import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import {
  parseDate,
  toInputValue,
  fmtFull,
  addDays,
  daysBetween,
} from '@/tools/_shared/dates';
import LunarConvert from '@/tools/_shared/LunarConvert';

type Mode = 'shift' | 'diff' | 'lunar';

const SHIFT_PRESETS = [
  { label: '+7', value: 7 },
  { label: '+30', value: 30 },
  { label: '+90', value: 90 },
  { label: '+180', value: 180 },
  { label: '+365', value: 365 },
];

export default function DayCalc() {
  const today = toInputValue(new Date());
  const [mode, setMode] = useState<Mode>('shift');

  // 推算模式
  const [base, setBase] = useState(today);
  const [offset, setOffset] = useState('90');

  // 间隔模式
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimer = useRef<number | undefined>(undefined);

  const flashCopy = (key: string, text: string) => {
    void copyText(text);
    setCopiedKey(key);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopiedKey(null), 1800);
  };

  // 基准日期前一天 / 后一天快捷切换
  const shiftBase = (n: number) => {
    const b = parseDate(base);
    if (!b) return;
    setBase(toInputValue(addDays(b, n)));
  };

  // ---- 推算计算 ----
  const shift = useMemo(() => {
    const b = parseDate(base);
    const raw = offset.trim();
    if (!b) return { error: '请选择有效的基准日期' } as const;
    if (raw === '' || raw === '+' || raw === '-') return { error: '请输入天数' } as const;
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      return { error: '天数需为整数（负数表示往前推算）' } as const;
    }
    return { error: null, date: addDays(b, n), n } as const;
  }, [base, offset]);

  // ---- 间隔计算 ----
  const diff = useMemo(() => {
    const s = parseDate(start);
    const e = parseDate(end);
    if (!s || !e) return { error: '请选择有效的起止日期' } as const;
    const days = daysBetween(s, e);
    const abs = Math.abs(days);
    return {
      error: null,
      days,
      abs,
      weeks: abs / 7,
      months: abs / 30.44,
      years: abs / 365.25,
    } as const;
  }, [start, end]);

  return (
    <div class="space-y-5">
      {/* 模式切换 */}
      <div class="tabs tabs-boxed bg-base-200/60 p-1 w-full max-w-sm">
        <button
          type="button"
          class={`tab flex-1 ${mode === 'shift' ? 'tab-active' : ''}`}
          onClick={() => setMode('shift')}
        >
          日期推算
        </button>
        <button
          type="button"
          class={`tab flex-1 ${mode === 'diff' ? 'tab-active' : ''}`}
          onClick={() => setMode('diff')}
        >
          天数间隔
        </button>
        <button
          type="button"
          class={`tab flex-1 ${mode === 'lunar' ? 'tab-active' : ''}`}
          onClick={() => setMode('lunar')}
        >
          阴阳历转换
        </button>
      </div>

      {mode === 'shift' ? (
        <section class="space-y-4">
          <p class="text-sm opacity-70">
            选择基准日期并输入天数，自动算出目标日期、星期与 ISO 格式。负数表示往前推算。
          </p>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium">基准日期</span>
              <input
                type="date"
                class="input input-bordered input-md mt-1.5 w-full"
                value={base}
                max="2100-12-31"
                min="1900-01-01"
                onInput={(e) => setBase((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">加减天数（负数往前推）</span>
              <input
                type="number"
                step="1"
                class="input input-bordered input-md mt-1.5 w-full font-mono"
                value={offset}
                onInput={(e) => setOffset((e.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            {SHIFT_PRESETS.map((p) => (
              <button
                type="button"
                key={p.value}
                class={`btn btn-sm ${Number(offset) === p.value ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setOffset(String(p.value))}
              >
                {p.label} 天
              </button>
            ))}
            <button
              type="button"
              class="btn btn-sm btn-outline"
              onClick={() => shiftBase(-1)}
              aria-label="基准日期改为前一天"
            >
              前一天
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline"
              onClick={() => shiftBase(1)}
              aria-label="基准日期改为后一天"
            >
              后一天
            </button>
            <button
              type="button"
              class="btn btn-sm btn-ghost"
              onClick={() => setBase(today)}
            >
              重置为今天
            </button>
          </div>

          {shift.error && (
            <p class="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{shift.error}</p>
          )}

          {!shift.error && shift.date && (
            <div class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs opacity-60">
                    推算结果 · {shift.n >= 0 ? `往后 ${shift.n} 天` : `往前 ${-shift.n} 天`}
                  </p>
                  <p class="mt-1 text-2xl font-bold leading-tight">{fmtFull(shift.date)}</p>
                  <p class="mt-1 font-mono text-sm opacity-70">{toInputValue(shift.date)}</p>
                </div>
                <button
                  type="button"
                  class={`btn btn-sm shrink-0 ${copiedKey === 'shift' ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => flashCopy('shift', toInputValue(shift.date!))}
                >
                  {copiedKey === 'shift' ? '已复制' : '复制'}
                </button>
              </div>
              <p class="mt-3 border-t border-base-200 pt-3 text-xs opacity-60">
                基准 {base} {shift.n >= 0 ? '+' : ''}{shift.n} 天 → {toInputValue(shift.date)}
              </p>
            </div>
          )}
        </section>
      ) : mode === 'diff' ? (
        <section class="space-y-4">
          <p class="text-sm opacity-70">
            选择开始与结束日期，自动算出两日期相差多少天，并提供周数、约月数、约年数折算。
          </p>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium">开始日期</span>
              <input
                type="date"
                class="input input-bordered input-md mt-1.5 w-full"
                value={start}
                max="2100-12-31"
                min="1900-01-01"
                onInput={(e) => setStart((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">结束日期</span>
              <input
                type="date"
                class="input input-bordered input-md mt-1.5 w-full"
                value={end}
                max="2100-12-31"
                min="1900-01-01"
                onInput={(e) => setEnd((e.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn btn-sm btn-outline"
              onClick={() => {
                setStart(today);
                setEnd(today);
              }}
            >
              重置为今天
            </button>
            <button
              type="button"
              class="btn btn-sm btn-ghost"
              onClick={() => {
                const s = start;
                setStart(end);
                setEnd(s);
              }}
            >
              交换两端
            </button>
            <button
              type="button"
              class="btn btn-sm btn-ghost"
              onClick={() => setEnd(today)}
            >
              结束设为今天
            </button>
          </div>

          {diff.error && (
            <p class="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{diff.error}</p>
          )}

          {!diff.error && (
            <div class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs opacity-60">两个日期相差</p>
                  <p class="mt-1 flex items-baseline gap-2">
                    <span class="text-3xl font-extrabold leading-none">{diff.abs}</span>
                    <span class="text-sm opacity-60">天 / DAYS</span>
                  </p>
                  {diff.days < 0 && (
                    <p class="mt-1 text-xs text-warning">结束日期早于开始日期</p>
                  )}
                </div>
                <button
                  type="button"
                  class={`btn btn-sm shrink-0 ${copiedKey === 'diff' ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => flashCopy('diff', `${diff.abs} 天`)}
                >
                  {copiedKey === 'diff' ? '已复制' : '复制'}
                </button>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div class="rounded-lg bg-base-200/70 p-3 text-center">
                  <p class="text-[11px] opacity-60">天数</p>
                  <p class="mt-0.5 font-mono text-sm font-semibold">{diff.abs}</p>
                </div>
                <div class="rounded-lg bg-base-200/70 p-3 text-center">
                  <p class="text-[11px] opacity-60">周数</p>
                  <p class="mt-0.5 font-mono text-sm font-semibold">{diff.weeks.toFixed(1)}</p>
                </div>
                <div class="rounded-lg bg-base-200/70 p-3 text-center">
                  <p class="text-[11px] opacity-60">约月数</p>
                  <p class="mt-0.5 font-mono text-sm font-semibold">{diff.months.toFixed(1)}</p>
                </div>
                <div class="rounded-lg bg-base-200/70 p-3 text-center">
                  <p class="text-[11px] opacity-60">约年数</p>
                  <p class="mt-0.5 font-mono text-sm font-semibold">{diff.years.toFixed(2)}</p>
                </div>
              </div>
              <p class="mt-3 border-t border-base-200 pt-3 text-xs opacity-55">
                周数按 7 天、月数按 30.44 天、年数按 365.25 天折算，属估算值；精确间隔请以天数为准。
              </p>
            </div>
          )}
        </section>
      ) : (
        <LunarConvert title="选择公历或农历日期，自动双向互转，并展示干支年、生肖与星期。" />
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        全部计算在浏览器本地完成，不会上传任何数据。公历与农历互转基于中国传统农历（1900-2100），自动处理闰年、闰月与跨年。
      </p>
    </div>
  );
}
