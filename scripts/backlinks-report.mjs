#!/usr/bin/env node
// backlinks-report.mjs
// MokaKit 反向链接看板生成器
// 读取 seo/*.csv（兼容 Google Search Console 与 百度搜索资源平台 导出格式），
// 通过“mokakit 主机判定”识别外链域名与目标页，聚合后生成自包含 HTML 看板。
//
// 用法：
//   node scripts/backlinks-report.mjs                # 仅用真实 CSV（忽略 sample- 开头文件）
//   node scripts/backlinks-report.mjs --include-samples   # 仅用示例数据渲染演示看板
//   node scripts/backlinks-report.mjs --dir=seo --out=seo/backlinks-report.html
//
// 不写任何线上服务端逻辑，看板纯前端静态、零追踪。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SEO_DIR = path.resolve(ROOT, 'seo');

const ROOT_DIR = path.resolve(ROOT, 'seo');
const DEFAULT_OUT = path.join(SEO_DIR, 'backlinks-report.html');

const args = process.argv.slice(2);
const includeSamples = args.includes('--include-samples') || args.includes('-s');
const dirArg = args.find((a) => a.startsWith('--dir='))?.split('=')[1];
const outArg = args.find((a) => a.startsWith('--out='))?.split('=')[1];
const SEO_DIR_RES = dirArg ? path.resolve(dirArg) : ROOT_DIR;
const OUT = outArg ? path.resolve(outArg) : DEFAULT_OUT;

const MOKA_HOSTS = ['mokakit.com', 'mokakit.cn', 'www.mokakit.com', 'www.mokakit.cn'];
const isMoka = (s) => {
  if (!s) return false;
  const t = String(s).toLowerCase();
  return (
    MOKA_HOSTS.some((h) => t.includes(h)) ||
    t.startsWith('localhost') ||
    t.includes('127.0.0.1')
  );
};

// ---------- 通用 CSV 解析（支持引号转义） ----------
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (c === '\r') {
        /* ignore */
      } else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function hostnameOf(s) {
  if (!s) return '';
  s = String(s).trim();
  if (!/^https?:\/\//i.test(s)) {
    return s.replace(/^www\./, '').split('/')[0].split('?')[0].toLowerCase();
  }
  try {
    return new URL(s).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    const m = s.match(/\/\/([^/]+)/);
    return m ? m[1].replace(/^www\./, '').toLowerCase() : s;
  }
}

function pathOf(s) {
  if (!s) return '';
  try {
    const u = new URL(String(s));
    return u.pathname + u.search;
  } catch {
    return String(s);
  }
}

// ---------- 平台归类 ----------
function classify(domain) {
  if (!domain) return '其他';
  const d = domain.toLowerCase();
  const social = ['twitter.com', 'x.com', 'facebook.com', 'linkedin.com', 'instagram.com', 'youtube.com', 'reddit.com', 'telegram.org', 't.me', 'weibo.com', 'zhihu.com', 'douyin.com', 'xiaohongshu.com', 'xhslink.com', 'pinterest.com', 'medium.com'];
  if (social.some((s) => d === s || d.endsWith('.' + s))) return '社媒';
  const forum = ['v2ex.com', 'discord.com', 'bbs', 'forum', 'tieba'];
  if (forum.some((s) => d.includes(s))) return '论坛';
  const blog = ['blog', 'wordpress', 'csdn.net', 'cnblogs.com', 'juejin.cn', 'blogspot', 'substack', 'github.io', 'notion.site', 'hexo', 'typecho'];
  if (blog.some((s) => d === s || d.endsWith('.' + s) || d.includes(s))) return '博客/个人';
  const nav = ['hao123', '265.com', 'botue', 'directory', 'daohang', 'webnav', 'similarsites', 'alexa', 'nav.'];
  if (nav.some((s) => d === s || d.endsWith('.' + s) || d.includes(s))) return '导航/目录';
  const gov = ['.gov', '.gov.cn', '.edu', '.edu.cn'];
  if (gov.some((s) => d.endsWith(s))) return '政府/教育';
  const news = ['news', '36kr', 'jiqizhixin', 'sspai', 'ifanr', 'huxiu'];
  if (news.some((s) => d === s || d.endsWith('.' + s) || d.includes(s))) return '媒体';
  return '其他';
}

// ---------- 读取 CSV 文件 ----------
function listCsv(dir, samplesOnly) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .filter((f) => !f.startsWith('.'))
    .filter((f) => (samplesOnly ? f.startsWith('sample') : !f.startsWith('sample')))
    .map((f) => path.join(dir, f));
}

const ANCHOR_HINTS = ['context', 'anchor', 'link text', '锚文本', '链接文本', '锚'];
function isAnchorHeader(cell) {
  const c = String(cell || '').trim().toLowerCase();
  return ANCHOR_HINTS.some((h) => c.includes(h));
}

function extractRowsFromCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(text);
  const out = [];
  let headerIdx = -1;
  // 找到表头行
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map((c) => String(c || '').trim().toLowerCase());
    if (cells.some((c) => c === 'source' || c === 'target' || c === 'referring' || c === 'page' || c.includes('来源') || c.includes('目标') || c.includes('链接') || c.includes('domain'))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) {
    // 无表头：把所有含 URL/域名 的行当作数据
    for (let i = 0; i < rows.length; i++) out.push(rows[i]);
    return out;
  }
  const header = rows[headerIdx];
  const anchorCol = header.findIndex(isAnchorHeader);
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.length === 0) continue;
    if (cells.every((c) => !String(c || '').trim())) continue;
    // 跳过标题行（首格含 “top/外部/链接” 之类）
    const first = String(cells[0] || '').trim().toLowerCase();
    if (/^(top |external |内部|链接|linking)/.test(first)) continue;
    if (isAnchorHeader(cells[0])) continue;
    out.push({ cells, anchorCol });
  }
  return out;
}

// ---------- 主解析 ----------
function buildData() {
  const files = listCsv(SEO_DIR_RES, includeSamples);
  const byDomain = new Map();
  const byTarget = new Map(); // page -> { count, anchors: Map }
  const anchorGlobal = new Map();

  for (const fp of files) {
    const rows = extractRowsFromCsv(fp);
    for (const { cells, anchorCol } of rows) {
      const anchor = anchorCol >= 0 ? String(cells[anchorCol] || '').trim() : '';
      // 找外链单元格（非 moka 主机）与目标单元格（moka 主机）
      let linking = '';
      let target = '';
      for (let c = 0; c < cells.length; c++) {
        if (c === anchorCol) continue;
        const v = String(cells[c] || '').trim();
        if (!v) continue;
        if (isMoka(v)) {
          if (!target) target = v;
        } else {
          if (!linking) linking = v;
        }
      }
      if (!linking) continue; // 无法确定外链来源，跳过
      const domain = hostnameOf(linking);
      if (!domain) continue;
      byDomain.set(domain, (byDomain.get(domain) || 0) + 1);
      if (target) {
        const t = pathOf(target) || target;
        if (!byTarget.has(t)) byTarget.set(t, { count: 0, anchors: new Map() });
        const rec = byTarget.get(t);
        rec.count += 1;
        if (anchor) {
          rec.anchors.set(anchor, (rec.anchors.get(anchor) || 0) + 1);
          anchorGlobal.set(anchor, (anchorGlobal.get(anchor) || 0) + 1);
        }
      }
    }
  }

  const domainsFull = [...byDomain.entries()]
    .map(([domain, count]) => ({ domain, count, cat: classify(domain) }))
    .sort((a, b) => b.count - a.count);

  const categories = {};
  for (const d of domainsFull) categories[d.cat] = (categories[d.cat] || 0) + d.count;
  const catList = Object.entries(categories)
    .map(([cat, count]) => ({ cat, count }))
    .sort((a, b) => b.count - a.count);

  const targets = [...byTarget.entries()]
    .map(([page, rec]) => {
      const anchors = [...rec.anchors.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([text, count]) => ({ text, count }));
      return { page, count: rec.count, anchors };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  const topAnchors = [...anchorGlobal.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([text, count]) => ({ text, count }));

  const totalLinks = domainsFull.reduce((s, d) => s + d.count, 0);
  const hasData = domainsFull.length > 0;

  return {
    generatedAt: new Date().toISOString(),
    isDemo: includeSamples,
    hasData,
    summary: {
      domains: domainsFull.length,
      links: totalLinks,
      topTarget: targets[0] || null,
      topAnchor: topAnchors[0] || null,
    },
    topDomains: domainsFull.slice(0, 20),
    categories: catList,
    targets,
    domainsFull,
  };
}

// ---------- HTML 渲染 ----------
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHTML(data) {
  const gen = new Date(data.generatedAt).toLocaleString('zh-CN', { hour12: false });
  const maxDomain = data.topDomains.length ? data.topDomains[0].count : 1;
  const maxTarget = data.targets.length ? data.targets[0].count : 1;

  const demoBanner = data.isDemo
    ? `<div class="banner demo">⚠️ 示例数据（sample-*.csv）—— 放入真实站长后台导出 CSV 后重跑 <code>node scripts/backlinks-report.mjs</code> 即可替换。</div>`
    : '';

  const emptyState = !data.hasData
    ? `<div class="banner empty">
         <h3>未检测到反链数据</h3>
         <p>把从 <b>Google Search Console</b>（链接 → 外部链接）与 <b>百度搜索资源平台</b>（数据监控 → 外链分析）导出的 CSV 放进 <code>seo/</code> 目录，然后重跑生成命令即可。</p>
       </div>`
    : '';

  const domainRows = data.topDomains
    .map((d) => {
      const w = Math.max(2, Math.round((d.count / maxDomain) * 100));
      return `<div class="bar-row">
        <div class="bar-label" title="${esc(d.domain)}">${esc(d.domain)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div>
        <div class="bar-val">${d.count}</div>
        <div class="bar-cat">${esc(d.cat)}</div>
      </div>`;
    })
    .join('');

  const catRows = data.categories
    .map(
      (c) =>
        `<div class="chip"><span>${esc(c.cat)}</span><b>${c.count}</b></div>`
    )
    .join('');

  const targetRows = data.targets
    .map((t) => {
      const w = Math.max(2, Math.round((t.count / maxTarget) * 100));
      const anchors = t.anchors.length
        ? t.anchors.map((a) => `${esc(a.text)} <span class="muted">(${a.count})</span>`).join('、')
        : '<span class="muted">—</span>';
      return `<tr>
        <td class="mono">${esc(t.page)}</td>
        <td class="num">${t.count}</td>
        <td>${anchors}</td>
      </tr>`;
    })
    .join('');

  const allDomainRows = data.domainsFull
    .map(
      (d) =>
        `<tr><td>${esc(d.domain)}</td><td class="num">${d.count}</td><td>${esc(d.cat)}</td></tr>`
    )
    .join('');

  const baselineNote = `公开检索基线（2026-08-24 实测）：在公开搜索引擎中以 <code>mokakit.com</code> 检索，未找到指向本站的有效反链；结果多为 mockkit / mochikit / mokkit 等撞名站点噪音。结论——站点上线时间短、体量小、外部索引极少，真实反链必须以站长后台（GSC / 百度搜索资源平台）导出数据为准，公开搜索不可靠。`;

  const summaryCards = data.hasData
    ? `<div class="cards">
        <div class="card"><div class="card-num">${data.summary.domains}</div><div class="card-label">来源域名数</div></div>
        <div class="card"><div class="card-num">${data.summary.links}</div><div class="card-label">反链记录数</div></div>
        <div class="card"><div class="card-num small">${data.summary.topTarget ? esc(data.summary.topTarget.page) : '—'}</div><div class="card-label">被链最多页面</div></div>
        <div class="card"><div class="card-num small">${data.summary.topAnchor ? esc(data.summary.topAnchor.text) : '—'}</div><div class="card-label">高频锚文本</div></div>
      </div>`
    : '';

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>MokaKit 反向链接看板</title>
<style>
  :root{
    --bg:#1a1410; --panel:#251c16; --panel2:#2e231b; --line:#3a2c22;
    --text:#ece2d6; --muted:#a9927f; --accent:#c8884f; --accent2:#e0a86b;
    --social:#6aa9e0; --forum:#c88ad0; --blog:#7bc88a; --nav:#e0c06a;
    --gov:#d08a8a; --news:#d09a6a; --other:#9a8a7a;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif;padding:28px}
  .wrap{max-width:1080px;margin:0 auto}
  h1{font-size:24px;margin:0 0 4px;color:var(--accent2)}
  .sub{color:var(--muted);font-size:13px;margin-bottom:18px}
  .banner{border-radius:10px;padding:14px 16px;margin:14px 0;font-size:14px}
  .banner.demo{background:#3a2a12;border:1px solid var(--accent)}
  .banner.empty{background:var(--panel);border:1px solid var(--line)}
  .banner h3{margin:0 0 6px;color:var(--accent2)}
  .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px}
  .card-num{font-size:26px;font-weight:700;color:var(--accent2);word-break:break-all}
  .card-num.small{font-size:16px;line-height:1.3}
  .card-label{color:var(--muted);font-size:12px;margin-top:4px}
  section{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px;margin:16px 0}
  section h2{font-size:17px;margin:0 0 14px;color:var(--accent2)}
  .bar-row{display:grid;grid-template-columns:200px 1fr 48px 90px;gap:10px;align-items:center;margin:7px 0}
  .bar-label{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .bar-track{background:var(--panel2);border-radius:6px;height:16px;overflow:hidden}
  .bar-fill{background:linear-gradient(90deg,var(--accent),var(--accent2));height:100%;border-radius:6px}
  .bar-val{text-align:right;font-variant-numeric:tabular-nums;color:var(--accent2)}
  .bar-cat{font-size:12px;color:var(--muted)}
  .chips{display:flex;flex-wrap:wrap;gap:8px}
  .chip{background:var(--panel2);border:1px solid var(--line);border-radius:20px;padding:6px 12px;font-size:13px}
  .chip b{color:var(--accent2);margin-left:6px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
  th{color:var(--muted);font-weight:600}
  td.num,th.num{text-align:right;font-variant-numeric:tabular-nums;color:var(--accent2)}
  .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;word-break:break-all}
  .muted{color:var(--muted)}
  code{background:var(--panel2);padding:1px 6px;border-radius:4px;font-size:12px}
  .note{color:var(--muted);font-size:13px;line-height:1.7}
  footer{color:var(--muted);font-size:12px;text-align:center;margin-top:24px}
  @media(max-width:720px){.cards{grid-template-columns:repeat(2,1fr)}.bar-row{grid-template-columns:120px 1fr 40px}.bar-cat{display:none}}
</style>
</head>
<body>
<div class="wrap">
  <h1>☕ MokaKit 反向链接看板</h1>
  <div class="sub">生成时间：${gen} ｜ 数据来源：站长后台导出 CSV（GSC / 百度搜索资源平台）｜ 纯本地静态、零追踪</div>
  ${demoBanner}
  ${emptyState}
  ${summaryCards}
  ${data.hasData ? `<section><h2>Top 20 来源域名</h2>${domainRows || '<p class="muted">无数据</p>'}</section>` : ''}
  ${data.hasData && data.categories.length ? `<section><h2>平台归类</h2><div class="chips">${catRows}</div></section>` : ''}
  ${data.hasData && data.targets.length ? `<section><h2>被链页面 Top（含主要锚文本）</h2><table><thead><tr><th>页面</th><th class="num">反链数</th><th>主要锚文本（次数）</th></tr></thead><tbody>${targetRows}</tbody></table></section>` : ''}
  ${data.hasData && data.domainsFull.length ? `<section><h2>全部来源域名（${data.domainsFull.length}）</h2><table><thead><tr><th>域名</th><th class="num">反链数</th><th>归类</th></tr></thead><tbody>${allDomainRows}</tbody></table></section>` : ''}
  <section><h2>公开检索基线</h2><p class="note">${baselineNote}</p></section>
  <footer>MokaKit · 摩卡工具箱 · 反向链接看板由 scripts/backlinks-report.mjs 生成</footer>
</div>
</body>
</html>`;
}

// ---------- 入口 ----------
function main() {
  if (!fs.existsSync(SEO_DIR_RES)) fs.mkdirSync(SEO_DIR_RES, { recursive: true });
  const data = buildData();
  const html = renderHTML(data);
  fs.writeFileSync(OUT, html, 'utf8');
  const mode = includeSamples ? '示例' : '真实';
  console.error(
    `[backlinks-report] 已生成 ${OUT}\n  模式=${mode} 域名数=${data.summary.domains} 反链记录=${data.summary.links} hasData=${data.hasData}`
  );
}

main();
