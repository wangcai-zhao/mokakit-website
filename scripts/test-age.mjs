/**
 * age.ts 纯函数回归：周岁日历差（date-fns 语义向量）+ 万天里程碑 + 下次生日。
 *
 * 测试向量来源：
 *  - 今日计划验收向量（date-fns intervalToDuration 语义）：
 *    1990-06-15 → 2026-08-12 = 36 岁 1 个月 28 天
 *    2022-02-28 → 2022-04-29 = 0 岁 2 个月 1 天
 *  - content.mdx 计算实例（1990-06-15 的 1/2/3 万天与当天周岁）
 *  - 闰年 2/29 边界（工具 FAQ 口径：平年生日落 2 月末）
 *
 * 跑法：node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/test-age.mjs
 */
import {
  calcAge,
  fmtAge,
  totalDays,
  diffDays,
  nextBirthdayInfo,
  addCalendarDays,
  milestoneDates,
  nextMilestone,
  daysInMonth,
} from '../src/lib/age.ts';

let pass = 0;
let fail = 0;
function ok(cond, label, extra = '') {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error(`✗ ${label}${extra ? '\n  ' + extra : ''}`);
  }
}
function eqAge(actual, y, mo, d, label) {
  ok(
    actual.y === y && actual.mo === mo && actual.d === d,
    label,
    `期望 ${y}岁${mo}个月${d}天，实际 ${fmtAge(actual)}`,
  );
}
function eq(actual, expected, label) {
  ok(actual === expected, label, `期望 ${expected}，实际 ${actual}`);
}

const D = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const fmt = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ① 周岁：date-fns 语义主向量（计划验收）
eqAge(calcAge(D('1990-06-15'), D('2026-08-12')), 36, 1, 28, '1990-06-15 → 2026-08-12 = 36岁1个月28天（date-fns 向量）');
eqAge(calcAge(D('2022-02-28'), D('2022-04-29')), 0, 2, 1, '2022-02-28 → 2022-04-29 = 0岁2个月1天（date-fns 向量）');

// ② 无歧义边界向量
eqAge(calcAge(D('2000-01-01'), D('2001-01-01')), 1, 0, 0, '整年');
eqAge(calcAge(D('2000-01-01'), D('2000-12-31')), 0, 11, 30, '差一天满岁');
eqAge(calcAge(D('2019-12-31'), D('2020-01-01')), 0, 0, 1, '跨年一天');
eqAge(calcAge(D('2003-03-30'), D('2003-04-30')), 0, 1, 0, '整月（30→30）');
eqAge(calcAge(D('2003-03-31'), D('2003-04-30')), 0, 0, 30, '31 号出生 + 30 天月：借位后 30 天');
eqAge(calcAge(D('1980-05-20'), D('2026-10-26')), 46, 5, 6, '今天向量 1980-05-20 → 2026-10-26');
eqAge(calcAge(D('2020-02-29'), D('2021-02-28')), 0, 11, 30, '闰日出生平年生日前 1 天');

// ③ 闰年 2/29 边界（工具 FAQ 口径：平年按 2 月末）
eqAge(calcAge(D('2000-02-29'), D('2024-02-28')), 23, 11, 30, '2000-02-29 → 2024-02-28（平年落 2/28）');
eqAge(calcAge(D('2000-02-29'), D('2024-02-29')), 24, 0, 0, '2000-02-29 → 2024-02-29（闰年正日）');
eqAge(calcAge(D('2000-02-29'), D('2023-03-01')), 23, 0, 0, '2000-02-29 → 2023-03-01（平年落点 2/28 当天，口径内 0 天）');

// ④ 天数不为负（修复前 1/31→3/1 会出 -1 天）
for (const [b, n] of [['2020-01-31', '2020-03-01'], ['2020-01-31', '2020-03-31'], ['2019-01-31', '2019-03-01']]) {
  const a = calcAge(D(b), D(n));
  ok(a.d >= 0 && a.mo >= 0 && a.y >= 0, `天数不为负：${b} → ${n}`, fmtAge(a));
}

// ⑤ totalDays / diffDays 与 UTC 毫秒差交叉验证
{
  const b = D('2000-01-01');
  const now = D('2026-10-26');
  const utcDays = Math.round(
    (Date.UTC(2026, 9, 26) - Date.UTC(2000, 0, 1)) / 86400000,
  );
  eq(totalDays(b, now), utcDays, 'totalDays 与 UTC 毫秒差一致（2000-01-01 → 2026-10-26）');
  eq(diffDays(D('2026-10-26'), D('2027-06-15')), 232, 'diffDays 2026-10-26 → 2027-06-15 = 232');
}

// ⑥ 下次生日（含 2/29 平年落点）
{
  const r = nextBirthdayInfo(D('1990-06-15'), D('2026-10-26'));
  eq(r.passed, true, '1990-06-15：今年生日已过');
  eq(r.isToday, false, '今天不是生日');
  eq(fmt(r.next), '2027-06-15', '下次生日 2027-06-15');
  eq(r.days, 232, '距下次生日 232 天');
  eq(r.nextAge, 37, '届时 37 岁');
}
{
  const r = nextBirthdayInfo(D('2000-02-29'), D('2026-10-26'));
  eq(fmt(r.next), '2027-02-28', '闰日出生：下次生日落 2027-02-28（平年 2 月末）');
  eq(r.nextAge, 27, '届时 27 岁（平年落点口径，比日历差 +1）');
}
{
  const r = nextBirthdayInfo(D('1990-06-15'), D('2026-06-15'));
  eq(r.isToday, true, '生日当天 isToday');
  eq(r.nextAge, 36, '生日当天周岁 36');
}

// ⑦ addCalendarDays：日历天累加（规避毫秒累加的夏令时偏差）
{
  eq(fmt(addCalendarDays(D('2000-02-29'), 365)), '2001-02-28', '闰日 +365 天 = 2001-02-28');
  eq(fmt(addCalendarDays(D('2000-02-29'), 366)), '2001-03-01', '闰日 +366 天 = 2001-03-01');
  eq(fmt(addCalendarDays(D('2026-10-26'), 1)), '2026-10-27', '明天');
  eq(fmt(addCalendarDays(D('2026-12-31'), 1)), '2027-01-01', '跨年');
  // 与 UTC 毫秒差自洽：10000 天
  const b = D('2000-01-01');
  const m = addCalendarDays(b, 10000);
  eq(
    (Date.UTC(m.getFullYear(), m.getMonth(), m.getDate()) - Date.UTC(2000, 0, 1)) / 86400000,
    10000,
    'addCalendarDays(2000-01-01, 10000) 与 UTC 差自洽',
  );
}

// ⑧ 万天里程碑（含 content.mdx 实例：1990-06-15）
{
  const ms = milestoneDates(D('1990-06-15'), D('2026-08-12'));
  eq(ms.length, 3, '默认 3 档里程碑');
  eq(fmt(ms[0].date), '2017-10-31', '1990-06-15 一万天 = 2017-10-31（content.mdx 实例，算法实测）');
  eq(fmtAge(ms[0].age), '27 岁 4 个月 16 天', '一万天当天周岁 27岁4个月16天');
  eq(fmt(ms[1].date), '2045-03-18', '1990-06-15 两万天 = 2045-03-18（content.mdx 实例，算法实测）');
  eq(fmtAge(ms[1].age), '54 岁 9 个月 3 天', '两万天当天周岁 54岁9个月3天');
  eq(fmt(ms[2].date), '2072-08-03', '1990-06-15 三万天 = 2072-08-03（content.mdx 实例，算法实测）');
  eq(fmtAge(ms[2].age), '82 岁 1 个月 19 天', '三万天当天周岁 82岁1个月19天');
  eq(ms[0].passed, true, '一万天已达成');
  eq(ms[0].daysAgo, diffDays(D('2017-10-31'), D('2026-08-12')), '一万天距今天数自洽');
  eq(ms[0].daysAgo, 3207, '一万天距今天数 3207（2026-08-12 基准）');
  eq(ms[1].passed, false, '两万天未到');
}
{
  const nm = nextMilestone(D('2000-01-01'), D('2026-10-26'));
  ok(nm !== null, '存在下一个里程碑');
  eq(nm?.n, 10000, '2000-01-01 出生：1 万天（2027-05-19）还没到');
  eq(fmt(nm?.date), '2027-05-19', '1 万天 = 2027-05-19');
}
{
  // 一万天未到的婴儿场景
  const nm = nextMilestone(D('2024-06-01'), D('2026-10-26'));
  eq(nm?.n, 10000, '幼儿：下一个里程碑是 1 万天');
  ok((nm?.days ?? 0) > 0, '1 万天还有 N 天');
}

// ⑨ daysInMonth
eq(daysInMonth(2024, 1), 29, '2024 年 2 月 29 天（闰）');
eq(daysInMonth(2023, 1), 28, '2023 年 2 月 28 天（平）');
eq(daysInMonth(2000, 1), 29, '2000 年 2 月 29 天（世纪闰年）');
eq(daysInMonth(1900, 1), 28, '1900 年 2 月 28 天（世纪非闰）');

console.log(`\ntest-age: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
