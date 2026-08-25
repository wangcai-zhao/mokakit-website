import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'gcd-lcm',
  name: '最大公约数与最小公倍数',
  tagline: 'GCD / LCM 一键求',
  description:
    '免费在线最大公约数（GCD）与最小公倍数（LCM）计算器，支持一次性输入两个或多个整数，自动用辗转相除法求出最大公约数，并据此算出最小公倍数。适合约分、通分、周期对齐、排课表等场景，本地即时计算。',
  keywords: ['最大公约数', '最小公倍数', 'GCD', 'LCM', '辗转相除法'],
  category: 'calc',
  tags: ['数论', '数学', '计算'],
  icon: 'binary',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '最大公约数和最小公倍数有什么关系？',
      a: '对两个数 a、b，有 a×b = GCD(a,b) × LCM(a,b)。知道了其中一个就能反推另一个，例如 LCM = a×b ÷ GCD。',
    },
    {
      q: '多个数的最大公约数怎么求？',
      a: '先求前两个数的 GCD，再把结果与第三个数求 GCD，依次递推。最小公倍数同理，每次用前一步的 LCM 与下一个数求 LCM。',
    },
    {
      q: '公约数为 1 说明什么？',
      a: '若一组数的最大公约数是 1，称它们「互质」（互素），例如 8 和 15。互质的数在分数化简、密码学里很常见。',
    },
  ],
  related: ['fraction-calculator', 'prime-factorization', 'roman-numeral'],
});
