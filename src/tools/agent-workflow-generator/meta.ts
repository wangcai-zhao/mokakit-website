import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'agent-workflow-generator',
  name: '智能体工作流生成器',
  tagline: '把步骤画成可跑的流程',
  description:
    '免费在线智能体工作流生成器：逐行添加步骤（名称、类型：模型 / 工具 / 条件分支、说明），一键生成结构化工作流 JSON 与可读的流程描述，便于直接落进 n8n / Dify / LangGraph 等编排框架，本地生成不上传。',
  keywords: ["智能体工作流","Workflow","Agent编排","n8n","Dify"],
  category: 'ai',
  tags: ["agent","工作流","编排","自动化","智能体"],
  icon: 'git-branch',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 8,
  faq: [
    {
      q: '生成的 JSON 能直接运行吗？',
      a: '它是与框架无关的结构化描述，需映射到具体框架的节点格式；本工具给出的是清晰骨架，省去从零设计。',
    },
    {
      q: '支持循环吗？',
      a: '当前以线性 + 条件分支为主，复杂循环建议在框架里再细化。',
    },
    {
      q: '会上传吗？',
      a: '不会，本地生成。',
    },
  ],
});
