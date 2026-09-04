import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'compound-interest',
  name: '复利计算器',
  tagline: '利滚利与定投复利',
  description:
    '免费在线复利计算器，输入本金、年化利率、期限与复利频次（年/月/日/季度），按 F = P(1+r/n)^(nt) 算出利滚利后的本息总额、总利息与年化单利对比，并支持每月定投的复利累积。适合规划存款、基金定投、理财收益测算与子女教育金，结果附带逐年明细表，本地即时计算。',
  keywords: ['复利计算器', '利滚利', '定投复利', '年化收益', '本息合计'],
  category: 'calc',
  tags: ['复利', '理财', '金融'],
  icon: 'trending-up',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '复利和单利有什么不同？',
      a: '单利只对本金计息，复利是「利滚利」——每一期的利息加入本金继续生息。期限越长、复利频次越高，两者差距越大。',
    },
    {
      q: '复利频次怎么选？',
      a: '年化利率相同时，计息越频繁（日复利 > 月复利 > 年复利）最终收益越高，因为利息更早进入下一轮计息。银行活期多为按日，理财多为按月或按年。',
    },
    {
      q: '每月定投的复利怎么算？',
      a: '每期投入的金额从投入当日起按剩余期限复利累积，各期本金的计息时间不同。工具会把每笔定投分别复利后加总，得到期末总额。',
    },
  ],
  related: ['deposit-interest', 'percentage-calculator', 'ratio-calculator'],
});
