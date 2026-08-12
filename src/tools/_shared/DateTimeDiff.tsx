import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { secondsToHms, fmtHms } from './time';

interface Props {
  title?: string;
}

function nowLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function DateTimeDiff({ title }: Props) {
  const [start, setStart] = useState(nowLocal());
  const [end, setEnd] = useState(nowLocal());
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
    const ms = e.getTime() - s.getTime();
    const absSec = Math.floor(Math.abs(ms) / 1000);
    return {
      reverse: ms < 0,
      absSec,
      hms: fmtHms(absSec),
      hours: (absSec / 3600).toFixed(2),
      minutes: (absSec / 60).toFixed(1),
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
          <span class="text-sm font-medium">开始时间</span>
          <input
            type="datetime-local"
            class="input input-bordered input-sm mt-1.5 w-full"
            value={start}
            onInput={(e) => setStart((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">结束时间</span>
          <input
            type="datetime-local"
            class="input input-bordered input-sm mt-1.5 w-full"
            value={end}
            onInput={(e) => setEnd((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      {!res && <p class="text-sm text-error">请选择两个有效时间</p>}

      {res && (
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <p class="flex-1 text-lg font-semibold">
              {res.reverse ? '结束早于开始 · ' : ''}时长 {res.hms}
            </p>
            <button
              type="button"
              class={`btn btn-xs shrink-0 ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(res.hms)}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <tbody>
                <tr>
                  <td class="opacity-60">总时长（时分秒）</td>
                  <td class="font-mono">{res.hms}</td>
                </tr>
                <tr>
                  <td class="opacity-60">总小时</td>
                  <td class="font-mono">{res.hours} 小时</td>
                </tr>
                <tr>
                  <td class="opacity-60">总分钟</td>
                  <td class="font-mono">{res.minutes} 分钟</td>
                </tr>
                <tr>
                  <td class="opacity-60">总秒数</td>
                  <td class="font-mono">{res.absSec} 秒</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        按自然时间精确计算，自动处理跨天、跨月与跨年。小时数可超过 24，用于表达连续总时长。
      </p>
    </div>
  );
}
