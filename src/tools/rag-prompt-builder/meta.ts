import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'rag-prompt-builder',
  name: 'RAG 提示词构建器',
  tagline: '拼装带引用的检索增强提示词',
  description:
    '免费在线 RAG 提示词构建器：填入角色、任务说明、引用格式与上下文占位符，一键拼出带 {context} 与 {question} 变量的检索增强生成（RAG）提示词模板，并支持「要求标注出处」开关，方便接进你自己的知识库问答，本地拼装不上传。',
  keywords: ["RAG","检索增强","提示词模板","知识库问答","Citation"],
  category: 'ai',
  tags: ["ai","rag","提示词","知识库","大模型"],
  icon: 'database',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 8,
  faq: [
    {
      q: '占位符怎么用？',
      a: '运行时把 {context} 替换成检索到的文本、{question} 替换成用户问题，再整体发给模型即可。',
    },
    {
      q: '能保证模型真引用吗？',
      a: '不能 100% 保证，但「必须标注出处」约束能显著提升引用率；强相关证据仍建议人工核对。',
    },
    {
      q: '和向量库有关吗？',
      a: '本工具只管提示词文本，检索与向量库由你现有管线负责。',
    },
  ],
});
