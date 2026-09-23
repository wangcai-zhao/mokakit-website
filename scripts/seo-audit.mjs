/**
 * SEO 审计：扫描 dist/ 下全部 HTML 页面，统计元标签 / 结构化数据 / 可索引性缺口。
 *
 * 为何独立脚本：SEO 问题在源码层难以静态判定（父布局 + 子模板 + 组件叠加），
 * 只有落到产物 HTML 才能看到最终效果。每次改动后跑一遍即可量化对比。
 *
 * 用法：node scripts/seo-audit.mjs [--json]
 *   --json  输出 JSON（供脚本间比较），默认输出人读表格。
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');

/**
 * 验证文件 / 非页面产物不算 SEO 对象：
 * 百度站长等的验证页（public/*.html）是平台校验用的固定文本，
 * 改它会导致验证失败，必须原样保留 —— 直接从审计里排除。
 */
function staticPassthroughHtmls() {
  try {
    return readdirSync(PUBLIC)
      .filter((f) => f.endsWith('.html'))
      .reduce((set, f) => set.add(f), new Set());
  } catch {
    return new Set();
  }
}
const PASSTHROUGH = staticPassthroughHtmls();

/** 阈值：参考 Google/Baidu 的实际截断区间，取偏保守值 */
const LIMITS = {
  titleMin: 10,
  titleMax: 60, // 百度标题展示上限约 56-60 字符（汉字按 2 计宽度的一半估算，这里按字符数保守取 60）
  descMin: 50,
  descMax: 160,
};

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

/**
 * 按gterah (?s) 标志不可用的旧 Node 兼容写法用 [\s\S] 代替。
 * 全部提取走正则而非 DOM 解析：产物是静态 HTML，正则足够且无依赖。
 */
function re(source, pattern) {
  const m = source.match(pattern);
  return m ? m[1] : null;
}
function reAll(source, pattern) {
  return [...source.matchAll(new RegExp(pattern, 'g'))].map((m) => m[1]);
}

function countOccurrences(source, pattern) {
  return (source.match(new RegExp(pattern, 'g')) || []).length;
}

/**
 * 提取属性值（属性内部可能含引号，比如百度统计的 description 带半角撇号）。
 * 先整体抓标签、再从标签里取 content，避免 /content=["']([^"']*)["']/ 这类
 * 正则被正文里的引号截断导致误判（曾经把 "y' = kx" 截断成 "y"，误报 6 页描述过短）。
 */
/**
 * 属性值段。写成「单字符替代」三选一，而不是原来的 `(?:"[^"]*"|'[^']*'|[^>])*`：
 * 老写法里 `[^>]` 能吃掉引号本身，于是同一段字符串有指数级种切分方式，
 * 实测在 5KB 的 head 上就能跑到 60 秒以上（灾难性回溯），586 页直接超时。
 * 把 `[^>]` 收紧成 `[^>"']` 后，遇到引号只剩「成对引号」这一条路，回溯退化成线性。
 */
const ANY = '(?:[^>"\']|"[^"]*"|\'[^\']*\')*?';

function attrOf(tag, name) {
  const m = tag.match(new RegExp(`${name}=(?:"([^"]*)"|'([^']*)')`));
  return m ? (m[1] ?? m[2] ?? null) : null;
}

/** 抓具备某个属性的标签整体：先从 < 扫到配对的 >，跳过属性值里的尖括号 */
function tagWith(source, tagName, cond) {
  const m = source.match(new RegExp(`<${tagName}\\s${ANY}${cond}${ANY}>`));
  return m ? m[0] : null;
}

/** 取 meta[name=x] 的 content（兼容 name/content 两种书写顺序） */
function metaContent(source, name) {
  const tag =
    tagWith(source, 'meta', `name=["']${name}["']`) ||
    source.match(
      new RegExp(`<meta\\s+content=(?:"[^"]*"|'[^']*')\\s+name=["']${name}["']\\s*/?>`),
    )?.[0];
  return tag ? attrOf(tag, 'content') : null;
}

/** 取 meta[property=x] 的 content */
function metaProperty(source, property) {
  const tag = tagWith(source, 'meta', `property=["']${property}["']`);
  return tag ? attrOf(tag, 'content') : null;
}

function auditPage(file) {
  const html = readFileSync(file, 'utf8');
  const rel = relative(DIST, file).split(sep).join('/');
  const issues = [];

  /**
   * ⚠️ 性能关键：meta / canonical / og / JSON-LD 全都只出现在 <head> 里，
   * 早期版本却拿它们在整篇 HTML（含几十 KB 正文）上跑带嵌套量词的正则，
   * 遇上属性值里成对的引号就可能触发灾难性回溯，586 页直接跑到超时。
   * 先把 head 切出来再匹配，扫描量降一个数量级，既快又不会因为正文里的
   * 尖括号/引号被误判（顺带修掉了几个错误缺报）。
   */
  const headEnd = html.indexOf('</head>');
  const head = headEnd === -1 ? html : html.slice(0, headEnd + 7);

  const title = re(head, /<title>([\s\S]*?)<\/title>/);
  const desc = metaContent(head, 'description');
  const canonicalTag =
    head.match(/<link(?:"[^"]*"|'[^']*'|[^>])*?\srel=["']canonical["'](?:"[^"]*"|'[^']*'|[^>])*?>/)?.[0] ?? '';
  const canonical = attrOf(canonicalTag, 'href');
  const robotsMeta = metaContent(head, 'robots');
  const ogTitle = metaProperty(head, 'og:title');
  const ogDesc = metaProperty(head, 'og:description');
  const ogImage = metaProperty(head, 'og:image');
  const ogUrl = metaProperty(head, 'og:url');
  const twImage = metaContent(head, 'twitter:image');
  const twCard = metaContent(head, 'twitter:card');
  const viewport = metaContent(head, 'viewport');
  const lang = re(html, /<html[^>]*\slang=["']([^"']*)["']/);
  const h1Count = countOccurrences(html, /<h1[\s>]/);
  const imgCount = countOccurrences(html, /<img\s/);
  const imgNoAlt = countOccurrences(html, /<img\s(?![^>]*\salt=)[^>]*>/);
  // JSON-LD 体积大且允许出现在 head 尾 / body，仍整篇提取，但用非贪婪 + 长度上限兜底
  const jsonLdBlocks = reAll(head, /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/);

  const ldTypes = [];
  let ldParseErrors = 0;
  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block);
      const collect = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) return obj.forEach(collect);
        if (obj['@type']) {
          if (Array.isArray(obj['@type'])) ldTypes.push(...obj['@type']);
          else ldTypes.push(obj['@type']);
        }
        if (obj['@graph']) collect(obj['@graph']);
      };
      collect(parsed);
    } catch {
      ldParseErrors++;
    }
  }

  const noindex = !!robotsMeta && /noindex/i.test(robotsMeta);

  /**
   * noindex 页面不进搜索结果，meta 标题/描述的长度、OG 标签写得短或缺失都无所谓，
   * 没必要为它们刷告警（曾把 /search/、/go/、404 报成问题，干扰真正要修的页面）。
   * 但结构性问题（缺失语言、多 h1、坏 JSON-LD）仍然要报 —— 那会影响真实用户的可读性。
   */
  const MI = noindex; // meta 类告警忽略开关

  if (!MI) {
    if (!title || title.trim().length < LIMITS.titleMin) issues.push('title_missing_or_short');
    else if (title.trim().length > LIMITS.titleMax) issues.push('title_too_long');
    if (!desc) issues.push('desc_missing');
    else if (desc.length < LIMITS.descMin) issues.push('desc_too_short');
    else if (desc.length > LIMITS.descMax) issues.push('desc_too_long');
    if (!ogTitle) issues.push('og_title_missing');
    if (!ogDesc) issues.push('og_desc_missing');
    if (!ogImage) issues.push('og_image_missing');
    if (!ogUrl) issues.push('og_url_missing');
    if (!twCard) issues.push('twitter_card_missing');
    if (!twImage) issues.push('twitter_image_missing');
  }
  if (!canonical) issues.push('canonical_missing');
  if (!viewport) issues.push('viewport_missing');
  if (!lang) issues.push('lang_missing');
  if (h1Count === 0) issues.push('h1_missing');
  if (h1Count > 1) issues.push('h1_multiple');
  if (imgNoAlt > 0) issues.push('img_alt_missing');
  if (ldParseErrors > 0) issues.push('jsonld_parse_error');
  if (jsonLdBlocks.length === 0) issues.push('jsonld_missing');

  return {
    rel,
    noindex,
    issues,
    titleLen: title ? title.trim().length : 0,
    descLen: desc ? desc.length : 0,
    ldTypes: [...new Set(ldTypes)],
    hasBreadcrumb: ldTypes.includes('BreadcrumbList'),
    hasApp: ldTypes.includes('SoftwareApplication') || ldTypes.includes('WebApplication'),
    hasFaq: ldTypes.includes('FAQPage'),
    imgCount,
    imgNoAlt,
    bytes: Buffer.byteLength(html),
  };
}

const files = walk(DIST).filter(
  (f) => !PASSTHROUGH.has(f.split(sep).pop() ?? ''),
);
const pages = files.map(auditPage);

const issueCounts = {};
for (const p of pages) for (const i of p.issues) issueCounts[i] = (issueCounts[i] || 0) + 1;

const indexed = pages.filter((p) => !p.noindex);
const noindexPages = pages.filter((p) => p.noindex).map((p) => p.rel);

const typeCount = {};
for (const p of pages) for (const t of p.ldTypes) typeCount[t] = (typeCount[t] || 0) + 1;

const summary = {
  totalPages: pages.length,
  indexablePages: indexed.length,
  noindexPages: noindexPages.length,
  pagesWithIssues: pages.filter((p) => p.issues.length > 0).length,
  coverage: {
    breadcrumb: pages.filter((p) => p.hasBreadcrumb).length,
    softwareApp: pages.filter((p) => p.hasApp).length,
    faq: pages.filter((p) => p.hasFaq).length,
  },
  issueCounts,
  ldTypeCoverage: typeCount,
  avgHtmlBytes: Math.round(pages.reduce((s, p) => s + p.bytes, 0) / pages.length),
  maxHtmlBytes: Math.max(...pages.map((p) => p.bytes)),
  noindexSample: noindexPages.slice(0, 20),
  worstPages: [...pages]
    .sort((a, b) => b.issues.length - a.issues.length || b.bytes - a.bytes)
    .slice(0, 15)
    .map((p) => ({ rel: p.rel, issues: p.issues, bytes: p.bytes })),
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log('=== SEO 审计报告 ===\n');
  console.log(`总页面数：${summary.totalPages}（可索引 ${summary.indexablePages} / noindex ${summary.noindexPages}）`);
  console.log(`存在问题页面：${summary.pagesWithIssues}`);
  console.log(`HTML 平均体积：${(summary.avgHtmlBytes / 1024).toFixed(1)} KB，最大 ${(summary.maxHtmlBytes / 1024).toFixed(1)} KB\n`);
  console.log('--- 问题分布 ---');
  for (const [k, v] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(26)} ${v}`);
  }
  console.log('\n--- 结构化数据覆盖 ---');
  for (const [k, v] of Object.entries(typeCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(26)} ${v}`);
  }
  console.log(`  面包屑 BreadcrumbList     ${summary.coverage.breadcrumb}`);
  console.log(`  SoftwareApplication       ${summary.coverage.softwareApp}`);
  console.log(`  FAQPage                   ${summary.coverage.faq}`);
  if (noindexPages.length) {
    console.log(`\n--- noindex 页面（${noindexPages.length}）样例 ---`);
    console.log('  ' + noindexPages.slice(0, 10).join('\n  '));
  }
  console.log('\n--- 问题最多的页面 ---');
  for (const p of summary.worstPages.slice(0, 10)) {
    console.log(`  ${p.rel}  (${(p.bytes / 1024).toFixed(0)}KB) ${p.issues.join(', ')}`);
  }
}
