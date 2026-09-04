import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'seconds-to-time',
  name: '秒转时分秒计算器',
  tagline: '秒数换算成 HH:MM:SS',
  description:
    '免费在线秒转时分秒计算器，一键将秒数换算成小时、分钟和秒（HH:MM:SS）格式，并给出完整的时分秒拆解，支持小数秒（毫秒输入）。适用于视频时长换算、任务耗时统计、日志分析与计时数据处理，结果支持一键复制，全部本地计算。',
  keywords: ['秒转时分秒', '秒换算', '秒转HHMMSS', '时间格式转换', '秒数拆分'],
  category: 'calc',
  tags: ['时间', '换算', '秒'],
  icon: 'timer',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 7,
  faq: [
    {
      q: '支持很大的秒数吗？',
      a: '支持。例如 90061 秒会换算为 25:01:01，小时数不做 24 取模，方便表达超过一天的总时长。',
    },
    {
      q: '小数秒怎么处理？',
      a: '输入会被取整到秒再换算。若需要毫秒精度，请先换算成秒的整数部分。',
    },
    {
      q: '结果能直接复制吗？',
      a: '可以。结果区的 HH:MM:SS 支持一键复制，方便粘贴到文档或代码里。',
    },
  ],
  related: ['hms-to-units', 'hms-add', 'time-duration', 'video-speed'],
});
