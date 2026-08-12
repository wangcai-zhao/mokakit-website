/**
 * 单位换算数据回归校验。
 *
 * 每次往 src/tools/unit-convert/units.ts 增删类目、单位或换算对之后跑一遍。
 * 它能在 1 秒内抓出 Astro 构建抓不到的静默错误——比如 FEATURED_PAIRS 里写了
 * 一个不存在的单位 id，构建时那一页会被静默跳过，不报错也不生成，很难发现。
 *
 * 用法：npm run check:units
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const toolDir = join(here, '..', 'src', 'tools', 'unit-convert');

const units = await import(pathToUrl(join(toolDir, 'units.ts')));
const metaMod = await import(pathToUrl(join(toolDir, 'meta.ts')));

function pathToUrl(p) {
  return new URL('file:///' + p.replace(/\\/g, '/')).href;
}

const { UNIT_CATEGORIES, CATEGORY_BY_ID, FEATURED_PAIRS, convert, findUnit } = units;
const meta = metaMod.default;

let err = 0;
const bad = (s) => {
  console.log('  x ' + s);
  err++;
};

// ── 1. 类目与单位结构 ──
const seenCatId = new Set();
const seenCatSlug = new Set();
for (const c of UNIT_CATEGORIES) {
  if (seenCatId.has(c.id)) bad('重复类目 id: ' + c.id);
  seenCatId.add(c.id);
  if (seenCatSlug.has(c.slug)) bad('重复类目 slug: ' + c.slug);
  seenCatSlug.add(c.slug);
  if (!/^[a-z0-9-]+$/.test(c.slug)) bad('类目 slug 含非法字符: ' + c.slug);

  const seenUnit = new Set();
  for (const u of c.units) {
    if (seenUnit.has(u.id)) bad('[' + c.id + '] 重复单位 id: ' + u.id);
    seenUnit.add(u.id);
    if (!/^[a-z0-9_]+$/.test(u.id)) bad('[' + c.id + '] 单位 id 含非法字符: ' + u.id);
    if (!Number.isFinite(u.factor) || u.factor === 0) {
      bad('[' + c.id + '/' + u.id + '] factor 非法: ' + u.factor);
    }
    if (!u.name || !u.symbol) bad('[' + c.id + '/' + u.id + '] 缺 name 或 symbol');
  }

  const base = c.units.find((u) => u.id === c.base);
  if (!base) bad('[' + c.id + '] base "' + c.base + '" 不在单位列表里');
  else if (base.factor !== 1) {
    bad('[' + c.id + '] 基准单位 ' + c.base + ' 的 factor 必须为 1，实为 ' + base.factor);
  }
}

// ── 2. 换算对引用有效性 + 长尾页 slug 唯一 ──
const pageSlugs = new Set();
for (const p of FEATURED_PAIRS) {
  const c = CATEGORY_BY_ID.get(p.cat);
  if (!c) {
    bad('未知类目: ' + p.cat);
    continue;
  }
  const f = findUnit(p.cat, p.from);
  const t = findUnit(p.cat, p.to);
  if (!f) bad('[' + p.cat + '] 未知源单位: ' + p.from);
  if (!t) bad('[' + p.cat + '] 未知目标单位: ' + p.to);
  if (p.from === p.to) bad('[' + p.cat + '] 自换算无意义: ' + p.from);
  const slug = c.slug + '/' + p.from + '-to-' + p.to;
  if (pageSlugs.has(slug)) bad('重复长尾页 slug: ' + slug);
  pageSlugs.add(slug);
  if (f && t && !Number.isFinite(convert(1, f, t))) bad('[' + slug + '] 换算结果非有限数');
}

// ── 3. 换算系数抽样断言（防手滑写错数量级） ──
const A = (cat, from, to, expect) => {
  const f = findUnit(cat, from);
  const t = findUnit(cat, to);
  if (!f || !t) {
    bad('断言引用了不存在的单位: ' + cat + '/' + from + '->' + to);
    return;
  }
  const got = convert(1, f, t);
  if (Math.abs(got - expect) > Math.abs(expect) * 1e-9 + 1e-12) {
    bad('断言失败 1' + from + '->' + to + ': 期望 ' + expect + '，实得 ' + got);
  }
};
A('length', 'inch', 'cm', 2.54);
A('length', 'mile', 'km', 1.609344);
A('length', 'li', 'm', 500);
A('length', 'chi', 'cm', 100 / 3);
A('length', 'nmi', 'm', 1852);
A('weight', 'jin', 'kg', 0.5);
A('weight', 'lb', 'kg', 0.45359237);
A('weight', 'oz', 'g', 28.349523125);
A('weight', 'dan', 'jin', 100);
A('weight', 'jin', 'liang', 10);
A('area', 'mu', 'm2', 2000 / 3);
A('area', 'hectare', 'mu', 15);
A('area', 'qing', 'mu', 100);
A('area', 'mu', 'fen_area', 10);
A('area', 'acre', 'm2', 4046.8564224);
A('volume', 'm3', 'l', 1000);
A('volume', 'gal_us', 'l', 3.785411784);
A('volume', 'cup', 'tbsp', 16);
A('volume', 'tbsp', 'tsp', 3);
A('volume', 'dm3', 'l', 1);
A('time', 'h', 'min', 60);
A('time', 'day', 'h', 24);
A('time', 'week', 'day', 7);
A('time', 'year', 'day', 365);
A('speed', 'kmh', 'mps', 1 / 3.6);
A('speed', 'knot', 'kmh', 1.852);
A('speed', 'mph', 'kmh', 1.609344);
A('data', 'gb', 'mb', 1024);
A('data', 'b', 'bit', 8);
A('data-rate', 'mbyteps', 'mbps', 8);
A('data-rate', 'gbps', 'mbps', 1000);
A('power', 'ps', 'w', 735.49875);
A('power', 'kw', 'ps', 1000 / 735.49875);
A('energy', 'kcal', 'kj', 4.184);
A('energy', 'kwh', 'j', 3600000);
A('pressure', 'atm', 'pa', 101325);
A('pressure', 'bar', 'psi', 100000 / 6894.757293168361);
A('angle', 'rad', 'deg', 180 / Math.PI);
A('angle', 'turn', 'deg', 360);
A('force', 'kgf', 'n', 9.80665);
A('torque', 'kgfm', 'nm', 9.80665);
A('frequency', 'ghz', 'mhz', 1000);
A('frequency', 'rpm', 'hz', 1 / 60);

// 温度是仿射变换，必须用多个取值点验证，只测 1 度看不出零点错位
const T = (from, to, v, expect) => {
  const f = findUnit('temperature', from);
  const t = findUnit('temperature', to);
  const got = convert(v, f, t);
  if (Math.abs(got - expect) > 1e-9) {
    bad('温度断言失败 ' + v + from + '->' + to + ': 期望 ' + expect + '，实得 ' + got);
  }
};
T('c', 'f', 0, 32);
T('c', 'f', 100, 212);
T('c', 'f', -40, -40);
T('f', 'c', 32, 0);
T('f', 'c', 212, 100);
T('c', 'k', 0, 273.15);
T('k', 'c', 273.15, 0);
T('c', 'r', 0, 491.67);
T('c', 're', 100, 80);

// ── 4. 长尾子页产出 ──
const pages = typeof meta.subpages === 'function' ? meta.subpages() : meta.subpages || [];
if (pages.length !== FEATURED_PAIRS.length) {
  bad('子页数量 ' + pages.length + ' 与换算对数量 ' + FEATURED_PAIRS.length + ' 不一致——有换算对被静默跳过了');
}
for (const p of pages) {
  if (!/^[a-z0-9/_-]+$/.test(p.slug)) bad('子页 slug 含非法字符: ' + p.slug);
  if (!p.title || !p.description) bad('子页缺 title/description: ' + p.slug);
  if (p.description && p.description.length < 40) bad('子页 description 过短: ' + p.slug);
  if (!Array.isArray(p.faq) || p.faq.length < 2) bad('子页 FAQ 不足 2 条: ' + p.slug);
  for (const f of p.faq || []) {
    if (!f.q || !f.a) bad('子页 FAQ 有空字段: ' + p.slug);
  }
  const text = p.title + p.description + (p.faq || []).map((f) => f.q + f.a).join('');
  if (/undefined|NaN|Infinity/.test(text)) bad('子页文案渲染出异常值: ' + p.slug);
  const d = p.data || {};
  if (!d.categoryId || !d.fromId || !d.toId || !d.oneEquals) bad('子页 data 字段缺失: ' + p.slug);
}

// ── 汇总 ──
const unitCount = UNIT_CATEGORIES.reduce((s, c) => s + c.units.length, 0);
const faqCount = pages.reduce((s, p) => s + (p.faq ? p.faq.length : 0), 0);
console.log('类目      ' + UNIT_CATEGORIES.length + ' 个');
console.log('单位      ' + unitCount + ' 个');
console.log('长尾页    ' + pages.length + ' 个');
console.log('页内 FAQ  ' + faqCount + ' 条');
console.log(err === 0 ? '✓ 全部校验通过' : '✗ 发现 ' + err + ' 处问题');
process.exit(err === 0 ? 0 : 1);
