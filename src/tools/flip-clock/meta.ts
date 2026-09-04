import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'flip-clock',
  name: '翻页时钟',
  tagline: '经典翻牌动画时钟',
  description:
    '免费在线翻页时钟，还原经典机械翻牌动画（带滴答声可选），每秒翻动数字，怀旧又吸睛。支持 12/24 小时制、多套主题（极简/复古/霓虹）与一键全屏，适合直播背景、大屏展示、桌面常驻或会议倒计时。纯浏览器本地运行，打开即用，不上传任何数据。',
  keywords: ['翻页时钟', '翻牌时钟', '在线翻页时钟', 'flip clock', '复古时钟'],
  category: 'clock',
  tags: ['时钟', '翻页'],
  icon: 'timer',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-14',
  updatedAt: '2026-08-14',
  priority: 10,
  faq: [
    {
      q: '翻页动画流畅吗？会卡顿吗？',
      a: '本工具用纯 CSS 3D 变换实现翻牌动画，浏览器硬件加速，正常情况下稳定 60fps，几乎不占用系统资源，可长期常驻桌面或投放大屏。',
    },
    {
      q: '为什么有时候翻动后数字「跳」了一下？',
      a: '翻页时钟每秒翻动一次来显示新的秒数，这是翻牌机制的固有表现，并非故障。若你想看连续平滑走时，可改用数字时钟或模拟时钟。',
    },
    {
      q: '可以常驻在屏幕上当装饰吗？',
      a: '可以。点击「全屏」后它就是一个纯净的翻页时钟，适合直播背景、会议室或卧室大屏；按 Esc 退出全屏。',
    },
  ],
  related: ['digital-clock', 'analog-clock', 'world-clock'],
});
