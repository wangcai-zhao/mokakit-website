import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'video-speed',
  name: '视频倍速观看时间计算器',
  tagline: '算倍速下看完要多久',
  description:
    '免费在线视频倍速观看时间计算器，输入视频原始时长与倍速（1.25/1.5/2/2.5/3 或任意小数），立即算出以该倍速看完所需的观看时间与节省时间。适用于网课加速、剧集追番、长视频与会议录像规划，附推荐倍速参考（学习/娱乐/复习），全部本地计算。',
  keywords: ['视频倍速', '观看时间计算', '倍速节省时间', '视频时长', '网课倍速'],
  category: 'calc',
  tags: ['视频', '时间', '计算'],
  icon: 'film',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 6,
  faq: [
    {
      q: '倍速怎么影响时间？',
      a: '观看时间 = 原时长 ÷ 倍速。例如 2 小时视频用 2× 看只需 1 小时；0.75× 则会变成 2 小时 40 分。',
    },
    {
      q: '常见的 1.25/1.5/2 倍速在哪？',
      a: '输入框下方有预设按钮，点一下即可填入对应倍速，也可手动输入任意倍速（含小于 1 的慢速）。',
    },
    {
      q: '节省时间是怎么算的？',
      a: '节省时间 = 原时长 − 观看时间。例如原 2 小时用 1.5× 看完省下约 40 分钟。',
    },
  ],
  related: ['time-duration', 'seconds-to-time', 'hms-to-units', 'fortnight-to-hours'],
});
