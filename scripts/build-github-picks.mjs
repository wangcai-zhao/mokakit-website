/**
 * 把 workbench/github-stars.json 内联进模板，生成可双击打开的挑选台。
 * 用法：node scripts/build-github-picks.mjs
 * 产出：workbench/github-picks.html（单文件，file:// 直接打开，无需起服务）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tpl = readFileSync(resolve(ROOT, 'workbench/github-picks.template.html'), 'utf8');
const raw = readFileSync(resolve(ROOT, 'workbench/github-stars.json'), 'utf8');
const data = JSON.parse(raw);

// 内联进 <script type="application/json">，需转义 </script 防止提前闭合
const safe = JSON.stringify(data).replace(/<\/script/gi, '<\\/script');
const html = tpl.replace('__DATA__', safe);

const out = resolve(ROOT, 'workbench/github-picks.html');
writeFileSync(out, html, 'utf8');
console.log(`✓ ${data.totalRepos} 个仓库已内联 → ${out}  (${(html.length / 1024).toFixed(0)} KB)`);
