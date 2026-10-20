import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'depreciation-calculator',
  name: '资产折旧计算',
  seoTitle: '资产折旧计算器 - 直线法年数总和双倍余额递减',
  tagline: '直线/年数总和/双倍余额递减',
  description:
    '免费在线资产折旧计算器，支持直线法、年数总和法与双倍余额递减法三种常用折旧方式，输入原值、残值与使用年限即可生成逐年折旧表，适合财务与资产管理，全部在浏览器本地计算。',
  keywords: ['折旧计算', '直线折旧', '双倍余额递减', '年数总和法', '资产折旧'],
  category: 'calc',
  tags: ['计算', '财务', '折旧'],
  icon: 'scale',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 7,
  faq: [
    {
      q: '三种折旧方法有什么区别？',
      a: '直线法每年折旧相同；年数总和法前多后少；双倍余额递减法前期折旧更快、后期递减。企业按资产性质与税务规定选择。',
    },
    {
      q: '残值可以设为零吗？',
      a: '可以。残值为零表示资产使用寿命结束时无残值，折旧基数就是原值本身。',
    },
  ],
  related: ['profit-margin', 'break-even-calculator', 'roi-calculator'],
});
