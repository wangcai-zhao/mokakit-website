/**
 * 线上核验：18 个场景子页是否真的可访问、标题正确、正文在、无 5xx。
 *
 * 跑法：node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs \
 *         scripts/verify-live-subpages.mjs
 *
 * 为什么部署后还要再查一遍：构建通过 ≠ 线上生效。nginx 目录替换、
 * 缓存、sitemap 未重新生成都可能让线上还是旧版。
 */
import { TASKS } from '../src/tools/ai-model-selector/data.ts';
import { TASK_PAGES } from '../src/tools/ai-model-selector/seo.ts';

const BASE = process.env.BASE || 'https://www.mokakit.com';
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));

let bad = 0;
const rows = [];

for (const t of TASKS) {
  const page = TASK_PAGES[t.id];
  const url = `${BASE}/tools/ai-model-selector/${page.slug}/`;
  const issues = [];
  let code = 0;
  let ms = 0;
  try {
    const t0 = Date.now();
    const res = await fetch(url, { redirect: 'follow' });
    ms = Date.now() - t0;
    code = res.status;
    const html = await res.text();
    if (code !== 200) issues.push(`HTTP ${code}`);
    if (!html.includes(page.seoTitle)) issues.push('title 不符');
    if (!html.includes('权重是怎么定的')) issues.push('正文缺失');
    if (!html.includes(`ai-model-selector/${page.slug}/`)) issues.push('canonical 不符');
    if (html.includes('未知场景')) issues.push('渲染异常');
  } catch (e) {
    issues.push(`请求失败 ${e.message}`);
  }
  if (issues.length) bad++;
  rows.push({ slug: page.slug, code, ms, issues });
}

console.log(`\n线上核验 ${BASE} · 共 ${rows.length} 个子页\n${'─'.repeat(66)}`);
for (const r of rows) {
  console.log(`${r.issues.length ? '✗' : '✓'} ${pad('/tools/ai-model-selector/' + r.slug + '/', 46)} ${pad(String(r.code), 4)} ${pad(r.ms + 'ms', 7)} ${r.issues.join('、')}`);
}
console.log(`${'─'.repeat(66)}\n通过 ${rows.length - bad} 个，异常 ${bad} 个\n`);
if (bad) process.exit(1);
