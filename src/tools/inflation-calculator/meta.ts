import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'inflation-calculator',
  name: '通货膨胀计算器',
  tagline: '算清钱随时间的购买力',
  description:
    '免费在线通货膨胀计算器，输入当前金额、年通胀率（CPI）与年数，一键算出这笔钱在若干年后的实际购买力，以及要保持同等购买力未来需要多少钱。按复利估算，帮你做储蓄、理财、退休金规划与子女教育金估算，支持正负通胀率，全部本地计算。',
  keywords: ['通货膨胀计算器', '通胀计算', '购买力', '复利贬值', 'CPI'],
  category: 'calc',
  tags: ['通胀', '理财', '计算'],
  icon: 'trending-down',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '为什么会有两个结果？',
      a: '“届时购买力”是今天的钱放 n 年后的真实价值（会缩水）；“需这么多才等价”是 n 年后要达到今天同等购买力所需的金额（会膨胀）。两者互为倒数关系。',
    },
    {
      q: '通胀率填多少合理？',
      a: '可参考国家统计局公布的 CPI 同比涨幅，长期多在 2%–3% 附近，但不同口径差异大，建议结合实际预期填写。',
    },
    {
      q: '这个能算投资收益吗？',
      a: '不能直接算。若想比较“投资收益率 vs 通胀”，可把收益率作为 r 反向思考，本工具仅衡量购买力贬值。',
    },
  ],
  related: ['compound-interest', 'provident-fund-calc', 'pension-estimate'],
});
