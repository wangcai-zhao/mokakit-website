import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'calendar-quarter',
  name: '日历季度计算器',
  tagline: '月份查所属季度',
  description:
    '免费在线日历季度计算器，输入任意月份，立即查出它属于第几个日历季度（Q1-Q4），并显示该季度的起止月份、当季天数与本季剩余天数。适用于财年规划、季度复盘、报表归类、项目里程碑对照与财务披露周期核对，全部本地计算。',
  keywords: ['日历季度', '季度计算', 'Q1Q2Q3Q4', '月份查季度', '季度起止'],
  category: 'calc',
  tags: ['季度', '日期', '计算'],
  icon: 'calendar',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 6,
  faq: [
    {
      q: '季度是怎么划分的？',
      a: '按自然月：Q1=1~3 月，Q2=4~6 月，Q3=7~9 月，Q4=10~12 月。这是公历标准季度划分。',
    },
    {
      q: '和财年季度一样吗？',
      a: '不一定。本工具按日历季度（自然年）划分；部分公司财年从 4 月或 7 月开始，其「财季」会不同。本工具仅供日历口径参考。',
    },
    {
      q: '输入非法月份会怎样？',
      a: '输入 1-12 之外的数字会提示「请输入 1 到 12 之间的月份」，不会给出错误结果。',
    },
  ],
  related: ['days-between', '90-day', 'time-duration', 'date-calculator'],
});
