import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'ai-model-selector',
  name: '场景选模型助手',
  tagline: '按任务挑最合适的大模型',
  description:
    '免费在线场景选模型助手：选使用场景（写代码、长文档、中文、省钱、多模态、推理），从内置主流大模型对照表中过滤并给出推荐理由，帮你在新模型层出不穷时快速做选型，数据本地对照不上传。',
  keywords: ["模型推荐","大模型选型","AI模型对比","LLM选择","模型评测"],
  category: 'ai',
  tags: ["ai","模型","选型","大模型","对比"],
  icon: 'git-compare',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 7,
  faq: [
    {
      q: '推荐准吗？',
      a: '基于公开能力与定位做规则匹配，属起点参考；最终以你实际压测为准。',
    },
    {
      q: '价格怎么看？',
      a: '价格随厂商变动频繁，对照表为参考快照，采购以官网公示价为准。',
    },
    {
      q: '会更新新模型吗？',
      a: '对照表为人工维护，新模型上线后会补充。',
    },
  ],
});
