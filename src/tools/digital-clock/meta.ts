import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'digital-clock',
  name: '数字时钟',
  tagline: '全屏大字时间显示',
  description:
    '免费在线数字时钟，大字号清晰显示当前时间（精确到秒），支持多时区切换、12/24 小时制、多种主题（含暗黑/极简/赛博）与一键全屏，毫秒级实时同步。适合会议室、教室、家居大屏、直播间、电脑副屏，纯浏览器本地运行，打开即用，不上传任何数据。',
  keywords: ['数字时钟', '在线时钟', '全屏时钟', '电子时钟', '实时时间'],
  category: 'clock',
  tags: ['时钟', '时间'],
  icon: 'clock',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-14',
  updatedAt: '2026-08-14',
  priority: 9,
  faq: [
    {
      q: '数字时钟的时间准吗？',
      a: '时钟直接读取你设备的系统时间，精度取决于设备本身与网络校时。若设备时间不准，请在系统中开启自动校时（NTP）后再使用本工具。',
    },
    {
      q: '支持哪些时区？',
      a: '内置北京、香港、东京、新加坡、迪拜、伦敦、巴黎、纽约、洛杉矶、悉尼等全球主要城市，覆盖常用办公与出行场景，夏令时地区会随季节自动变化。',
    },
    {
      q: '全屏后怎么退出？',
      a: '按键盘 Esc 键，或再次点击「全屏 / 退出全屏」按钮即可退出全屏模式。',
    },
  ],
  related: ['world-clock', 'flip-clock', 'analog-clock'],
});
