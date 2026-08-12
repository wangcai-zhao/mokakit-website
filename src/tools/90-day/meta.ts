import { defineTool } from '@/tools/types';

export default defineTool({
  id: '90-day',
  name: '90天计算器',
  tagline: '算 90 天/任意天后是几号',
  description:
    '免费在线90天计算器，输入起始日期即可算出90天、180天或任意天数之后是哪一天，并显示对应的星期几。适用于合同到期、项目节点、账期与各类截止日推算，支持往前推算，全部在浏览器本地计算。',
  keywords: ['90天计算器', '90天后是几号', '日期加天数', '到期日推算', '天数后日期'],
  category: 'calc',
  tags: ['日期', '天数', '计算'],
  icon: 'calendar',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 7,
  faq: [
    {
      q: '90天后是星期几怎么看？',
      a: '结果区会同时显示完整日期和星期几（如「周日」），无需自己推算。',
    },
    {
      q: '支持算任意天数吗？',
      a: '支持。天数输入框可填任意整数，负数表示往前推算，例如 -30 即 30 天前。',
    },
    {
      q: '闰年二月会算错吗？',
      a: '不会。计算基于真实公历，自动处理闰年 29 天、跨月与跨年。',
    },
  ],
  related: ['days-ago', 'days-between', 'date-calculator', 'age-calculator'],
});
