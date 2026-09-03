import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'illuminance',
  name: '照度换算',
  tagline: 'lux、foot-candle、phot 等光照度单位在线互转',
  description:
    '免费在线照度（光照度）单位换算工具，覆盖勒克斯（lux）、英尺烛光（foot-candle）、 phot、流明每平方米（lm/m²）等常用单位。用于灯光设计、摄影布光、阅读照明评估，全部本地计算。',
  keywords: ['照度换算', 'lux 英尺烛光', '勒克斯', 'foot-candle', '光照度', '照明单位'],
  category: 'convert',
  tags: ['照度', '照明', '换算'],
  icon: 'lightbulb',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert'],
  faq: [
    {
      q: 'lux 和 foot-candle 怎么换算？',
      a: '1 foot-candle（fc）≈ 10.764 lux；1 lux = 1 流明/平方米（lm/m²）。美标照明常用 fc，国际标准用 lux。',
    },
    {
      q: '家里照明多少 lux 合适？',
      a: '一般走廊 50–100 lux，客厅 100–300 lux，阅读/书桌 300–500 lux，办公室约 500 lux，精细作业可达 750–1000 lux。太暗易疲劳，太亮刺眼。',
    },
    {
      q: 'phot 是什么单位？',
      a: 'phot 是厘米·克·秒制照度单位，1 phot = 10,000 lux。日常几乎只用 lux，phot 多见于老资料或专业光学文献。',
    },
    {
      q: '手机/相机测光显示的是什么？',
      a: '多为 lux（环境光传感器）或 EV（曝光值）。相机自动曝光依据的是被摄面照度，本工具可把不同照度单位统一成 lux 方便理解。',
    },
  ],
});
