import type { ToolMeta } from '@/tools/types';

export interface TimeGroup {
  id: string;
  title: string;
  icon: string;
  desc: string;
  toolIds: string[];
}

/**
 * 首页导航「时间日期」聚合页的分组配置。
 * 把散落在 clock / calc / life / dev 等分类下的时间、日期类工具收拢到一处。
 * toolIds 必须与 src/tools/<id>/meta.ts 的 id 一致（缺失会在页面构建时抛错）。
 */
export const TIME_GROUPS: TimeGroup[] = [
  {
    id: 'clock',
    title: '时钟',
    icon: 'clock',
    desc: '全屏数字、翻页、模拟与世界时钟，毫秒级精准，可一键沉浸显示。',
    toolIds: ['digital-clock', 'flip-clock', 'analog-clock', 'world-clock'],
  },
  {
    id: 'date',
    title: '日期计算',
    icon: 'calendar',
    desc: '算相差天数、算几小时后是几点、算年龄与孕期周数、算任意日期间隔。',
    toolIds: [
      'date-calculator',
      'days-between',
      'days-ago',
      'hours-from-now',
      'age-calculator',
      'calendar-quarter',
      '90-day',
      'min-age-birth',
      'time-duration',
      'hms-add',
      'hms-to-units',
      'seconds-to-time',
      'fortnight-to-hours',
      'weekly-hours',
    ],
  },
  {
    id: 'tz',
    title: '时区换算',
    icon: 'globe',
    desc: 'UTC 与中国标准时间、美东、美西、EDT 等主流时区一键互转。',
    toolIds: ['utc-to-cst', 'utc-to-est', 'utc-to-pst', 'utc-to-edt'],
  },
  {
    id: 'countdown',
    title: '计时 · 倒数',
    icon: 'timer',
    desc: '正计时倒数、事件倒计时，聚会提醒、活动节点都好用。',
    toolIds: ['countdown-timer', 'gov-shutdown-countdown'],
  },
  {
    id: 'stamp',
    title: '时间戳 & 表达式',
    icon: 'hash',
    desc: 'Unix 时间戳与人类可读时间互转，Cron 表达式一秒读懂。',
    toolIds: ['timestamp-converter', 'cron-parser'],
  },
  {
    id: 'today',
    title: '今天',
    icon: 'sun',
    desc: '一眼看清今天几号、星期几。',
    toolIds: ['today-info'],
  },
];
