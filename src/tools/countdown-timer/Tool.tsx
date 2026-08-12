import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/** 把 Date 格式化成 datetime-local 输入框要的 YYYY-MM-DDTHH:mm（本地时区） */
function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 快捷目标：懒计算，保证"下一个"始终在未来 */
function presets(): { label: string; value: string }[] {
  const now = new Date();
  const y = now.getFullYear();
  // 元旦：今年的还没到就用今年，否则用明年
  const newYear = new Date(y, 0, 1, 0, 0, 0);
  if (newYear.getTime() <= now.getTime()) newYear.setFullYear(y + 1);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return [
    { label: '明天零点', value: toLocalInput(tomorrow) },
    { label: '一周后', value: toLocalInput(nextWeek) },
    { label: '一个月后', value: toLocalInput(nextMonth) },
    { label: `${newYear.getFullYear()} 元旦`, value: toLocalInput(newYear) },
  ];
}

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  totalMs: number;
}

function split(diffMs: number): Parts {
  const expired = diffMs <= 0;
  const ms = Math.abs(diffMs);
  const totalSec = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    expired,
    totalMs: ms,
  };
}

export default function CountdownTimer() {
  // 默认给一个 7 天后的目标，避免首屏空白
  const [target, setTarget] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(0, 0, 0, 0);
    return toLocalInput(d);
  });
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);

  // 每秒刷新一次「当前时间」，倒计时由 target - now 推导
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const quick = useMemo(() => presets(), []);

  const targetMs = useMemo(() => {
    if (!target) return NaN;
    const t = new Date(target).getTime();
    return Number.isNaN(t) ? NaN : t;
  }, [target]);

  const valid = !Number.isNaN(targetMs);
  const p = valid ? split(targetMs - now) : null;

  const summary = useMemo(() => {
    if (!p || !valid) return '';
    const when = new Date(targetMs).toLocaleString('zh-CN', { hour12: false });
    if (p.expired) {
      return `目标时间 ${when} 已过去 ${p.days} 天 ${p.hours} 小时 ${p.minutes} 分 ${p.seconds} 秒`;
    }
    return `距离 ${when} 还有 ${p.days} 天 ${p.hours} 小时 ${p.minutes} 分 ${p.seconds} 秒`;
  }, [p, targetMs, valid]);

  const copy = async (text: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const cell = (value: number, label: string) => (
    <div class="flex flex-col items-center rounded-xl bg-base-100 px-2 py-3 sm:px-4 sm:py-4 shadow-sm">
      <span class="font-mono text-2xl sm:text-4xl font-semibold tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span class="mt-1.5 text-[11px] sm:text-xs opacity-60">{label}</span>
    </div>
  );

  return (
    <div class="space-y-4">
      {/* 目标时间输入 */}
      <div>
        <label for="cd-target" class="block text-sm font-medium mb-1.5">
          目标日期时间
        </label>
        <input
          id="cd-target"
          type="datetime-local"
          class="input input-bordered input-sm w-full sm:max-w-xs"
          value={target}
          onInput={(e) => setTarget((e.target as HTMLInputElement).value)}
        />
        <div class="mt-2 flex flex-wrap gap-1.5">
          {quick.map((q) => (
            <button
              key={q.label}
              type="button"
              class="btn btn-xs btn-outline"
              onClick={() => setTarget(q.value)}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* 倒计时展示 */}
      {!valid && (
        <p class="text-sm text-error" role="alert">
          请选择一个有效的目标日期时间。
        </p>
      )}

      {valid && p && (
        <>
          <div class="rounded-xl bg-base-200 p-3 sm:p-4" aria-live="polite">
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span
                class={`badge badge-sm ${p.expired ? 'badge-error' : 'badge-primary'}`}
              >
                {p.expired ? '已到期' : '倒计时中'}
              </span>
              <span class="text-xs opacity-60">
                目标：{new Date(targetMs).toLocaleString('zh-CN', { hour12: false })}
              </span>
            </div>

            <div class="grid grid-cols-4 gap-2 sm:gap-3">
              {cell(p.days, '天')}
              {cell(p.hours, '小时')}
              {cell(p.minutes, '分')}
              {cell(p.seconds, '秒')}
            </div>

            {p.expired && (
              <p class="mt-3 text-sm text-center opacity-70">
                目标时间已经过去，上方显示的是已过去的时长。
              </p>
            )}
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
              onClick={() => copy(summary)}
            >
              {copied ? '已复制' : '复制倒计时文本'}
            </button>
            <span class="text-xs opacity-55">
              共 {Math.floor(p.totalMs / 1000).toLocaleString('zh-CN')} 秒
            </span>
          </div>
        </>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        倒计时按你设备的本地时区实时计算，每秒刷新一次，全部在浏览器本地完成，不上传任何数据。
      </p>
    </div>
  );
}
