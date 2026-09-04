import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'fraction-calculator',
  name: '分数计算器',
  tagline: '分数加减乘除与约分',
  description:
    '免费在线分数计算器，支持两个分数之间的加、减、乘、除运算，自动约分（最简分数）并同时给出假分数与带分数（整数+真分数）两种结果，附运算过程。适合小学生作业自查、家长辅导、烘焙配比换算、工程比例计算与化学摩尔浓度计算，全部本地运算、即时出结果。',
  keywords: ['分数计算器', '分数加减乘除', '分数约分', '带分数换算', '假分数化简'],
  category: 'calc',
  tags: ['分数', '数学', '计算'],
  icon: 'divide',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '计算器给出的带分数和假分数有什么区别？',
      a: '假分数分子大于或等于分母（如 7/4），带分数把整数部分拆出来（如 1 又 3/4）。两者数值相等，带分数更直观，假分数更适合继续参与运算。',
    },
    {
      q: '分数运算的结果会自动约分吗？',
      a: '会。本工具用最大公约数对结果分子分母同时约掉公因数，得到最简分数。例如 4/8 会显示为 1/2。',
    },
    {
      q: '分母可以为 0 吗？',
      a: '不可以。分母为 0 在分数中没有意义，工具会提示错误。此外除以一个分数时若该分数为 0（分子为 0）也会被判为非法运算。',
    },
  ],
  related: ['percentage-calculator', 'ratio-calculator', 'average-calculator'],
});
