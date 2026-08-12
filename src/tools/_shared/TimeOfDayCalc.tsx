import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { parseTime, fmtTime, addHours } from './time';

interface Props {
  title?: string;
  intro?: string;
  defaultHours?: number;
}

export default function TimeOfDayCalc({ title, intro, defaultHours = 3 }: Props) {
  const [start, setStart] = useState('09:00');
  const [hours, setHours] = useState(String(defaultHours));
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const t = parseTime(start);
    const h = Number(hours);
    if (!t || !Number.isFinite(h)) return null;
    const r = addHours(t.h, t.m, h);
    return { ...r, text: fmtTime(r.h, r.m) };
  }, [start, hours]);

  const copy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const h = Number(hours);

  return (
    <div class="space-y-4">
      {title && <p class="text-sm opacity-70">{title}</p>}
      {intro && <p class="text-xs opacity-60">{intro}</p>}

      <div class="grid gap-3 rounded-xl bg-base-200 p-3 sm:grid-cols-2 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">起始时间（24 小时制）</span>
          <input
            type="time"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={start}
            onInput={(e) => setStart((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">加多少小时</span>
          <input
            type="number"
            step="0.5"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={hours}
            onInput={(e) => setHours((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      {!res && <p class="text-sm text-error">请填写有效的时间与小时数</p>}

      {res && (
        <div class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
          <div class="flex-1">
            <p class="text-xs opacity-60">
              {Number.isFinite(h) && h >= 0 ? `往后 ${h} 小时` : `往前 ${-h} 小时`}
            </p>
            <p class="text-lg font-semibold">{res.text}</p>
            {res.crossDays !== 0 && (
              <span class="badge badge-warning badge-sm mt-1">
                {res.crossDays > 0
                  ? `跨到次日（+${res.crossDays} 天）`
                  : `跨到前一天（${res.crossDays} 天）`}
              </span>
            )}
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
        自动处理跨越午夜的情况，全部在浏览器本地完成，不上传任何数据。
      </p>
    </div>
  );
}
