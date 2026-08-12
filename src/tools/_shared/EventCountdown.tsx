import { useState, useMemo, useEffect } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

interface Props {
  title?: string;
  intro?: string;
  defaultTarget?: string;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export default function EventCountdown({
  title,
  intro,
  defaultTarget = '2026-12-31T00:00',
}: Props) {
  const [target, setTarget] = useState(defaultTarget);
  const [now, setNow] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const res = useMemo(() => {
    if (now === null) return null;
    const t = new Date(target).getTime();
    if (isNaN(t)) return null;
    const ms = t - now;
    const past = ms < 0;
    const abs = Math.abs(ms);
    const days = Math.floor(abs / 86400000);
    const rem = abs - days * 86400000;
    const h = Math.floor(rem / 3600000);
    const m = Math.floor((rem % 3600000) / 60000);
    const s = Math.floor((rem % 60000) / 1000);
    const years = Math.floor(days / 365.25);
    const months = Math.floor((days - years * 365.25) / 30.44);
    return { past, days, h, m, s, years, months };
  }, [target, now]);

  const copy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      {title && <p class="text-sm opacity-70">{title}</p>}
      {intro && <p class="text-xs opacity-60">{intro}</p>}

      <label class="block">
        <span class="text-sm font-medium">目标日期与时间</span>
        <input
          type="datetime-local"
          class="input input-bordered input-sm mt-1.5 w-full"
          value={target}
          onInput={(e) => setTarget((e.target as HTMLInputElement).value)}
        />
      </label>

      {res && (
        <div class="space-y-3">
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[
              ['年', res.years],
              ['月', res.months],
              ['天', res.days],
              ['时', res.h],
              ['分', res.m],
              ['秒', res.s],
            ].map(([label, val]) => (
              <div class="rounded-xl bg-base-100 p-3 text-center">
                <p class="text-2xl font-semibold tabular-nums">{pad(Number(val))}</p>
                <p class="text-xs opacity-60">{label}</p>
              </div>
            ))}
          </div>
          <p class="text-xs opacity-60 text-center">
            {res.past ? '该时刻已过去' : '距离目标时刻还剩'}
          </p>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={() =>
              copy(
                `${res.years}年${res.months}月${res.days}天 ${pad(res.h)}:${pad(res.m)}:${pad(res.s)}`,
              )
            }
          >
            {copied ? '已复制' : '复制倒计时'}
          </button>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        倒计时按本地时区实时刷新（每秒）。年/月为按均值的近似口径，天及以下为精确值。全部本地计算。
      </p>
    </div>
  );
}
