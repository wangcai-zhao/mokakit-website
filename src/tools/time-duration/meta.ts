import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'time-duration',
  name: '时间间隔计算器',
  tagline: '算两时刻之间时长',
  description:
    '免费在线时间间隔计算器，选择开始与结束的日期时间（精确到秒），即可精确算出两个时间点之间的时长，给出总天数、总小时、总分钟、总秒数与时分秒格式。适用于工时统计、行程时长、设备运行时间、项目周期核算，自动处理跨天跨月跨年与闰秒。',
  keywords: ['时间间隔计算器', '两个时间相差', '时长计算', '时间差', 'datetime 差'],
  category: 'calc',
  tags: ['时间', '时长', '计算'],
  icon: 'clock',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 7,
  faq: [
    {
      q: '支持跨天的时长吗？',
      a: '支持。例如从今天 22:00 到明天 02:00，会正确算出 4 小时，并拆分出天数与时分秒。',
    },
    {
      q: '小时数超过 24 怎么显示？',
      a: '「总时长」以 时:分:秒 展示，小时不做 24 取模（如 30:15:00 表示 30 小时），同时另列总天数与总小时便于阅读。',
    },
    {
      q: '需要联网吗？',
      a: '不需要。全部计算在浏览器本地完成，不上传任何数据，打开即用。',
    },
  ],
  related: ['hours-from-now', 'days-between', 'date-calculator', 'hms-add'],
});
