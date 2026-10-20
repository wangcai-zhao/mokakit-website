import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'speed-convert',
  name: '速度换算',
  seoTitle: '速度换算 - km/h mph m/s 节 在线互转',
  tagline: 'km/h、mph、m/s、节 互转',
  description:
    '免费在线速度换算工具，支持公里每小时、英里每小时、米每秒与节（海里每小时）四种速度单位一键互转，适合出行、航海与运动场景，全部在浏览器本地计算。',
  keywords: ['速度换算', 'mph 转换', '节 换算', 'km/h', 'm/s'],
  category: 'convert',
  tags: ['换算', '速度', '单位'],
  icon: 'wind',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: '节是什么单位？',
      a: '节（knot）是航海与航空的速度单位，1 节约等于 1 海里每小时，约 1.852 公里每小时。',
    },
    {
      q: 'mph 和 km/h 怎么换算？',
      a: '1 英里 = 1.609344 公里，所以 1 mph ≈ 1.609 km/h，1 km/h ≈ 0.621 mph。',
    },
  ],
  related: ['fuel-efficiency', 'unit-convert', 'running-pace'],
});
