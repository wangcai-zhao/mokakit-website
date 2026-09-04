import { defineTool } from '../types';

export default defineTool({
  id: 'trigonometry',
  name: '三角函数计算器',
  tagline: '角度一输，六函数全出',
  description:
    '免费三角函数计算器，输入角度（度/弧度可切换），一键算出正弦 sin、余弦 cos、正切 tan，以及余切 cot、正割 sec、余割 csc 六种三角函数值，附反三角函数（arcsin/arccos/arctan）求角度。学三角函数、解三角形、验证手算结果都好用，结果支持弧度与角度切换，全程本地运算。',
  keywords: ['三角函数计算器', 'sin cos tan', '正弦余弦正切', '余切正割余割', '角度算三角函数'],
  category: 'calc',
  tags: ['三角函数', 'sin', 'cos', 'tan', '数学'],
  icon: 'function',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-01',
  updatedAt: '2026-09-01',
  priority: 6,
  faq: [
    {
      q: '输入的是角度还是弧度？',
      a: '本工具输入「角度（度）」，例如 30、45、60。工具内部自动转成弧度再计算。如果你手上是弧度值，先乘 180 ÷ π 转成度再填。',
    },
    {
      q: 'tan 90° 为什么算不出？',
      a: '因为 tan = sin ÷ cos，而 cos 90° = 0，除以 0 无意义（趋于无穷大）。所以 90°、270° 等位置 tan 不存在，工具会提示「不存在」而非报错。cot、sec、csc 在各自分母为 0 的点也同样不存在。',
    },
    {
      q: '六个函数有什么关系？',
      a: 'cot = 1/tan，sec = 1/cos，csc = 1/sin。记住一组（sin/cos/tan）就能推出另外三个。工具一次给全，省得手算倒数。',
    },
    {
      q: '结果精度够吗？',
      a: '用浏览器双精度浮点计算，日常学习和工程足够。像 sin 30° 会显示 0.5，sin 45° 显示约 0.7071。特殊角会有公认的精确值可对照。',
    },
  ],
});
