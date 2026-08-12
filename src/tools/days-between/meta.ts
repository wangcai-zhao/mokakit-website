import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'days-between',
  name: '两个日期之间天数计算器',
  tagline: '算两日期相差多少天',
  description:
    '免费在线两个日期之间天数计算器，输入开始与结束日期即可精确算出相隔多少天，并提供周数、约月数、约年数。适用于工期、账期、倒计时与纪念日核算，自动处理闰年与跨年，全部本地计算。',
  keywords: ['两个日期相差天数', '日期之间天数', '相隔多少天', '日期差计算', '天数计算器'],
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
      q: '相差天数包含起始当天吗？',
      a: '本工具按「结束日期减起始日期」计算间隔，不含起始当天。例如 8 月 1 日到 8 月 2 日为 1 天；若要含首尾，结果加 1 即可。',
    },
    {
      q: '月数和年数为什么约算？',
      a: '每月天数 28~31 天不等、还有闰年差异，无法固定精确折算。本工具按均值估算（月约 30.44 天、年约 365.25 天），精确请以天数为准。',
    },
    {
      q: '结束早于开始会报错吗？',
      a: '不会。结果仍显示相差天数，并标注「结束早于起始」，方便核对输入是否填反。',
    },
  ],
  related: ['90-day', 'days-ago', 'date-calculator', 'age-calculator'],
});
