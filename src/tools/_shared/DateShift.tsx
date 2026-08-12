import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import {
  parseDate,
  toInputValue,
  fmtFull,
  addDays,
  addWeeks,
  addMonths,
} from './dates';

interface Props {
  title?: string;
  intro?: string;
  defaultOffset?: number;
  presets?: number[];
  unit?: 'day' | 'week' | 'month';
  unitLabel?: string;
}

export default function DateShift({
  title,
  intro,
  defaultOffset = 30,
  presets = [7, 30, 90, 365],
  unit = 'day',
  unitLabel = '天',
}: Props) {
  const today = toInputValue(new Date());
  const [base, setBase] = useState(today);
  const [offset, setOffset] = useState(String(defaultOffset));
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const shift = useMemo(() => {
    const b = parseDate(base);
    if (!b) return null;
    const raw = offset.trim();
    if (raw === '' || raw === '-' || raw === '+') return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return unit === 'day'
      ? addDays(b, n)
      : unit === 'week'
        ? addWeeks(b, n)
        : addMonths(b, n);
  }, [base, offset, unit]);

  const copy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const n = Number(offset);

  return (
    <div class="space-y-4">
      {title && <p class="text-sm opacity-70">{title}</p>}
      {intro && <p class="text-xs opacity-60">{intro}</p>}

      <div class="grid gap-3 rounded-xl bg-base-200 p-3 sm:grid-cols-2 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">基准日期</span>
          <input
            type="date"
            class="input input-bordered input-sm mt-1.5 w-full"
            value={base}
            onInput={(e) => setBase((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">加减{unitLabel}（负数往前推）</span>
          <input
            type="number"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={offset}
            onInput={(e) => setOffset((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <div class="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            type="button"
            class="btn btn-xs btn-outline"
            onClick={() => setOffset(String(p))}
          >
            {p > 0 ? `+${p}` : p} {unitLabel}
          </button>
        ))}
        <button
          type="button"
          class="btn btn-xs btn-ghost"
          onClick={() => setBase(today)}
        >
          重置为今天
        </button>
      </div>

      {!shift && <p class="text-sm text-error">请填写有效的日期与{unitLabel}数</p>}

      {shift && (
        <div class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
          <div class="flex-1">
            <p class="text-xs opacity-60">
              {Number.isFinite(n) && n >= 0
                ? `往后 ${n} ${unitLabel}`
                : `往前 ${-n} ${unitLabel}`}
            </p>
            <p class="text-lg font-semibold">{fmtFull(shift)}</p>
            <code class="font-mono text-sm opacity-70">{toInputValue(shift)}</code>
          </div>
          <button
            type="button"
            class={`btn btn-xs shrink-0 ${copied ? 'btn-success' : 'btn-ghost'}`}
            onClick={() => copy(toInputValue(shift))}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        计算自动处理跨月、跨年与闰年二月，全部在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
