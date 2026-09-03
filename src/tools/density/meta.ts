import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'density',
  name: '密度单位换算',
  tagline: 'kg/m³、g/cm³、lb/ft³ 等密度单位在线互转',
  description:
    '免费在线密度单位换算工具，覆盖千克每立方米（kg/m³）、克每立方厘米（g/cm³）、克每毫升（g/mL）、磅每立方英尺（lb/ft³）、磅每加仑（lb/gal）等常用单位。适合材料、化工与日常比重查询，全部本地计算。',
  keywords: ['密度换算', 'kg/m3 g/cm3', '比重', '密度单位', '克每立方厘米'],
  category: 'convert',
  tags: ['密度', '换算'],
  icon: 'layers',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert'],
  faq: [
    {
      q: '密度单位之间怎么换算？',
      a: '以 kg/m³ 为基准：1 g/cm³ = 1000 kg/m³，1 g/mL = 1000 kg/m³；1 lb/ft³ ≈ 16.0185 kg/m³，1 lb/gal(US) ≈ 119.826 kg/m³。',
    },
    {
      q: '水的密度是多少？',
      a: '4℃ 纯水约 1000 kg/m³ = 1 g/cm³ = 1 kg/L。常温略低（约 0.998 g/cm³），工程上常取 1 g/cm³。',
    },
    {
      q: '比重和密度是一回事吗？',
      a: '比重（相对密度）是无量纲量，表示某物质密度与水的比值；数值上常等于其 g/cm³。例如铁比重约 7.87，即 7.87 g/cm³。',
    },
    {
      q: '常见物质密度大概多少？',
      a: '汽油约 0.70–0.78 g/cm³，酒精约 0.79 g/cm³，铝 2.70 g/cm³，铁 7.87 g/cm³，黄金 19.3 g/cm³，人体约 1.0 g/cm³。',
    },
  ],
});
