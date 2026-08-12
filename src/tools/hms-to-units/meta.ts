import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'hms-to-units',
  name: '时分秒转小时分钟秒',
  tagline: 'HH:MM:SS 转总小时/分钟/秒',
  description:
    '免费在线时分秒转小时分钟秒计算器，将 HH:MM:SS 时长换算为总小时数、总分钟数或总秒数，支持小数与超过 59 的数值。适用于工时统计、时长汇总、报表换算，全部本地计算。',
  keywords: ['时分秒转小时', 'HHMMSS换算', '时长转小时', '时间单位换算', '时分秒转分钟'],
  category: 'calc',
  tags: ['时间', '换算', '时长'],
  icon: 'timer',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 7,
  faq: [
    {
      q: '输入超过 59 的分钟/秒可以吗？',
      a: '可以。例如填 00:90:00 会被正确识别为 1 小时 30 分，无需先手动进位。',
    },
    {
      q: '总小时为什么有小数？',
      a: '因为 1 小时 = 60 分钟，非整小时会折算成小数小时（如 90 分钟 = 1.5 小时），便于报表统计。',
    },
    {
      q: '和秒转时分秒是反操作吗？',
      a: '是互补关系：本工具把 时:分:秒 拆成「总小时/总分钟/总秒」，秒转时分秒则把总秒数拼回 HH:MM:SS。',
    },
  ],
  related: ['seconds-to-time', 'hms-add', 'fortnight-to-hours', 'time-duration'],
});
