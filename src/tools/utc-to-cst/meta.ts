import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'utc-to-cst',
  name: 'UTC 转中国标准时间',
  tagline: 'UTC 换算成北京时间',
  description:
    '免费在线 UTC 转中国标准时间（北京时间，UTC+8）换算器，输入 UTC 的小时与分钟，立即得出对应的中国时间，并提示是否跨天到次日。适用于跨国协作、日志时间、国际赛事与会议排期，全部本地计算。',
  keywords: ['UTC转北京时间', 'UTC转中国时间', 'UTC+8', '时区换算', '北京时间计算'],
  category: 'calc',
  tags: ['时区', 'UTC', '换算'],
  icon: 'globe',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 7,
  faq: [
    {
      q: '中国标准时间就是北京时间吗？',
      a: '是。中国大陆统一使用东八区（UTC+8）时间，称为北京时间或中国标准时间（CST），全国无时区差异。',
    },
    {
      q: '会跨天吗？',
      a: '会。例如 UTC 20:00 加 8 小时为次日 04:00，工具会标注「次日」，避免把日期搞错。',
    },
    {
      q: '夏令时怎么办？',
      a: '中国不实行夏令时，全年固定 UTC+8，因此本换算常年有效，无需按季节调整。',
    },
  ],
  related: ['utc-to-est', 'utc-to-edt', 'utc-to-pst', 'time-duration'],
});
