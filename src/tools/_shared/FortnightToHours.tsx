import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

interface Props {
  title?: string;
}

export default function FortnightToHours({ title }: Props) {
  const [days, setDays] = useState('14');
  const [extraH, setExtraH] = useState('0');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const d = Number(days);
    const h = Number(extraH);
    if (!Number.isFinite(d) || !Number.isFinite(h) || d < 0 || h < 0) return null;
    const hours = d * 24 + h;
    return { hours, minutes: hours * 60 };
  }, [days, extraH]);

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
          <span class="text-sm font-medium">天数</span>
          <input
            type="number"
            min="0"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={days}
            onInput={(e) => setDays((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">额外小时（可选）</span>
          <input
            type="number"
            min="0"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={extraH}
            onInput={(e) => setExtraH((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      {!res && <p class="text-sm text-error">请输入有效的非负天数与小时</p>}

      {res && (
        <div class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
          <div class="flex-1">
            <p class="text-xs opacity-60">总时长</p>
            <p class="text-lg font-semibold">{res.hours} 小时</p>
            <code class="font-mono text-sm opacity-70">{res.minutes} 分钟</code>
          </div>
          <button
            type="button"
            class={`btn btn-xs shrink-0 ${copied ? 'btn-success' : 'btn-ghost'}`}
            onClick={() => copy(`${res.hours} 小时`)}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      )}

      <p class="text-xs opacity-55">按「小时 = 天数 × 24」换算，全部本地计算。</p>
    </div>
  );
}
