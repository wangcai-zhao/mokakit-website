import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'rate-limit-calculator',
  name: '限流参数计算器',
  seoTitle: '限流参数计算器 - 在线算令牌桶漏桶配置',
  tagline: '算令牌桶/漏桶容量与补充',
  description:
    '免费在线限流参数计算器，输入每秒速率与突发容量，给出令牌桶的桶容量、补充间隔与补充量，帮助后端与网关快速定参数，全部在浏览器本地计算。',
  keywords: ['限流计算', '令牌桶', '漏桶', '速率限制', 'API 限流'],
  category: 'dev',
  tags: ['开发', '网络', '限流'],
  icon: 'timer',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: '令牌桶和漏桶有什么区别？',
      a: '令牌桶允许一定程度的突发（桶内积攒的令牌），漏桶则强制恒定输出、平滑流量。本工具先给出令牌桶的常用参数，便于直接落地。',
    },
    {
      q: '补充间隔是怎么算的？',
      a: '用 1000 毫秒除以目标速率得到每次补充的毫秒间隔，保证长期平均速率等于设定值。',
    },
  ],
  related: ['timestamp-converter', 'cron-parser', 'json-formatter'],
});
