import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { parseTime, fmtHms, hmsToSeconds } from './time';

interface Props {
  title?: string;
}

const SPEEDS = [1.25, 1.5, 2, 0.75];

export default function VideoSpeed({ title }: Props) {
  const [dur, setDur] = useState('02:00:00');
  const [speed, setSpeed] = useState('1.5');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const t = parseTime(dur);
    const sp = Number(speed);
    if (!t || !Number.isFinite(sp) || sp <= 0) return null;
    const totalSec = hmsToSeconds(t);
    const watchSec = totalSec / sp;
    const savedSec = totalSec - watchSec;
    return {
      watch: fmtHms(watchSec),
      saved: fmtHms(savedSec),
      watchSec,
      savedSec,
    };
  }, [dur, speed]);

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
          <span class="text-sm font-medium">视频时长（时:分:秒）</span>
          <input
            type="text"
            placeholder="02:00:00"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={dur}
            onInput={(e) => setDur((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">倍速</span>
          <input
            type="number"
            step="0.05"
            min="0.1"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={speed}
            onInput={(e) => setSpeed((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <div class="flex flex-wrap gap-2">
        {SPEEDS.map((s) => (
          <button
            type="button"
            class="btn btn-xs btn-outline"
            onClick={() => setSpeed(String(s))}
          >
            {s}×
          </button>
        ))}
      </div>

      {!res && <p class="text-sm text-error">请输入有效的时长（时:分:秒）与倍速</p>}

      {res && (
        <div class="space-y-3">
          <div class="flex items-center gap-2 rounded-xl bg-base-100 p-3">
            <div class="flex-1">
              <p class="text-xs opacity-60">以 {speed}× 看完需要</p>
              <p class="text-lg font-semibold">{res.watch}</p>
              <code class="font-mono text-sm opacity-70">{(res.watchSec / 60).toFixed(1)} 分钟</code>
            </div>
            <button
              type="button"
              class={`btn btn-xs shrink-0 ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(res.watch)}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <div class="rounded-xl bg-base-200 p-3">
            <p class="text-xs opacity-60">比原速节省</p>
            <p class="text-lg font-semibold">{res.saved}</p>
            <code class="font-mono text-sm opacity-70">{(res.savedSec / 60).toFixed(1)} 分钟</code>
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        观看时长 = 原时长 ÷ 倍速，节省时长 = 原时长 − 观看时长。全部本地计算。
      </p>
    </div>
  );
}
