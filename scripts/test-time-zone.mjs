/**
 * test-time-zone.mjs —— 时区换算纯函数层的回归验证
 * ----------------------------------------------------------------------------
 * 为什么必须单独测：时区换算的坑全在「例外」上 —— 半小时时区（印度）、
 * 三刻钟时区（尼泊尔）、南半球夏令时（悉尼）、夏令时拨快导致的不存在时刻
 * （纽约 3 月第二个周日 02:30）、拨慢导致的重复时刻（11 月第一个周日 01:30）。
 * 这些用例只要算错一小时，用户拿它去约会议就是实打实的损失。
 *
 * 跑法：
 *   node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/test-time-zone.mjs
 */

import {
  convertZone,
  parseWallInput,
  formatOffset,
  formatDayDiff,
  formatDiff,
  formatHm,
  formatYmd,
  getOffsetMinutes,
  epochToZone,
  isValidZone,
} from '../src/lib/time-zone.ts';

let pass = 0;
let fail = 0;

function eq(actual, expected, label) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  console.log(`${ok ? '✅' : '❌'} ${label}: 期望 ${expected}，实际 ${actual}`);
}

/** 一次换算 → 目标地「YYYY-MM-DD HH:MM」+ 跨日 + 时差 */
function conv(date, time, fromTz, toTz) {
  const w = parseWallInput(date, time);
  if (!w.ok) throw new Error(`输入不合法：${w.error}`);
  const r = convertZone(w.data, fromTz, toTz);
  if (!r.ok) throw new Error(`换算失败：${r.error}`);
  const c = r.data;
  return {
    text: `${formatYmd(c.to)} ${formatHm(c.to)}`,
    weekday: c.to.weekday,
    dayDiff: formatDayDiff(c.dayDiff),
    diff: formatDiff(c.offsetDiffMin),
    offsetTo: formatOffset(c.to.offsetMin),
    dstShiftMin: c.dstShiftMin,
    dst: c.to.dst,
  };
}

console.log('\n── 1. 基本换算：北京 → 纽约（美东已转标准时） ─────────');
{
  const r = conv('2026-11-04', '10:00', 'Asia/Shanghai', 'America/New_York');
  eq(r.text, '2026-11-03 21:00', '北京 11-04 10:00 → 纽约');
  eq(r.dayDiff, '前 1 天', '跨日标记');
  eq(r.diff, '慢 13 小时', '时差');
  eq(r.offsetTo, 'UTC-5', '纽约偏移（11 月已过夏令时）');
  eq(r.dst, false, '纽约 11-04 非夏令时');
}

console.log('\n── 2. 夏令时生效期：伦敦 → 北京 ────────────────────────');
{
  const r = conv('2026-07-01', '12:00', 'Europe/London', 'Asia/Shanghai');
  eq(r.text, '2026-07-01 19:00', '伦敦 7 月 12:00 → 北京');
  eq(r.offsetTo, 'UTC+8', '北京偏移');
  eq(r.diff, '快 7 小时', '夏季时差（伦敦 BST 只差 7 小时）');
  const w = conv('2026-01-01', '12:00', 'Europe/London', 'Asia/Shanghai');
  eq(w.diff, '快 8 小时', '冬季时差（伦敦 GMT 差 8 小时）');
}

console.log('\n── 3. 跨年跨日：东京 → 洛杉矶 ──────────────────────────');
{
  const r = conv('2026-01-01', '01:00', 'Asia/Tokyo', 'America/Los_Angeles');
  eq(r.text, '2025-12-31 08:00', '东京元旦 01:00 → 洛杉矶');
  eq(r.dayDiff, '前 1 天', '跨日标记');
  eq(r.diff, '慢 17 小时', '时差');
}

console.log('\n── 4. 非整点时区：印度 / 尼泊尔 ────────────────────────');
{
  const r = conv('2026-01-01', '12:00', 'Asia/Kolkata', 'UTC');
  eq(r.text, '2026-01-01 06:30', '孟买 12:00 → UTC（+5:30）');
  eq(r.offsetTo, 'UTC+0', 'UTC 偏移');

  const n = conv('2026-01-01', '12:00', 'Asia/Kathmandu', 'UTC');
  eq(n.text, '2026-01-01 06:15', '加德满都 12:00 → UTC（+5:45）');
  eq(formatOffset(345), 'UTC+5:45', 'formatOffset 三刻钟');
  eq(formatOffset(330), 'UTC+5:30', 'formatOffset 半小时');
  eq(formatOffset(-210), 'UTC-3:30', 'formatOffset 负半小时');
}

console.log('\n── 5. 夏令时拨慢：重复的 01:30 取先发生那次 ─────────────');
{
  // 2026-11-01 美东 02:00 回拨到 01:00，01:30 出现两次（EDT 与 EST）
  const r = conv('2026-11-01', '01:30', 'America/New_York', 'UTC');
  eq(r.text, '2026-11-01 05:30', '纽约重复时刻 01:30 → UTC（取 EDT −4）');
  const back = epochToZone(Date.UTC(2026, 10, 1, 5, 30), 'America/New_York');
  eq(formatHm(back), '01:30', '回读仍是 01:30（自洽）');
}

console.log('\n── 6. 夏令时拨快：不存在的 02:30 顺延 ──────────────────');
{
  // 2026-03-08 美东 02:00 直接跳到 03:00，02:30 从未发生
  const r = conv('2026-03-08', '02:30', 'America/New_York', 'UTC');
  eq(r.text, '2026-03-08 07:30', '不存在的 02:30 → UTC 07:30（等价 03:30 EDT）');
  eq(r.dstShiftMin, 60, '顺延分钟数');
  const self = conv('2026-03-08', '02:30', 'America/New_York', 'America/New_York');
  eq(self.text, '2026-03-08 03:30', '同区换算暴露顺延结果');
}

console.log('\n── 7. 南半球夏令时：悉尼 ───────────────────────────────');
{
  const r = conv('2026-01-15', '12:00', 'Australia/Sydney', 'UTC');
  eq(r.text, '2026-01-15 01:00', '悉尼 1 月 12:00 → UTC（AEDT +11）');
  eq(r.dst, false, '目标地是 UTC，不算夏令时');
  const s = conv('2026-07-15', '12:00', 'Australia/Sydney', 'UTC');
  eq(s.text, '2026-07-15 02:00', '悉尼 7 月 12:00 → UTC（AEST +10）');
}

console.log('\n── 8. 无夏令时国家：中国全年恒定 ───────────────────────');
{
  eq(getOffsetMinutes('Asia/Shanghai', Date.UTC(2026, 0, 15, 0, 0)), 480, '北京 1 月偏移');
  eq(getOffsetMinutes('Asia/Shanghai', Date.UTC(2026, 6, 15, 0, 0)), 480, '北京 7 月偏移');
  const z = epochToZone(Date.UTC(2026, 6, 15, 0, 0), 'Asia/Shanghai');
  eq(formatHm(z), '08:00', '北京 7 月 UTC 0 点 → 08:00');
  eq(z.weekday, 3, '2026-07-15 是周三');
}

console.log('\n── 9. 输入校验 ────────────────────────────────────────');
{
  eq(parseWallInput('2026-02-29', '10:00').ok, false, '2026 非闰年 2-29 应报错');
  eq(parseWallInput('2024-02-29', '10:00').ok, true, '2024 闰年 2-29 合法');
  eq(parseWallInput('2026-13-01', '10:00').ok, false, '13 月应报错');
  eq(parseWallInput('2026-04-31', '10:00').ok, false, '4 月 31 日应报错');
  eq(parseWallInput('2026-04-01', '24:00').ok, false, '24:00 应报错');
  eq(parseWallInput('2026-04-01', '9:5').ok, false, '分钟少一位应报错');
  eq(parseWallInput('2026-4-1', '09:05').ok, true, '非补零日期可接受');
  eq(isValidZone('Asia/Shanghai'), true, '合法时区');
  eq(isValidZone('Mars/Olympus'), false, '非法时区');

  const bad = parseWallInput('2026-02-29', '10:00');
  if (!bad.ok) eq(bad.error, '2026 年 2 月没有 29 日', '报错文案带真实原因');
}

console.log('\n── 10. 时差的正负方向 ─────────────────────────────────');
{
  const a = conv('2026-11-04', '10:00', 'Asia/Shanghai', 'Europe/London');
  eq(a.diff, '慢 8 小时', '北京 → 伦敦（伦敦慢）');
  const b = conv('2026-11-04', '10:00', 'Europe/London', 'Asia/Shanghai');
  eq(b.diff, '快 8 小时', '伦敦 → 北京（北京快）');
  const c = conv('2026-11-04', '10:00', 'Asia/Shanghai', 'Asia/Shanghai');
  eq(c.diff, '无时差', '同区无时差');
  eq(c.dayDiff, '同日', '同区同日');
}

console.log(`\n──────── 汇总：通过 ${pass}　失败 ${fail} ────────`);
if (fail > 0) process.exit(1);
