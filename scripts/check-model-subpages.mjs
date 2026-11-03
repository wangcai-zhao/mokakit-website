/**
 * 场景选模型助手 · 18 个长尾子页产物核验
 *
 * 跑法：node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs \
 *         scripts/check-model-subpages.mjs
 *
 * 光看「文件存在」不够：astro-island 缺失说明工具区是死壳，
 * 排名表没渲染说明正文没进 HTML（爬虫看到的就是空白页）。
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TASKS } from '../src/tools/ai-model-selector/data.ts';
import { TASK_PAGES } from '../src/tools/ai-model-selector/seo.ts';

const ROOT = process.cwd();
const BASE = join(ROOT, 'dist', 'tools', 'ai-model-selector');

let bad = 0;
const rows = [];

for (const t of TASKS) {
  const page = TASK_PAGES[t.id];
  const file = join(BASE, page.slug, 'index.html');
  const issues = [];

  if (!existsSync(file)) {
    issues.push('文件缺失');
    rows.push({ task: t.id, slug: page.slug, fit: '-', issues });
    bad++;
    continue;
  }

  const html = readFileSync(file, 'utf8');
  if (!html.includes(page.seoTitle)) issues.push('title 不符');
  if (!html.includes(`rel="canonical" href="https://www.mokakit.com/tools/ai-model-selector/${page.slug}/"`)) issues.push('canonical 缺失');
  if (!html.includes(page.title)) issues.push('h1 缺失');
  if (!html.includes('权重是怎么定的')) issues.push('正文未渲染');
  if ((html.match(/astro-island/g) ?? []).length < 1) issues.push('未水合');
  // 排名表至少要有 5 行（Top 5）
  const body = html.slice(html.indexOf('排名前 5'), html.indexOf('权重是怎么定的'));
  const trCount = (body.match(/<tr>/g) ?? []).length - 1;
  if (trCount < 5) issues.push(`排名表仅 ${trCount} 行`);
  if (html.includes('未知场景')) issues.push('渲染异常');

  if (issues.length) bad++;
  rows.push({ task: t.id, slug: page.slug, fit: `${trCount}行`, issues });
}

const pad = (s, n) => s + ' '.repeat(Math.max(0, n - s.length));
console.log(`\n长尾子页核验（dist）· 共 ${rows.length} 个\n${'─'.repeat(64)}`);
for (const r of rows) {
  console.log(`${r.issues.length ? '✗' : '✓'} /tools/ai-model-selector/${pad(r.slug + '/', 26)} ${pad(r.fit, 6)} ${r.issues.join('、')}`);
}
console.log(`${'─'.repeat(64)}\n通过 ${rows.length - bad} 个，异常 ${bad} 个\n`);
if (bad) process.exit(1);
