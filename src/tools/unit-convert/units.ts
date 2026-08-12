/**
 * 单位定义数据。
 *
 * 换算统一走"基准单位"中转：先把输入值换算成基准单位，再换算到目标单位。
 * factor 表示"1 个该单位等于多少个基准单位"。
 *
 * 温度是唯一例外——它是仿射变换（有偏移量，不只是乘系数），
 * 所以单独用 offset 字段处理，公式为：基准值 = 值 × factor + offset
 */

export interface Unit {
  id: string;
  /** 中文名 */
  name: string;
  /** 符号，用于结果显示 */
  symbol: string;
  /** 1 个该单位 = factor 个基准单位 */
  factor: number;
  /** 仿射偏移，仅温度用到 */
  offset?: number;
  /** 搜索用的别名 */
  aliases?: string[];
}

export interface UnitCategory {
  id: string;
  name: string;
  /** URL 片段 */
  slug: string;
  desc: string;
  /** 基准单位 id */
  base: string;
  units: Unit[];
}

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    name: '长度',
    slug: 'length',
    desc: '米、厘米、英寸、英尺、里、海里等长度单位互相换算',
    base: 'm',
    units: [
      { id: 'nm', name: '纳米', symbol: 'nm', factor: 1e-9 },
      { id: 'um', name: '微米', symbol: 'μm', factor: 1e-6, aliases: ['丝米'] },
      { id: 'mm', name: '毫米', symbol: 'mm', factor: 0.001 },
      { id: 'cm', name: '厘米', symbol: 'cm', factor: 0.01, aliases: ['公分'] },
      { id: 'dm', name: '分米', symbol: 'dm', factor: 0.1 },
      { id: 'm', name: '米', symbol: 'm', factor: 1, aliases: ['公尺'] },
      { id: 'km', name: '千米', symbol: 'km', factor: 1000, aliases: ['公里'] },
      { id: 'inch', name: '英寸', symbol: 'in', factor: 0.0254, aliases: ['吋'] },
      { id: 'feet', name: '英尺', symbol: 'ft', factor: 0.3048, aliases: ['呎'] },
      { id: 'yard', name: '码', symbol: 'yd', factor: 0.9144 },
      { id: 'fathom', name: '英寻', symbol: 'ftm', factor: 1.8288 },
      { id: 'mile', name: '英里', symbol: 'mi', factor: 1609.344 },
      { id: 'nmi', name: '海里', symbol: 'nmi', factor: 1852 },
      { id: 'li', name: '市里', symbol: '里', factor: 500 },
      { id: 'zhang', name: '市丈', symbol: '丈', factor: 10 / 3 },
      { id: 'chi', name: '市尺', symbol: '尺', factor: 1 / 3 },
      { id: 'cun', name: '市寸', symbol: '寸', factor: 1 / 30 },
      { id: 'fen', name: '市分', symbol: '分', factor: 1 / 300 },
      { id: 'au', name: '天文单位', symbol: 'AU', factor: 149597870700 },
      { id: 'ly', name: '光年', symbol: 'ly', factor: 9460730472580800 },
    ],
  },
  {
    id: 'weight',
    name: '重量',
    slug: 'weight',
    desc: '千克、克、斤、磅、盎司、吨等重量单位互相换算',
    base: 'kg',
    units: [
      { id: 'ug', name: '微克', symbol: 'μg', factor: 1e-9 },
      { id: 'mg', name: '毫克', symbol: 'mg', factor: 0.000001 },
      { id: 'g', name: '克', symbol: 'g', factor: 0.001 },
      { id: 'kg', name: '千克', symbol: 'kg', factor: 1, aliases: ['公斤'] },
      { id: 't', name: '吨', symbol: 't', factor: 1000, aliases: ['公吨'] },
      { id: 'dan', name: '担', symbol: '担', factor: 50, aliases: ['市担'] },
      { id: 'jin', name: '斤', symbol: '斤', factor: 0.5, aliases: ['市斤'] },
      { id: 'liang', name: '两', symbol: '两', factor: 0.05, aliases: ['市两'] },
      { id: 'qian', name: '钱', symbol: '钱', factor: 0.005 },
      { id: 'lb', name: '磅', symbol: 'lb', factor: 0.45359237 },
      { id: 'oz', name: '盎司', symbol: 'oz', factor: 0.028349523125 },
      { id: 'oz_t', name: '金衡盎司', symbol: 'ozt', factor: 0.0311034768, aliases: ['金盎司'] },
      { id: 'st', name: '英石', symbol: 'st', factor: 6.35029318 },
      { id: 'ton_us', name: '短吨', symbol: 'ton(US)', factor: 907.18474, aliases: ['美吨'] },
      { id: 'ton_uk', name: '长吨', symbol: 'ton(UK)', factor: 1016.0469088, aliases: ['英吨'] },
      { id: 'ct', name: '克拉', symbol: 'ct', factor: 0.0002 },
    ],
  },
  {
    id: 'temperature',
    name: '温度',
    slug: 'temperature',
    desc: '摄氏度、华氏度、开尔文等温度单位互相换算',
    base: 'c',
    units: [
      { id: 'c', name: '摄氏度', symbol: '°C', factor: 1, offset: 0 },
      { id: 'f', name: '华氏度', symbol: '°F', factor: 5 / 9, offset: -160 / 9 },
      { id: 'k', name: '开尔文', symbol: 'K', factor: 1, offset: -273.15 },
      { id: 'r', name: '兰氏度', symbol: '°R', factor: 5 / 9, offset: -273.15 },
      { id: 're', name: '列氏度', symbol: '°Ré', factor: 1.25, offset: 0 },
    ],
  },
  {
    id: 'area',
    name: '面积',
    slug: 'area',
    desc: '平方米、亩、公顷、平方英尺等面积单位互相换算',
    base: 'm2',
    units: [
      { id: 'mm2', name: '平方毫米', symbol: 'mm²', factor: 0.000001 },
      { id: 'cm2', name: '平方厘米', symbol: 'cm²', factor: 0.0001 },
      { id: 'dm2', name: '平方分米', symbol: 'dm²', factor: 0.01 },
      { id: 'm2', name: '平方米', symbol: 'm²', factor: 1, aliases: ['平方', '平米'] },
      { id: 'km2', name: '平方千米', symbol: 'km²', factor: 1000000, aliases: ['平方公里'] },
      { id: 'fen_area', name: '分', symbol: '分', factor: 200 / 3, aliases: ['地分'] },
      { id: 'mu', name: '亩', symbol: '亩', factor: 2000 / 3, aliases: ['市亩'] },
      { id: 'qing', name: '顷', symbol: '顷', factor: 200000 / 3 },
      { id: 'hectare', name: '公顷', symbol: 'ha', factor: 10000 },
      { id: 'in2', name: '平方英寸', symbol: 'in²', factor: 0.00064516 },
      { id: 'ft2', name: '平方英尺', symbol: 'ft²', factor: 0.09290304 },
      { id: 'yd2', name: '平方码', symbol: 'yd²', factor: 0.83612736 },
      { id: 'acre', name: '英亩', symbol: 'ac', factor: 4046.8564224 },
      { id: 'mi2', name: '平方英里', symbol: 'mi²', factor: 2589988.110336 },
    ],
  },
  {
    id: 'volume',
    name: '体积',
    slug: 'volume',
    desc: '升、毫升、立方米、加仑、杯、汤匙等体积容量单位互相换算',
    base: 'l',
    units: [
      { id: 'ml', name: '毫升', symbol: 'mL', factor: 0.001 },
      { id: 'cl', name: '厘升', symbol: 'cL', factor: 0.01 },
      { id: 'l', name: '升', symbol: 'L', factor: 1 },
      { id: 'm3', name: '立方米', symbol: 'm³', factor: 1000, aliases: ['方', '立方'] },
      { id: 'dm3', name: '立方分米', symbol: 'dm³', factor: 1 },
      { id: 'cm3', name: '立方厘米', symbol: 'cm³', factor: 0.001, aliases: ['cc'] },
      { id: 'mm3', name: '立方毫米', symbol: 'mm³', factor: 0.000001 },
      { id: 'in3', name: '立方英寸', symbol: 'in³', factor: 0.016387064 },
      { id: 'ft3', name: '立方英尺', symbol: 'ft³', factor: 28.316846592 },
      { id: 'gal_us', name: '美制加仑', symbol: 'gal', factor: 3.785411784 },
      { id: 'gal_uk', name: '英制加仑', symbol: 'gal(UK)', factor: 4.54609 },
      { id: 'qt_us', name: '美制夸脱', symbol: 'qt', factor: 0.946352946 },
      { id: 'pt_us', name: '美制品脱', symbol: 'pt', factor: 0.473176473 },
      { id: 'floz_us', name: '美制液量盎司', symbol: 'fl oz', factor: 0.0295735295625 },
      { id: 'floz_uk', name: '英制液量盎司', symbol: 'fl oz(UK)', factor: 0.0284130625 },
      { id: 'cup', name: '杯', symbol: 'cup', factor: 0.2365882365, aliases: ['量杯'] },
      { id: 'tbsp', name: '汤匙', symbol: 'tbsp', factor: 0.01478676478125, aliases: ['大勺'] },
      { id: 'tsp', name: '茶匙', symbol: 'tsp', factor: 0.00492892159375, aliases: ['小勺'] },
      { id: 'bbl', name: '桶（石油）', symbol: 'bbl', factor: 158.987294928 },
    ],
  },
  {
    id: 'time',
    name: '时间',
    slug: 'time',
    desc: '秒、分钟、小时、天、周、月、年等时间单位互相换算',
    base: 's',
    units: [
      { id: 'ns', name: '纳秒', symbol: 'ns', factor: 1e-9 },
      { id: 'us', name: '微秒', symbol: 'μs', factor: 0.000001 },
      { id: 'ms', name: '毫秒', symbol: 'ms', factor: 0.001 },
      { id: 's', name: '秒', symbol: 's', factor: 1 },
      { id: 'min', name: '分钟', symbol: 'min', factor: 60 },
      { id: 'h', name: '小时', symbol: 'h', factor: 3600, aliases: ['钟头'] },
      { id: 'day', name: '天', symbol: 'd', factor: 86400, aliases: ['日'] },
      { id: 'week', name: '周', symbol: '周', factor: 604800, aliases: ['星期'] },
      { id: 'month', name: '月（30天）', symbol: '月', factor: 2592000 },
      { id: 'quarter', name: '季度（90天）', symbol: '季', factor: 7776000 },
      { id: 'year', name: '年（365天）', symbol: '年', factor: 31536000 },
      { id: 'decade', name: '十年', symbol: '十年', factor: 315360000 },
    ],
  },
  {
    id: 'speed',
    name: '速度',
    slug: 'speed',
    desc: '米每秒、千米每小时、英里每小时、节、马赫等速度单位互相换算',
    base: 'mps',
    units: [
      { id: 'cms', name: '厘米每秒', symbol: 'cm/s', factor: 0.01 },
      { id: 'mps', name: '米每秒', symbol: 'm/s', factor: 1 },
      { id: 'kmh', name: '千米每小时', symbol: 'km/h', factor: 1 / 3.6, aliases: ['码', '公里每小时'] },
      { id: 'mph', name: '英里每小时', symbol: 'mph', factor: 0.44704 },
      { id: 'fps', name: '英尺每秒', symbol: 'ft/s', factor: 0.3048 },
      { id: 'knot', name: '节', symbol: 'kn', factor: 1852 / 3600, aliases: ['海里每小时'] },
      { id: 'mach', name: '马赫', symbol: 'Ma', factor: 340.3 },
      { id: 'light', name: '光速', symbol: 'c', factor: 299792458 },
    ],
  },
  {
    id: 'data',
    name: '数据存储',
    slug: 'data',
    desc: '字节、KB、MB、GB、TB 等存储容量单位互相换算',
    base: 'mb',
    units: [
      { id: 'bit', name: '比特', symbol: 'bit', factor: 1 / 8388608 },
      { id: 'b', name: '字节', symbol: 'B', factor: 1 / 1048576 },
      { id: 'kb', name: 'KB', symbol: 'KB', factor: 1 / 1024, aliases: ['千字节'] },
      { id: 'mb', name: 'MB', symbol: 'MB', factor: 1, aliases: ['兆字节', '兆'] },
      { id: 'gb', name: 'GB', symbol: 'GB', factor: 1024, aliases: ['吉字节'] },
      { id: 'tb', name: 'TB', symbol: 'TB', factor: 1048576, aliases: ['太字节'] },
      { id: 'pb', name: 'PB', symbol: 'PB', factor: 1073741824 },
      { id: 'eb', name: 'EB', symbol: 'EB', factor: 1099511627776 },
    ],
  },
  {
    id: 'data-rate',
    name: '网速',
    slug: 'data-rate',
    desc: 'Mbps、MB/s、Gbps 等网络带宽与下载速度单位互相换算',
    base: 'mbps',
    units: [
      { id: 'bps', name: '比特每秒', symbol: 'bps', factor: 0.000001 },
      { id: 'kbps', name: '千比特每秒', symbol: 'Kbps', factor: 0.001 },
      { id: 'mbps', name: '兆比特每秒', symbol: 'Mbps', factor: 1, aliases: ['兆宽带'] },
      { id: 'gbps', name: '吉比特每秒', symbol: 'Gbps', factor: 1000 },
      { id: 'tbps', name: '太比特每秒', symbol: 'Tbps', factor: 1000000 },
      { id: 'byteps', name: '字节每秒', symbol: 'B/s', factor: 0.000008 },
      { id: 'kbyteps', name: '千字节每秒', symbol: 'KB/s', factor: 0.008 },
      { id: 'mbyteps', name: '兆字节每秒', symbol: 'MB/s', factor: 8, aliases: ['下载速度'] },
      { id: 'gbyteps', name: '吉字节每秒', symbol: 'GB/s', factor: 8000 },
    ],
  },
  {
    id: 'power',
    name: '功率',
    slug: 'power',
    desc: '瓦、千瓦、马力、匹等功率单位互相换算',
    base: 'w',
    units: [
      { id: 'mw_milli', name: '毫瓦', symbol: 'mW', factor: 0.001 },
      { id: 'w', name: '瓦', symbol: 'W', factor: 1, aliases: ['瓦特'] },
      { id: 'kw', name: '千瓦', symbol: 'kW', factor: 1000 },
      { id: 'mw', name: '兆瓦', symbol: 'MW', factor: 1000000 },
      { id: 'gw', name: '吉瓦', symbol: 'GW', factor: 1000000000 },
      { id: 'ps', name: '公制马力', symbol: 'PS', factor: 735.49875, aliases: ['匹', '马力'] },
      { id: 'hp', name: '英制马力', symbol: 'hp', factor: 745.6998715822702 },
      { id: 'btuh', name: '英热单位每小时', symbol: 'BTU/h', factor: 0.29307107017222 },
      { id: 'kcalh', name: '千卡每小时', symbol: 'kcal/h', factor: 1.163 },
    ],
  },
  {
    id: 'energy',
    name: '能量',
    slug: 'energy',
    desc: '焦耳、千卡、大卡、千瓦时（度）等能量单位互相换算',
    base: 'j',
    units: [
      { id: 'j', name: '焦耳', symbol: 'J', factor: 1 },
      { id: 'kj', name: '千焦', symbol: 'kJ', factor: 1000 },
      { id: 'mj', name: '兆焦', symbol: 'MJ', factor: 1000000 },
      { id: 'cal', name: '卡路里', symbol: 'cal', factor: 4.184, aliases: ['小卡'] },
      { id: 'kcal', name: '千卡', symbol: 'kcal', factor: 4184, aliases: ['大卡'] },
      { id: 'wh', name: '瓦时', symbol: 'Wh', factor: 3600 },
      { id: 'kwh', name: '千瓦时', symbol: 'kWh', factor: 3600000, aliases: ['度电', '度'] },
      { id: 'btu', name: '英热单位', symbol: 'BTU', factor: 1055.05585262 },
      { id: 'ev', name: '电子伏', symbol: 'eV', factor: 1.602176634e-19 },
    ],
  },
  {
    id: 'pressure',
    name: '压力',
    slug: 'pressure',
    desc: '帕斯卡、巴、标准大气压、psi、毫米汞柱等压强单位互相换算',
    base: 'pa',
    units: [
      { id: 'pa', name: '帕斯卡', symbol: 'Pa', factor: 1, aliases: ['帕'] },
      { id: 'hpa', name: '百帕', symbol: 'hPa', factor: 100, aliases: ['毫巴'] },
      { id: 'kpa', name: '千帕', symbol: 'kPa', factor: 1000 },
      { id: 'mpa', name: '兆帕', symbol: 'MPa', factor: 1000000 },
      { id: 'bar', name: '巴', symbol: 'bar', factor: 100000 },
      { id: 'atm', name: '标准大气压', symbol: 'atm', factor: 101325 },
      { id: 'psi', name: '磅力每平方英寸', symbol: 'psi', factor: 6894.757293168361 },
      { id: 'mmhg', name: '毫米汞柱', symbol: 'mmHg', factor: 133.322387415, aliases: ['托'] },
      { id: 'kgfcm2', name: '千克力每平方厘米', symbol: 'kgf/cm²', factor: 98066.5 },
    ],
  },
  {
    id: 'angle',
    name: '角度',
    slug: 'angle',
    desc: '度、弧度、角分、角秒等角度单位互相换算',
    base: 'deg',
    units: [
      { id: 'deg', name: '度', symbol: '°', factor: 1 },
      { id: 'rad', name: '弧度', symbol: 'rad', factor: 180 / Math.PI },
      { id: 'grad', name: '百分度', symbol: 'gon', factor: 0.9 },
      { id: 'arcmin', name: '角分', symbol: '′', factor: 1 / 60 },
      { id: 'arcsec', name: '角秒', symbol: '″', factor: 1 / 3600 },
      { id: 'turn', name: '圈', symbol: 'turn', factor: 360 },
    ],
  },
  {
    id: 'force',
    name: '力',
    slug: 'force',
    desc: '牛顿、千克力、磅力等力的单位互相换算',
    base: 'n',
    units: [
      { id: 'dyn', name: '达因', symbol: 'dyn', factor: 0.00001 },
      { id: 'gf', name: '克力', symbol: 'gf', factor: 0.00980665 },
      { id: 'n', name: '牛顿', symbol: 'N', factor: 1, aliases: ['牛'] },
      { id: 'kgf', name: '千克力', symbol: 'kgf', factor: 9.80665, aliases: ['公斤力'] },
      { id: 'lbf', name: '磅力', symbol: 'lbf', factor: 4.4482216152605 },
      { id: 'kn', name: '千牛', symbol: 'kN', factor: 1000 },
    ],
  },
  {
    id: 'torque',
    name: '扭矩',
    slug: 'torque',
    desc: '牛米、千克力米、磅力英尺等扭矩单位互相换算',
    base: 'nm',
    units: [
      { id: 'nm', name: '牛米', symbol: 'N·m', factor: 1, aliases: ['牛顿米'] },
      { id: 'knm', name: '千牛米', symbol: 'kN·m', factor: 1000 },
      { id: 'kgfm', name: '千克力米', symbol: 'kgf·m', factor: 9.80665 },
      { id: 'lbfft', name: '磅力英尺', symbol: 'lbf·ft', factor: 1.3558179483314004 },
      { id: 'lbfin', name: '磅力英寸', symbol: 'lbf·in', factor: 0.1129848290276167 },
    ],
  },
  {
    id: 'frequency',
    name: '频率',
    slug: 'frequency',
    desc: '赫兹、千赫、兆赫、吉赫、转每分等频率单位互相换算',
    base: 'hz',
    units: [
      { id: 'hz', name: '赫兹', symbol: 'Hz', factor: 1, aliases: ['赫'] },
      { id: 'khz', name: '千赫', symbol: 'kHz', factor: 1000 },
      { id: 'mhz', name: '兆赫', symbol: 'MHz', factor: 1000000 },
      { id: 'ghz', name: '吉赫', symbol: 'GHz', factor: 1000000000 },
      { id: 'thz', name: '太赫', symbol: 'THz', factor: 1000000000000 },
      { id: 'rpm', name: '转每分', symbol: 'rpm', factor: 1 / 60 },
    ],
  },
];

export const CATEGORY_BY_ID = new Map(UNIT_CATEGORIES.map((c) => [c.id, c]));

export function findUnit(catId: string, unitId: string): Unit | undefined {
  return CATEGORY_BY_ID.get(catId)?.units.find((u) => u.id === unitId);
}

/**
 * 核心换算。走基准单位中转，温度用仿射公式。
 *
 * 注意用 Number 计算即可，展示层再做精度处理——
 * decimal.js 用于显示格式化，避免 0.1+0.2=0.30000000000000004 这类问题。
 */
export function convert(
  value: number,
  from: Unit,
  to: Unit,
): number {
  const base = value * from.factor + (from.offset ?? 0);
  return (base - (to.offset ?? 0)) / to.factor;
}

/**
 * ★ 长尾 SEO 的核心：精选换算对 ★
 *
 * 每一对生成一个独立静态页面，承接"厘米换算英寸"这类具体搜索词。
 *
 * ⚠️ 刻意不做 N×N 全排列：20 个长度单位全排列会产生 380 个页面，
 * 其中大量是"市寸换算光年"这种没人搜的组合，会被判定为
 * thin content（低质内容）拖累整站权重。只保留真实有搜索量的组合。
 */
export const FEATURED_PAIRS: { cat: string; from: string; to: string }[] = [
  // ── 长度：中英制互换是绝对高频 ──
  { cat: 'length', from: 'cm', to: 'inch' },
  { cat: 'length', from: 'inch', to: 'cm' },
  { cat: 'length', from: 'm', to: 'feet' },
  { cat: 'length', from: 'feet', to: 'm' },
  { cat: 'length', from: 'km', to: 'mile' },
  { cat: 'length', from: 'mile', to: 'km' },
  { cat: 'length', from: 'cm', to: 'm' },
  { cat: 'length', from: 'm', to: 'cm' },
  { cat: 'length', from: 'mm', to: 'cm' },
  { cat: 'length', from: 'cm', to: 'mm' },
  { cat: 'length', from: 'm', to: 'km' },
  { cat: 'length', from: 'km', to: 'm' },
  { cat: 'length', from: 'm', to: 'mm' },
  { cat: 'length', from: 'mm', to: 'm' },
  { cat: 'length', from: 'inch', to: 'mm' },
  { cat: 'length', from: 'mm', to: 'inch' },
  { cat: 'length', from: 'feet', to: 'cm' },
  { cat: 'length', from: 'cm', to: 'feet' },
  { cat: 'length', from: 'feet', to: 'inch' },
  { cat: 'length', from: 'inch', to: 'feet' },
  { cat: 'length', from: 'yard', to: 'm' },
  { cat: 'length', from: 'm', to: 'yard' },
  { cat: 'length', from: 'nmi', to: 'km' },
  { cat: 'length', from: 'km', to: 'nmi' },
  { cat: 'length', from: 'li', to: 'km' },
  { cat: 'length', from: 'km', to: 'li' },
  { cat: 'length', from: 'chi', to: 'cm' },
  { cat: 'length', from: 'cm', to: 'chi' },
  { cat: 'length', from: 'chi', to: 'm' },
  { cat: 'length', from: 'cun', to: 'cm' },
  { cat: 'length', from: 'um', to: 'mm' },
  { cat: 'length', from: 'nm', to: 'um' },
  { cat: 'length', from: 'ly', to: 'km' },
  { cat: 'length', from: 'mile', to: 'm' },

  // ── 重量：斤与千克、磅是国内最高频 ──
  { cat: 'weight', from: 'kg', to: 'jin' },
  { cat: 'weight', from: 'jin', to: 'kg' },
  { cat: 'weight', from: 'kg', to: 'lb' },
  { cat: 'weight', from: 'lb', to: 'kg' },
  { cat: 'weight', from: 'g', to: 'kg' },
  { cat: 'weight', from: 'kg', to: 'g' },
  { cat: 'weight', from: 'oz', to: 'g' },
  { cat: 'weight', from: 'g', to: 'oz' },
  { cat: 'weight', from: 't', to: 'kg' },
  { cat: 'weight', from: 'kg', to: 't' },
  { cat: 'weight', from: 'jin', to: 'liang' },
  { cat: 'weight', from: 'liang', to: 'g' },
  { cat: 'weight', from: 'lb', to: 'jin' },
  { cat: 'weight', from: 'jin', to: 'lb' },
  { cat: 'weight', from: 'ct', to: 'g' },
  { cat: 'weight', from: 'g', to: 'mg' },
  { cat: 'weight', from: 'mg', to: 'g' },
  { cat: 'weight', from: 'st', to: 'kg' },
  { cat: 'weight', from: 'kg', to: 'oz' },
  { cat: 'weight', from: 'oz', to: 'kg' },
  { cat: 'weight', from: 'lb', to: 'oz' },
  { cat: 'weight', from: 'oz', to: 'lb' },
  { cat: 'weight', from: 'dan', to: 'kg' },
  { cat: 'weight', from: 'qian', to: 'g' },
  { cat: 'weight', from: 'oz_t', to: 'g' },
  { cat: 'weight', from: 'ton_us', to: 'kg' },

  // ── 温度 ──
  { cat: 'temperature', from: 'c', to: 'f' },
  { cat: 'temperature', from: 'f', to: 'c' },
  { cat: 'temperature', from: 'c', to: 'k' },
  { cat: 'temperature', from: 'k', to: 'c' },
  { cat: 'temperature', from: 'f', to: 'k' },
  { cat: 'temperature', from: 'k', to: 'f' },
  { cat: 'temperature', from: 'c', to: 'r' },

  // ── 面积：亩与平方米是国内特色高频词 ──
  { cat: 'area', from: 'mu', to: 'm2' },
  { cat: 'area', from: 'm2', to: 'mu' },
  { cat: 'area', from: 'hectare', to: 'mu' },
  { cat: 'area', from: 'mu', to: 'hectare' },
  { cat: 'area', from: 'km2', to: 'mu' },
  { cat: 'area', from: 'mu', to: 'km2' },
  { cat: 'area', from: 'm2', to: 'ft2' },
  { cat: 'area', from: 'ft2', to: 'm2' },
  { cat: 'area', from: 'acre', to: 'mu' },
  { cat: 'area', from: 'mu', to: 'acre' },
  { cat: 'area', from: 'hectare', to: 'm2' },
  { cat: 'area', from: 'm2', to: 'cm2' },
  { cat: 'area', from: 'km2', to: 'm2' },
  { cat: 'area', from: 'qing', to: 'mu' },
  { cat: 'area', from: 'fen_area', to: 'm2' },
  { cat: 'area', from: 'acre', to: 'hectare' },

  // ── 体积 ──
  { cat: 'volume', from: 'l', to: 'ml' },
  { cat: 'volume', from: 'ml', to: 'l' },
  { cat: 'volume', from: 'm3', to: 'l' },
  { cat: 'volume', from: 'l', to: 'm3' },
  { cat: 'volume', from: 'gal_us', to: 'l' },
  { cat: 'volume', from: 'l', to: 'gal_us' },
  { cat: 'volume', from: 'cm3', to: 'ml' },
  { cat: 'volume', from: 'm3', to: 'cm3' },
  { cat: 'volume', from: 'gal_uk', to: 'l' },
  { cat: 'volume', from: 'ft3', to: 'l' },
  { cat: 'volume', from: 'ft3', to: 'm3' },
  { cat: 'volume', from: 'pt_us', to: 'ml' },
  { cat: 'volume', from: 'qt_us', to: 'l' },
  { cat: 'volume', from: 'floz_us', to: 'ml' },
  { cat: 'volume', from: 'cup', to: 'ml' },
  { cat: 'volume', from: 'tbsp', to: 'ml' },
  { cat: 'volume', from: 'tsp', to: 'ml' },
  { cat: 'volume', from: 'bbl', to: 'l' },
  { cat: 'volume', from: 'dm3', to: 'l' },

  // ── 时间 ──
  { cat: 'time', from: 'h', to: 'min' },
  { cat: 'time', from: 'min', to: 'h' },
  { cat: 'time', from: 'min', to: 's' },
  { cat: 'time', from: 's', to: 'min' },
  { cat: 'time', from: 'day', to: 'h' },
  { cat: 'time', from: 'h', to: 'day' },
  { cat: 'time', from: 'week', to: 'day' },
  { cat: 'time', from: 'day', to: 'week' },
  { cat: 'time', from: 's', to: 'ms' },
  { cat: 'time', from: 'ms', to: 's' },
  { cat: 'time', from: 'year', to: 'day' },
  { cat: 'time', from: 'day', to: 's' },
  { cat: 'time', from: 'h', to: 's' },
  { cat: 'time', from: 's', to: 'h' },
  { cat: 'time', from: 'month', to: 'day' },
  { cat: 'time', from: 'us', to: 'ms' },

  // ── 速度 ──
  { cat: 'speed', from: 'kmh', to: 'mps' },
  { cat: 'speed', from: 'mps', to: 'kmh' },
  { cat: 'speed', from: 'mph', to: 'kmh' },
  { cat: 'speed', from: 'kmh', to: 'mph' },
  { cat: 'speed', from: 'knot', to: 'kmh' },
  { cat: 'speed', from: 'kmh', to: 'knot' },
  { cat: 'speed', from: 'mach', to: 'kmh' },
  { cat: 'speed', from: 'mps', to: 'fps' },
  { cat: 'speed', from: 'fps', to: 'mps' },
  { cat: 'speed', from: 'mph', to: 'mps' },
  { cat: 'speed', from: 'kmh', to: 'cms' },
  { cat: 'speed', from: 'knot', to: 'mps' },
  { cat: 'speed', from: 'mach', to: 'mps' },
  { cat: 'speed', from: 'light', to: 'kmh' },

  // ── 数据存储 ──
  { cat: 'data', from: 'gb', to: 'mb' },
  { cat: 'data', from: 'mb', to: 'gb' },
  { cat: 'data', from: 'mb', to: 'kb' },
  { cat: 'data', from: 'kb', to: 'mb' },
  { cat: 'data', from: 'tb', to: 'gb' },
  { cat: 'data', from: 'gb', to: 'tb' },
  { cat: 'data', from: 'kb', to: 'b' },
  { cat: 'data', from: 'b', to: 'kb' },
  { cat: 'data', from: 'mb', to: 'b' },
  { cat: 'data', from: 'tb', to: 'mb' },
  { cat: 'data', from: 'pb', to: 'tb' },
  { cat: 'data', from: 'gb', to: 'b' },

  // ── 网速：宽带用户高频刚需 ──
  { cat: 'data-rate', from: 'mbps', to: 'mbyteps' },
  { cat: 'data-rate', from: 'mbyteps', to: 'mbps' },
  { cat: 'data-rate', from: 'gbps', to: 'mbps' },
  { cat: 'data-rate', from: 'mbps', to: 'kbps' },
  { cat: 'data-rate', from: 'mbps', to: 'bps' },
  { cat: 'data-rate', from: 'gbps', to: 'gbyteps' },
  { cat: 'data-rate', from: 'kbps', to: 'kbyteps' },
  { cat: 'data-rate', from: 'mbyteps', to: 'kbyteps' },
  { cat: 'data-rate', from: 'tbps', to: 'gbps' },
  { cat: 'data-rate', from: 'gbyteps', to: 'mbyteps' },

  // ── 功率：汽车匹数/马力是高频 ──
  { cat: 'power', from: 'kw', to: 'ps' },
  { cat: 'power', from: 'ps', to: 'kw' },
  { cat: 'power', from: 'kw', to: 'hp' },
  { cat: 'power', from: 'hp', to: 'kw' },
  { cat: 'power', from: 'w', to: 'kw' },
  { cat: 'power', from: 'kw', to: 'w' },
  { cat: 'power', from: 'hp', to: 'ps' },
  { cat: 'power', from: 'ps', to: 'hp' },
  { cat: 'power', from: 'kw', to: 'mw' },
  { cat: 'power', from: 'w', to: 'btuh' },
  { cat: 'power', from: 'mw', to: 'kw' },
  { cat: 'power', from: 'btuh', to: 'w' },

  // ── 能量：卡路里/千焦是减脂人群刚需 ──
  { cat: 'energy', from: 'kcal', to: 'kj' },
  { cat: 'energy', from: 'kj', to: 'kcal' },
  { cat: 'energy', from: 'cal', to: 'j' },
  { cat: 'energy', from: 'j', to: 'cal' },
  { cat: 'energy', from: 'kwh', to: 'j' },
  { cat: 'energy', from: 'j', to: 'kwh' },
  { cat: 'energy', from: 'kcal', to: 'j' },
  { cat: 'energy', from: 'kj', to: 'j' },
  { cat: 'energy', from: 'btu', to: 'kj' },
  { cat: 'energy', from: 'wh', to: 'j' },
  { cat: 'energy', from: 'kwh', to: 'kj' },
  { cat: 'energy', from: 'mj', to: 'kwh' },

  // ── 压力：轮胎胎压是高频场景 ──
  { cat: 'pressure', from: 'bar', to: 'psi' },
  { cat: 'pressure', from: 'psi', to: 'bar' },
  { cat: 'pressure', from: 'kpa', to: 'bar' },
  { cat: 'pressure', from: 'bar', to: 'kpa' },
  { cat: 'pressure', from: 'atm', to: 'kpa' },
  { cat: 'pressure', from: 'kpa', to: 'atm' },
  { cat: 'pressure', from: 'mpa', to: 'bar' },
  { cat: 'pressure', from: 'bar', to: 'mpa' },
  { cat: 'pressure', from: 'psi', to: 'kpa' },
  { cat: 'pressure', from: 'kpa', to: 'psi' },
  { cat: 'pressure', from: 'mmhg', to: 'kpa' },
  { cat: 'pressure', from: 'kgfcm2', to: 'bar' },

  // ── 角度 ──
  { cat: 'angle', from: 'deg', to: 'rad' },
  { cat: 'angle', from: 'rad', to: 'deg' },
  { cat: 'angle', from: 'deg', to: 'arcmin' },
  { cat: 'angle', from: 'grad', to: 'deg' },
  { cat: 'angle', from: 'turn', to: 'deg' },
  { cat: 'angle', from: 'arcsec', to: 'deg' },

  // ── 力 ──
  { cat: 'force', from: 'kgf', to: 'n' },
  { cat: 'force', from: 'n', to: 'kgf' },
  { cat: 'force', from: 'lbf', to: 'n' },
  { cat: 'force', from: 'n', to: 'lbf' },
  { cat: 'force', from: 'kn', to: 'n' },
  { cat: 'force', from: 'n', to: 'dyn' },

  // ── 扭矩 ──
  { cat: 'torque', from: 'nm', to: 'kgfm' },
  { cat: 'torque', from: 'kgfm', to: 'nm' },
  { cat: 'torque', from: 'lbfft', to: 'nm' },
  { cat: 'torque', from: 'nm', to: 'lbfft' },
  { cat: 'torque', from: 'knm', to: 'nm' },

  // ── 频率 ──
  { cat: 'frequency', from: 'mhz', to: 'hz' },
  { cat: 'frequency', from: 'ghz', to: 'mhz' },
  { cat: 'frequency', from: 'khz', to: 'hz' },
  { cat: 'frequency', from: 'hz', to: 'khz' },
  { cat: 'frequency', from: 'mhz', to: 'khz' },
  { cat: 'frequency', from: 'rpm', to: 'hz' },
];
