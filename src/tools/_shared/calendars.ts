/**
 * 历法换算纯算法（无 Preact 依赖，可在 Node 下直接校验）。
 *
 * 两个目标历法：
 *  1) 中国传统农历（阴历）→ 公历，覆盖 1900-2100。
 *  2) 伊斯兰历（回历 / Hijri）→ 公历，算术民用版（Kuwaiti/R-D civil 算法）。
 *
 * 之所以把算法单独抽出来：Astro 的 client:* 岛屿组件必须静态 import，
 * 但纯算法本身需要在 Node 里跑断言校验（对照已知日期）。
 * 把纯逻辑放这里，组件只负责 UI，校验脚本直接 import 本文件即可。
 */

// ───────────────────────── 农历（1900-2100）─────────────────────────
// 年份信息表编码（业界通用 lunarInfo 算法，已对照已知节日/闰月校验）：
//   低 4 位       = 闰月月份（0 表示当年无闰月）
//   位 4..15      = 农历 1..12 月的大小（1=30 天大月，0=29 天小月）
//   位 16 (0x10000)= 闰月的大小（1=30 天，0=29 天）
// 农历 1900 年正月初一 = 公历 1900-01-31（转换基准）。
const LUNAR_INFO: number[] = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06aa0, 0x1a6c4, 0x0aae0, // 2050-2059
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520, // 2100
];

const BASE_YEAR = 1900;
const BASE = new Date(1900, 0, 31); // 1900-01-31 = 农历1900正月初一

export function leapMonth(y: number): number {
  return LUNAR_INFO[y - BASE_YEAR] & 0xf;
}
function leapDays(y: number): number {
  if (leapMonth(y) === 0) return 0;
  return LUNAR_INFO[y - BASE_YEAR] & 0x10000 ? 30 : 29;
}
function monthDays(y: number, m: number): number {
  // 业界通用 lunarInfo 编码：bit15=正月(月1)，bit4=腊月(月12)
  return LUNAR_INFO[y - BASE_YEAR] & (0x10000 >> m) ? 30 : 29;
}
function yearDays(y: number): number {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) sum += LUNAR_INFO[y - BASE_YEAR] & i ? 1 : 0;
  return sum + leapDays(y);
}

/** 农历 → 公历。返回 Date 或 null（输入非法）。 */
export function lunarToSolar(
  ly: number,
  lm: number,
  ld: number,
  isLeap: boolean,
): Date | null {
  if (ly < BASE_YEAR || ly > 2100) return null;
  const lmNum = leapMonth(ly);
  if (lm < 1 || lm > 12) return null;
  if (isLeap && lm !== lmNum) return null;
  const maxD = isLeap ? leapDays(ly) : monthDays(ly, lm);
  if (ld < 1 || ld > maxD) return null;

  let offset = 0;
  for (let y = BASE_YEAR; y < ly; y++) offset += yearDays(y);
  const leap = lmNum;
  for (let m = 1; m <= 12; m++) {
    const md = monthDays(ly, m);
    if (m === lm && !isLeap) {
      offset += ld - 1;
      break;
    }
    offset += md;
    if (leap === m) {
      const lmd = leapDays(ly);
      if (m === lm && isLeap) {
        offset += ld - 1;
        break;
      }
      offset += lmd;
    }
  }

  const d = new Date(BASE.getTime());
  d.setDate(d.getDate() + offset);
  return d;
}

// ───────────────────────── 公历 → 农历 ─────────────────────────
export interface LunarDate {
  ly: number;
  lm: number;
  ld: number;
  isLeap: boolean;
}

/** 公历 → 农历。返回 LunarDate 或 null（超出 1900-2100 农历表范围）。 */
export function solarToLunar(date: Date): LunarDate | null {
  const y = date.getFullYear();
  const mo = date.getMonth() + 1;
  const d = date.getDate();
  if (y < BASE_YEAR || y > 2100) return null;
  // 用 UTC 求天数差，规避本地时区/夏令时带来的偏差
  const offset = Math.floor(
    (Date.UTC(y, mo - 1, d) - Date.UTC(BASE_YEAR, 0, 31)) / 86400000,
  );
  let ly = BASE_YEAR;
  let remaining = offset;
  while (remaining >= yearDays(ly)) {
    remaining -= yearDays(ly);
    ly++;
    if (ly > 2100) return null;
  }
  const leap = leapMonth(ly);
  for (let m = 1; m <= 12; m++) {
    const md = monthDays(ly, m);
    if (remaining < md) return { ly, lm: m, ld: remaining + 1, isLeap: false };
    remaining -= md;
    if (leap === m) {
      const lmd = leapDays(ly);
      if (remaining < lmd) return { ly, lm: m, ld: remaining + 1, isLeap: true };
      remaining -= lmd;
    }
  }
  return null;
}

// ───────────────────────── 农历展示辅助（纯函数）─────────────────────────
const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
const MONTH_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const DAY_ONES = ['十', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const CN_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 农历年 → 干支（如 2026 → 丙午）。 */
export function ganzhiOfYear(ly: number): string {
  const g = ((ly - 4) % 10 + 10) % 10;
  const z = ((ly - 4) % 12 + 12) % 12;
  return GAN[g] + ZHI[z];
}

/** 农历年 → 生肖（如 2026 → 马）。 */
export function zodiacOfYear(ly: number): string {
  const z = ((ly - 4) % 12 + 12) % 12;
  return ZODIAC[z];
}

/** 农历月 → 中文（如 1 → 正，闰6 → 闰六）。 */
export function lunarMonthCN(m: number, isLeap: boolean): string {
  if (m < 1 || m > 12) return '';
  return (isLeap ? '闰' : '') + MONTH_CN[m - 1];
}

/** 农历日 → 中文（如 1 → 初一，20 → 二十，30 → 三十）。 */
export function lunarDayCN(d: number): string {
  if (d < 1 || d > 30) return '';
  if (d === 10) return '初十';
  if (d === 20) return '二十';
  if (d === 30) return '三十';
  if (d < 10) return '初' + DAY_ONES[d];
  if (d < 20) return '十' + DAY_ONES[d - 10];
  return '廿' + DAY_ONES[d - 20];
}

/** 年份（1900-2100）→ 中文数字（如 2026 → 二〇二六）。 */
export function yearToCN(y: number): string {
  return String(y).split('').map((c) => CN_DIGITS[Number(c)]).join('');
}

// ───────────────────────── 伊斯兰历（回历）─────────────────────────
// 算术民用回历（arithmetic / civil Hijri），即多数软件日历采用的 Kuwaiti 算法
// （Reingold & Dershowitz "fixed-from-islamic"）。
// 注意：实际伊斯兰历以新月观测为准（如沙特 Umm al-Qura），个别年份可能与本结果相差 1 天。
// 公式直接给出「儒略日数 JD」，再用 Fliegel–Van Flandern 算法转回公历。

const HIJRI_EPOCH_OFFSET = 1948440 - 385; // 1 Muharram 1 AH 对应的 JD 已含在公式里

/** 伊斯兰历 → 儒略日数 JD（整数）。 */
function hijriToJD(hy: number, hm: number, hd: number): number {
  return (
    Math.floor((11 * hy + 3) / 30) +
    354 * hy +
    30 * hm -
    Math.floor((hm - 1) / 2) +
    hd +
    HIJRI_EPOCH_OFFSET
  );
}

/** 儒略日数（整数，正午起算）→ 公历 Date（Fliegel–Van Flandern 算法）。 */
function jdToGregorian(jd: number): Date {
  const L = jd + 68569;
  const N = Math.floor((4 * L) / 146097);
  const L2 = L - Math.floor((146097 * N + 3) / 4);
  const I = Math.floor((4000 * (L2 + 1)) / 1461001);
  const L3 = L2 - Math.floor((1461 * I) / 4) + 31;
  const J = Math.floor((80 * L3) / 2447);
  const K = L3 - Math.floor((2447 * J) / 80);
  const L4 = Math.floor(J / 11);
  const month = J + 2 - 12 * L4;
  const year = 100 * (N - 49) + I + L4;
  return new Date(year, month - 1, K);
}

/** 某伊斯兰年是否为闰年（第 12 月多 1 天，30 年 11 闰）。 */
export function isHijriLeapYear(hy: number): boolean {
  return (11 * hy + 14) % 30 < 11;
}

/** 伊斯兰历某月天数（民用算法：奇月 30，偶月 29；闰年 12 月 30）。 */
function hijriMonthDays(hy: number, hm: number): number {
  const leap = isHijriLeapYear(hy);
  if (hm % 2 === 1) return 30;
  if (hm === 12 && leap) return 30;
  return 29;
}

/** 伊斯兰历 → 公历。返回 Date 或 null（输入非法）。 */
export function hijriToGregorian(
  hy: number,
  hm: number,
  hd: number,
): Date | null {
  if (!Number.isInteger(hy) || !Number.isInteger(hm) || !Number.isInteger(hd)) return null;
  if (hy < 1 || hy > 1500) return null;
  if (hm < 1 || hm > 12) return null;
  if (hd < 1 || hd > hijriMonthDays(hy, hm)) return null;
  return jdToGregorian(hijriToJD(hy, hm, hd));
}
