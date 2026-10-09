/**
 * Bing Webmaster Tools 报表分析（一次性诊断脚本）
 * 用法：node scripts/seo-bing-analysis.mjs
 * 只读 CSV，产出机会清单到 stdout。
 */
import fs from 'node:fs';

function parseCsv(p) {
  const raw = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inQ) {
      if (ch === '"') {
        if (raw[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch !== '\r') field += ch;
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows[0];
  return rows.slice(1).filter(r => r.length >= head.length).map(r => {
    const o = {};
    head.forEach((h, i) => { o[h] = (r[i] ?? '').trim(); });
    return o;
  });
}

const DL = 'C:/Users/zhao-/Downloads';
const num = x => parseFloat(String(x).replace('%', '')) || 0;

const P = parseCsv(`${DL}/www.mokakit.com_PageTrafficReport_2026_10_9.csv`)
  .map(r => ({ u: r['页面'], i: +r['印象数'], c: +r['点击次数'], ctr: num(r['点击率']), pos: +r['平均排名'] }))
  .filter(r => r.i > 0);
const K = parseCsv(`${DL}/www.mokakit.com_KeywordReport_2026_10_9.csv`)
  .map(r => ({ k: r['关键字'], i: +r['印象数'], c: +r['点击次数'], ctr: num(r['点击率']), pos: +r['平均排名'] }))
  .filter(r => r.i > 0);

const sum = (a, f) => a.reduce((x, y) => x + f(y), 0);
const ti = sum(P, r => r.i), tc = sum(P, r => r.c);
const short = u => u.replace('https://www.mokakit.com', '');

console.log('== 总盘 ==');
console.log(`有展现页面 ${P.length} | 展现 ${ti} | 点击 ${tc} | CTR ${(tc / ti * 100).toFixed(2)}%`);
console.log(`TOP10 页面展现占比 ${(sum(P.slice(0, 10), r => r.i) / ti * 100).toFixed(1)}%`);
console.log(`TOP1 占比 ${(P[0].i / ti * 100).toFixed(1)}%  ${short(P[0].u)}`);
console.log(`关键词总数 ${K.length} | 长尾(展现<=3) ${K.filter(r => r.i <= 3).length} 条 (${(K.filter(r => r.i <= 3).length / K.length * 100).toFixed(1)}%)`);

console.log('\n== A. 高展现低 CTR 页面（展现>=200 且 CTR<1.5%，改标题/描述直接见效）==');
P.filter(r => r.i >= 200 && r.ctr < 1.5)
  .forEach(r => console.log(`${String(r.i).padStart(6)}  ${String(r.c).padStart(4)}  ${String(r.ctr + '%').padStart(7)}  pos${r.pos.toFixed(1)}  ${short(r.u)}`));

console.log('\n== B. 零点击页面（展现>=100）==');
P.filter(r => r.c === 0 && r.i >= 100)
  .forEach(r => console.log(`${String(r.i).padStart(6)}  pos${r.pos.toFixed(1)}  ${short(r.u)}`));

console.log('\n== C. 时钟族关键词聚类 ==');
const clk = K.filter(r => /时钟|clock|时间显示|大屏/i.test(r.k));
console.log(`词数 ${clk.length} | 展现 ${sum(clk, r => r.i)} | 点击 ${sum(clk, r => r.c)} | CTR ${(sum(clk, r => r.c) / sum(clk, r => r.i) * 100).toFixed(2)}%`);
clk.slice(0, 15).forEach(r => console.log(`${String(r.i).padStart(6)}  ${String(r.c).padStart(4)}  ${String(r.ctr + '%').padStart(7)}  pos${r.pos.toFixed(2)}  ${r.k}`));

console.log('\n== D. 首页掘金位关键词（pos 4–9 且 展现>=150，冲进前 3 收益最大）==');
K.filter(r => r.pos >= 4 && r.pos <= 9 && r.i >= 150)
  .sort((a, b) => b.i - a.i)
  .forEach(r => console.log(`${String(r.i).padStart(6)}  ${String(r.c).padStart(4)}  ${String(r.ctr + '%').padStart(7)}  pos${r.pos.toFixed(2)}  ${r.k}`));

console.log('\n== E. 高展现零点击关键词（展现>=100 且 0 点击）==');
K.filter(r => r.i >= 100 && r.c === 0).sort((a, b) => b.i - a.i)
  .forEach(r => console.log(`${String(r.i).padStart(6)}  pos${r.pos.toFixed(2)}  ${r.k}`));

console.log('\n== F. 明星词（CTR>=10%，值得扩内容做护城河）==');
K.filter(r => r.ctr >= 10 && r.i >= 20).sort((a, b) => b.i - a.i)
  .forEach(r => console.log(`${String(r.i).padStart(6)}  ${String(r.c).padStart(4)}  ${String(r.ctr + '%').padStart(7)}  pos${r.pos.toFixed(2)}  ${r.k}`));
