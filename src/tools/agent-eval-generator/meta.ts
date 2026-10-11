import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'agent-eval-generator',
  name: '智能体评测用例生成器',
  tagline: '给智能体出一套考题',
  description:
    '免费在线智能体评测用例生成器：填被测能力、边界场景与预期行为，批量生成结构化测试用例（输入 / 预期输出 / 评判点），用于回归评测你的智能体是否稳定，减少上线后「突然变傻」的发现成本，本地生成不上传。',
  keywords: ["智能体评测","Agent Eval","测试用例","回归测试","AI质检"],
  category: 'ai',
  tags: ["agent","评测","测试","质量","智能体"],
  icon: 'check',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 7,
  faq: [
    {
      q: '自动判分吗？',
      a: '不。本工具只产出「预期与评判点」，实际打分可由你或另一个评审模型完成。',
    },
    {
      q: '用例要多少条？',
      a: '核心场景 20–50 条即可覆盖主路径，边界场景越多越稳。',
    },
    {
      q: '会上传吗？',
      a: '不会，本地生成。',
    },
  ],
});
