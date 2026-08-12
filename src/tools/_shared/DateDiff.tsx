import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { parseDate, toInputValue, fmtFull, daysBetween } from './dates';

interface Props {
  title?: string;
}

export default function DateDiff({ title }: Props) {
  const today = toInputValue(new Date());
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [copied, setCopied] = useState(false);

  const diff = useMemo(() => {
    const s = parseDate(start);
    const e = parseDate(end);
    if (!s || !e) return null;
    const days = daysBetween(s, e);
    const abs = Math.abs(days);
    return {
      days,
      abs,
      reverse: days < 0,
      weeks: (abs / 7).toFixed(2),
      months: (abs / 30.44).toFixed(2),
      years: (abs / 365.25).toFixed(2),
    };
  }, [start, end]);

  const copy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      {title && <p class="text-sm opacity-70">{title}</p>}

      <div class="grid gap-3 rounded-xl bg-base-200 p-3 sm:grid-cols-2 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">起始日期</span>
          <input
            type="date"
            class="input input-bordered input-sm mt-1.5 w-full"
            value={start}
            onInput={(e) => setStart((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">结束日期</span>
          <input
            type="date"
            class="input input-bordered input-sm mt-1.5 w-full"
            value={end}
            onInput={(e) => setEnd((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-xs btn-outline"
          onClick={() => {
            setStart(today);
            setEnd(today);
          }}
        >
          重置为今天
        </button>
        <button
          type="button"
          class="btn btn-xs btn-ghost"
          onClick={() => {
            const s = start;
            setStart(end);
            setEnd(s);
          }}
        >
          交换两端
        </button>
      </div>

      {!diff && <p class="text-sm text-error">请选择两个有效日期</p>}

      {diff && (
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <p class="flex-1 text-lg font-semibold">
              {diff.abs === 0
                ? '两个日期是同一天'
                : `相差 ${diff.abs} 天${diff.reverse ? '（结束早于起始）' : ''}`}
            </p>
            <button
              type="button"
              class={`btn btn-xs shrink-0 ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(`${diff.abs} 天`)}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <tbody>
                <tr>
                  <td class="opacity-60">天数</td>
                  <td class="font-mono">{diff.abs} 天</td>
                </tr>
                <tr>
                  <td class="opacity-60">周数</td>
                  <td class="font-mono">{diff.weeks} 周</td>
                </tr>
                <tr>
                  <td class="opacity-60">月数（约）</td>
                  <td class="font-mono">{diff.months} 个月</td>
                </tr>
                <tr>
                  <td class="opacity-60">年数（约）</td>
                  <td class="font-mono">{diff.years} 年</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        月数按 30.44 天、年数按 365.25 天折算，属于估算值；精确间隔请以天数为准。所有计算均在浏览器本地完成。
      </p>
    </div>
  );
}
