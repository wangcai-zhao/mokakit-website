import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'cagr-calculator',
  name: '复合年增长率',
  seoTitle: '复合年增长率 CAGR 计算器 - 在线算年化增速',
  tagline: '算期初到期末的年化增长率',
  description:
    '免费在线复合年增长率（CAGR）计算器，输入期初值、期末值与年数，一键算出年化增长率与投资倍数，适合评估投资、营收与用户增长的长期表现，全部在浏览器本地计算。',
  keywords: ['CAGR', '复合年增长率', '年化增长率', '增长率计算', '投资回报'],
  category: 'calc',
  tags: ['计算', '金融', '增长'],
  icon: 'percent',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 7,
  faq: [
    {
      q: 'CAGR 和年均增长率有什么不同？',
      a: 'CAGR 假设增长平滑复利，只看首尾两点的几何平均，抹平了中间的波动；它衡量的是「如果每年均匀增长」的等效速率，而非某一年真实增速。',
    },
    {
      q: '年数可以不是整数吗？',
      a: '可以。例如持有时长 2.5 年也能算，工具会按小数年数求几何平均，给出等效年化增长率。',
    },
  ],
  related: ['annualized-return', 'rule-of-72', 'inflation-calculator'],
});
