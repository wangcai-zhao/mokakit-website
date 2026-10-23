import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { parseDate, fmtFull, toInputValue, WEEK_LABEL } from './dates';
import {
  lunarToSolar,
  solarToLunar,
  leapMonth,
  ganzhiOfYear,
  zodiacOfYear,
  lunarMonthCN,
  lunarDayCN,
  yearToCN,
} from './calendars';

type Dir = 's2l' | 'l2s';

interface Props {
  title?: string;
}

export default function LunarConvert({ title }: Props) {
  const today = toInputValue(new Date());
  const [dir, setDir] = useState<Dir>('s2l');

  // 阳历 → 阴历
  const [solar, setSolar] = useState(today);

  // 阴历 → 阳历
  const [ly, setLy] = useState('2026');
  const [lm, setLm] = useState('1');
  const [ld, setLd] = useState('1');
  const [isLeap, setIsLeap] = useState(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimer = useRef<number | undefined>(undefined);

  const flashCopy = (key: string, text: string) => {
    void copyText(text);
    setCopiedKey(key);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopiedKey(null), 1800);
  };

  // 阳历 → 阴历
  const s2l = useMemo(() => {
    const d = parseDate(solar);
    if (!d) return { error: '请选择有效的公历日期（支持 1900-2100）' } as const;
    const r = solarToLunar(d);
    if (!r) return { error: '该日期超出农历换算范围（支持 1900-2100）' } as const;
    return { error: null, r, solar: d } as const;
  }, [solar]);

  // 阴历 → 阳历
  const leapNum = useMemo(() => {
    const y = Number(ly);
    if (!Number.isFinite(y) || y < 1900 || y > 2100) return 0;
    return leapMonth(y);
  }, [ly]);

  const l2s = useMemo(() => {
    const y = Number(ly);
    const m = Number(lm);
    const d = Number(ld);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      return { error: '请输入合法的农历年月日' } as const;
    }
    const res = lunarToSolar(y, m, d, isLeap);
    if (!res) {
      return {
        error: '请输入合法的农历日期（年份 1900-2100；闰月须是该年真实存在的闰月）',
      } as const;
    }
    return { error: null, res } as const;
  }, [ly, lm, ld, isLeap]);

  return (
    <div class="space-y-4">
      {title && <p class="text-sm opacity-70">{title}</p>}

      {/* 方向切换 */}
      <div class="tabs tabs-boxed bg-base-200/60 p-1 w-full max-w-sm">
        <button
          type="button"
          class={`tab flex-1 ${dir === 's2l' ? 'tab-active' : ''}`}
          onClick={() => setDir('s2l')}
        >
          阳历转阴历
        </button>
        <button
          type="button"
          class={`tab flex-1 ${dir === 'l2s' ? 'tab-active' : ''}`}
          onClick={() => setDir('l2s')}
        >
          阴历转阳历
        </button>
      </div>

      {dir === 's2l' ? (
        <section class="space-y-4">
          <label class="block">
            <span class="text-sm font-medium">公历（阳历）日期</span>
            <input
              type="date"
              class="input input-bordered input-md mt-1.5 w-full"
              value={solar}
              max="2100-12-31"
              min="1900-01-01"
              onInput={(e) => setSolar((e.target as HTMLInputElement).value)}
            />
          </label>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn btn-sm btn-ghost" onClick={() => setSolar(today)}>
              设为今天
            </button>
          </div>

          {s2l.error && (
            <p class="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{s2l.error}</p>
          )}

          {!s2l.error && s2l.r && (
            <div class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs opacity-60">
                    农历 {yearToCN(s2l.r.ly)} 年（{ganzhiOfYear(s2l.r.ly)}年 · {zodiacOfYear(s2l.r.ly)}）
                  </p>
                  <p class="mt-1 text-2xl font-bold leading-tight">
                    {lunarMonthCN(s2l.r.lm, s2l.r.isLeap)}月{lunarDayCN(s2l.r.ld)}
                  </p>
                  <p class="mt-1 text-sm opacity-70">
                    {toInputValue(s2l.solar!)} · 星期{WEEK_LABEL[s2l.solar!.getDay()]}
                  </p>
                </div>
                <button
                  type="button"
                  class={`btn btn-sm shrink-0 ${copiedKey === 's2l' ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() =>
                    flashCopy(
                      's2l',
                      `农历${yearToCN(s2l.r.ly)}年${lunarMonthCN(s2l.r.lm, s2l.r.isLeap)}月${lunarDayCN(s2l.r.ld)}（${ganzhiOfYear(s2l.r.ly)}年 ${zodiacOfYear(s2l.r.ly)}）`,
                    )
                  }
                >
                  {copiedKey === 's2l' ? '已复制' : '复制'}
                </button>
              </div>
              <div class="mt-3 grid grid-cols-3 gap-2">
                <div class="rounded-lg bg-base-200/70 p-3 text-center">
                  <p class="text-[11px] opacity-60">干支年</p>
                  <p class="mt-0.5 font-mono text-sm font-semibold">{ganzhiOfYear(s2l.r.ly)}</p>
                </div>
                <div class="rounded-lg bg-base-200/70 p-3 text-center">
                  <p class="text-[11px] opacity-60">生肖</p>
                  <p class="mt-0.5 text-sm font-semibold">{zodiacOfYear(s2l.r.ly)}</p>
                </div>
                <div class="rounded-lg bg-base-200/70 p-3 text-center">
                  <p class="text-[11px] opacity-60">公历</p>
                  <p class="mt-0.5 font-mono text-sm font-semibold">{toInputValue(s2l.solar!)}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section class="space-y-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium">农历年份</span>
              <input
                type="number"
                class="input input-bordered input-md mt-1.5 w-full font-mono"
                value={ly}
                min="1900"
                max="2100"
                onInput={(e) => setLy((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">农历月份（1-12）</span>
              <input
                type="number"
                min="1"
                max="12"
                class="input input-bordered input-md mt-1.5 w-full font-mono"
                value={lm}
                onInput={(e) => setLm((e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium">农历日（1-30）</span>
              <input
                type="number"
                min="1"
                max="30"
                class="input input-bordered input-md mt-1.5 w-full font-mono"
                value={ld}
                onInput={(e) => setLd((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">是否闰月</span>
              <div class="mt-2">
                <label class="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    checked={isLeap}
                    disabled={leapNum === 0}
                    onChange={(e) => setIsLeap((e.target as HTMLInputElement).checked)}
                  />
                  <span class="text-sm">
                    {leapNum === 0 ? '该年无闰月' : `闰${leapNum}月可用`}
                  </span>
                </label>
              </div>
            </label>
          </div>

          {l2s.error && (
            <p class="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{l2s.error}</p>
          )}

          {!l2s.error && (
            <div class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs opacity-60">公历（阳历）</p>
                  <p class="mt-1 text-2xl font-bold leading-tight">{fmtFull(l2s.res!)}</p>
                  <p class="mt-1 text-sm opacity-70">
                    {toInputValue(l2s.res!)} · 星期{WEEK_LABEL[l2s.res!.getDay()]}
                  </p>
                </div>
                <button
                  type="button"
                  class={`btn btn-sm shrink-0 ${copiedKey === 'l2s' ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => flashCopy('l2s', toInputValue(l2s.res!))}
                >
                  {copiedKey === 'l2s' ? '已复制' : '复制'}
                </button>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-2">
                <div class="rounded-lg bg-base-200/70 p-3 text-center">
                  <p class="text-[11px] opacity-60">农历</p>
                  <p class="mt-0.5 text-sm font-semibold">
                    {yearToCN(Number(ly))}年{lunarMonthCN(Number(lm), isLeap)}月{lunarDayCN(Number(ld))}
                  </p>
                </div>
                <div class="rounded-lg bg-base-200/70 p-3 text-center">
                  <p class="text-[11px] opacity-60">干支 · 生肖</p>
                  <p class="mt-0.5 text-sm font-semibold">
                    {ganzhiOfYear(Number(ly))} · {zodiacOfYear(Number(ly))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        基于中国传统农历（1900-2100），闰月按当年实际安排。公历→农历与农历→公历双向互转，全部在浏览器本地计算。
      </p>
    </div>
  );
}
