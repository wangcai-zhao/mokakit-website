import { defineTool } from '../types';

export default defineTool({
  id: 'cron-parser',
  name: 'Cron 表达式解读',
  tagline: '把 Cron 表达式翻译成人话',
  description:
    '免费在线 Cron 表达式解读工具，解析标准 5 段 Cron 表达式（分 时 日 月 周），将其含义翻译为中文可读描述，支持 * , - / 等常见语法，帮助快速确认定时任务何时触发。纯前端解析，立即显示结果。',
  keywords: ['Cron', '定时任务', '表达式', 'Crontab', '调度'],
  category: 'dev',
  tags: ['cron', '定时', 'dev', '解析', '调度'],
  icon: 'clock',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 4,
  faq: [
    {
      q: '支持哪种 Cron 格式？',
      a: '支持标准 5 段格式：分 时 日 月 周（如 0 9 * * 1-5 表示工作日 9 点）。暂不支持秒级（6 段）与 @daily 等宏定义，这类可先展开为 5 段再解析。',
    },
    {
      q: '解析结果准确吗？',
      a: '对常见语法（* 任意、, 列举、- 区间、/ 步长）解析可靠；复杂组合以可读描述为主，建议在正式上线前用调度系统实测一次执行时间。',
    },
  ],
});
