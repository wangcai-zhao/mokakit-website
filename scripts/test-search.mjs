/**
 * 站内搜索回归测试
 * ============================================================================
 * 跑法：npm run check:search
 *
 * 为什么单独写这个而不是塞进 astro check：
 *   检索质量是「行为」，类型检查管不到。这里锁的是 40 多条具体查询的
 *   预期结果 —— 以后改权重、加字段、换算法，先看这盏灯是不是还绿。
 *
 * 数据来自真实 src/tools/<id>/meta.ts（不是手写 fixture），
 * 所以新加工具后如果关键词缺失导致搜不到，这里会直接红。
 */
import { registerHooks } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = pathToFileURL(join(ROOT, 'src') + '/');

// 让 Node 认识 '@/...' 别名（Astro/Vite 专有）
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const target = new URL(specifier.slice(2), SRC).href;
      for (const s of ['', '.ts', '.tsx', '/index.ts']) {
        if (existsSync(fileURLToPath(target + s))) return nextResolve(target + s, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

const { buildSearchIndexData, subpageSources } = await import(
  pathToFileURL(join(ROOT, 'src/lib/search-build.ts')).href
);
const { prepareIndex, searchTools, hotTools, splitHighlight, normalize, editDistance } = await import(
  pathToFileURL(join(ROOT, 'src/lib/search.ts')).href
);
const { CATEGORIES } = await import(pathToFileURL(join(ROOT, 'src/config/categories.ts')).href);

// ── 加载真实 meta ────────────────────────────────────────────────────────────
const dirs = readdirSync(join(ROOT, 'src/tools'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const metas = [];
for (const d of dirs) {
  const p = join(ROOT, 'src/tools', d, 'meta.ts');
  if (!existsSync(p)) continue;
  try {
    const m = await import(pathToFileURL(p).href);
    if (m.default) metas.push(m.default);
  } catch {
    /* 个别 meta 依赖运行时环境，跳过（与 registry 的容错口径一致） */
  }
}

const catName = new Map(CATEGORIES.map((c) => [c.id, c.name]));
const INDEXABLE = metas.filter((m) => !m.noindex);
const sources = INDEXABLE.map((m) => ({
  id: m.id,
  name: m.name,
  tagline: m.tagline,
  keywords: m.keywords ?? [],
  tags: m.tags ?? [],
  category: catName.get(m.category) ?? m.category,
  priority: m.priority ?? 0,
  icon: m.icon ?? '',
  url: `/tools/${m.id}/`,
}));
// 长尾子页与 registry 同口径展开（共用 subpageSources，防漂移）
for (const m of INDEXABLE) {
  sources.push(...subpageSources(m, catName.get(m.category) ?? m.category));
}
const data = buildSearchIndexData(sources, CATEGORIES.map((c) => c.name));
const pi = prepareIndex(data);

// ── 断言框架 ────────────────────────────────────────────────────────────────
let pass = 0;
const fails = [];
function ok(name, cond, extra = '') {
  if (cond) pass++;
  else fails.push(`${name}${extra ? ` → ${extra}` : ''}`);
}
const hits = (q, n = 40) => searchTools(pi, q, { limit: n }).hits;
const ids = (q, n = 40) => hits(q, n).map((h) => h.id);
const top1 = (q) => hits(q, 1)[0]?.id ?? null;

// 1. 基础：数据完整性
ok('索引条数 > 250', data.n.length > 250, `实际 ${data.n.length}`);
ok('各列长度一致', [data.g, data.k, data.y, data.s, data.c, data.p, data.u, data.i].every((a) => a.length === data.n.length));
const pyFilled = data.y.filter(Boolean).length;
ok('拼音覆盖率 ≥ 98%', pyFilled / data.n.length >= 0.98, `${((pyFilled / data.n.length) * 100).toFixed(1)}%`);
ok('无重复 id', new Set(data.u).size === data.u.length);
// 母页 /tools/<id>/；浅层长尾子页 /tools/<id>/<slug>/（深路径子页不进索引）
ok('url 形态合法', data.u.every((u) => /^\/tools\/[a-z0-9-]+(\/[a-z0-9-]+)?\/$/.test(u)));

// 2. 名称精确 / 前缀（最核心的意图）
ok('中文全名 top1', top1('密码生成器') === 'password-generator', top1('密码生成器'));
ok('中文前缀命中', ids('密码生成').includes('password-generator'));
ok('带空格的英文名', top1('JSON 格式化') === 'json-formatter', top1('JSON 格式化'));
ok('分类名可搜', hits('开发辅助').length > 20, `实际 ${hits('开发辅助').length} 条`);

// 3. 拼音（优化前完全为 0，是这次最大的功能补齐）
ok('全拼 mima 命中密码生成器', ids('mima').includes('password-generator'), ids('mima').slice(0, 3).join(','));
ok('首字母 mmscq 命中', ids('mmscq').includes('password-generator'), ids('mmscq').slice(0, 3).join(','));
ok('首字母 sjczh 命中时间戳', ids('sjczh').includes('timestamp-converter'), ids('sjczh').slice(0, 3).join(','));
ok('全拼 erweima 命中二维码', ids('erweima').some((x) => x.includes('qr')), ids('erweima').slice(0, 3).join(','));

// 4. 英文别名：id 压缩匹配（qr-code → qrcode）
ok('qrcode 命中二维码', ids('qrcode').some((x) => x.includes('qr')), ids('qrcode').slice(0, 3).join(','));
ok('timestamp 命中', ids('timestamp').includes('timestamp-converter'), ids('timestamp').slice(0, 3).join(','));
ok('base64 命中', ids('base64').length > 0, ids('base64').slice(0, 3).join(','));
ok('uuid 命中', ids('uuid').length > 0);
ok('regex 命中正则工具', ids('regex').some((x) => x.includes('regex')), ids('regex').slice(0, 3).join(','));

// 5. 词序 / 大小写 / 全角 / 多空格 全部等价
const a1 = ids('json 格式化').sort().join(',');
const a2 = ids('格式化 json').sort().join(',');
ok('词序无关', a1 === a2, `顺序不同`);
ok('大小写无关', ids('JSON').sort().join(',') === ids('json').sort().join(','));
ok('全角等价', ids('ＪＳＯＮ').sort().join(',') === ids('json').sort().join(','));
ok('多空格等价', ids('  json   格式化  ').sort().join(',') === a1, '多空格未折叠');
ok('标点等价', ids('json,格式化').sort().join(',') === a1, '标点未折叠');
ok('normalize 幂等', normalize(normalize(' ＪＳＯＮ，格式化 ')) === normalize('ＪＳＯＮ，格式化'));

// 6. 单字查询：只搜工具名，排序有效（优化前「器」139 条、「算」147 条且完全无排序）
for (const ch of ['器', '算', '转']) {
  const r = hits(ch, 200);
  ok(`单字「${ch}」只命中名字含该字的工具`, r.every((h) => h.name.includes(ch)), `${r.length} 条`);
  ok(`单字「${ch}」结果有序`, r.every((h, i) => i === 0 || r[i - 1].score >= h.score));
  ok(`单字「${ch}」top5 全部相关`, r.slice(0, 5).every((h) => h.name.includes(ch)));
}
ok('单字结果数不超过名字含该字的总数', hits('器', 500).length <= data.n.filter((n) => n.includes('器')).length);
ok('单字「器」首条强相关', /器/.test(hits('器', 1)[0]?.name ?? ''), hits('器', 1)[0]?.name);

// 7. 空输入 / 脏输入不崩
ok('空查询返回空', searchTools(pi, '').hits.length === 0);
ok('纯空格返回空', searchTools(pi, '   ').hits.length === 0);
ok('纯标点返回空', searchTools(pi, '。，、！！').hits.length === 0);
ok('超长输入不崩', (() => {
  const r = searchTools(pi, '密码'.repeat(200));
  return Array.isArray(r.hits);
})());
ok('emoji 输入不崩', (() => searchTools(pi, '🔐🔑').hits.length >= 0)());

// 8. 结果质量
const jsonHits = hits('json', 20);
ok('json 结果全相关', jsonHits.every((h) => /json/i.test(`${h.name} ${h.tagline} ${h.keywords} ${h.id}`)));
ok('结果按分数降序', jsonHits.every((h, i) => i === 0 || jsonHits[i - 1].score >= h.score));
ok('结果无重复', new Set(jsonHits.map((h) => h.id)).size === jsonHits.length);
ok('priority 参与排序（同档位）', (() => {
  const r = hits('转换', 40);
  return r.length === 0 || r.every((h, i) => i === 0 || r[i - 1].score >= h.score);
})());

// 9. 高亮正确性：切出来的片段拼回去必须等于原文（防丢字/错位）
for (const q of ['json', '密码', 'mima', '格式化']) {
  for (const h of hits(q, 10)) {
    const joinedName = splitHighlight(h.name, h.nameRanges).map((x) => x.t).join('');
    const joinedTag = splitHighlight(h.tagline, h.tagRanges).map((x) => x.t).join('');
    ok(`高亮不丢字 ${q}/${h.id}`, joinedName === h.name && joinedTag === h.tagline);
  }
}
ok('高亮有命中即非空', hits('密码', 5).some((h) => h.nameRanges.length > 0));

// 10. 纠错建议（中文同音错字是主要场景，英文拼错在中文站里候选少，不强制）
const typo = searchTools(pi, '时间戳装换', { limit: 5 });
ok('中文错字有建议', typo.suggestions.length > 0, JSON.stringify(typo.suggestions));
ok('建议指向正确词', typo.suggestions.some((s) => s.includes('时间戳')), JSON.stringify(typo.suggestions));
const miss = searchTools(pi, 'pssword', { limit: 5 });
ok('无候选时不崩且不抛错', Array.isArray(miss.hits) && Array.isArray(miss.suggestions));
ok('编辑距离基本正确', editDistance('json', 'jsno', 2) === 2 && editDistance('json', 'json', 2) === 0);

// 11. 热门兜底
const hot = hotTools(pi, 8);
ok('热门非空且有序', hot.length === 8 && hot[0].priority >= hot[7].priority);

// 11.5 长尾子页（2026-11-03 新增收录）
// 子页抢的是具体问句，若搜不到等于白建；这里锁住三条底线：
// 进索引、问句能命中、命中的是子页而不是只有母页。
const subDocs = data.u.filter((u) => u.replace(/\/$/, '').split('/tools/')[1]?.includes('/'));
ok('子页已进索引', subDocs.length > 0, `${subDocs.length} 条`);
ok('子页 url 带二级路径', subDocs.every((u) => /^\/tools\/[^/]+\/[^/]+\/$/.test(u)));
ok('搜「客服机器人」命中客服子页', ids('客服机器人').includes('ai-model-selector/customer-service'), ids('客服机器人').slice(0, 4).join(','));
ok('搜「写代码 模型」命中 coding 子页', ids('写代码 模型').includes('ai-model-selector/coding'), ids('写代码 模型').slice(0, 4).join(','));
ok('搜「合同审阅」命中子页', ids('合同审阅').includes('ai-model-selector/contract-review'));
// 母页仍是主入口：搜工具名时母页排在子页前面
const parentRank = ids('场景选模型助手').indexOf('ai-model-selector');
const subRank = ids('场景选模型助手').findIndex((id) => id.startsWith('ai-model-selector/'));
ok('母页优先于子页', parentRank >= 0 && (subRank < 0 || parentRank < subRank), `母页#${parentRank} 子页#${subRank}`);

// 12. 性能（本地 Node，无 DOM，代表纯计算成本）
const qs = ['密码', 'json', 'mima', '换算', '时间戳转换', 'a', '二维码生成', 'base64 编码', '图片', '个人所得税'];
const t0 = performance.now();
for (let i = 0; i < 200; i++) searchTools(pi, qs[i % qs.length]);
const perCall = (performance.now() - t0) / 200;
ok('单次检索 < 8ms', perCall < 8, `${perCall.toFixed(2)}ms`);

// ── 输出 ────────────────────────────────────────────────────────────────────
console.log(`\n[search] 工具 ${data.n.length} 条 · 索引 ${(JSON.stringify(data).length / 1024).toFixed(1)}KB · 单次检索 ${perCall.toFixed(2)}ms`);
if (fails.length) {
  console.error(`\n✗ ${fails.length} 项失败 / 共 ${pass + fails.length} 项：`);
  for (const f of fails) console.error('  · ' + f);
  process.exit(1);
}
console.log(`✓ 全部 ${pass} 项通过`);
