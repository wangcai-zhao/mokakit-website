// 纯 TS 日期运算工具，零依赖，供所有时间/日期工具复用。

export const WEEK_LABEL = ['日', '一', '二', '三', '四', '五', '六'];

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Date → YYYY-MM-DD，用于 <input type="date"> */
export function toInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 解析 YYYY-MM-DD，非法日期（如 2 月 30 日）返回 null */
export function parseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const d = new Date(y, mo - 1, da);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
  return d;
}

/** 2026 年 8 月 9 日 周日 */
export function fmtFull(d: Date): string {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 周${WEEK_LABEL[d.getDay()]}`;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d.getTime());
  r.setDate(r.getDate() + Math.trunc(n));
  return r;
}

export function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7);
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getTime());
  r.setMonth(r.getMonth() + Math.trunc(n));
  return r;
}

/** 两个日期相差的整数天数（按日历日，结束减起始） */
export function daysBetween(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((db - da) / 86400000);
}

export function friendlyDuration(absDays: number): string {
  if (absDays === 0) return '同一天';
  if (absDays >= 365) return `约 ${(absDays / 365.25).toFixed(1)} 年（${absDays} 天）`;
  if (absDays >= 31) return `约 ${(absDays / 30.44).toFixed(1)} 个月（${absDays} 天）`;
  if (absDays >= 7) return `约 ${(absDays / 7).toFixed(1)} 周（${absDays} 天）`;
  return `${absDays} 天`;
}
