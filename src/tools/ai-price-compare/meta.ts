import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'ai-price-compare',
  name: 'AI 价格比价',
  tagline: '主流大模型与视觉生成价格对比',
  description:
    '免费在线 AI 价格比价工具，汇总 OpenAI、Anthropic、Google、DeepSeek、通义千问、智谱、Kimi 等主流大模型的 API 单价（每百万 token 输入/输出价），以及即梦、可灵、Runway、Sora、Veo 等视觉生成工具的价格，支持按场景估算调用成本，数据本地对比、不上传，仅供参考。',
  keywords: ['AI价格', '大模型比价', 'API价格', '即梦价格', 'token价格', 'GPU成本'],
  category: 'ai',
  tags: ['ai', '价格', '比价', '大模型', '即梦'],
  icon: 'coins',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 8,
  faq: [
    {
      q: '价格是实时获取的吗？',
      a: '不是。价格为人工维护的参考快照（数据更新于 2026-08），大模型与视觉生成平台调价频繁，正式采购请以各厂商官网公示价为准。',
    },
    {
      q: '货币怎么看？',
      a: '国际大模型官方以美元（USD）计费，本工具按约 1 USD ≈ 7.2 CNY 折算出人民币参考价，仅作直观对比，实际以账单为准。',
    },
    {
      q: '为什么没有豆包/文心等的输出价？',
      a: '部分国产模型仅公开输入价或采用积分/会员制，输出价随档位浮动，为避免误导此处留空或标注「会员制」，建议以官方报价页核对。',
    },
  ],
});
