import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'voltage',
  name: '电压单位换算',
  tagline: 'μV、mV、V、kV、MV 等电压单位在线互转',
  description:
    '免费在线电压单位换算工具，覆盖微伏（μV）、毫伏（mV）、伏特（V）、千伏（kV）、兆伏（MV）等常用单位，输入数值即时显示全部单位结果。适合电子电路设计、电工配线、电池电压估算、太阳能板与高压输电场景，附常见电压等级参考，全部本地计算。',
  keywords: ['电压换算', '毫伏千伏换算', 'μV mV V kV', '电压单位', '伏特'],
  category: 'convert',
  tags: ['电压', '电子', '换算'],
  icon: 'plug',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert', 'resistance', 'current'],
  faq: [
    {
      q: '电压单位怎么换算？',
      a: '以伏特（V）为基准：1 MV = 1,000,000 V，1 kV = 1000 V，1 V = 1000 mV = 1,000,000 μV。例如 5 V = 5000 mV，220 kV = 220,000 V。',
    },
    {
      q: '家用电压为什么是 220V，国外是 110V？',
      a: '这是供电标准差异。中国与欧洲多用 220–240V（线电压 380V），美国/日本部分用 100–120V。同样功率下电压低则电流大，对导线要求更高。出国带电器要看是否支持宽电压（如 100–240V）。',
    },
    {
      q: 'mV 和 μV 常见于哪里？',
      a: '小信号测量：麦克风、传感器、生物电（心电图 mV 级、脑电 μV 级）、热电偶（mV 级）。大信号或电网才用 V/kV。',
    },
    {
      q: 'kV 和 MV 用在什么地方？',
      a: 'kV 用于配电（10kV/35kV）、输电（110kV–1000kV）；MV 级只在特高压或科研（如粒子加速器）出现，日常几乎碰不到。',
    },
  ],
});
