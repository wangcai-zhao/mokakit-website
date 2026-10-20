import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'coffee-ratio',
  name: '手冲咖啡粉水比',
  seoTitle: '手冲咖啡粉水比 - 在线算用水量或反推比例',
  tagline: '按粉水比算用水量或比例',
  description:
    '免费在线手冲咖啡粉水比工具，输入咖啡粉重量与粉水比例即可算出所需水量，也能反推已有粉水对应的比例，帮你稳定复刻一杯好咖啡，全部在浏览器本地计算。',
  keywords: ['咖啡粉水比', '手冲咖啡', '咖啡水量', '冲煮比例', '咖啡计算'],
  category: 'life',
  tags: ['生活', '咖啡', '比例'],
  icon: 'coffee',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: '常用的粉水比是多少？',
      a: '手冲常见比例在 1:15 到 1:18 之间，1:16 左右风味均衡；喜欢浓郁可降到 1:14，喜欢清爽可升到 1:17。',
    },
    {
      q: '这里的水量是总重量还是体积？',
      a: '咖啡密度接近水，本工具按 1 克 ≈ 1 毫升近似换算，给出的水量以毫升计，日常使用足够精确。',
    },
  ],
  related: ['unit-convert', 'percentage-calculator', 'ideal-weight'],
});
