import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'world-clock',
  name: '世界时钟',
  tagline: '多时区并列对照',
  description:
    '免费在线世界时钟，并列显示全球主要城市的当前时间，支持搜索添加、一键收藏与移除，自动标注 UTC 偏移与夏令时。一屏掌握多地时差，出差、跨国协作、看球赛必备。纯浏览器本地运行，打开即用，不上传任何数据。',
  keywords: ['世界时钟', '世界时间', '多时区时钟', '全球时间', '时区对照'],
  category: 'clock',
  tags: ['时钟', '时区'],
  icon: 'globe',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-14',
  updatedAt: '2026-08-14',
  priority: 9,
  faq: [
    {
      q: '为什么有的城市显示 UTC+5:30、UTC+9:30 这种半小时偏移？',
      a: '部分国家采用非整点时区（如印度 UTC+5:30、澳大利亚中部 UTC+9:30），这是当地的法定标准时间，本工具会如实显示，并非计算错误。',
    },
    {
      q: '夏令时会自动处理吗？',
      a: '会。本工具基于浏览器内置的 IANA 时区数据库，实行夏令时的城市（如纽约、伦敦）会随当地规则自动切换，偏移与时间都会随之变化，无需手动调整。',
    },
    {
      q: '可以添加自定义城市吗？',
      a: '目前内置 18 个全球主要城市。你可以通过搜索框从列表里追加到面板；如需更多城市，可在反馈页告诉我们，我们会持续补充。',
    },
  ],
  related: ['digital-clock', 'time-duration', 'today-info'],
});
