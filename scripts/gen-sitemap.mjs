/**
 * 生成 sitemap（扫 dist/ 静态产物，不依赖 @astrojs/sitemap 插件）。
 *
 * 为何独立脚本：沙箱环境下 @astrojs/sitemap 插件偶发卡死/静默失败。
 * 本脚本直接遍历 dist 下的 index.html，产出符合搜索引擎规范的
 * sitemap-0.xml + sitemap-index.xml，robots.txt 已指向 sitemap-index.xml。
 *
 * ★ SEO 要点 ★
 * 1. lastmod 必须反映真实更新时间。早年版本把所有 URL 的 lastmod 都写成构建当天，
 *    结果每次发布都让 500+ 个页面「看起来全更新了」，爬虫反复重抓没变过的页面，
 *    白白浪费抓取预算（crawl budget）。现在工具页取 meta.ts 的 updatedAt，
 *    其余静态页取 git 最近一次改动时间，实在拿不到才回落到今天。
 * 2. priority 反映相对重要性（本站内部的相对值），工具页按 meta.priority(0-10) 映射，
 *    避免 belang 的深度玩法把长尾页和首页设成同一个权重。
 *
 * 用法：node scripts/gen-sitemap.mjs
 */
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url)); // 仓库根
const DIST = join(ROOT, 'dist');
const TOOLS_DIR = join(ROOT, 'src', 'tools');

const TODAY = new Date().toISOString().slice(0, 10);

// 从 src/config/site.ts 取 SITE.url（避免与 astro.config 的 SITE.url 漂移）
const siteSrc = readFileSync(join(ROOT, 'src/config/site.ts'), 'utf8');
const m = siteSrc.match(/url:\s*'([^']+)'/);
const BASE = (m ? m[1] : 'https://www.mokakit.com').replace(/\/$/, '');

/** 读取全部工具的 UpdatedAt / priority：key 是 `/tools/<id>/` */
function loadToolMeta() {
  const map = new Map();
  let dirs = [];
  try {
    dirs = readdirSync(TOOLS_DIR);
  } catch {
    return map;
  }
  for (const dir of dirs) {
    const p = join(TOOLS_DIR, dir, 'meta.ts');
    let src;
    try {
      src = readFileSync(p, 'utf8');
    } catch {
      continue;
    }
    const id = dir;
    const updated = src.match(/updatedAt:\s*'([^']+)'/)?.[1];
    const prio = src.match(/priority:\s*([0-9.]+)/)?.[1];
    // noindex 的工具不进 sitemap（与页面上的 robots meta 保持一致，否则自相矛盾）
    if (/noindex:\s*true/.test(src)) continue;
    map.set(`/tools/${id}/`, {
      updatedAt: updated || TODAY,
      priority: prio ? Number(prio) : 5,
    });
  }
  return map;
}

/**
 * 静态页的最后修改时间。
 *
 * ⚠️ 性能陷阱：早期版本对每个页面单独 execSync('git log -1 ...')，
 * 500+ 个子进程直接把构建拖到几分钟并触发超时。这里改成**只跑一次** git，
 * 一次性把「文件 → 最近提交日期」建表，后面查表即可（零子进程）。
 *
 * `git log --format=%cs --name-only` 的输出形如：
 *   2026-09-23
 *
 *   src/content/blog/a.md
 *   src/pages/b.astro
 *   2026-09-20
 *   ...
 * 用一个游标按「空行后的日期行」推进即可解析。
 */
const GIT_DATE_MAP = (() => {
  const map = new Map();
  let raw;
  try {
    raw = execSync('git log --pretty=format:__TS__%cs --name-only', {
      cwd: ROOT,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
  } catch {
    return map; // 非 git 环境（如部署机上的纯产物目录）→ 全部回落到今天
  }
  let current = null;
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('__TS__')) {
      current = t.slice(6).trim();
      continue;
    }
    // 同一次提交里可能列出多个文件；取第一次见到（即最近一次提交）的日期
    if (current && /^\d{4}-\d{2}-\d{2}$/.test(current) && !map.has(t)) {
      map.set(t, current);
    }
  }
  return map;
})();

function gitDateOf(relFile) {
  return GIT_DATE_MAP.get(relFile) || null;
}

const TOOL_META = loadToolMeta();

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

/** src 侧源文件猜测：/blog/xxx/ → src/content/blog/xxx.md 或 src/pages/blog/[...] */
function guessSourceFile(path, rel) {
  if (path.startsWith('/blog/')) {
    const slug = path.replace('/blog/', '').replace(/\/$/, '');
    return [`src/content/blog/${slug}.md`];
  }
  if (path.startsWith('/tips/')) {
    const slug = path.replace('/tips/', '').replace(/\/$/, '');
    return [`src/content/tips/${slug}.md`];
  }
  return [
    `src/pages/${rel.replace(/index\.html$/, 'index.astro')}`,
    `src/pages/${rel.replace(/index\.html$/, '')}.astro`,
  ];
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

  const meta = TOOL_META.get(path);
  const depth = path === '/' ? 0 : path.split('/').filter(Boolean).length;

  let priority;
  let lastmod;

  if (meta) {
    // 工具页：优先级由自身 priority(0-10) 映射到 0.4-0.9
    priority = Math.min(0.9, Math.max(0.4, 0.4 + meta.priority * 0.05));
    lastmod = meta.updatedAt;
  } else if (depth === 0) {
    priority = 1.0;
    lastmod = TODAY; // 首页聚合全部工具，每次发布都算有变化
  } else if (depth <= 1) {
    priority = 0.8; // /tools/、/blog/、/tips/ 这类频道页
    lastmod = TODAY;
  } else {
    priority = 0.6;
    // 内容站 publishDate/updatedDate 来自 frontmatter，git 日期足够接近
    const candidates = guessSourceFile(path, rel);
    lastmod = candidates.map(gitDateOf).find(Boolean) || TODAY;
  }

  urls.push({ loc: BASE + path, priority, lastmod });
}
urls.sort((a, b) => a.loc.localeCompare(b.loc));

const escapeXml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const urlset =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map(
      (u) =>
        `  <url><loc>${escapeXml(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority.toFixed(1)}</priority></url>`,
    )
    .join('\n') +
  '\n</urlset>\n';

const index =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  `  <sitemap><loc>${BASE}/sitemap-0.xml</loc><lastmod>${TODAY}</lastmod></sitemap>\n` +
  '</sitemapindex>\n';

writeFileSync(join(DIST, 'sitemap-0.xml'), urlset);
writeFileSync(join(DIST, 'sitemap-index.xml'), index);
console.log(
  `sitemap 已生成：${urls.length} 条 URL → dist/sitemap-0.xml + dist/sitemap-index.xml`,
);
