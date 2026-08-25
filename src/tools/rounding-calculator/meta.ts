import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'rounding-calculator',
  name: '四舍五入计算器',
  tagline: '指定位数四舍五入',
  description:
    '免费在线四舍五入计算器，输入一个数字并指定保留小数位数（或保留到十位、百位、千位），自动按四舍五入规则处理，也可切换为向上取整、向下取整、四舍六入五成双。适合成绩、金额、测量数据的规范化，本地即时计算。',
  keywords: ['四舍五入计算器', '保留小数', '向上取整', '向下取整', '保留到十位'],
  category: 'calc',
  tags: ['四舍五入', '数学', '计算'],
  icon: 'target',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '四舍五入到指定位数怎么判断进位？',
      a: '看保留位之后那一位数字：0–4 舍去，5–9 进位。例如 3.14159 保留两位小数是 3.14，保留三位是 3.142。',
    },
    {
      q: '向上取整和向下取整分别是什么？',
      a: '向上取整（ceil）无论小数多少都进位到下一个整数（2.1→3）；向下取整（floor）直接舍去小数（2.9→2）。四舍五入是第三种常见策略。',
    },
    {
      q: '「四舍六入五成双」是什么？',
      a: '这是银行家舍入法：舍去位为 5 且后面全 0 时，向最近的偶数靠拢，以减少累计误差。例如 2.5→2、3.5→4。常用于金融统计。',
    },
  ],
  related: ['average-calculator', 'percentage-calculator', 'scientific-notation'],
});
