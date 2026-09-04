import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'gov-shutdown-countdown',
  name: '事件倒计时器',
  tagline: '自定义目标实时倒计时',
  description:
    '免费在线事件倒计时器，自定义任意目标日期与时间，按本地时区实时显示距离该时刻还剩多少年、月、天、时、分、秒，到点提示。适用于截止日、节日、考试、纪念日、活动与项目节点倒计时，可同时跟踪多个目标，全部本地计算。',
  keywords: ['倒计时', '事件倒计时', '目标倒计时', '日期倒计时', '实时倒计时'],
  category: 'calc',
  tags: ['倒计时', '时间', '计算'],
  icon: 'timer',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 6,
  faq: [
    {
      q: '倒计时是实时的吗？',
      a: '是。设置目标时刻后，页面会每秒刷新，显示距离该时刻还剩的年/月/天/时/分/秒。',
    },
    {
      q: '年/月是精确的吗？',
      a: '天及以下为精确值；年/月按均值（年约 365.25 天、月约 30.44 天）近似，用于直观感知，精确请以天数为准。',
    },
    {
      q: '过去的时间会怎样？',
      a: '若目标时刻已过，会显示「该时刻已过去」，倒计时数字仍按差值展示，便于回看。',
    },
  ],
  related: ['time-duration', 'days-between', 'hours-from-now', '90-day'],
});
