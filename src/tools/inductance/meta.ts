import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'inductance',
  name: '电感单位换算',
  tagline: 'nH、μH、mH、H 等电感单位在线互转',
  description:
    '免费在线电感单位换算工具，覆盖纳亨（nH）、微亨（μH）、毫亨（mH）、亨利（H）等常用单位。输入数值即时显示全部单位结果，适合电源、射频与滤波电路设计，全部本地计算。',
  keywords: ['电感换算', 'nH μH mH H 换算', '电感单位', '亨利', '微亨'],
  category: 'convert',
  tags: ['电感', '电子', '换算'],
  icon: 'waves',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert', 'resistance', 'capacitance'],
  faq: [
    {
      q: '电感单位怎么换算？',
      a: '以亨利（H）为基准：1 H = 1000 mH = 1,000,000 μH = 1,000,000,000 nH。电源里常用 μH 到 mH 级，射频与高频电路常用 nH 到 μH 级。',
    },
    {
      q: 'μH 和 mH 哪个大？',
      a: 'mH 更大，1 mH = 1000 μH。例如 4.7 mH = 4700 μH，100 μH = 0.1 mH。',
    },
    {
      q: '贴片电感上的数字怎么读？',
      a: '常见两位或三位数字编码，最后一位是倍率（10 的幂），单位为 μH。例如 100 = 10 × 10⁰ = 10 μH，101 = 10 × 10¹ = 100 μH，R47 = 0.47 μH（R 表示小数点）。',
    },
    {
      q: '电感和电容单位会混淆吗？',
      a: '不会，物理量不同。电容存电荷（F 系），电感存磁场（H 系）。但它们常成对出现在 LC 滤波、谐振电路中，本工具可分别快速换算两者数值。',
    },
  ],
});
