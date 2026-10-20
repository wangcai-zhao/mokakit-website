import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'angle-convert',
  name: '角度换算',
  seoTitle: '角度换算 - 度弧度梯度度分秒在线互转',
  tagline: '度、弧度、梯度、度分秒互转',
  description:
    '免费在线角度换算工具，支持角度、弧度、梯度与度分秒四种单位一键互转，适合数学、工程与导航场景，结果实时显示，全部在浏览器本地计算。',
  keywords: ['角度换算', '弧度转换', '度分秒', '梯度', '角度单位'],
  category: 'convert',
  tags: ['换算', '角度', '数学'],
  icon: 'triangle',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: '弧度和角度怎么换算？',
      a: '180 度等于 π 弧度，因此 1 度 = π/180 弧度，1 弧度 ≈ 57.2958 度。本工具直接给出精确换算值。',
    },
    {
      q: '梯度是什么单位？',
      a: '梯度（grad）把直角分成 100 份，360 度对应 400 梯度，常见于测量与炮术，1 梯度 = 0.9 度。',
    },
  ],
  related: ['trigonometry', 'unit-convert', 'temperature-convert'],
});
