import { defineTool } from '../types';

export default defineTool({
  id: 'token-counter',
  name: 'Token 计算器',
  tagline: '估算 GPT/Claude 等模型的 token 数量',
  description:
    '免费在线 Token 计算器，可切换 cl100k_base / o200k_base / p50k_base / r50k_base 编码，对应 GPT-4o、4o-mini、3.5-Instruct、GPT-3 等不同模型；实时统计 token 数、字符数、中文字符、英文词、标点与行数，并按单价估算调用花费，所有分词在浏览器本地完成，不上传文本。',
  keywords: ['Token计算器', 'token估算', 'GPT字数', '大模型分词', '提示词字数', '多模型', '价格估算'],
  category: 'ai',
  tags: ['token', 'ai', '大模型', '分词', '提示词'],
  icon: 'hash',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: '算出来的 token 数和官方一致吗？',
      a: '本工具采用 cl100k_base（GPT-3.5/4/4o 通用分词器），对英文与代码还原度高；中文按子词切分，结果与实际计费口径非常接近，适合估算，精确账单以厂商为准。',
    },
    {
      q: '我的文本会被上传吗？',
      a: '不会。分词完全在浏览器本地进行，文本不上传任何服务器，可放心粘贴含敏感内容的文本。',
    },
  ],
});
