import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'agent-name-generator',
  name: '智能体命名生成器',
  tagline: '给智能体起个好名字',
  description:
    '免费在线智能体命名生成器：填关键词与风格（科技感 / 可爱 / 专业 / 极简），从词库随机组合出一批候选名，并标注可注册性提示，帮你给新搭的智能体、Bot、技能快速定名，本地生成不上传。',
  keywords: ["智能体命名","AI起名","Bot名字","产品起名","名称生成"],
  category: 'ai',
  tags: ["agent","命名","起名","智能体","创意"],
  icon: 'tag',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 6,
  faq: [
    {
      q: '名字会重复吗？',
      a: '组合来自内置词库，可能与现有产品重名，正式使用前请自行检索商标 / 域名。',
    },
    {
      q: '能指定语言吗？',
      a: '支持中英文混合风格，可在关键词里控制。',
    },
    {
      q: '生成随机还是固定？',
      a: '每次点生成重新随机组合，多试几次挑到满意的。',
    },
  ],
});
