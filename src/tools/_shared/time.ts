// 纯 TS 时间（一天内的时刻与时长）运算工具，零依赖。

export interface Hms {
  h: number;
  m: number;
  s: number;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** 解析 HH:MM 或 HH:MM:SS，返回 {h,m,s} 或 null */
export function parseTime(s: string): Hms | null {
  const m = /^\s*(\d{1,2})\s*[:：]\s*(\d{1,2})(?:\s*[:：]\s*(\d{1,2}))?\s*$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  const se = m[3] ? Number(m[3]) : 0;
  if (h > 23 || mi > 59 || se > 59) return null;
  return { h, m: mi, s: se };
}

export function fmtTime(h: number, m: number): string {
  return `${pad(h)}:${pad(m)}`;
}

/** 秒数 → HH:MM:SS（小时不做 24 取模，可超过 24，便于表达总时长） */
export function secondsToHms(total: number): Hms {
  const sign = total < 0 ? -1 : 1;
  let t = Math.abs(Math.trunc(total));
  const s = t % 60;
  t = Math.floor(t / 60);
  const m = t % 60;
  const h = Math.floor(t / 60);
  return { h: h * sign, m, s };
}

export function fmtHms(total: number): string {
  const { h, m, s } = secondsToHms(total);
  const sign = h < 0 ? '-' : '';
  return `${sign}${pad(Math.abs(h))}:${pad(m)}:${pad(s)}`;
}

export function hmsToSeconds(p: Hms): number {
  return (p.h * 3600 + p.m * 60 + p.s) * (p.h < 0 ? -1 : 1);
}

/** 时刻 + 小时数 → 结果时刻与跨天数（crossDays 可正可负） */
export function addHours(baseH: number, baseM: number, hours: number): {
  h: number;
  m: number;
  crossDays: number;
} {
  const totalMin = (baseH * 60 + baseM) + Math.round(hours * 60);
  const crossDays = Math.floor(totalMin / (24 * 60));
  const rem = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60);
  return { h: Math.floor(rem / 60), m: rem % 60, crossDays };
}
