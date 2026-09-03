import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'fuel-efficiency',
  name: '油耗换算',
  tagline: 'L/100km、km/L、mpg 等燃油效率单位在线互转',
  description:
    '免费在线燃油效率（油耗）换算工具，支持升每百公里（L/100km）、公里每升（km/L）、美制英里每加仑（mpg US）、英制英里每加仑（mpg UK）、英里每升（mi/L）等常用单位实时互转。看进口车参数、海外评测、出国自驾加油不再懵，全部本地计算不上传。',
  keywords: ['油耗换算', '燃油效率换算', 'L/100km转mpg', 'mpg转公里每升', '百公里油耗', '英里每加仑换算'],
  category: 'convert',
  tags: ['油耗', '燃油效率', '换算'],
  icon: 'fuel',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 8,
  related: ['unit-convert'],
  faq: [
    {
      q: 'L/100km 和 km/L 有什么区别？',
      a: '两者方向相反：L/100km 表示跑 100 公里要烧多少升油，数值越小越省（国内常用）；km/L 表示 1 升油能跑多少公里，数值越大越省（日韩常用）。换算关系为 km/L = 100 ÷ L/100km，例如 8 L/100km 等价于 12.5 km/L。',
    },
    {
      q: 'mpg 是什么，美制和英制一样吗？',
      a: 'mpg 即 miles per gallon（英里每加仑）。美制加仑约 3.785 L、英制加仑约 4.546 L，二者不同，所以同一油耗 mpg(US) 和 mpg(UK) 数值不同：30 mpg US ≈ 36 mpg UK。美国与英国车评不能直接比数字，必须先统一单位。',
    },
    {
      q: '进口车标 30 mpg，相当于国内百公里几个油？',
      a: '若是美制 30 mpg：先转 km/L = 30 × 1.609344 ÷ 3.785411784 ≈ 12.75 km/L，再转 L/100km = 100 ÷ 12.75 ≈ 7.84 L/100km。若是英制 30 mpg ≈ 9.41 L/100km。差别不小，务必看清是 US 还是 UK。',
    },
    {
      q: '为什么标定的 L/100km 往往比实际低？',
      a: 'L/100km 是单位距离油耗，适合比较同路况；但综合工况（NEDC/WLTP）标定值通常低于真实油耗，实际常高 10%–30%。本工具只做单位换算，真实油耗请以实际加油记录为准。',
    },
  ],
});
