import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'ratio-calculator',
  name: '比例计算器',
  tagline: '比例换算与按比例分配',
  description:
    '免费在线比例计算器，支持解比例式 a:b = c:x 求未知项、把比值化简为最简整数比，以及按给定比例把总量拆分到多份。适合配方调配、地图比例尺、投资占股、图纸缩放等场景，全部本地计算。',
  keywords: ['比例计算器', '解比例', '化简比', '按比例分配', '比值怎么算'],
  category: 'calc',
  tags: ['比例', '数学', '计算'],
  icon: 'scale',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '什么是解比例（交叉相乘）？',
      a: '已知 a:b = c:x，则 x = b×c÷a。原理是内项积等于外项积（a×x = b×c），移项即得。本工具输入三项即可求出第四项。',
    },
    {
      q: '化简比和求比值有什么不同？',
      a: '化简比是把 a:b 两边同除以最大公约数得到最简整数比（如 4:6 → 2:3）；求比值是用前项除以后项得到一个数值（4:6 的比值是 0.667）。',
    },
    {
      q: '按比例分配怎么用？',
      a: '输入总量和各份数（如 100 按 2:3:5 分配），工具会先求总份数，再用「总量×单份占比」算出每一份的金额。',
    },
  ],
  related: ['fraction-calculator', 'percentage-calculator', 'average-calculator'],
});
