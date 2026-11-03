import { useState, useMemo, useEffect } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import {
  TIME_ZONES,
  TZ_REGIONS,
  zoneLabel,
  convertZone,
  parseWallInput,
  epochToZone,
  formatOffset,
  formatDayDiff,
  formatDiff,
  formatHm,
  formatYmd,
  weekdayCn,
} from '@/lib/time-zone';

/** 源时区默认北京，目标默认纽约：跨境办公 / 外贸最常问的一对 */
const DEFAULT_FROM = 'Asia/Shanghai';
const DEFAULT_TO = 'America/New_York';

/** 多城对照默认看这几地 */
const BOARD_DEFAULT = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney'];

/** 可加入对照面板的城市 */
const BOARD_POOL = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
];

/** 按某时区取「此刻」的日期与时间 */
function nowWall(tz: string): { date: string; time: string } {
  const z = epochToZone(Date.now(), tz);
  return { date: formatYmd(z), time: formatHm(z) };
}

export default function TimezoneConverter() {
  // 首帧用固定值，挂载后再填「此刻」——直接拿 new Date() 会与 SSR 输出不一致触发 hydration mismatch
  const [date, setDate] = useState('2026-01-01');
  const [time, setTime] = useState('09:00');
  const [fromTz, setFromTz] = useState(DEFAULT_FROM);
  const [toTz, setToTz] = useState(DEFAULT_TO);
  const [board, setBoard] = useState<string[]>(BOARD_DEFAULT);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const n = nowWall(DEFAULT_FROM);
    setDate(n.date);
    setTime(n.time);
  }, []);

  const calc = useMemo(() => {
    const w = parseWallInput(date, time);
    if (!w.ok) return w;
    return convertZone(w.data, fromTz, toTz);
  }, [date, time, fromTz, toTz]);

  const resetToNow = () => {
    const n = nowWall(fromTz);
    setDate(n.date);
    setTime(n.time);
  };

  /** 交换源/目标：把当前结果时间搬过去，方便反向核对 */
  const swap = () => {
    if (!calc.ok) return;
    const nextFrom = toTz;
    const nextTo = fromTz;
    setFromTz(nextFrom);
    setToTz(nextTo);
    setDate(formatYmd(calc.data.to));
    setTime(formatHm(calc.data.to));
  };

  const toggleBoard = (tz: string) =>
    setBoard((list) => (list.includes(tz) ? list.filter((t) => t !== tz) : [...list, tz]));

  const copy = async () => {
    if (!calc.ok) return;
    const c = calc.data;
    const text = [
      `源：${zoneLabel(fromTz)} ${formatYmd(c.from)} ${formatHm(c.from)}（${formatOffset(c.from.offsetMin)}）`,
      `目标：${zoneLabel(toTz)} ${formatYmd(c.to)} ${formatHm(c.to)}（${formatOffset(c.to.offsetMin)}）`,
      `跨日：${formatDayDiff(c.dayDiff)}｜时差：${formatDiff(c.offsetDiffMin)}`,
    ].join('\n');
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const zoneOptions = TZ_REGIONS.map((region) => (
    <optgroup label={region} key={region}>
      {TIME_ZONES.filter((z) => z.region === region).map((z) => (
        <option value={z.tz} key={z.tz}>
          {z.city}（{z.tz}）
        </option>
      ))}
    </optgroup>
  ));

  return (
    <div class="space-y-4">
      {/* 输入区：源时间 + 源时区 */}
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="text-sm font-medium">日期</span>
            <input
              type="date"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={date}
              min="1970-01-01"
              max="2100-12-31"
              onInput={(e) => setDate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">时间</span>
            <input
              type="time"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={time}
              onInput={(e) => setTime((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">源时区</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={fromTz}
              onChange={(e) => setFromTz((e.target as HTMLSelectElement).value)}
            >
              {zoneOptions}
            </select>
          </label>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" class="btn btn-xs btn-outline" onClick={resetToNow}>
            用当前时间
          </button>
          <button type="button" class="btn btn-xs btn-outline" onClick={swap}>
            ⇄ 交换两地
          </button>
          <span class="text-xs opacity-55">
            源时区当地时间，非 UTC；夏令时由浏览器内置 IANA 规则自动判定
          </span>
        </div>
      </div>

      {!calc.ok && (
        <p class="text-sm text-error" role="alert">
          {calc.error}
        </p>
      )}

      {calc.ok && (
        <>
          {/* 目标时区选择 + 结果 */}
          <div class="rounded-xl bg-base-100 p-3 sm:p-4">
            <div class="flex flex-wrap items-end gap-3">
              <label class="block flex-1 min-w-[200px]">
                <span class="text-sm font-medium">目标时区</span>
                <select
                  class="select select-bordered select-sm mt-1.5 w-full"
                  value={toTz}
                  onChange={(e) => setToTz((e.target as HTMLSelectElement).value)}
                >
                  {zoneOptions}
                </select>
              </label>
            </div>

            <div class="mt-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p class="text-xs opacity-60">
                  {zoneLabel(toTz)} · {formatOffset(calc.data.to.offsetMin)}
                  {calc.data.to.dst ? ' · 夏令时' : ''}
                </p>
                <p class="font-mono text-3xl font-semibold tabular-nums leading-tight">
                  {formatHm(calc.data.to)}
                </p>
                <p class="text-sm opacity-70">
                  {calc.data.to.y} 年 {calc.data.to.mo} 月 {calc.data.to.d} 日{' '}
                  {weekdayCn(calc.data.to.weekday)}
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <span
                  class={`badge badge-sm ${calc.data.dayDiff === 0 ? 'badge-ghost' : 'badge-warning'}`}
                >
                  {formatDayDiff(calc.data.dayDiff)}
                </span>
                <span class="badge badge-sm badge-ghost">{formatDiff(calc.data.offsetDiffMin)}</span>
                <button
                  type="button"
                  class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
                  onClick={copy}
                >
                  {copied ? '已复制' : '复制结果'}
                </button>
              </div>
            </div>

            <p class="mt-2 text-xs opacity-55">
              源：{zoneLabel(fromTz)} {formatYmd(calc.data.from)} {formatHm(calc.data.from)}（
              {formatOffset(calc.data.from.offsetMin)}
              {calc.data.from.dst ? ' 夏令时' : ''}）
            </p>

            {calc.data.dstShiftMin !== 0 && (
              <p class="mt-2 rounded-lg bg-warning/15 px-3 py-2 text-xs">
                ⚠️ {zoneLabel(fromTz)}当地 {date} {time} 因夏令时拨快并不存在，已按顺延后的实际时刻换算（
                {formatHm(calc.data.from)}）。
              </p>
            )}
          </div>

          {/* 多城对照 */}
          <div class="rounded-xl bg-base-200 p-3 sm:p-4">
            <p class="text-sm font-medium">多城对照（同一时刻）</p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              {BOARD_POOL.map((tz) => (
                <button
                  type="button"
                  key={tz}
                  class={`btn btn-xs ${board.includes(tz) ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => toggleBoard(tz)}
                >
                  {zoneLabel(tz)}
                </button>
              ))}
            </div>

            {board.length > 0 && (
              <div class="mt-3 overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>城市</th>
                      <th>当地时间</th>
                      <th>日期</th>
                      <th>与源时区</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.map((tz) => {
                      const z = epochToZone(calc.data.epoch, tz);
                      const diffMin = z.offsetMin - calc.data.from.offsetMin;
                      return (
                        <tr key={tz}>
                          <td class="whitespace-nowrap">
                            {zoneLabel(tz)}
                            {tz === fromTz && (
                              <span class="badge badge-xs badge-ghost ml-1.5">源</span>
                            )}
                            {tz === toTz && (
                              <span class="badge badge-xs badge-primary ml-1.5">目标</span>
                            )}
                          </td>
                          <td class="font-mono tabular-nums">{formatHm(z)}</td>
                          <td class="whitespace-nowrap">
                            {formatYmd(z)} {weekdayCn(z.weekday)}
                          </td>
                          <td class="whitespace-nowrap">{formatDiff(diffMin)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        换算基于浏览器内置的 IANA 时区数据库，夏令时起止由各地现行规则自动判定；不联网、不上传数据。
        历史日期使用当前时区库的规则回推，1970 年以前个别地区可能有几分钟偏差。
      </p>
    </div>
  );
}
