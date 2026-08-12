const m = await import('./src/tools/unit-convert/units.ts');
const { UNIT_CATEGORIES, CATEGORY_BY_ID, FEATURED_PAIRS, convert, findUnit } = m;

let err = 0;
const bad = (s) => { console.log('  x ' + s); err++; };

// 1. 类目 slug / id 唯一，基准单位存在且 factor=1
const slugs = new Set(), ids = new Set();
for (const c of UNIT_CATEGORIES) {
  if (ids.has(c.id)) bad('重复类目 id: ' + c.id);
  ids.add(c.id);
  if (slugs.has(c.slug)) bad('重复类目 slug: ' + c.slug);
  slugs.add(c.slug);
  const uids = new Set();
  for (const u of c.units) {
    if (uids.has(u.id)) bad('[' + c.id + '] 重复单位 id: ' + u.id);
    uids.add(u.id);
    if (!Number.isFinite(u.factor) || u.factor === 0) bad('[' + c.id + '/' + u.id + '] factor 非法');
  }
  const b = c.units.find((u) => u.id === c.base);
  if (!b) bad('[' + c.id + '] base "' + c.base + '" 不在单位列表里');
  else if (b.factor !== 1) bad('[' + c.id + '] 基准单位 ' + c.base + ' 的 factor 应为 1，实为 ' + b.factor);
}

// 2. FEATURED_PAIRS 引用有效 + 长尾页 slug 唯一
const pageSlugs = new Set();
for (const p of FEATURED_PAIRS) {
  const c = CATEGORY_BY_ID.get(p.cat);
  if (!c) { bad('未知类目: ' + p.cat); continue; }
  const f = findUnit(p.cat, p.from), t = findUnit(p.cat, p.to);
  if (!f) bad('[' + p.cat + '] 未知源单位: ' + p.from);
  if (!t) bad('[' + p.cat + '] 未知目标单位: ' + p.to);
  if (p.from === p.to) bad('[' + p.cat + '] 自换算: ' + p.from);
  const s = c.slug + '/' + p.from + '-to-' + p.to;
  if (pageSlugs.has(s)) bad('重复长尾页 slug: ' + s);
  pageSlugs.add(s);
  if (f && t && !Number.isFinite(convert(1, f, t))) bad('[' + s + '] 换算结果非有限数');
}

// 3. 抽样断言，防止系数写错
const A = (cat, from, to, expect) => {
  const f = findUnit(cat, from), t = findUnit(cat, to);
  if (!f || !t) { bad('断言单位缺失 ' + cat + '/' + from + '->' + to); return; }
  const got = convert(1, f, t);
  if (Math.abs(got - expect) > Math.abs(expect) * 1e-9 + 1e-12) {
    bad('断言失败 1' + from + '->' + to + ': 期望 ' + expect + ', 实得 ' + got);
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

// 温度专项（仿射变换）
const T = (from, to, v, expect) => {
  const f = findUnit('temperature', from), t = findUnit('temperature', to);
  const got = convert(v, f, t);
  if (Math.abs(got - expect) > 1e-9) {
    bad('温度断言失败 ' + v + from + '->' + to + ': 期望 ' + expect + ', 实得 ' + got);
  }
};
T('c', 'f', 0, 32);
T('c', 'f', 100, 212);
T('f', 'c', 32, 0);
T('f', 'c', 212, 100);
T('c', 'k', 0, 273.15);
T('k', 'c', 273.15, 0);
T('c', 'r', 0, 491.67);
T('c', 're', 100, 80);

const unitCount = UNIT_CATEGORIES.reduce((s, c) => s + c.units.length, 0);
console.log('类目 ' + UNIT_CATEGORIES.length + ' 个');
console.log('单位 ' + unitCount + ' 个');
console.log('长尾页 ' + FEATURED_PAIRS.length + ' 个');
console.log(err === 0 ? 'OK 全部校验通过' : 'FAIL ' + err + ' 处问题');
process.exit(err === 0 ? 0 : 1);
