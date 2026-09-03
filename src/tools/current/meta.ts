import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'current',
  name: '电流单位换算',
  tagline: 'μA、mA、A、kA 等电流单位在线互转',
  description:
    '免费在线电流单位换算工具，覆盖微安（μA）、毫安（mA）、安培（A）、千安（kA）等常用单位。输入数值即时显示全部单位结果，适合电子、电工与供电场景，全部本地计算。',
  keywords: ['电流换算', '微安毫安安培', 'μA mA A kA', '电流单位'],
  category: 'convert',
  tags: ['电流', '电子', '换算'],
  icon: 'zap',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert', 'voltage', 'resistance'],
  faq: [
    {
      q: '电流单位之间怎么换算？',
      a: '以安培（A）为基准：1 kA = 1000 A，1 A = 1000 mA = 1,000,000 μA。例如 2 A = 2000 mA，0.5 A = 500 mA。',
    },
    {
      q: 'mA 和 A 分别用在哪？',
      a: '手机电池、LED、小电路常用 mA（如 3000 mAh 电池放电 1A=1000mA）；家电用 A（电水壶约 10A）；电网/开关用 kA 级短路电流。',
    },
    {
      q: 'μA 用在什么地方？',
      a: '低功耗芯片休眠电流、传感器待机电流常在 nA–μA 级，例如一颗纽扣电池供电的传感器可能只耗 5–10 μA。',
    },
    {
      q: '充电头标 2A 和 2000mA 是一回事吗？',
      a: '是，2 A = 2000 mA。快充头会标 5A/5000mA 甚至 10A。注意线材也要支持对应电流，否则会限流发热。',
    },
  ],
});
