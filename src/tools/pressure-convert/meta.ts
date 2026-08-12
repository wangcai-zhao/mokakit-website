import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'pressure-convert',
  name: '压力换算',
  tagline: 'Pa、bar、psi、atm、mmHg 等压强单位在线互转',
  description:
    '免费在线压力（压强）单位换算工具，覆盖帕斯卡、百帕、千帕、兆帕、巴、标准大气压、psi、毫米汞柱、千克力每平方厘米共 9 种单位。输入数值即时显示全部单位换算结果，附换算公式、实例与常见问答，全部本地计算不上传。',
  keywords: [
    '压力换算',
    '压强换算',
    '单位换算',
    'bar转psi',
    '帕斯卡换算',
    'psi换算',
    '标准大气压',
    '毫米汞柱',
    '胎压换算',
  ],
  category: 'convert',
  tags: ['压力', '压强', '换算'],
  icon: 'gauge',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-08',
  updatedAt: '2026-08-08',
  priority: 8,
  related: ['unit-convert', 'temperature-convert'],
  faq: [
    {
      q: '为什么 1 标准大气压 = 101,325 Pa？',
      a: '这是海平面上标准大气压的国际规定值，由国际协议统一确定。1 atm = 101.325 kPa = 1013.25 hPa，日常约等于 1.01325 bar。在需要精确计算的工程与气象场景，直接使用 101,325 Pa 即可。',
    },
    {
      q: 'bar 和 atm 一样吗？',
      a: '几乎相同但不完全相等。1 bar = 100,000 Pa，1 atm = 101,325 Pa，因此 1 atm ≈ 1.01325 bar。工程中 bar 更常用，气象上常用 hPa（百帕，= 毫巴）。两者日常可近似互换，但精密场合要区分。',
    },
    {
      q: 'mmHg（托 / Torr）常用在哪里？',
      a: '毫米汞柱常用于医学（血压测量，如 120/80 mmHg）和气压测量；760 mmHg ≈ 1 atm。它也称托（Torr），是托里拆利实验定义的压强单位。气象上的高空气压也常用 hPa 与 mmHg 对照。',
    },
    {
      q: '轮胎胎压 2.5 bar 是多少 psi？',
      a: '1 bar ≈ 14.5038 psi，所以 2.5 bar ≈ 36.3 psi。国内油箱盖上的推荐胎压多用 bar 或 kPa（1 bar = 100 kPa），而不少胎压计的刻度是 psi，换算时容易出错。常见对照：2.2 bar ≈ 32 psi、2.4 bar ≈ 35 psi、2.5 bar ≈ 36 psi。具体数值请以车辆铭牌标注为准。',
    },
    {
      q: 'psi 和 bar 怎么互相换算？',
      a: '1 bar = 14.5038 psi，反过来 1 psi ≈ 0.06895 bar。例如 30 psi ≈ 2.07 bar，35 psi ≈ 2.41 bar。汽车、自行车胎压与压缩空气设备最常用这组换算。',
    },
  ],
});
