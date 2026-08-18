import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'analog-clock',
  name: '模拟时钟',
  tagline: '经典指针表盘',
  description:
    '免费在线模拟时钟，传统指针表盘平滑走动，提供 8 种精美主题。时针、分针、秒针实时同步设备时间，适合喜欢经典钟表设计、追求视觉美感的你，也可一键全屏当装饰钟。纯浏览器本地运行，打开即用。',
  keywords: ['模拟时钟', '在线时钟', '指针时钟', '传统时钟', '表盘时钟'],
  category: 'clock',
  tags: ['时钟', '模拟'],
  icon: 'clock',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-14',
  updatedAt: '2026-08-14',
  priority: 8,
  faq: [
    {
      q: '模拟时钟的指针走时是连续的吗？',
      a: '秒针每秒跳动一格，分针与时针随分钟连续微调角度，整体呈现真实钟表的走动观感。若需要更顺滑的扫秒效果，可后续版本加入。',
    },
    {
      q: '为什么表盘时间和我手机差几秒？',
      a: '本工具读取设备系统时间，与手机的差异通常来自两台设备各自的校时误差，并非工具问题。保持设备开启自动校时即可基本一致。',
    },
    {
      q: '可以切换主题吗？',
      a: '可以，内置经典黑、极简白、蓝调、玫瑰金、森林绿、紫罗兰、青瓷、摩卡共 8 种主题，点击下拉框即可更换表盘配色。',
    },
  ],
  related: ['digital-clock', 'flip-clock', 'world-clock'],
});
