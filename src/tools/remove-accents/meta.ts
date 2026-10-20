import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'remove-accents',
  name: '去变音符号',
  seoTitle: '去变音符号 - 在线去除重音与变音符',
  tagline: '去除拉丁字母的重音符号',
  description:
    '免费在线去变音符号工具，把 é、ü、ñ、ç 等带重音或变音的拉丁字母还原为 ASCII 基础字母，适合清洗文件名、生成 URL 友好文本与统一搜索词，全部在浏览器本地完成。',
  keywords: ['去变音符号', '去重音', 'normalize', '拉丁字母清洗', 'ASCII'],
  category: 'text',
  tags: ['文本', '清洗', '编码'],
  icon: 'type',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: '它会改变字母的含义吗？',
      a: '不会。它仅剥离附加在字母上的变音记号，例如 café 变成 cafe、naïve 变成 naive，字母本身保持不变。',
    },
    {
      q: '中文会受影响吗？',
      a: '不会。中文没有拉丁变音记号，原样保留；本工具只作用于带变音符的拉丁字符。',
    },
  ],
  related: ['jian-fan-convert', 'chinese-number', 'unicode-escape'],
});
