/**
 * 活动时间窗真源（Single Source of Truth）
 * ----------------------------------------------------------------------------
 * 为什么单独成文件：
 *   1. 纯静态站没有运行时，无法"到点自毁"。到期下线只能靠三重保障：
 *      ① 构建期判定 —— resolveCampaign() 过期即不渲染（本文件）；
 *      ② 闸门脚本 —— scripts/check-campaigns.mjs 对过期/临期活动报警，已挂进 check:all；
 *      ③ 迭代规范 —— 活动结束后 7 天内必须重新构建部署（见 docs/CAMPAIGN-POLICY.md）。
 *   2. 本文件不 import 任何东西（不碰 package.json、不碰 @/ 别名），
 *      因此 Node 侧脚本可以用 --experimental-strip-types 直接加载，不需要额外钩子。
 *   3. site.ts / 组件都只从这里取值，避免"开关在 site.ts、日期在别处"的分裂。
 *
 * 日期口径：YYYY-MM-DD，按**本地时区**取当天（不是 UTC），避免 UTC+8 凌晨判错一天。
 * 测试覆盖：设环境变量 CAMPAIGN_TODAY=2026-10-01 可模拟任意日期，无需改系统时间。
 */

/** 一个有时限的运营活动 */
export interface CampaignWindow {
  /** kebab-case 唯一标识，脚本与日志用它定位 */
  id: string;
  /** 展示名，进报警信息 */
  name: string;
  /** 官方活动页；仅用于报警信息与组件跳转 */
  activityUrl?: string;
  /** 开始日（含）。留空 = 不限开始 */
  startAt?: string;
  /** 结束日（含）。null / 留空 = 长期有效（官方未公布截止） */
  endAt?: string | null;
  /**
   * 人工总开关，优先级最高。
   * - 提前下线、临时关闭：置 false
   * - 活动自然到期：不需要动它，构建期会自动判成 expired
   */
  active: boolean;
  /** 规则文案最后核对日期，用于月度复核 */
  rulesCheckedAt?: string;
  /** 结束前多少天开始"临期"提醒，默认 14 */
  warnDays?: number;
}

export type CampaignReason = 'active' | 'long-term' | 'not-started' | 'expired' | 'disabled';

export interface CampaignState {
  live: boolean;
  reason: CampaignReason;
  /** 人话解释，直接进日志/报警 */
  detail: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 本地时区的今天（YYYY-MM-DD）。UTC 的 toISOString 在东八区会差一天，不能用。 */
export function localToday(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** 可被 CAMPAIGN_TODAY 覆盖的"今天"，用于测试与 CI */
export function campaignToday(): string {
  const override = typeof process !== 'undefined' ? process.env?.CAMPAIGN_TODAY : undefined;
  return override && DATE_RE.test(override) ? override : localToday();
}

/** 两个 YYYY-MM-DD 之间相差的天数（b - a） */
export function daysBetween(a: string, b: string): number {
  const toUTC = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.round((toUTC(b) - toUTC(a)) / 86400000);
}

/**
 * 判定活动当前是否应当展示。
 * 顺序：人工关闭 > 未开始 > 已结束 > 有效。
 */
export function resolveCampaign(c: CampaignWindow, today: string = campaignToday()): CampaignState {
  if (!c.active) {
    return { live: false, reason: 'disabled', detail: `${c.id}：已被 active:false 手动关闭` };
  }
  if (c.startAt && today < c.startAt) {
    return { live: false, reason: 'not-started', detail: `${c.id}：${c.startAt} 才开始（今天 ${today}）` };
  }
  if (c.endAt && today > c.endAt) {
    return { live: false, reason: 'expired', detail: `${c.id}：已于 ${c.endAt} 结束（今天 ${today}），构建期自动下线` };
  }
  if (!c.endAt) {
    return { live: true, reason: 'long-term', detail: `${c.id}：长期有效（未设 endAt）` };
  }
  return { live: true, reason: 'active', detail: `${c.id}：有效至 ${c.endAt}` };
}

/** 距结束还有几天；无 endAt 返回 null */
export function daysLeft(c: CampaignWindow, today: string = campaignToday()): number | null {
  return c.endAt ? daysBetween(today, c.endAt) : null;
}

/**
 * 全部活动登记表。
 * 新增活动：在这里加一条，然后 site.ts 用 byId() 取，组件读派生出的 live 字段。
 */
export const CAMPAIGNS: readonly CampaignWindow[] = [
  {
    id: 'workbuddy-invite',
    name: 'WorkBuddy 邀请注册',
    activityUrl: 'https://www.workbuddy.cn/events/invite',
    startAt: '2026-01-01',
    // 官方未公布截止日期 → 长期有效。一旦公布，填 YYYY-MM-DD，到期即自动下线。
    endAt: null,
    active: true,
    rulesCheckedAt: '2026-09-01',
    warnDays: 14,
  },
  {
    id: 'workbuddy-teacher',
    name: 'WorkBuddy 教师普惠',
    activityUrl: 'https://www.workbuddy.cn/events/teacher-benefit/',
    startAt: '2026-09-01',
    // 2026 教师节活动，官方注释写明 09-30 结束。
    // 已确认结束 → active 置 false（保留记录与日期，明年复用只需改回 true + 改日期）。
    // 注意：即使这里忘了置 false，构建期也会因 endAt 过期而自动下线，双保险。
    endAt: '2026-09-30',
    active: false,
    rulesCheckedAt: '2026-11-03',
    warnDays: 14,
  },
] as const;

/** 按 id 取活动窗口；id 写错直接抛错，避免"静默没有活动" */
export function byId(id: string): CampaignWindow {
  const found = CAMPAIGNS.find((c) => c.id === id);
  if (!found) throw new Error(`未知活动 id：${id}，请先在 src/config/campaigns.ts 的 CAMPAIGNS 中登记`);
  return found;
}
