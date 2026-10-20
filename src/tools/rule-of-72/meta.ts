import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'rule-of-72',
  name: '72 法则',
  seoTitle: '72 法则计算器 - 在线估算本金翻倍年限',
  tagline: '估算本金翻倍所需年限',
  description:
    '免费在线 72 法则计算器，输入年化收益率即可快速估算本金翻倍所需年限，并给出基于对数的精确值对照，适合理财与复利直觉培养，全部在浏览器本地计算。',
  keywords: ['72 法则', '翻倍年限', '复利', '理财计算', '翻倍时间'],
  category: 'calc',
  tags: ['计算', '金融', '复利'],
  icon: 'calculator',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 7,
  faq: [
    {
      q: '72 法则是怎么算的？',
      a: '用 72 除以年化收益率百分数，得到的就是本金大致翻倍的年数。例如年化 8%，72 ÷ 8 = 9 年翻倍。',
    },
    {
      q: '为什么还要给精确值？',
      a: '72 是近似值，利率较高时误差会变大。精确值用 ln(2) ÷ ln(1+利率) 计算，本工具同时展示两者方便对比。',
    },
  ],
  related: ['cagr-calculator', 'compound-interest', 'inflation-calculator'],
});
