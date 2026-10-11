import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'prompt-optimizer',
  name: '提示词优化器',
  tagline: '把粗糙提示词改写得更好用',
  description:
    '免费在线提示词优化器：粘贴一段随手写的粗糙提示词，工具按角色明确、目标清晰、补充上下文、指定输出格式、加入示例等套路自动增强，并高亮本次补了哪些内容，帮你把「随便问问」变成「能稳定出活」的提示词，本地处理不上传。',
  keywords: ["提示词优化","Prompt优化","提示词改写","AI提效","Prompt工程"],
  category: 'ai',
  tags: ["ai","提示词","优化","prompt-engineering","大模型"],
  icon: 'wand',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 9,
  faq: [
    {
      q: '优化是调用大模型吗？',
      a: '不是。本工具用规则化的提示词工程套路在本地改写，不调用任何大模型 API，也不上传你的内容。',
    },
    {
      q: '优化后一定更好吗？',
      a: '套路能补齐常见缺失，但业务细节仍靠你判断。建议把优化结果当草稿，再按实际效果微调。',
    },
    {
      q: '支持中文提示词吗？',
      a: '支持。中英文提示词都能优化。',
    },
  ],
});
