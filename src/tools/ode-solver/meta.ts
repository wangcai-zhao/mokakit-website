import { defineTool } from '@/tools/types';
import { EXAMPLES } from './examples';

export default defineTool({
  id: 'ode-solver',
  name: '微分方程求解器',
  tagline: '一阶常微分方程 RK4 数值解',
  description:
    '在线微分方程求解器，专解一阶常微分方程初值问题 dy/dx = f(x,y)。采用四阶龙格-库塔法（RK4）高精度数值积分，输入方程、初值与区间即可获得数值解曲线、采样数据表与 JSON，全程浏览器本地计算，不上传任何数据。',
  keywords: ['微分方程求解器', '常微分方程', 'RK4', '数值解', 'ODE'],
  category: 'calc',
  tags: ['微分方程', '数值计算', '数学'],
  icon: 'activity',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 7,
  faq: [
    {
      q: '什么是微分方程初值问题？',
      a: '给定一个方程 dy/dx = f(x, y) 和起点 (x₀, y₀)，求 y 随 x 变化的函数。初值条件 y(x₀)=y₀ 唯一确定了数值解的路径。',
    },
    {
      q: 'RK4 是什么？精度如何？',
      a: '四阶龙格-库塔法（Runge-Kutta），局部截断误差为 O(h⁵)，是工程与科研中最常用的高精度数值积分方法，比欧拉法稳定且精确得多。',
    },
    {
      q: '步长 h 应该怎么选？',
      a: '步长越小精度越高，但采样点越多、计算越慢。推荐 h 在 0.01~0.1 之间；若步数超过 2000 本工具会提示优化。解变化剧烈时可适当减小 h。',
    },
    {
      q: '为什么很多方程没有解析解？',
      a: '只有少数特殊形式（可分离变量、线性、恰当方程等）能写出闭式解。多数非线性方程没有解析解，数值解（如 RK4）是唯一可行的途径，也能画出解曲线直观观察。',
    },
  ],
  related: ['loan-calculator', 'percentage-calculator', 'bmi-calculator'],
  subpages: () =>
    EXAMPLES.map((e) => ({
      slug: e.id,
      title: `${e.name}：解 y' = ${e.equation}`,
      description: `在线求解${e.name}微分方程 y' = ${e.equation}，给定初值 y(${e.x0})=${e.y0}、区间 [${e.x0}, ${e.xEnd}]、步长 ${e.h}，获取 RK4 数值解曲线与采样数据表。`,
      data: {
        equation: e.equation,
        x0: String(e.x0),
        y0: String(e.y0),
        xEnd: String(e.xEnd),
        h: String(e.h),
        name: e.name,
      },
    })),
});
