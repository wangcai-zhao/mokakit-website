import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'weekly-hours',
  name: '每周工时计算器',
  tagline: '按打卡统计周总/加班工时',
  description:
    '免费在线每周工时计算器，按每天上下班打卡时间与休息时间，自动统计每周总工时、日均工时以及超过 40 小时的加班时长。适用于排班核对、加班统计与薪资核算，全部本地计算。',
  keywords: ['每周工时', '周工时计算', '加班时长', '打卡工时', '排班统计'],
  category: 'calc',
  tags: ['工时', '计算', '排班'],
  icon: 'clock',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 6,
  faq: [
    {
      q: '休息时间是必填吗？',
      a: '默认每天 1 小时，可改为 0 或任意非负小时。它会在「下班 − 上班」的基础上扣除，得到真实工时。',
    },
    {
      q: '加班怎么算？',
      a: '按每周总工时超过 40 小时的部分计为加班。例如周总 48 小时，则加班 8 小时。',
    },
    {
      q: '下班早于上班会怎样？',
      a: '该日会显示「下班早于上班」提示且当日工时为负数，便于你发现填反；修正后自动恢复正常统计。',
    },
  ],
  related: ['hours-from-now', 'fortnight-to-hours', 'hms-add', 'time-duration'],
});
