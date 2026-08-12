import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { fmtTime, addHours } from './time';

interface Props {
  title?: string;
  intro?: string;
  offsetHours: number;
  targetName: string;
  targetAbbr: string;
}

export default function UtcConvert({
  title,
  intro,
  offsetHours,
  targetName,
  targetAbbr,
}: Props) {
  const [h, setH] = useState('12');
  const [m, setM] = useState('00');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const hh = Number(h);
    const mm = Number(m);
    if (
      !Number.isFinite(hh) ||
      !Number.isFinite(mm) ||
      hh < 0 ||
      hh > 23 ||
      mm < 0 ||
      mm > 59
    )
      return null;
    const r = addHours(hh, mm, offsetHours);
    return { ...r, text: fmtTime(r.h, r.m) };
  }, [h, m, offsetHours]);

  const copy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const dayLabel = res
    ? res.crossDays > 0
      ? `次日（相对 UTC 跨 +${res.crossDays} 天）`
      : res.crossDays < 0
        ? `前一天（相对 UTC 跨 ${res.crossDays} 天）`
        : '当天'
    : '';

  const off = offsetHours >= 0 ? `+${offsetHours}` : `${offsetHours}`;

  return (
    <div class="space-y-4">
      {title && <p class="text-sm opacity-70">{title}</p>}
      {intro && <p class="text-xs opacity-60">{intro}</p>}

      <div class="grid gap-3 rounded-xl bg-base-200 p-3 sm:grid-cols-2 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">UTC 小时（0-23）</span>
          <input
            type="number"
            min="0"
            max="23"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={h}
            onInput={(e) => setH((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">UTC 分钟（0-59）</span>
          <input
            type="number"
            min="0"
            max="59"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={m}
            onInput={(e) => setM((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      {!res && (
        <p class="text-sm text-error">
          请输入有效的 UTC 小时（0-23）与分钟（0-59）
        </p>
      )}

      {res && (
        <div class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
          <div class="flex-1">
            <p class="text-xs opacity-60">
              {targetName}（{targetAbbr}，UTC{off}）
            </p>
            <p class="text-lg font-semibold">{res.text}</p>
            <span class="badge badge-warning badge-sm mt-1">{dayLabel}</span>
          </div>
          <button
            type="button"
            class={`btn btn-xs shrink-0 ${copied ? 'btn-success' : 'btn-ghost'}`}
            onClick={() => copy(res.text)}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        按固定时区偏移换算，未考虑夏令时的临时调整；全部在浏览器本地完成，不上传数据。
      </p>
    </div>
  );
}
