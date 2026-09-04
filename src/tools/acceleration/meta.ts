import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'acceleration',
  name: '加速度换算',
  tagline: 'm/s²、g、ft/s²、Gal 等加速度单位在线互转',
  description:
    '免费在线加速度单位换算工具，覆盖米每二次方秒（m/s²）、标准重力加速度（g）、英尺每二次方秒（ft/s²）、伽（Gal）等常用单位。适合物理学习、汽车加速测试（0-100km/h）、地震学测量与航空工程，输入即时换算，全部本地计算。',
  keywords: ['加速度换算', 'm/s2 g', '重力加速度', 'ft/s2', 'Gal', '汽车加速'],
  category: 'convert',
  tags: ['加速度', '换算'],
  icon: 'rocket',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert'],
  faq: [
    {
      q: '加速度单位怎么换算？',
      a: '以 m/s² 为基准：1 g（标准重力加速度）≈ 9.80665 m/s²；1 ft/s² ≈ 0.3048 m/s²；1 Gal = 0.01 m/s²（1 cm/s²）。',
    },
    {
      q: 'g 到底是多少？',
      a: '标准重力加速度 g ≈ 9.80665 m/s²。日常说"承受 3g"就是约 29.4 m/s² 的加速度，过山车、战斗机机动可达数 g 到十几 g。',
    },
    {
      q: '汽车 0–100km/h 加速几秒对应多少 m/s²？',
      a: '100 km/h = 27.78 m/s。3.6 秒破百 ≈ 7.72 m/s²，5 秒 ≈ 5.56 m/s²，7 秒 ≈ 3.97 m/s²。加速越快数值越大。',
    },
    {
      q: 'Gal 是什么单位？',
      a: '伽（Gal）是厘米·克·秒制加速度单位，1 Gal = 1 cm/s² = 0.01 m/s²，用于地震学与重力测量（毫伽 mGal 更常用）。',
    },
  ],
});
