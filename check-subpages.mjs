const mod = await import('./src/tools/unit-convert/meta.ts');
const meta = mod.default;

const pages = typeof meta.subpages === 'function' ? meta.subpages() : meta.subpages;

let err = 0;
const bad = (s) => { console.log('  x ' + s); err++; };

const seen = new Set();
for (const p of pages) {
  if (!p.slug || /[^a-z0-9/_-]/.test(p.slug)) bad('slug 含非法字符: ' + p.slug);
  if (seen.has(p.slug)) bad('slug 重复: ' + p.slug);
  seen.add(p.slug);
  if (!p.title || !p.description) bad('缺 title/description: ' + p.slug);
  if (p.description.length < 40) bad('description 过短: ' + p.slug);
  if (!Array.isArray(p.faq) || p.faq.length < 2) bad('FAQ 不足: ' + p.slug);
  for (const f of p.faq || []) {
    if (!f.q || !f.a) bad('FAQ 空字段: ' + p.slug);
    if (/undefined|NaN|Infinity/.test(f.a + f.q)) bad('FAQ 含异常值: ' + p.slug + ' -> ' + f.q);
  }
  if (/undefined|NaN|Infinity/.test(p.description + p.title)) bad('文案含异常值: ' + p.slug);
  const d = p.data || {};
  if (!d.categoryId || !d.fromId || !d.toId || !d.oneEquals) bad('data 字段缺失: ' + p.slug);
}

console.log('生成子页 ' + pages.length + ' 个');
console.log('FAQ 总条数 ' + pages.reduce((s, p) => s + p.faq.length, 0));
console.log('---- 抽样 ----');
for (const s of ['data-rate/mbps-to-mbyteps', 'power/kw-to-ps', 'temperature/c-to-f', 'area/mu-to-m2', 'energy/kcal-to-kj']) {
  const p = pages.find((x) => x.slug === s);
  if (!p) { bad('抽样页缺失: ' + s); continue; }
  console.log('[' + p.slug + '] ' + p.title + ' | 1' + p.data.fromName + ' = ' + p.data.oneEquals + ' ' + p.data.toName);
  console.log('   Q: ' + p.faq[1].q);
  console.log('   A: ' + p.faq[1].a.slice(0, 100));
}
console.log(err === 0 ? 'OK 子页校验通过' : 'FAIL ' + err + ' 处问题');
process.exit(err === 0 ? 0 : 1);
