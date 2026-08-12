import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'utc-to-edt',
  name: 'UTC 转 EDT 换算器',
  tagline: 'UTC 换算成美东夏令时',
  description:
    '免费在线 UTC 转 EDT（美国东部夏令时间）换算器，EDT = UTC − 4 小时。输入 UTC 的小时与分钟，立即得出对应的美东时钟时间，并标注是否跨天。适用于美股交易、美国会议与跨国协作排期，全部本地计算。',
  keywords: ['UTC转EDT', 'UTC转美东夏令时', 'UTC-4', '美国东部时间', '时区换算'],
  category: 'calc',
  tags: ['时区', 'UTC', '换算'],
  icon: 'globe',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 6,
  faq: [
    {
      q: 'EDT 和 EST 有什么区别？',
      a: 'EDT 是美国东部夏令时（UTC−4），EST 是东部标准时（UTC−5）。美国每年夏令时期间用 EDT，其余用 EST，相差 1 小时。',
    },
    {
      q: '会跨天吗？',
      a: '会。例如 UTC 02:00 减 4 小时为前一天 22:00，工具会标注「前一天」，避免日期错位。',
    },
    {
      q: '为什么有时差 1 小时？',
      a: '因为美东在夏令时比标准时快 1 小时（−4 而非 −5）。若需标准时请用 UTC 转 EST 工具。',
    },
  ],
  related: ['utc-to-est', 'utc-to-cst', 'utc-to-pst', 'time-duration'],
});
