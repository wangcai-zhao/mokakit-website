import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'context-window-calculator',
  name: '上下文窗口计算器',
  tagline: '算清一次对话能吃多少 token',
  description:
    '免费在线上下文窗口计算器：选模型、填每轮输入 / 输出 token 与系统提示词长度，估算一轮对话能撑多少轮不超窗口、以及达到上限时的截断风险，内置主流大模型上下文长度对照，帮你为长对话与批量任务定预算，本地计算不上传。',
  keywords: ["上下文窗口","Context Window","Token计算","大模型长度","对话预算"],
  category: 'ai',
  tags: ["ai","token","上下文","大模型","成本"],
  icon: 'ruler',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 7,
  faq: [
    {
      q: 'token 数怎么估？',
      a: '中文约 1.5–2 字 / token、英文约 4 字符 / token 为粗略参考；精确值以各模型 tokenizer 为准。',
    },
    {
      q: '窗口越长越好吗？',
      a: '更长窗口能装更多历史，但长上下文推理更慢更贵，按任务实际需要选即可。',
    },
    {
      q: '数据更新频率？',
      a: '模型上下文长度为人工维护快照，新模型上线请以厂商文档为准。',
    },
  ],
});
