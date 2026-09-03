import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'capacitance',
  name: '电容单位换算',
  tagline: 'pF、nF、μF、mF、F 等电容单位在线互转',
  description:
    '免费在线电容单位换算工具，覆盖皮法（pF）、纳法（nF）、微法（μF）、毫法（mF）、法拉（F）等常用单位。输入数值即时显示全部单位结果，适合电子制作、维修与滤波电路设计，全部本地计算。',
  keywords: ['电容换算', 'pF nF μF F 换算', '电容单位', '法拉', '微法纳法'],
  category: 'convert',
  tags: ['电容', '电子', '换算'],
  icon: 'battery-charging',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert', 'resistance', 'inductance'],
  faq: [
    {
      q: '电容单位怎么换算？',
      a: '以法拉（F）为基准：1 F = 1000 mF = 1,000,000 μF = 1,000,000,000 nF = 1,000,000,000,000 pF。日常电路几乎用 μF 和 pF，1 μF = 1000 nF = 1,000,000 pF。',
    },
    {
      q: '标着 104 的电容是多少 μF？',
      a: '这是三位数字编码：前两位有效数 10，第三位倍率 10⁴，即 100,000 pF = 100 nF = 0.1 μF。同理 105 = 1,000,000 pF = 1 μF，224 = 220,000 pF = 0.22 μF。',
    },
    {
      q: 'μF 和 uF 一样吗？',
      a: '一样，只是写法不同。μ 是希腊字母"微"，键盘打不出时常以 u 代替，所以 uF = μF = 10⁻⁶ F。本工具以 μF 显示。',
    },
    {
      q: '电解电容的 μF 和瓷片电容的 pF 怎么对照？',
      a: '1 μF = 1,000,000 pF。小信号耦合/退耦常用 0.1 μF（=100 nF=100,000 pF），高频旁路常用 10–100 pF。换单位时本工具可避免数量级搞错。',
    },
  ],
});
