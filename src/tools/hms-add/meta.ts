import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'hms-add',
  name: '时间计算器 hh:mm:ss',
  tagline: '按 时:分:秒 累加加减',
  description:
    '免费在线时间计算器（hh:mm:ss 加减），按 时:分:秒 累计加减时间，支持负数时长、超过 59 的数值、批量行同时相加，结果自动补零显示 HH:MM:SS。适用于排班累计、任务时长汇总、多段工时相加、视频剪辑时长统计与跑步配速换算，全部本地计算。',
  keywords: ['时间计算器', '时分秒加减', 'hh:mm:ss 累加', '时间相加', '时长汇总'],
  category: 'calc',
  tags: ['时间', '计算', '时长'],
  icon: 'timer',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 7,
  faq: [
    {
      q: '怎么连续累加多段时间？',
      a: '在输入框填入一段 时:分:秒，点「＋加上」就会累加到下方的总时长；再填下一段继续加，点「－减去」可扣减，点「清零」重新开始。',
    },
    {
      q: '支持负数时长吗？',
      a: '支持。累计结果可以为负（例如先减后加不足），小时数也会正确显示负号。',
    },
    {
      q: '和时分秒转单位工具有什么区别？',
      a: '本工具是「累加器」，用于把多段时间加起来；时分秒转单位是把单段时长拆成总小时/分钟/秒。',
    },
  ],
  related: ['hms-to-units', 'seconds-to-time', 'time-duration', 'fortnight-to-hours'],
});
