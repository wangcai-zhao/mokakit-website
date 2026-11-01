/**
 * 年龄计算纯函数层（age-calculator 工具与「一万天纪念日」子页共用，MCP 同源）。
 *
 * 口径说明：
 *  - 周岁按日历差计算：先定岁 / 月，天数不足时向上一个月借位（借位月取
 *    「今天」往前数第 k 个月的天数），循环保证天数不为负；
 *  - 闰年 2 月 29 日出生者，平年生日按 2 月最后一天推算（与工具 FAQ 口径一致，
 *    与 date-fns 等库的边界差异最多一天，不影响周岁判断）；
 *  - 万天里程碑按日历天累加（非毫秒累加，规避夏令时偏差）。
 *
 * 借鉴来源（MIT license，仅借鉴测试向量与边界语义，不引依赖）：
 *  date-fns/date-fns 的 intervalToDuration / differenceInCalendarDays
 *  测试向量（见 scripts/test-age.mjs）。
 */

const DAY_MS = 86400000;

/** 某年某月的天数，month0 为 0-11 */
export function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

/** 去掉时分秒，只留本地日期 */
function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 两个本地日期的日历天差（b - a，非负才有意义） */
export function diffDays(a: Date, b: Date): number {
  return Math.round((stripTime(b).getTime() - stripTime(a).getTime()) / DAY_MS);
}

/**
 * 周岁：出生日 b → 今天 now 的「岁 / 月 / 天」。
 * 借位月从 now 的上个月开始往前数，保证 d ≥ 0。
 */
export function calcAge(b: Date, now: Date): { y: number; mo: number; d: number } {
  let y = now.getFullYear() - b.getFullYear();
  let mo = now.getMonth() - b.getMonth();
  let d = now.getDate() - b.getDate();
  let borrow = 0;
  while (d < 0) {
    mo -= 1;
    if (mo < 0) {
      mo += 12;
      y -= 1;
    }
    d += daysInMonth(now.getFullYear(), now.getMonth() - 1 - borrow);
    borrow += 1;
  }
  if (mo < 0) {
    mo += 12;
    y -= 1;
  }
  return { y, mo, d };
}

/** 「36 岁 1 个月 28 天」格式 */
export function fmtAge(a: { y: number; mo: number; d: number }): string {
  return `${a.y} 岁 ${a.mo} 个月 ${a.d} 天`;
}

/** 已存活总天数 */
export function totalDays(b: Date, now: Date): number {
  return diffDays(b, now);
}

/** 某年的生日日（2 月 29 日出生者平年落到 2 月最后一天） */
export function birthdayInYear(b: Date, year: number): Date {
  return new Date(year, b.getMonth(), Math.min(b.getDate(), daysInMonth(year, b.getMonth())));
}

/** 下次生日信息（含倒计时天数与届时周岁） */
export function nextBirthdayInfo(
  b: Date,
  now: Date,
): { isToday: boolean; passed: boolean; next: Date; days: number; nextAge: number } {
  const thisYear = birthdayInYear(b, now.getFullYear());
  const isToday = stripTime(thisYear).getTime() === stripTime(now).getTime();
  const passed = thisYear.getTime() < stripTime(now).getTime();
  const next = passed ? birthdayInYear(b, now.getFullYear() + 1) : thisYear;
  // 2/29 出生者平年落到 2/28：届时常住口径是「第 N 个生日」，比日历差多一岁
  // （日历差在落点当天还差一天满岁，见 FAQ「天数差异最多一天」）
  const clamped = b.getDate() > daysInMonth(next.getFullYear(), b.getMonth());
  return {
    isToday,
    passed,
    next,
    days: diffDays(now, next),
    nextAge: calcAge(b, next).y + (clamped ? 1 : 0),
  };
}

/** 按日历天累加（new Date(y, m, d + n)，JS 自动跨月归一） */
export function addCalendarDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** 万天里程碑：出生后第 n 天（默认 1/2/3 万天）的日期与当天周岁 */
export function milestoneDates(
  b: Date,
  now: Date,
  ns: number[] = [10000, 20000, 30000],
): { n: number; date: Date; age: { y: number; mo: number; d: number }; passed: boolean; daysAgo: number }[] {
  return ns.map((n) => {
    const date = addCalendarDays(b, n);
    const days = diffDays(now, date);
    return { n, date, age: calcAge(b, date), passed: days <= 0, daysAgo: -days };
  });
}

/** 下一个未到的万天里程碑；全部已过返回 null */
export function nextMilestone(
  b: Date,
  now: Date,
  ns: number[] = [10000, 20000, 30000],
): { n: number; date: Date; days: number } | null {
  for (const n of ns) {
    const date = addCalendarDays(b, n);
    const days = diffDays(now, date);
    if (days > 0) return { n, date, days };
  }
  return null;
}
