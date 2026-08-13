/**
 * 生成 sitemap（扫 dist/ 静态产物，不依赖 @astrojs/sitemap 插件）。
 *
 * 为何独立脚本：沙箱环境下 @astrojs/sitemap 插件偶发卡死/静默失败。
 * 本脚本直接遍历 dist 下的 index.html，产出符合搜索引擎规范的
 * sitemap-0.xml + sitemap-index.xml，robots.txt 已指向 sitemap-index.xml。
 *
 * 用法：node scripts/gen-sitemap.mjs
 */
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url)); // 仓库根
const DIST = join(ROOT, 'dist');

// 从 src/config/site.ts 取 SITE.url（避免与 astro.config 的 SITE.url 漂移）
const siteSrc = readFileSync(join(ROOT, 'src/config/site.ts'), 'utf8');
const m = siteSrc.match(/url:\s*'([^']+)'/);
const BASE = (m ? m[1] : 'https://www.mokakit.com').replace(/\/$/, '');

// 递归收集 dist 下所有 index.html / 404.html
function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (name === 'index.html' || name === '404.html') acc.push(full);
  }
  return acc;
}

const files = walk(DIST);
const urls = [];
for (const f of files) {
  const rel = relative(DIST, f).split(sep).join('/');
  if (rel === '404.html') continue; // 404 不收录
  if (rel.startsWith('go/')) continue; // 跳转中转页不收录（功能页，noindex）
  if (rel.startsWith('search/')) continue; // 搜索结果页无收录价值
  if (rel === 'workbench.html') continue; // 内部进度工作台不收录
  let path = '/' + rel.replace(/index\.html$/, '');
  if (path !== '/' && !path.endsWith('/')) path += '/';
  const depth = path === '/' ? 0 : path.split('/').filter(Boolean).length;
  const priority = depth === 0 ? 1.0 : depth === 1 ? 0.9 : depth === 2 ? 0.8 : 0.7;
  urls.push({ loc: BASE + path, priority, lastmod: new Date().toISOString().slice(0, 10) });
}
urls.sort((a, b) => a.loc.localeCompare(b.loc));

const urlset =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map(
      (u) =>
        `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority.toFixed(1)}</priority></url>`,
    )
    .join('\n') +
  '\n</urlset>\n';

const index =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  `  <sitemap><loc>${BASE}/sitemap-0.xml</loc></sitemap>\n` +
  '</sitemapindex>\n';

writeFileSync(join(DIST, 'sitemap-0.xml'), urlset);
writeFileSync(join(DIST, 'sitemap-index.xml'), index);
console.log(`sitemap 已生成：${urls.length} 条 URL → dist/sitemap-0.xml + dist/sitemap-index.xml`);
