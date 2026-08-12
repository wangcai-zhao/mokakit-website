/**
 * 微分方程求解器 · 示例方程库
 *
 * 同一份数据同时被两处消费：
 *   - Tool.tsx 的「常用方程示例库」一键填充按钮
 *   - meta.ts 的 subpages() 生成长尾子页（每个示例一个独立静态页）
 */

export interface OdeExample {
  id: string;
  name: string;
  equation: string;
  x0: number;
  y0: number;
  xEnd: number;
  h: number;
  desc: string;
}

export const EXAMPLES: OdeExample[] = [
  {
    id: 'linear-decay',
    name: '线性衰减',
    equation: '-2*y + x',
    x0: 0,
    y0: 1,
    xEnd: 2,
    h: 0.05,
    desc: '受迫线性衰减，常见于一阶 RC 电路、冷却模型',
  },
  {
    id: 'logistic-growth',
    name: '逻辑斯蒂增长',
    equation: 'y*(1 - y)',
    x0: 0,
    y0: 0.1,
    xEnd: 10,
    h: 0.1,
    desc: '种群增长的 S 形曲线，饱和值为 1',
  },
  {
    id: 'forced-vibration',
    name: '强迫振动',
    equation: 'sin(x) - y',
    x0: 0,
    y0: 0,
    xEnd: 10,
    h: 0.1,
    desc: '阻尼受迫振子，常用于振动与电路响应分析',
  },
  {
    id: 'parabolic',
    name: '抛物线型',
    equation: 'x*x - y',
    x0: 0,
    y0: 1,
    xEnd: 5,
    h: 0.1,
    desc: '右端含 x² 的非齐次一阶方程',
  },
  {
    id: 'exp-driven',
    name: '指数驱动',
    equation: 'exp(-x) - 2*y',
    x0: 0,
    y0: 1,
    xEnd: 3,
    h: 0.05,
    desc: '指数衰减驱动的一阶方程',
  },
  {
    id: 'product',
    name: '乘积型',
    equation: 'x*y',
    x0: 1,
    y0: 1,
    xEnd: 3,
    h: 0.05,
    desc: 'y 与 x 成正比，解析解为指数型',
  },
];
