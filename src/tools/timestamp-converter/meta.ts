import { defineTool } from '../types';

export default defineTool({
  id: 'timestamp-converter',
  name: '时间戳转换',
  tagline: 'Unix 时间戳与日期互转',
  description:
    '免费在线时间戳转换工具，支持 Unix 时间戳（秒/毫秒/微秒）与日期时间互转，可同时显示本地时间、UTC、北京时间三种时区，一键复制结果。常用于接口调试、日志分析、数据库时间字段核对、分布式系统对时，结果即时刷新。',
  keywords: ['时间戳转换', 'unix时间戳', '时间戳在线转换', '时间戳转日期', '在线时间戳工具'],
  category: 'dev',
  tags: ['时间戳', '时间', '转换', '开发'],
  icon: 'clock',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 8,
  faq: [
    {
      q: '什么是 Unix 时间戳？',
      a: 'Unix 时间戳（又称 Epoch 时间）是从 1970 年 1 月 1 日 00:00:00 UTC 起经过的秒数（或毫秒数）。它是一个与时区无关的整数，因此常被用于跨时区系统之间传递时间，避免时区换算的麻烦。',
    },
    {
      q: '秒和毫秒有什么区别？',
      a: '多数系统（如 Linux、MySQL 的 UNIX_TIMESTAMP）使用秒级时间戳（10 位），而 JavaScript 的 Date.now() 返回毫秒级（13 位）。本工具可在两种单位间切换，转换时请先确认你的数据用的是哪一种。',
    },
    {
      q: '为什么同样的数字在不同时区显示的日期不一样？',
      a: '时间戳本身不含时区信息，它代表的是绝对时刻。同一时间戳在不同时区会被显示成本地时间——例如北京时间比 UTC 早 8 小时。本工具同时给出本地时间和 UTC，方便你核对。',
    },
  ],
});
