import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'power-root',
  name: '幂与根式计算器',
  tagline: 'a^b 与 n 次根',
  description:
    '免费在线幂与根式计算器，支持任意实数底数 a 的整数/小数指数幂 a^b（含负指数与分数指数），以及 n 次根式 ⁿ√a（平方根、立方根及任意次根），附运算过程展示。适合开方、复利指数、科学计算与数学作业自查，结果保留多位小数，全部本地计算。',
  keywords: ['幂计算器', '根式计算器', '开方', '平方根', '立方根', '指数运算'],
  category: 'calc',
  tags: ['幂', '数学', '计算'],
  icon: 'function',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '小数指数也能算吗？',
      a: '可以。例如 9^0.5 即 √9 = 3，工具按 a^b 直接计算。',
    },
    {
      q: '根次 n 能是小数吗？',
      a: '本工具根次 n 按整数设计；小数根可改写为指数形式（如 1/2 次根 = 平方根）后用幂模式计算。',
    },
    {
      q: '负数开根出现无效提示是怎么回事？',
      a: '负数开偶数次根（如平方根）在实数范围内无解，这是数学约定；负数开奇数次根（如 ³√-8）则有解。',
    },
  ],
  related: ['log-calculator', 'scientific-notation', 'fraction-calculator'],
});
