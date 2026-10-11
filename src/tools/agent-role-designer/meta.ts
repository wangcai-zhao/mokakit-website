import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'agent-role-designer',
  name: '智能体角色设定生成器',
  tagline: '写清一个智能体该是谁',
  description:
    '免费在线智能体角色设定生成器：填名称、领域、性格、目标、边界与可用工具，一键产出结构化的智能体角色卡（Persona），可直接用作系统提示词或产品文档，让多智能体协作时每个成员「人设」清晰、不串戏，本地生成不上传。',
  keywords: ["智能体角色","Agent Persona","角色设定","多智能体","系统提示词"],
  category: 'ai',
  tags: ["agent","角色","persona","多智能体","智能体"],
  icon: 'users',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 8,
  faq: [
    {
      q: '和多智能体框架什么关系？',
      a: '本工具产出「角色定义」，你再把它粘进 CrewAI / AutoGen / MetaGPT 等框架的 agent 配置里。',
    },
    {
      q: '边界真的能限制模型吗？',
      a: '边界是软约束，靠提示词生效；关键权限仍要在工具层做硬隔离。',
    },
    {
      q: '会保存吗？',
      a: '不会，本地生成。',
    },
  ],
});
