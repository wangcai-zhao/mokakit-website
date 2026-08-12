import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'utc-to-est',
  name: 'UTC 转 EST 换算器',
  tagline: 'UTC 换算成美东标准时',
  description:
    '免费在线 UTC 转 EST（美国东部标准时间）换算器，EST = UTC − 5 小时。输入 UTC 的小时与分钟，立即换算为美东时钟时间，并清晰标注是前一天、当天还是次日。适用于美股、美国会议与跨境协作，全部本地计算。',
  keywords: ['UTC转EST', 'UTC转美东标准时', 'UTC-5', '美国东部时间', '时区换算'],
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
      q: 'EST 和 EDT 差多少？',
      a: 'EDT 是夏令时（UTC−4），EST 是标准时（UTC−5），相差 1 小时。美国非夏令时期间使用 EST。',
    },
    {
      q: '结果是前一天还是次日？',
      a: '工具会明确标注：UTC 减去 5 小时若落到前一天则标「前一天」，跨过 0 点则标「次日」。',
    },
    {
      q: '和北京时间差多少？',
      a: '北京时间 UTC+8 与 EST UTC−5 相差 13 小时，北京比美东标准时早约 13 小时。',
    },
  ],
  related: ['utc-to-edt', 'utc-to-cst', 'utc-to-pst', 'time-duration'],
});
