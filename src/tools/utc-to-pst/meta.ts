import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'utc-to-pst',
  name: 'UTC 转 PST 换算器',
  tagline: 'UTC 换算成太平洋时间',
  description:
    '免费在线 UTC 转 PST（太平洋标准时间）换算器，PST = UTC − 8 小时。输入 UTC 的小时与分钟，立即得出对应的太平洋时钟时间，并标注是否跨天。适用于硅谷时区、美国西海岸会议与跨境协作排期，全部本地计算。',
  keywords: ['UTC转PST', 'UTC转太平洋时间', 'UTC-8', '美国西部时间', '时区换算'],
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
      q: 'PST 和 PDT 有什么区别？',
      a: 'PST 是太平洋标准时（UTC−8），PDT 是太平洋夏令时（UTC−7）。美国夏令时期间用 PDT，其余用 PST。本工具按标准时 −8 计算。',
    },
    {
      q: '会跨天吗？',
      a: '会。例如 UTC 06:00 减 8 小时为前一天 22:00，工具会标注「前一天」。',
    },
    {
      q: '和北京时间差多少？',
      a: '北京时间 UTC+8 与 PST UTC−8 相差 16 小时，北京比太平洋时间早约 16 小时。',
    },
  ],
  related: ['utc-to-est', 'utc-to-edt', 'utc-to-cst', 'time-duration'],
});
