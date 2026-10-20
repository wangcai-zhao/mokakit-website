import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'annuity-calculator',
  name: '年金计算',
  seoTitle: '年金计算器 - 在线算定期定额的未来值与现值',
  tagline: '普通年金未来值/现值计算',
  description:
    '免费在线年金计算器，输入每期投入金额、期数与每期利率，一键算出普通年金的未来值与现值，以及累计本金和利息，适合基金定投、养老金与储蓄规划，全部在浏览器本地计算。',
  keywords: ['年金计算', '基金定投', '未来值', '现值', '定投收益'],
  category: 'calc',
  tags: ['计算', '金融', '储蓄'],
  icon: 'piggy-bank',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 7,
  faq: [
    {
      q: '未来值和现值分别是什么？',
      a: '未来值是按固定周期投入、到期末连本带利的总额；现值是把这些未来现金流按利率折现到今天的价值，用来判断定投是否划算。',
    },
    {
      q: '这里的年金是期初还是期末付？',
      a: '本工具采用最常见的普通年金（期末收付）公式；期初年金的终值会再乘 (1+r)，如需可在结果上手动微调。',
    },
  ],
  related: ['compound-interest', 'savings-goal-calculator', 'cagr-calculator'],
});
