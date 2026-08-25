import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'permutation-combination',
  name: '排列组合计算器',
  tagline: '排列数 P(n,k) 与组合数 C(n,k)',
  description:
    '免费在线排列组合计算器，输入总数 n 与选取数 k，自动计算排列数 P(n,k)、组合数 C(n,k) 以及阶乘 n!，并解释「是否考虑顺序」的差异。适合概率论、彩票组合数、抽签分组、算法复杂度估算，本地即时计算。',
  keywords: ['排列组合计算器', '排列数', '组合数', '阶乘', 'Cnk Pnk 怎么算'],
  category: 'calc',
  tags: ['排列组合', '概率', '数学'],
  icon: 'shuffle',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '排列和组合的区别是什么？',
      a: '排列 P(n,k) 考虑顺序（ABC 与 BAC 算两种），组合 C(n,k) 不考虑顺序（只关心选了哪 k 个）。关系：P(n,k) = C(n,k) × k!。',
    },
    {
      q: '阶乘 n! 是什么意思？',
      a: 'n! 表示从 1 乘到 n 的积，例如 5! = 120。规定 0! = 1。它是排列组合公式的基础：C(n,k) = n! ÷ (k! × (n−k)!)。',
    },
    {
      q: 'n 比 k 小会怎样？',
      a: '如果选取数 k 大于总数 n，则无法选取，排列数与组合数都为 0。工具会提示输入不合法。',
    },
  ],
  related: ['average-calculator', 'gcd-lcm', 'percentage-calculator'],
});
