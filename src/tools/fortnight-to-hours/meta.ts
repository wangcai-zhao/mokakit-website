import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'fortnight-to-hours',
  name: '两周转小时计算器',
  tagline: '天数换算成总小时数',
  description:
    '免费在线两周转小时计算器，把天数快速换算成总小时数（小时 = 天数 × 24），可选填额外小时。适用于工期、工时、活动时长与排期换算，全部本地计算。',
  keywords: ['两周转小时', '天数换算小时', '天转小时', '工时换算', '天数乘24'],
  category: 'calc',
  tags: ['时间', '换算', '小时'],
  icon: 'clock',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 6,
  faq: [
    {
      q: '两周为什么是 336 小时？',
      a: '一周 7 天 × 24 小时 = 168 小时，两周即 336 小时。本工具默认天数为 14，结果即 336 小时。',
    },
    {
      q: '能加额外小时吗？',
      a: '能。在「额外小时」填入数字，会与「天数 × 24」相加，得到更精确的总小时。',
    },
    {
      q: '和视频倍速工具有关系吗？',
      a: '关系不大，但都属时间换算：本工具是「天→小时」，视频倍速是「时长÷倍速」。需要拆分时长可配合时分秒工具。',
    },
  ],
  related: ['hours-from-now', 'hms-to-units', 'hms-add', 'time-duration'],
});
