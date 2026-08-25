import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'average-calculator',
  name: '平均数计算器',
  tagline: '均值、中位数与众数',
  description:
    '免费在线平均数计算器，一次性输入多个数字，自动算出算术平均值（均值）、中位数和众数，并给出数据个数、总和与极差。适合成绩统计、工资核算、实验数据整理，支持用空格、逗号或换行分隔，本地即时计算。',
  keywords: ['平均数计算器', '算术平均值', '中位数计算', '众数计算', '均值怎么算'],
  category: 'calc',
  tags: ['平均数', '统计', '数学'],
  icon: 'sigma',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '平均数、中位数、众数有什么区别？',
      a: '平均数是所有数之和除以个数，容易被极端值拉偏；中位数是排序后排在中间的数，抗干扰；众数是出现次数最多的数，一组数据可能不止一个众数甚至没有众数。',
    },
    {
      q: '数据有偶数个时中位数怎么算？',
      a: '偶数个数据时，中位数是中间两个数的平均值。例如 2、4、6、8 的中位数是 (4+6)/2 = 5。',
    },
    {
      q: '输入的数字可以用什么分隔？',
      a: '空格、中文或英文逗号、换行都可以混用，工具会自动拆分并忽略空值，方便直接从表格或文档里粘贴一串数字。',
    },
  ],
  related: ['percentage-calculator', 'ratio-calculator', 'fraction-calculator'],
});
