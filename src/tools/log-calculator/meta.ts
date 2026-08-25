import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'log-calculator',
  name: '对数计算器',
  tagline: '任意底数的对数',
  description:
    '免费在线对数计算器，支持以任意实数 a 为底计算 log_a(b)，同时给出自然对数 ln(b) 与常用对数 lg(b)。基于换底公式，适用于数学作业、工程计算、信息论与算法复杂度分析。全部本地计算。',
  keywords: ['对数计算器', 'log计算', '自然对数', '常用对数', '换底公式'],
  category: 'calc',
  tags: ['对数', '数学', '计算'],
  icon: 'function',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '常用对数和自然对数有什么区别？',
      a: '常用对数以 10 为底（lg），自然对数以 e≈2.718 为底（ln）。本工具两者都给，底数可任意填。',
    },
    {
      q: 'ln(b) 和 log_a(b) 怎么互相换算？',
      a: 'log_a(b) = ln(b) / ln(a)，这就是换底公式，工具内部正是用它在算。',
    },
    {
      q: '真数能是 0 或负数吗？',
      a: '在实数范围内不能。ln(0)、log(-5) 均无定义，工具会提示错误。',
    },
  ],
  related: ['power-root', 'scientific-notation', 'permutation-combination'],
});
