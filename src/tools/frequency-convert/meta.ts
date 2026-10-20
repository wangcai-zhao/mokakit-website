import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'frequency-convert',
  name: '频率换算',
  seoTitle: '频率换算 - Hz kHz MHz GHz 在线互转',
  tagline: 'Hz、kHz、MHz、GHz 互转',
  description:
    '免费在线频率换算工具，支持赫兹、千赫、兆赫、吉赫四种频率单位一键互转，适合电子、音频与无线场景，结果实时显示，全部在浏览器本地计算。',
  keywords: ['频率换算', 'Hz 转换', 'MHz', 'GHz', '赫兹'],
  category: 'convert',
  tags: ['换算', '频率', '单位'],
  icon: 'waves',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: 'kHz、MHz、GHz 之间差多少？',
      a: '相邻单位相差 1000 倍：1 GHz = 1000 MHz = 1,000,000 kHz = 1,000,000,000 Hz。',
    },
    {
      q: '赫兹和周期有什么关系？',
      a: '频率是每秒的周期数，单位为赫兹（Hz）。例如 50 Hz 表示每秒 50 个周期，周期时长就是 1/50 秒。',
    },
  ],
  related: ['unit-convert', 'data-rate-convert', 'scientific-notation'],
});
