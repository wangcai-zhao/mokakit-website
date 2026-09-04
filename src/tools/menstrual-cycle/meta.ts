import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'menstrual-cycle',
  name: '月经周期与排卵期',
  tagline: '推算排卵日与易孕窗口',
  description:
    '免费在线月经周期计算器，输入末次月经第一天、周期长度与经期长度，推算下次月经日期、排卵日与易孕窗口（排卵前 5 天到排卵后 1 天共 6 天）。基于「下次月经 − 14 天 = 排卵日」医学规则，适合备孕规划、避孕参考与周期记录，附黄体期/卵泡期说明，全部本地计算。',
  keywords: ['月经周期计算', '排卵期计算', '易孕窗口', '备孕', '排卵日'],
  category: 'life',
  tags: ['月经', '排卵期', '健康'],
  icon: 'calendar-heart',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '为什么是“减 14 天”而不是加？',
      a: '因为排卵到月经的黄体期较固定（约 14 天），所以从下次月经往回推最稳；从本次月经往后加会因卵泡期波动而不准。',
    },
    {
      q: '易孕窗口为什么是 5 天？',
      a: '卵子存活约 1 天，但精子可在体内存活约 3–5 天，所以排卵日前后的几天都可能有受孕机会。',
    },
    {
      q: '结果能用于避孕吗？',
      a: '本工具为粗略估算，不能替代可靠避孕方法；如需避孕或备孕，请结合专业医疗建议。',
    },
  ],
  related: ['bmi-calculator', 'age-calculator', 'weeks-pregnant'],
});
