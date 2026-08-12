import { defineTool } from '../types';
import type { SubPage } from '../types';
import { CATEGORY_BY_ID, FEATURED_PAIRS, convert, findUnit, type Unit } from './units';
import { formatNumber } from './format';

/**
 * 生成长尾子页。
 * 每个精选换算对生成一个独立页面，承接"厘米换算英寸"这类具体搜索词。
 */
function buildSubpages(): SubPage[] {
  const pages: SubPage[] = [];

  for (const pair of FEATURED_PAIRS) {
    const cat = CATEGORY_BY_ID.get(pair.cat);
    const from = findUnit(pair.cat, pair.from);
    const to = findUnit(pair.cat, pair.to);
    if (!cat || !from || !to) continue;

    const one = formatNumber(convert(1, from, to), 8);
    const slug = `${cat.slug}/${pair.from}-to-${pair.to}`;
    // 温度是仿射变换（零点不重合），不能套用"乘以系数"的话术，需单独成文
    const isTemp = cat.id === 'temperature';

    pages.push({
      slug,
      title: `${from.name}换算${to.name}`,
      description: isTemp
        ? `${from.name}和${to.name}怎么换算？在线${from.name}转${to.name}计算器，附换算公式与常见温度对照表，输入即得结果，免费无需下载。`
        : `${from.name}和${to.name}怎么换算？1${from.name}=${one}${to.name}。提供在线${from.name}转${to.name}计算器和常用数值对照表，输入即得结果，免费无需下载。`,
      data: {
        categoryId: cat.id,
        fromId: from.id,
        toId: to.id,
        fromName: from.name,
        toName: to.name,
        fromSymbol: from.symbol,
        toSymbol: to.symbol,
        oneEquals: one,
      },
      faq: buildPairFaq(cat.id, from, to, one, isTemp),
    });
  }

  return pages;
}

/**
 * 为单个换算对生成 FAQ。
 * 比例类给"数值 + 公式 + 大小比较"，温度类换成仿射变换的专门话术。
 */
function buildPairFaq(
  catId: string,
  from: Unit,
  to: Unit,
  one: string,
  isTemp: boolean,
): { q: string; a: string }[] {
  if (isTemp) {
    const samples = [0, 25, 37, 100]
      .map((v) => `${v}${from.symbol} = ${formatNumber(convert(v, from, to), 6)}${to.symbol}`)
      .join('；');
    return [
      {
        q: `${from.name}怎么换算成${to.name}？`,
        a: `常见对照：${samples}。温度换算不能像长度、重量那样简单乘一个系数，因为不同温标的零点位置不同，必须用带偏移量的公式计算。直接用本页上方的换算器输入数值最省事。`,
      },
      {
        q: '为什么温度换算不能直接按比例乘？',
        a: '因为温标之间是"仿射关系"而不是"比例关系"。摄氏度把水的冰点定为 0 度，华氏度的 0 度则落在另一个参考点上，两者零点不重合。所以 0°C 不等于 0°F，而是等于 32°F。换算时必须先缩放刻度再平移零点，公式为 °F = °C × 9/5 + 32。',
      },
      {
        q: `${from.name}和${to.name}哪个刻度更细？`,
        a:
          from.factor < to.factor
            ? `${from.name}的刻度更细。同样是 1 度的间隔，${from.name}代表的温度变化量更小，读数更精细。`
            : from.factor > to.factor
              ? `${to.name}的刻度更细。同样是 1 度的间隔，${to.name}代表的温度变化量更小。`
              : '两者刻度间隔完全相同，只是零点不同，所以换算时只需加减一个固定数值。',
      },
    ];
  }

  const ratio = convert(1, from, to);
  const faq = [
    {
      q: `1${from.name}等于多少${to.name}？`,
      a: `1${from.name} = ${one}${to.name}。你可以用本页上方的换算器输入任意数值，即时得到精确结果。`,
    },
    {
      q: `${from.name}换算${to.name}的公式是什么？`,
      a: `${to.name} = ${from.name} × ${one}；反过来 ${from.name} = ${to.name} × ${formatNumber(1 / ratio, 8)}。例如 10${from.name} = ${formatNumber(convert(10, from, to), 8)}${to.name}，100${from.name} = ${formatNumber(convert(100, from, to), 8)}${to.name}。`,
    },
    {
      q: `${from.name}和${to.name}哪个更大？`,
      a:
        ratio > 1
          ? `${from.name}更大。1${from.name}相当于${one}个${to.name}。`
          : `${to.name}更大。1${from.name}只相当于${one}个${to.name}。`,
    },
  ];

  // 网速最容易被"比特 / 字节"绕晕，这一类统一补一条澄清
  if (catId === 'data-rate') {
    faq.push({
      q: '为什么 100M 宽带的下载速度只有 12.5MB/s？',
      a: '因为运营商标称的"100M"指 100 Mbps（兆比特每秒），而下载软件显示的是 MB/s（兆字节每秒）。1 字节 = 8 比特，所以 100 Mbps ÷ 8 = 12.5 MB/s。这不是运营商缺斤少两，而是两个单位的计量对象不同，实际带宽是达标的。',
    });
  }

  return faq;
}

export default defineTool({
  id: 'unit-convert',
  name: '单位换算',
  tagline: '长度重量温度网速等 16 类单位在线互换',
  description:
    '免费在线单位换算工具，覆盖长度、重量、温度、面积、体积、时间、速度、数据存储、网速、功率、能量、压力、角度、力、扭矩、频率共 16 大类 160 多种单位，含厘米转英寸、斤转千克、亩转平方米、摄氏度转华氏度、Mbps 转 MB/s、千瓦转马力、大卡转千焦等常用换算，输入即得结果。',
  keywords: [
    '单位换算',
    '单位转换',
    '在线换算器',
    '长度换算',
    '重量换算',
    '网速换算',
    '功率换算',
    '压力换算',
  ],
  category: 'convert',
  tags: ['换算', '单位', '计算', '转换'],
  icon: 'ruler',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-08',
  priority: 10,
  subpages: buildSubpages,
  faq: [
    {
      q: '这个换算工具的精度怎么样？',
      a: '所有换算系数均采用国际标准定义值，例如 1 英寸精确等于 2.54 厘米、1 磅精确等于 0.45359237 千克。计算过程使用高精度十进制运算库处理，避免了 JavaScript 浮点数的精度误差，结果保留 10 位有效数字。',
    },
    {
      q: '为什么温度换算和其他单位不一样？',
      a: '长度、重量这类单位是纯比例关系，乘个系数就行。但温度不同，摄氏度和华氏度的零点不在同一位置，需要用仿射变换公式：°F = °C × 9/5 + 32。所以 0°C 不等于 0°F，而是等于 32°F。本工具对温度做了专门处理。',
    },
    {
      q: '一斤等于多少千克？为什么有的地方说不一样？',
      a: '中国大陆现行标准是 1 市斤 = 0.5 千克 = 500 克，本工具采用此标准。历史上市斤曾等于 596.8 克，1959 年国务院统一改为 500 克。另外中国台湾地区的台斤等于 600 克，中国香港地区的司马斤约等于 604.8 克，与大陆市斤不同，使用时需注意区分。',
    },
    {
      q: '一亩地是多少平方米？',
      a: '1 亩 ≈ 666.67 平方米，精确值是 2000/3 平方米。1 公顷 = 15 亩 = 10000 平方米，1 平方千米 = 1500 亩。这是中国大陆的市亩标准。',
    },
    {
      q: '数据存储单位为什么按 1024 换算而不是 1000？',
      a: '本工具采用传统的二进制换算，即 1 KB = 1024 字节。这是操作系统（尤其是 Windows）显示文件大小的方式。而硬盘厂商标称容量时用的是十进制，1 GB = 1000 MB，这就是为什么标称 500GB 的硬盘在系统里只显示约 465GB——两者的计算口径不同，并非缺斤少两。',
    },
    {
      q: '「数据存储」和「网速」为什么分成两类？换算口径不一样吗？',
      a: '是的，两者口径不同，混用会算错。存储容量沿用二进制，1 MB = 1024 KB；而网络带宽沿用十进制，1 Mbps = 1000 Kbps。更关键的是计量对象不同：带宽用比特（bit），文件大小用字节（Byte），1 字节 = 8 比特。所以 100 Mbps 的宽带，理论下载速度是 100 ÷ 8 = 12.5 MB/s。本工具把这两类拆开，就是为了避免把这两套规则搅在一起。',
    },
    {
      q: '汽车说的「匹」和「马力」是一回事吗？1 匹等于多少千瓦？',
      a: '日常说的「匹」通常指公制马力（PS），1 PS = 735.49875 瓦 ≈ 0.7355 千瓦，反过来 1 千瓦 ≈ 1.36 匹。另有英制马力（hp），1 hp ≈ 745.7 瓦，比公制马力略大约 1.4%，欧系车参数多用 PS、美系多用 hp，看车时留意单位标注。注意空调说的「匹」是另一回事——那指的是制冷量（1 匹约对应 2500 W 制冷量），和功率单位的匹不能直接混用。',
    },
    {
      q: '食品包装上的千焦怎么换算成大卡？',
      a: '1 大卡（千卡，kcal）= 4.184 千焦（kJ），所以用千焦除以 4.184 就得到大卡。例如一包标称 1200 kJ 的零食，约等于 287 大卡。中国大陆的食品营养成分表按国标使用千焦，而健身和减脂场景习惯用大卡，这就是两者需要频繁换算的原因。顺带一提，日常说的「卡路里」在减肥语境下几乎都指大卡，不是小卡（cal）。',
    },
    {
      q: '轮胎胎压 2.5 bar 是多少 psi？',
      a: '1 bar ≈ 14.5038 psi，所以 2.5 bar ≈ 36.3 psi。国内车辆油箱盖上的推荐胎压多用 bar 或 kPa（1 bar = 100 kPa），而不少胎压计的刻度是 psi，换算时容易出错。常见对照：2.2 bar ≈ 32 psi，2.4 bar ≈ 35 psi，2.5 bar ≈ 36 psi。具体数值请以车辆铭牌标注为准。',
    },
  ],
});
