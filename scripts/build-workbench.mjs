/**
 * build-workbench.mjs
 * -------------------------------------------------------------
 * 扫描 MokaKit 项目，生成一份自包含的「进度工作台」HTML。
 *
 * 自动部分（无需手改）：
 *   - src/tools 下各 meta.ts  → 工具总数 / 分类分布 / 状态 / 更新时间
 *   - src/config/categories.ts → 全部分类（含空分类）
 *   - src/config/site.ts → 站点品牌 / 域名 / 版本
 *   - src/tools/unit-convert/units.ts → 换算类目 / 单位 / 长尾对（真实 import）
 *   - src/data/sites.ts → 导航分组 / 外链条数（真实 import）
 *   - dist/ → 静态页面产出规模、各工具长尾子页数（若已构建）
 * 手动部分（workbench/status.json）：
 *   - 部署 / 备案 / 里程碑 / 待办 / 批次日志
 *
 * 用法：npm run workbench
 *   （必须带 --experimental-strip-types + ./scripts/ts-resolve.mjs，
 *     否则无法直接 import src/ 下的 .ts 数据模块）
 * 产物：workbench/workbench.html （双击即用，无需服务器）
 *       public/workbench.html （站点内 /workbench.html，供页脚版本号链接，astro build 会随 public/ 一起发布）
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const TOOLS_DIR = path.join(ROOT, 'src', 'tools');
const CATS_FILE = path.join(ROOT, 'src', 'config', 'categories.ts');
const SITE_FILE = path.join(ROOT, 'src', 'config', 'site.ts');
const DIST_DIR = path.join(ROOT, 'dist');
const STATUS_FILE = path.join(ROOT, 'workbench', 'status.json');
const OUT_HTML = path.join(ROOT, 'workbench', 'workbench.html');
const OUT_JSON = path.join(ROOT, 'workbench', 'workbench-data.json');
// 同时输出到 public/，让站点（预览/线上）能以 /workbench.html 访问，供页脚版本号链接。
const OUT_PUBLIC = path.join(ROOT, 'public', 'workbench.html');

function parseMeta(file) {
  const s = fs.readFileSync(file, 'utf8');
  const g = (re) => {
    const m = s.match(re);
    return m ? m[1] : '';
  };
  const tagsM = s.match(/^\s*tags:\s*\[([\s\S]*?)\]/m);
  const tags = tagsM ? [...tagsM[1].matchAll(/'([^']*)'/g)].map((x) => x[1]) : [];
  const pri = g(/^\s*priority:\s*(\d+)/m);
  return {
    id: g(/^\s*id:\s*'([^']*)'/m),
    name: g(/^\s*name:\s*'([^']*)'/m),
    tagline: g(/^\s*tagline:\s*'([^']*)'/m),
    category: g(/^\s*category:\s*'([^']*)'/m),
    status: g(/^\s*status:\s*'([^']*)'/m),
    priority: pri ? Number(pri) : 0,
    createdAt: g(/^\s*createdAt:\s*'([^']*)'/m),
    updatedAt: g(/^\s*updatedAt:\s*'([^']*)'/m),
    tags,
  };
}

/** 递归数某目录下的 .html 文件数 */
function countHtml(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countHtml(path.join(dir, e.name));
    else if (e.name.endsWith('.html')) n++;
  }
  return n;
}

/**
 * 扫描「内容资产」——工具数之外的规模指标。
 * 这一块很关键：像单位换算扩容这类改动，工具总数纹丝不动，
 * 但长尾页可能翻好几倍，只看工具数会以为「什么都没变」。
 */
async function scanAssets(toolIds) {
  const a = {
    distExists: fs.existsSync(DIST_DIR),
    pagesTotal: 0,
    subpagesTotal: 0,
    subpagesByTool: [],
    sitemapUrls: 0,
    distBuiltAt: '',
    mdxTools: [],
    units: null,
    sites: null,
  };

  // a) content.mdx 深度内容覆盖率
  a.mdxTools = toolIds.filter((id) => fs.existsSync(path.join(TOOLS_DIR, id, 'content.mdx')));

  // b) 单位换算规模（直接 import 真实数据，不用正则猜）
  try {
    const u = await import('../src/tools/unit-convert/units.ts');
    a.units = {
      categories: u.UNIT_CATEGORIES.length,
      units: u.UNIT_CATEGORIES.reduce((s, c) => s + c.units.length, 0),
      pairs: u.FEATURED_PAIRS.length,
      catNames: u.UNIT_CATEGORIES.map((c) => c.name),
    };
  } catch (e) {
    console.warn('  ⚠️ units.ts 读取失败：' + e.message);
  }

  // c) 好站导航规模
  try {
    const s = await import('../src/data/sites.ts');
    a.sites = {
      groups: s.SITE_GROUPS.length,
      links: s.SITE_GROUPS.reduce((n, g) => n + g.links.length, 0),
    };
  } catch (e) {
    console.warn('  ⚠️ sites.ts 读取失败：' + e.message);
  }

  // d) dist 产物规模（构建过才有）
  if (a.distExists) {
    a.pagesTotal = countHtml(DIST_DIR);
    const toolsDist = path.join(DIST_DIR, 'tools');
    if (fs.existsSync(toolsDist)) {
      for (const e of fs.readdirSync(toolsDist, { withFileTypes: true })) {
        if (!e.isDirectory() || e.name === 'c') continue; // /tools/c/ 是分类页，不算长尾
        const n = countHtml(path.join(toolsDist, e.name));
        if (n > 1) {
          a.subpagesByTool.push({ id: e.name, count: n - 1 }); // 减去工具主页
          a.subpagesTotal += n - 1;
        }
      }
      a.subpagesByTool.sort((x, y) => y.count - x.count);
    }
    const sm = path.join(DIST_DIR, 'sitemap-0.xml');
    if (fs.existsSync(sm)) {
      a.sitemapUrls = (fs.readFileSync(sm, 'utf8').match(/<url>/g) || []).length;
      a.distBuiltAt = fs.statSync(sm).mtime.toLocaleString('zh-CN', { hour12: false });
    } else {
      const idx = path.join(DIST_DIR, 'index.html');
      if (fs.existsSync(idx)) a.distBuiltAt = fs.statSync(idx).mtime.toLocaleString('zh-CN', { hour12: false });
    }
  }

  return a;
}

async function main() {
  // 1) 扫描所有工具
  const dirs = fs
    .readdirSync(TOOLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(TOOLS_DIR, d.name, 'meta.ts')))
    .map((d) => path.join(TOOLS_DIR, d.name, 'meta.ts'));
  const tools = dirs.map(parseMeta);

  // 2) 分类
  const cs = fs.readFileSync(CATS_FILE, 'utf8');
  const catMatches = [
    ...cs.matchAll(/id:\s*'(\w+)'[\s\S]*?slug:\s*'([\w-]+)'[\s\S]*?name:\s*'([^']+)'/g),
  ];
  const categories = catMatches.map((m) => ({ id: m[1], slug: m[2], name: m[3], count: 0 }));
  for (const t of tools) {
    const c = categories.find((c) => c.id === t.category);
    if (c) c.count++;
  }

  // 3) 站点配置
  const ss = fs.readFileSync(SITE_FILE, 'utf8');
  const siteName = (ss.match(/^\s*name:\s*'([^']*)'/m) || [])[1] || '';
  const siteNameCn = (ss.match(/^\s*nameCn:\s*'([^']*)'/m) || [])[1] || '';
  const siteUrl = (ss.match(/^\s*url:\s*'([^']*)'/m) || [])[1] || '';
  const siteVersion = (ss.match(/^\s*version:\s*'([^']*)'/m) || [])[1] || '';

  // 4) 内容资产（长尾页 / 换算规模 / 导航规模 / mdx 覆盖）
  const assets = await scanAssets(tools.map((t) => t.id));

  // 5) 统计
  const stats = {
    total: tools.length,
    beta: tools.filter((t) => t.status === 'beta').length,
    cats: categories.length,
    emptyCats: categories.filter((c) => c.count === 0).map((c) => c.name),
    maxCat: Math.max(1, ...categories.map((c) => c.count)),
    latestUpdate: tools.reduce((a, b) => (b.updatedAt > a ? b.updatedAt : a), ''),
    earliestCreate: tools.reduce((a, b) => (b.createdAt < a ? b.createdAt : a), '9999'),
    pages: assets.pagesTotal,
    subpages: assets.subpagesTotal,
    mdxCoverage: tools.length ? Math.round((assets.mdxTools.length / tools.length) * 100) : 0,
  };

  // 6) 合并手动状态
  const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  const data = {
    generatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    project: { ...status.project, siteName, siteNameCn, siteUrl, siteVersion },
    deploy: status.deploy,
    milestones: status.milestones,
    todos: status.todos,
    batches: status.batches,
    tools,
    categories,
    stats,
    assets,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(data, null, 2));
  fs.writeFileSync(OUT_HTML, buildHtml(data));
  fs.writeFileSync(OUT_PUBLIC, buildHtml(data, true));
  console.log(`✅ 工作台已生成 → ${OUT_HTML}`);
  console.log(`   副本已写入 → ${OUT_PUBLIC} （站点内 /workbench.html 可访问）`);
  console.log(`   工具总数: ${stats.total} | 分类: ${stats.cats} | 空分类: ${stats.emptyCats.length ? stats.emptyCats.join('/') : '无'}`);
  console.log(
    `   页面: ${assets.distExists ? stats.pages : 'dist 未构建'} | 长尾子页: ${stats.subpages} | 深度内容覆盖: ${assets.mdxTools.length}/${stats.total} (${stats.mdxCoverage}%)`
  );
  if (assets.units) console.log(`   单位换算: ${assets.units.categories} 类 / ${assets.units.units} 单位 / ${assets.units.pairs} 长尾对`);
  if (assets.sites) console.log(`   好站导航: ${assets.sites.groups} 组 / ${assets.sites.links} 条外链`);
  if (assets.distExists && assets.distBuiltAt) console.log(`   dist 快照: ${assets.distBuiltAt}`);
}

/* ----------------------------- 前端渲染 ----------------------------- */
function frontend() {
  const d = window.DATA;
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const catColor = {
    convert: '#7c9cbf', text: '#9b8cc4', security: '#cf6f6f', calc: '#5bb39a',
    dev: '#d2934f', barcode: '#c9a14a', ai: '#c77fd1', life: '#6fae6f', fun: '#d98b5b',
  };
  const catName = (id) => (d.categories.find((c) => c.id === id) || {}).name || id;

  const header = `
    <header class="hd">
      <div>
        <div class="brand">${esc(d.project.siteName)} <span class="cn">${esc(d.project.siteNameCn)}</span>${d.project.siteVersion ? ` <span class="ver">${esc(d.project.siteVersion)}</span>` : ''}</div>
        <div class="sub">项目进度工作台 · 随时查看 · 数据自动扫描代码生成</div>
      </div>
      <div class="gen">快照生成于<br><b>${esc(d.generatedAt)}</b></div>
    </header>`;

  const A = d.assets || {};
  const kpis = `
    <section class="kpis">
      ${kpi(d.stats.total, '工具总数', '🧰')}
      ${kpi(A.distExists ? d.stats.pages : '—', '静态页面', '📄', A.distExists ? '' : 'dist 未构建')}
      ${kpi(d.stats.subpages, '长尾子页', '🌱')}
      ${kpi(d.stats.cats, '分类数', '🗂️', d.stats.emptyCats.length ? `${d.stats.emptyCats.length} 个空` : '')}
      ${kpi(`${d.stats.mdxCoverage}%`, '深度内容覆盖', '📝', `${(A.mdxTools || []).length}/${d.stats.total}`)}
      ${kpi(d.stats.latestUpdate, '最近更新', '📅')}
    </section>`;
  function kpi(v, label, icon, note) {
    return `<div class="kpi"><div class="ki">${icon}</div><div class="kv">${esc(v)}</div><div class="kl">${esc(label)}</div>${note ? `<div class="kn">${esc(note)}</div>` : ''}</div>`;
  }

  // 内容资产：工具数之外的规模指标（长尾页 / 换算 / 导航 / 深度内容）
  const subBars = (A.subpagesByTool || [])
    .map((s) => {
      const max = Math.max(1, ...(A.subpagesByTool || []).map((x) => x.count));
      return `<div class="bar">
        <div class="bl">${esc(s.id)}</div>
        <div class="btrack"><div class="bfill" style="width:${Math.round((s.count / max) * 100)}%;background:var(--green)"></div></div>
        <div class="bnum">${s.count}</div>
      </div>`;
    })
    .join('');
  const missingMdx = d.tools.filter((t) => !(A.mdxTools || []).includes(t.id)).length;
  const assetsCard = `
    <section class="card">
      <h2>📄 内容资产（SEO 规模）</h2>
      <div class="grid2">
        ${kv('静态页面', A.distExists ? `${d.stats.pages} 个 HTML` : 'dist 未构建')}
        ${kv('sitemap', A.sitemapUrls ? `${A.sitemapUrls} 条 URL` : '—')}
        ${kv('长尾子页', `${d.stats.subpages} 个（${(A.subpagesByTool || []).length} 个工具产出）`)}
        ${kv('dist 快照', A.distBuiltAt || '—')}
        ${A.units ? kv('单位换算', `${A.units.categories} 类 / ${A.units.units} 单位 / ${A.units.pairs} 长尾对`) : ''}
        ${A.sites ? kv('好站导航', `${A.sites.groups} 组 / ${A.sites.links} 条外链`) : ''}
      </div>
      ${A.units ? `<div class="chips">${A.units.catNames.map((n) => `<i>${esc(n)}</i>`).join('')}</div>` : ''}
      ${subBars ? `<h3 class="sub2">长尾子页分布</h3>${subBars}` : ''}
      <div class="next">深度内容（content.mdx）覆盖 ${(A.mdxTools || []).length}/${d.stats.total} 个工具${missingMdx ? `，还有 <b>${missingMdx}</b> 个工具页缺正文——这是当前最大的 SEO 缺口` : ''}</div>
    </section>`;

  const deploy = `
    <section class="card">
      <h2>🚀 上线与备案状态</h2>
      <div class="grid2">
        ${kv('服务器', `${d.deploy.serverIp} · ${d.deploy.serverOs}`)}
        ${kv('OpenClaw', d.deploy.openclaw)}
        ${kv('域名', d.deploy.domains.join(' / '))}
        ${kv('域名状态', d.deploy.domainStatus)}
        ${kv('ICP 备案', `${d.deploy.icp.status}（${d.deploy.icp.siteName}，约 ${d.deploy.icp.etaDays} 工作日）`)}
        ${kv('SSL', d.deploy.ssl)}
        ${kv('生产上线', d.deploy.prodLive ? '✅ 已上线' : '🔴 未上线（等备案）')}
        ${kv('数据备份', d.deploy.backupPath)}
      </div>
      <div class="next">下一步：${esc(d.deploy.nextStep)}</div>
    </section>`;
  function kv(k, v) {
    return `<div class="kvrow"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>`;
  }

  const ms = `
    <section class="card">
      <h2>📍 里程碑</h2>
      <div class="timeline">
        ${d.milestones
          .map(
            (m) => `<div class="tl ${m.state}">
              <span class="dot"></span>
              <div class="tlbody"><div class="tlt">${esc(m.title)} <span class="tld">${esc(m.date)}</span></div>
              <div class="tld2">${esc(m.detail)}</div></div>
            </div>`
          )
          .join('')}
      </div>
    </section>`;

  const cats = `
    <section class="card">
      <h2>🗂️ 分类分布</h2>
      ${d.categories
        .map((c) => {
          const pct = Math.round((c.count / d.stats.maxCat) * 100);
          const empty = c.count === 0;
          return `<div class="bar">
            <div class="bl"><span class="cdot" style="background:${catColor[c.id] || '#999'}"></span>${esc(c.name)}</div>
            <div class="btrack"><div class="bfill" style="width:${empty ? 4 : pct}%;background:${catColor[c.id] || '#999'}"></div></div>
            <div class="bnum">${c.count}${empty ? ' ⚠️空' : ''}</div>
          </div>`;
        })
        .join('')}
    </section>`;

  const todos = `
    <section class="card">
      <h2>✅ 待办清单</h2>
      ${d.todos
        .map(
          (t) => `<label class="todo ${t.blocker ? 'blk' : ''}">
            <input type="checkbox" ${t.done ? 'checked' : ''} disabled>
            <span>${esc(t.text)}</span>
            ${t.blocker ? '<span class="badge-blk">阻塞</span>' : ''}
          </label>`
        )
        .join('')}
    </section>`;

  const table = `
    <section class="card">
      <h2>🧰 全部工具（${d.stats.total}）</h2>
      <div class="tblwrap">
      <table class="tbl">
        <thead><tr><th>工具</th><th>分类</th><th>状态</th><th>更新</th><th>标签</th></tr></thead>
        <tbody>
          ${d.tools
            .map(
              (t) => `<tr>
                <td><b>${esc(t.name)}</b><div class="tl2">${esc(t.id)}</div></td>
                <td><span class="cdot" style="background:${catColor[t.category] || '#999'}"></span>${esc(catName(t.category))}</td>
                <td><span class="st ${t.status}">${t.status}</span></td>
                <td>${esc(t.updatedAt)}</td>
                <td class="tags">${t.tags.slice(0, 4).map((x) => `<i>${esc(x)}</i>`).join('')}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>
      </div>
    </section>`;

  const batches = `
    <section class="card">
      <h2>📦 开发批次日志</h2>
      <details><summary>展开 ${d.batches.length} 个批次</summary>
      ${d.batches
        .map(
          (b) => `<div class="batch"><span class="bn">${esc(b.batch)}</span>
            <span class="bc">+${b.count}</span>
            <span class="bt">${esc(b.tools)}</span></div>`
        )
        .join('')}
      </details>
    </section>`;

  document.getElementById('app').innerHTML =
    header + kpis + assetsCard + deploy + ms + cats + todos + table + batches;
}

function buildHtml(d, redact = false) {
  let raw = JSON.stringify(d);
  if (redact) {
    // 公开副本（/workbench.html 会随站点发布）深度脱敏：
    // 覆盖结构化字段 + 自由文本（里程碑 detail / todos text 等手写内容）里的运营隐私。
    // ⚠️ 新增手写文案后请回头核对这里，别让本地路径、IP、人名漏出去。
    raw = raw
      .replace(/[A-Za-z]:(\\\\|\/)(Users|WorkBuddy)(\\\\|\/)[^"，,）)]*/g, '（本地路径，已隐藏）')
      .replace(/58\.87\.68\.151/g, '（已隐藏）')
      .replace(/mokakit-backup/g, '（已隐藏）')
      .replace(/旺财先生|旺财|大美丽/g, '（站点负责人）');
  }
  const json = raw.replace(/</g, '\\u003c');
  const css = `
    :root{
      --bg:#1c1612; --panel:#271e17; --panel2:#322619; --line:#3d2f22;
      --text:#f3e9dd; --muted:#b7a48f; --mocha:#8b5e3c; --accent:#d99a5b;
      --green:#7bbf6a; --amber:#e0a85a; --red:#d9776b;
    }
    *{box-sizing:border-box}
    body{margin:0;background:var(--bg);color:var(--text);
      font-family:-apple-system,'PingFang SC','Microsoft YaHei',Segoe UI,system-ui,sans-serif;
      line-height:1.5;padding:20px;max-width:1080px;margin:0 auto}
    .hd{display:flex;justify-content:space-between;align-items:center;
      border-bottom:2px solid var(--mocha);padding-bottom:14px;margin-bottom:18px;flex-wrap:wrap;gap:10px}
    .brand{font-size:26px;font-weight:800;color:var(--accent);letter-spacing:.5px}
    .brand .cn{font-size:16px;color:var(--muted);font-weight:600}
    .brand .ver{font-size:12px;color:var(--muted);font-weight:600;background:var(--panel2);
      padding:2px 8px;border-radius:99px;vertical-align:middle}
    .sub{color:var(--muted);font-size:13px;margin-top:2px}
    .gen{text-align:right;color:var(--muted);font-size:12px}
    .gen b{color:var(--text)}
    .kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:18px}
    .kpi{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 8px;text-align:center}
    .ki{font-size:20px}.kv{font-size:24px;font-weight:800;color:var(--accent);margin:4px 0;word-break:break-all}
    .kl{color:var(--muted);font-size:12px}.kn{color:var(--red);font-size:11px;margin-top:2px}
    .chips{margin:10px 0 4px;display:flex;flex-wrap:wrap;gap:6px}
    .chips i{font-style:normal;background:var(--panel2);color:var(--muted);font-size:11.5px;
      padding:2px 9px;border-radius:99px}
    .sub2{font-size:13px;color:var(--muted);margin:14px 0 6px;font-weight:600}
    .card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px 18px;margin-bottom:16px}
    .card h2{margin:0 0 12px;font-size:16px;color:var(--accent)}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px 22px}
    .kvrow{display:flex;gap:10px;padding:4px 0;border-bottom:1px dashed var(--line);font-size:13px}
    .kvrow .k{color:var(--muted);min-width:84px;flex-shrink:0}
    .kvrow .v{color:var(--text)}
    .next{margin-top:12px;padding:10px 12px;background:var(--panel2);border-left:3px solid var(--amber);
      border-radius:8px;font-size:13px;color:var(--text)}
    .timeline{position:relative;padding-left:8px}
    .tl{display:flex;gap:12px;margin-bottom:12px;align-items:flex-start}
    .dot{width:14px;height:14px;border-radius:50%;margin-top:4px;flex-shrink:0;border:2px solid var(--text)}
    .tl.done .dot{background:var(--green);border-color:var(--green)}
    .tl.doing .dot{background:var(--amber);border-color:var(--amber);box-shadow:0 0 0 4px rgba(224,168,90,.2)}
    .tl.todo .dot{background:transparent}
    .tlt{font-weight:700;font-size:14px}.tld{color:var(--muted);font-size:11px;margin-left:6px;font-weight:400}
    .tld2{color:var(--muted);font-size:12px}
    .bar{display:flex;align-items:center;gap:10px;margin:8px 0}
    .bl{width:120px;font-size:13px;display:flex;align-items:center;gap:6px}
    .cdot{width:9px;height:9px;border-radius:50%;display:inline-block}
    .btrack{flex:1;background:var(--panel2);border-radius:6px;height:12px;overflow:hidden}
    .bfill{height:100%;border-radius:6px}.bnum{width:54px;text-align:right;font-size:12px;color:var(--muted)}
    .todo{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px dashed var(--line);font-size:13px}
    .todo.blk{color:var(--red)}
    .badge-blk{background:var(--red);color:#1c1612;font-size:10px;font-weight:700;padding:1px 7px;border-radius:99px}
    .tblwrap{overflow-x:auto}
    .tbl{width:100%;border-collapse:collapse;font-size:12.5px}
    .tbl th{text-align:left;color:var(--muted);font-weight:600;padding:6px 8px;border-bottom:1px solid var(--line)}
    .tbl td{padding:7px 8px;border-bottom:1px dashed var(--line);vertical-align:top}
    .tl2{color:var(--muted);font-size:11px}
    .st{font-size:11px;padding:1px 8px;border-radius:99px;text-transform:capitalize}
    .st.stable{background:rgba(123,191,106,.18);color:var(--green)}
    .st.beta{background:rgba(224,168,90,.18);color:var(--amber)}
    .tags i{font-style:normal;background:var(--panel2);padding:1px 7px;border-radius:6px;margin:0 4px 4px 0;display:inline-block;font-size:11px;color:var(--muted)}
    .batch{display:flex;gap:10px;padding:6px 0;font-size:13px;border-bottom:1px dashed var(--line);align-items:baseline}
    .bn{font-weight:700;color:var(--accent);min-width:64px}.bc{color:var(--green);font-weight:700;min-width:36px}
    .bt{color:var(--muted)}
    details summary{cursor:pointer;color:var(--accent);font-size:13px;margin-bottom:8px}
    @media(max-width:980px){.kpis{grid-template-columns:repeat(3,1fr)}}
    @media(max-width:720px){.kpis{grid-template-columns:repeat(2,1fr)}.grid2{grid-template-columns:1fr}.bl{width:90px}}
  `;
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MokaKit 进度工作台</title>
<meta name="robots" content="noindex">
<style>${css}</style></head>
<body><div id="app"></div>
<script>window.DATA=${json};(${frontend.toString()})();</script>
</body></html>`;
}

await main();
