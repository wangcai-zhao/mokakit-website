import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'hours-from-now',
  name: '几小时后是几点',
  tagline: '算 N 小时后是几点钟',
  description:
    '免费在线几小时后是几点计算器，输入起始时间与小时数，立即算出几小时后是几点钟，以 24 小时制 HH:MM 显示，自动处理跨越午夜。适用于排班、行程衔接、倒计时等场景，全部本地计算。',
  keywords: ['几小时后是几点', '时间加小时', '小时后是几点', '时间推算', 'HH:MM 计算'],
  category: 'calc',
  tags: ['时间', '计算', '小时'],
  icon: 'clock',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 7,
  faq: [
    {
      q: '跨越午夜会算错吗？',
      a: '不会。例如 23:00 加 3 小时会得到次日 02:00，并提示「跨到次日」，时间始终是正确的 24 小时制。',
    },
    {
      q: '支持小数小时吗？',
      a: '支持。小时数可填 0.5、1.25 等小数，例如 0.5 即 30 分钟。',
    },
    {
      q: '能往前推吗？',
      a: '能。填负数小时即可算出「几小时前是几点」，逻辑与往后推完全对称。',
    },
  ],
  related: ['time-duration', 'hms-add', 'fortnight-to-hours', 'date-calculator'],
});
