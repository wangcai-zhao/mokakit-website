import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'scientific-notation',
  name: '科学计数法转换',
  tagline: '普通数字与科学计数法互转',
  description:
    '免费在线科学计数法转换器，支持普通十进制数字与科学计数法（a×10ⁿ）双向转换，自动格式化系数（保留有效数字）与指数，并给出工程计数法（指数为 3 的倍数：k/M/G）。适合物理、化学、天文的大数与小数表达，以及计算机存储容量（KB/MB/GB）换算，本地即时换算。',
  keywords: ['科学计数法', '科学计数法转换', '工程计数法', '指数表示', '大数小数表示'],
  category: 'calc',
  tags: ['科学计数法', '数学', '换算'],
  icon: 'function-square',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '科学计数法的标准格式是什么？',
      a: '写成 a×10ⁿ，其中 1 ≤ |a| < 10，n 为整数。例如 123000 = 1.23×10⁵，0.00045 = 4.5×10⁻⁴。',
    },
    {
      q: '科学计数法和工程计数法有什么不同？',
      a: '工程计数法要求指数必须是 3 的倍数（…−6、−3、0、3、6…），系数范围放宽到 1–1000，便于和千、百万、十亿等单位对应。',
    },
    {
      q: '负指数代表什么？',
      a: '负指数表示很小的数。10⁻³ 即 0.001，所以 5×10⁻³ = 0.005。指数绝对值越大，数值越接近 0。',
    },
  ],
  related: ['roman-numeral', 'base-converter', 'rounding-calculator'],
});
