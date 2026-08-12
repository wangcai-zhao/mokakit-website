/**
 * 历法算法校验：对照已知日期断言 lunarToSolar / hijriToGregorian 正确。
 * 运行：node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/verify-calendars.mjs
 */
import { lunarToSolar, hijriToGregorian } from '../src/tools/_shared/calendars.ts';

let pass = 0;
let fail = 0;

function fmt(d) {
  if (!d) return 'null';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function check(name, got, want) {
  const ok = got === want;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? '✓' : '✗'} ${name}: got ${got} want ${want}`);
}

console.log('=== 农历 → 公历 ===');
// 春节基准
check('农历2026正月初一(春节)', fmt(lunarToSolar(2026, 1, 1, false)), '2026-02-17');
check('农历2025正月初一(春节)', fmt(lunarToSolar(2025, 1, 1, false)), '2025-01-29');
check('农历2024正月初一(春节)', fmt(lunarToSolar(2024, 1, 1, false)), '2024-02-10');
check('农历2000正月初一(春节)', fmt(lunarToSolar(2000, 1, 1, false)), '2000-02-05');
check('农历1900正月初一(基准)', fmt(lunarToSolar(1900, 1, 1, false)), '1900-01-31');
// 闰月
check('农历2023闰二月初一', fmt(lunarToSolar(2023, 2, 1, true)), '2023-03-22');
check('农历2025闰六月初一', fmt(lunarToSolar(2025, 6, 1, true)), '2025-07-25');
// 非法闰月应返回 null
check('农历2026闰五月(不存在)→null', String(lunarToSolar(2026, 5, 1, true)), 'null');

console.log('\n=== 伊斯兰历（民用算术） → 公历 ===');
// 这些是被广泛引用的「观测历」日期；民用算法个别年份相差 1 天属正常。
check('回历1445年1月1日', fmt(hijriToGregorian(1445, 1, 1)), '2023-07-19');
check('回历1445年9月1日(斋月)', fmt(hijriToGregorian(1445, 9, 1)), '2024-03-11');
check('回历1446年1月1日(算术)', fmt(hijriToGregorian(1446, 1, 1)), '2024-07-08');
check('回历1445年12月10日(古尔邦节)', fmt(hijriToGregorian(1445, 12, 10)), '2024-06-17');

// 往返一致性：同一天次年同日应约 +354/-355 天
const a = hijriToGregorian(1445, 1, 1);
const b = hijriToGregorian(1446, 1, 1);
const diff = Math.round((b - a) / 86400000);
check('回历1445→1446 间隔天数(354或355)', String(diff), diff === 354 || diff === 355 ? String(diff) : 'ERR');

console.log(`\n结果：通过 ${pass} / 失败 ${fail}`);
if (fail > 0) process.exit(1);
