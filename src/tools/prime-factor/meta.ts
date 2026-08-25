import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'prime-factor',
  name: '质因数分解',
  tagline: '分解质因数并判定素数',
  description:
    '免费在线质因数分解工具，输入一个正整数，自动分解为质数连乘积并判定是素数还是合数，结果形如 360 = 2³ × 3² × 5。基于算术基本定理，适合数学作业、竞赛与密码学入门。全部本地计算。',
  keywords: ['质因数分解', '素数判定', '质数分解', '合数', '算术基本定理'],
  category: 'calc',
  tags: ['质因数', '数学', '计算'],
  icon: 'factor',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '支持多大的数？',
      a: '本工具支持到约 1 万亿（10¹²）以内的整数，结果即时返回；更大的数因精度与耗时限制暂不支持。',
    },
    {
      q: '分解结果是唯一的吗？',
      a: '是的。算术基本定理保证质因数分解在不计顺序时唯一，例如 12 永远是 2² × 3。',
    },
    {
      q: '带指数的写法怎么读？',
      a: '2³ 表示 2×2×2，2² 表示 2×2。指数即该质因数出现的次数。',
    },
  ],
  related: ['gcd-lcm', 'permutation-combination', 'roman-numeral'],
});
