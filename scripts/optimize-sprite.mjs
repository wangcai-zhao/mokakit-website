/**
 * 产物级图标雪碧图瘦身。
 *
 * 背景：BaseLayout 每页都内联一份「全站所有图标」的 SVG 雪碧图（106 个 symbol，约 33KB），
 * 而单个页面实际只用 5-15 个。实测每个 HTML 有近一半体积是这些用不上的 path，
 * 既拖慢首屏解析也抬高传输成本（LCP / 下载体积直接相关）。
 *
 * 为什么不在构建期做：Astro 静态渲染时父布局拿不到子组件最终用了哪些图标，
 * 只能统一输出全量。放到产物阶段做是最省事也最准确的时机。
 *
 * 做法：扫每个 HTML 里实际出现的 `<use href="#icon-xxx">`，删掉其余 symbol。
 *
 * 安全护栏：
 * - 若页面 JS 里出现动态拼接 sprite id 的痕迹（如 `#icon-` + 变量），整页跳过不瘦身，
 *   避免删掉运行态才用到的图标（宁可不优化，也不能让图标变空白方块）。
 * - 找不到任何 symbol 的页面直接跳过。
 *
 * 用法：node scripts/optimize-sprite.mjs [--dry]
 */
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const DRY = process.argv.includes('--dry');

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

const SYMBOL_RE = /<symbol id="icon-([A-Za-z0-9-]+)"[\s\S]*?<\/symbol>/g;

function optimize(file) {
  const html = readFileSync(file, 'utf8');

  // 定位雪碧图容器（display:none 的 svg）
  const spriteStart = html.indexOf('<svg xmlns="http://www.w3.org/2000/svg" style="display:none"');
  if (spriteStart === -1) return null;
  const spriteEnd = html.indexOf('</svg>', spriteStart);
  if (spriteEnd === -1) return null;
  const sprite = html.slice(spriteStart, spriteEnd + 6);

  const symbols = [...sprite.matchAll(SYMBOL_RE)];
  if (symbols.length === 0) return null;

  const before = Buffer.byteLength(html);

  // 页面正文（去掉 script）里实际用到的图标
  const bodyNoScript = html.replace(/<script[\s\S]*?<\/script>/g, '');
  const used = new Set(
    [...bodyNoScript.matchAll(/href="#icon-([A-Za-z0-9-]+)"/g)].map((mm) => mm[1]),
  );

  // 护栏：script 里若存在动态拼接 sprite id，本页不瘦身
  const scripts = html.match(/<script[\s\S]*?<\/script>/g) || [];
  const dynamicRef = scripts.some((s) => /['"`#][^'"`]{0,10}#?icon-/.test(s) && /\+|\$\{/.test(s));
  if (dynamicRef) return null;

  const toDrop = symbols.filter((s) => !used.has(s[1]));
  if (toDrop.length === 0) return null;

  let newSprite = sprite;
  for (const s of toDrop) newSprite = newSprite.replace(s[0], '');

  const newHtml = html.slice(0, spriteStart) + newSprite + html.slice(spriteEnd + 6);
  const after = Buffer.byteLength(newHtml);

  if (!DRY) writeFileSync(file, newHtml);

  return {
    rel: relative(DIST, file).split(sep).join('/'),
    total: symbols.length,
    used: used.size,
    dropped: toDrop.length,
    savedBytes: before - after,
    before,
    after,
  };
}

let files = [];
try {
  files = walk(DIST);
} catch {
  console.error('找不到 dist/，请先跑 npm run build');
  process.exit(1);
}

const results = [];
for (const f of files) {
  const r = optimize(f);
  if (r) results.push(r);
}

const totalSaved = results.reduce((s, r) => s + r.savedBytes, 0);
console.log(
  `雪碧图瘦身：处理 ${results.length}/${files.length} 个页面${DRY ? '（dry run，未写盘）' : ''}`,
);
console.log(
  `累计减少 ${(totalSaved / 1024).toFixed(1)} KB（平均 ${results.length ? (totalSaved / results.length / 1024).toFixed(1) : 0} KB/页）`,
);

const top = [...results].sort((a, b) => b.savedBytes - a.savedBytes).slice(0, 5);
for (const r of top) {
  console.log(
    `  ${r.rel}: ${r.total} → 保留 ${r.used}（删除 ${r.dropped}），${(r.before / 1024).toFixed(1)}KB → ${(r.after / 1024).toFixed(1)}KB`,
  );
}
