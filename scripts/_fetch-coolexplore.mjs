// 一次性采集脚本：把 coolexplore.com/zh 收录的网站搬进 MokaKit 好站导航。
// 用法：
//   node scripts/_fetch-coolexplore.mjs                抓取 138 条 → workbench/coolexplore-raw.json
//   node scripts/_fetch-coolexplore.mjs --probe       在上面基础上做探活+去重，写回 raw.json（加 alive 字段）
//   node scripts/_fetch-coolexplore.mjs --emit        读取带 alive 的 raw.json，生成 sites.ts 待插入代码块到 stdout + 剔除清单
//   node scripts/_fetch-coolexplore.mjs --dry 5       只跑前 5 条，仅供调试
//
// 设计：Node 24 原生 fetch，零第三方依赖；手写并发池（6 并发 + 退避重试）。

const BASE = 'https://www.coolexplore.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SITEMAP = `${BASE}/sitemap_zh.xml`;
const OUT = 'workbench/coolexplore-raw.json';

// 分类优先级（特征越强越优先）。一对多时取第一个命中的。
const CAT_PRIORITY = [
  'cool-game',
  'cool-space',
  'cool-art',
  'cool-music',
  'cool-map',
  'cool-fun',
  'cool-study',
  'cool-design',
  'life',
  'cool-video',
];

// coolexplore 分类 → MokaKit 新分组
const CAT_TO_GROUP = {
  'cool-game': 'web-game',
  'cool-space': 'explore-map',
  'cool-art': 'culture',
  'cool-music': 'culture',
  'cool-map': 'explore-map',
  'cool-fun': 'fun-web',
  'cool-study': 'curio-tool',
  'cool-design': 'curio-tool',
  life: 'curio-tool',
  // 影视类(cool-video)仅 2-3 条，不足以新建分组；并入奇趣网站 fun-web，避免改动现有 media 数据
  'cool-video': 'fun-web',
};

const RE_VISIT = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*class="item-visit-btn"/i;
const RE_VISIT2 = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*title="点击访问官方网站"/i;
const RE_TITLE = /<title>([\s\S]*?)<\/title>/i;
const RE_H1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i;
const RE_METADESC = /<meta[^>]+name="description"[^>]+content="([^"]*)"/i;
const RE_CATS = /href="\/zh\/category\/([a-zA-Z0-9-]+)"/g;

function pool(items, worker, concurrency = 6) {
  const results = new Array(items.length);
  let cursor = 0;
  return Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await worker(items[i], i);
      }
    })
  ).then(() => results);
}

async function get(url, tries = 3) {
  for (let t = 1; t <= tries; t++) {
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 20000);
      const r = await fetch(url, { signal: ac.signal, headers: { 'user-agent': UA } });
      clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.text();
    } catch (e) {
      if (t === tries) return null;
      await new Promise((s) => setTimeout(s, 800 * t));
    }
  }
}

function pickVisited(html) {
  let m = html.match(RE_VISIT);
  if (m) return m[1].trim();
  m = html.match(RE_VISIT2);
  if (m) return m[1].trim();
  return null;
}

function normalizeUrl(u) {
  try {
    const x = new URL(u.trim());
    let host = x.hostname.toLowerCase().replace(/^www\./, '');
    // 裸 IP 不处理
    const seg = x.pathname.split('/').filter(Boolean)[0] || '';
    return seg ? `${host}/${seg.toLowerCase()}` : host;
  } catch {
    return u.trim().toLowerCase();
  }
}

// ---- 抓取阶段 ----
async function fetchAll(limit) {
  console.error('[1/3] 拉 sitemap_zh.xml ...');
  const sm = await get(SITEMAP);
  if (!sm) throw new Error('sitemap 拉取失败');
  const slugs = [...sm.matchAll(/<loc>([^<]*\/zh\/tools\/([a-zA-Z0-9_.-]+))<\/loc>/g)].map((m) => m[2]);
  const uniqueSlugs = [...new Set(slugs)];
  console.error(`      共 ${slugs.length} 条，去重后 ${uniqueSlugs.length} 个 slug`);

  console.error('[2/3] 抓 10 个分类页建 slug→分类 映射 ...');
  const catPages = await pool(CAT_PRIORITY, async (cat) => {
    const html = await get(`${BASE}/zh/category/${cat}`);
    return { cat, html };
  });
  const slugToCats = {};
  for (const { cat, html } of catPages) {
    if (!html) continue;
    const itemSlugs = [...html.matchAll(/href="\/zh\/item\/([a-zA-Z0-9_.-]+)"/g)].map((m) => m[1]);
    for (const s of itemSlugs) {
      (slugToCats[s] ||= []).push(cat);
    }
  }
  console.error(`      覆盖 ${Object.keys(slugToCats).length} 个 slug 的分类归属`);

  console.error('[3/3] 抓 138 个详情页 ...');
  const work = limit ? uniqueSlugs.slice(0, limit) : uniqueSlugs;
  const details = await pool(work, async (slug) => {
    const html = await get(`${BASE}/zh/item/${slug}`);
    if (!html) return { slug, failed: true, reason: 'detail-page-empty' };
    const url = pickVisited(html);
    const h1 = html.match(RE_H1);
    const meta = html.match(RE_METADESC);
    const cats = slugToCats[slug] || [];
    const group = cats.length
      ? CAT_TO_GROUP[cats.find((c) => CAT_PRIORITY.includes(c)) || cats[0]]
      : 'fun-web'; // 无分类归属的暂放 fun-web，后续人工调
    return {
      slug,
      name: h1 ? h1[1].trim() : slug,
      url,
      rawDesc: meta ? meta[1].trim() : '',
      cats,
      group: group || 'fun-web',
      failed: !url,
      reason: url ? '' : 'no-visit-url',
    };
  });

  const failed = details.filter((d) => d.failed);
  console.error(`      完成 ${details.length} 条，failed=${failed.length}`);
  if (failed.length) console.error('      failed slugs:', failed.map((f) => f.slug).join(', '));

  const out = {
    fetchedAt: new Date().toISOString(),
    total: details.length,
    items: details,
    failed: failed.map((f) => ({ slug: f.slug, reason: f.reason })),
  };
  return out;
}

// ---- 探活阶段 ----
const PARKED_HOST = /(sedo|afternic|dan\.com|hugedomains|bodis|parkingcrew|namecheap|registrar)/i;
const PARKED_TITLE = /(domain for sale|buy this domain|该域名可以出售|this domain is for sale|domain name for sale)/i;

async function probeOne(url) {
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 30000);
    const r = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: ac.signal,
      headers: { 'user-agent': UA, range: 'bytes=0-2047' },
    });
    clearTimeout(timer);
    const finalUrl = r.url || url;
    const body = await r.text();
    if (PARKED_HOST.test(finalUrl) || PARKED_TITLE.test(body)) {
      return { status: 'parked', finalUrl };
    }
    if (r.status === 404 || r.status === 410) {
      return { status: 'dead', http: r.status, finalUrl };
    }
    if (r.status >= 200 && r.status < 400) {
      return { status: 'alive', http: r.status, finalUrl };
    }
    if (r.status === 403 || r.status === 405 || r.status === 429) {
      // 有防护，站仍活着
      return { status: 'alive', http: r.status, finalUrl, note: '受防护' };
    }
    return { status: 'unknown', http: r.status, finalUrl };
  } catch (e) {
    // 超时 / 连接重置 / DNS 失败 → 一律保留，标记为 timeout/err
    const isTimeout = /abort|timeout/i.test(e.message || '');
    return { status: isTimeout ? 'timeout' : 'err', error: String(e.message || e) };
  }
}

async function probe(raw) {
  // 读取现有 493 条 URL 用于对外去重
  let existingKeys = new Set();
  try {
    const mod = await import('../src/data/sites.ts');
    existingKeys = new Set(mod.SITE_GROUPS.flatMap((g) => g.links.map((l) => normalizeUrl(l.url))));
    console.error(`[probe] 现有 sites.ts 站点 ${existingKeys.size} 个 key`);
  } catch (e) {
    console.error('[probe] 读取现有 sites.ts 失败，跳过对外去重:', e.message);
  }

  // 对内去重（按归一化 key）
  const seen = new Set();
  const innerDup = [];
  const uniqItems = [];
  for (const it of raw.items) {
    if (!it.url) {
      it.probe = { status: 'no-url' };
      uniqItems.push(it);
      continue;
    }
    const k = normalizeUrl(it.url);
    if (seen.has(k)) {
      innerDup.push(it.url);
      continue;
    }
    seen.add(k);
    uniqItems.push(it);
  }
  console.error(`[probe] 对内去重剔除 ${innerDup.length} 条`);

  // 对外去重
  const outerDup = [];
  const toProbe = [];
  for (const it of uniqItems) {
    if (!it.url) continue;
    if (existingKeys.has(normalizeUrl(it.url))) {
      outerDup.push(it.url);
    } else {
      toProbe.push(it);
    }
  }
  console.error(`[probe] 对外去重剔除 ${outerDup.length} 条，待探活 ${toProbe.length} 条`);

  const results = await pool(
    toProbe,
    async (it) => {
      const pr = await probeOne(it.url);
      it.probe = pr;
      if (pr.status === 'dead' || pr.status === 'parked') {
        it.drop = pr.status;
      }
      return it;
    },
    6
  );

  const counts = {};
  for (const it of results) {
    const s = it.probe?.status || 'unknown';
    counts[s] = (counts[s] || 0) + 1;
  }
  console.error('[probe] 探活结果:', JSON.stringify(counts));

  // 把对外去重掉的也标记回去（不探活，直接 drop=existing-dup）
  for (const u of outerDup) {
    const it = uniqItems.find((x) => x.url === u);
    if (it) it.drop = 'existing-dup';
  }

  return { ...raw, items: uniqItems };
}

// ---- 生成 sites.ts 代码块 ----
function escapeField(s) {
  return String(s || '')
    .replace(/'/g, '’')
    .replace(/\\/g, '＼')
    .replace(/\n/g, ' ');
}

function shortenDesc(raw, name) {
  // 先取 meta 简介的主体；压到 ≤20 中文字。规则化：以『：』『，』『。』断句取首句，再去标点。
  let base = String(raw || '').trim();
  if (!base) base = String(name || '');
  // 取首句（按中英文标点断）
  const first = base.split(/[，。；;:：!！?？]/)[0].trim();
  // 去首尾书名号/引号
  const clean = first.replace(/^[《「『"]+/, '').replace(/[》」』"]+$/, '');
  if (clean.length <= 20) return clean;
  return clean.slice(0, 20);
}

function emit(raw) {
  // 只输出保留的条目（drop 的不进库），但打印剔除清单
  const dropped = raw.items.filter((it) => it.drop);
  const kept = raw.items.filter((it) => !it.drop && it.url);
  const byGroup = {};
  for (const it of kept) {
    (byGroup[it.group] ||= []).push(it);
  }

  console.error('===== 剔除清单 =====');
  const byReason = {};
  for (const d of dropped) {
    (byReason[d.drop] ||= []).push(`${d.name} <${d.url}>`);
  }
  for (const [reason, list] of Object.entries(byReason)) {
    console.error(`\n[${reason}] ${list.length} 条:`);
    for (const l of list) console.error('  - ' + l);
  }

  // 分组元信息（与计划一致）
  const META = {
    'fun-web': { name: '奇趣网站', desc: '脑洞、冷知识与新奇玩意', icon: 'smile' },
    'web-game': { name: '网页游戏', desc: '免下载，开浏览器即玩', icon: 'dice' },
    'explore-map': { name: '地理漫游', desc: '街景、地图与太空探索', icon: 'compass' },
    culture: { name: '艺术人文', desc: '名画、音乐与文化馆藏', icon: 'palette' },
    'curio-tool': { name: '冷门妙用', desc: '小众但顺手的实用站', icon: 'sparkles' },
    media: { name: '影音娱乐', desc: '视频、直播与影视聚合', icon: 'eye' },
  };

  const order = ['fun-web', 'web-game', 'explore-map', 'culture', 'curio-tool'];
  let out = `\n\n  // ===================== 奇趣探索（来自 coolexplore.com/zh） =====================\n`;
  for (const g of order) {
    const items = byGroup[g];
    if (!items || !items.length) continue;
    const m = META[g];
    out += `  {\n`;
    out += `    id: '${g}',\n`;
    out += `    name: '${m.name}',\n`;
    out += `    desc: '${m.desc}',\n`;
    out += `    icon: '${m.icon}',\n`;
    out += `    links: [\n`;
    items.forEach((it, idx) => {
      const desc = escapeField(shortenDesc(it.rawDesc, it.name));
      const line = `      { name: '${escapeField(it.name)}', url: '${it.url}', desc: '${
        desc || escapeField(it.name)
      }' }`;
      out += line + (idx < items.length - 1 ? ',\n' : '\n');
    });
    out += `    ],\n`;
    out += `  },\n`;
  }

  console.error(`\n===== 待插入统计 =====`);
  console.error(`保留 ${kept.length} 条，分布:`, order.map((g) => `${g}=${byGroup[g]?.length || 0}`).join(', '));
  console.error(`剔除 ${dropped.length} 条（见上方清单）`);
  console.log(out); // stdout 给后续 Edit 用
  return out;
}

// ---- 入口 ----
const mode = process.argv.slice(2);
const isDry = mode.includes('--dry');
const doProbe = mode.includes('--probe');
const doEmit = mode.includes('--emit');
const dryLimit = isDry ? parseInt(mode[mode.indexOf('--dry') + 1], 10) || 5 : 0;

import { writeFileSync, readFileSync, existsSync } from 'node:fs';

if (doEmit) {
  if (!existsSync(OUT)) {
    console.error('raw.json 不存在，先跑 --probe');
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(OUT, 'utf8'));
  if (!raw.items.some((i) => i.probe)) {
    console.error('raw.json 未探活（无 probe 字段），先跑 --probe');
    process.exit(1);
  }
  emit(raw);
} else if (doProbe) {
  if (!existsSync(OUT)) {
    console.error('raw.json 不存在，先跑抓取');
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(OUT, 'utf8'));
  const probed = await probe(raw);
  writeFileSync(OUT, JSON.stringify(probed, null, 2));
  console.error('已写回', OUT);
} else {
  const raw = await fetchAll(dryLimit || undefined);
  writeFileSync(OUT, JSON.stringify(raw, null, 2));
  console.error('已写出', OUT);
}
