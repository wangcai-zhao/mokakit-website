import { useState, useMemo, useRef, useEffect } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import {
  calcAge,
  totalDays,
  nextBirthdayInfo,
  milestoneDates,
  nextMilestone,
  fmtAge,
} from '@/lib/age';

const WEEK_LABEL = ['日', '一', '二', '三', '四', '五', '六'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayStr(): string {
  return toInputValue(new Date());
}

function parseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const d = new Date(y, mo - 1, da);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) return null;
  return d;
}

function fmtFull(d: Date): string {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 周${WEEK_LABEL[d.getDay()]}`;
}

type Result =
  | { ok: false; error: string }
  | {
      ok: true;
      y: number;
      mo: number;
      d: number;
      totalDays: number;
      totalWeeks: number;
      isToday: boolean;
      passed: boolean;
      next: Date;
      daysToNext: number;
      nextAge: number;
      milestones: ReturnType<typeof milestoneDates>;
      nextMilestone: ReturnType<typeof nextMilestone>;
    };

export default function AgeCalculator() {
  const [birth, setBirth] = useState('2000-01-01');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  // 「今天」提为 state：页面挂过 0 点后定时刷新，避免总天数 / 倒计时停摆一天
  const [today, setToday] = useState(todayStr);

  useEffect(() => {
    const tick = () => setToday((t) => (t === todayStr() ? t : todayStr()));
    const id = window.setInterval(tick, 30000); // 轻量比对日期串，跨零点即重算
    document.addEventListener('visibilitychange', tick); // 从后台切回也立即比对
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const result = useMemo<Result | null>(() => {
    const b = parseDate(birth);
    if (!b) return null;
    const now = parseDate(today) ?? new Date();
    if (b.getTime() > now.getTime()) return { ok: false, error: '出生日期不能晚于今天' };

    const age = calcAge(b, now);
    const td = totalDays(b, now);
    const nb = nextBirthdayInfo(b, now);
    return {
      ok: true,
      y: age.y,
      mo: age.mo,
      d: age.d,
      totalDays: td,
      totalWeeks: Math.floor(td / 7),
      isToday: nb.isToday,
      passed: nb.passed,
      next: nb.next,
      daysToNext: nb.days,
      nextAge: nb.nextAge,
      milestones: milestoneDates(b, now),
      nextMilestone: nextMilestone(b, now),
    };
  }, [birth, today]);

  const summary =
    result && result.ok
      ? `出生于 ${birth}，现在 ${result.y} 岁 ${result.mo} 个月零 ${result.d} 天，共 ${result.totalDays} 天`
      : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">出生日期</span>
          <input
            type="date"
            class="input input-bordered input-sm mt-1.5 w-full sm:max-w-xs"
            max={today}
            value={birth}
            onInput={(e) => setBirth((e.target as HTMLInputElement).value)}
          />
        </label>

        {!result && <p class="mt-3 text-sm text-error">请选择有效的出生日期</p>}
        {result && !result.ok && <p class="mt-3 text-sm text-error">{result.error}</p>}

        {result && result.ok && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <p class="text-3xl font-bold">
                <span class="font-mono">{result.y}</span> 岁
                <span class="font-mono ml-2">{result.mo}</span> 个月零
                <span class="font-mono ml-2">{result.d}</span> 天
              </p>
              <button
                type="button"
                class={`btn btn-xs ml-auto mb-1 ${copied === 'age' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(summary, 'age')}
              >
                {copied === 'age' ? '已复制' : '复制结果'}
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              {result.isToday ? (
                <span class="badge badge-success">今天就是你的生日，生日快乐</span>
              ) : result.passed ? (
                <span class="badge badge-ghost">今年生日已过</span>
              ) : (
                <span class="badge badge-info">今年生日还没到</span>
              )}
              {!result.isToday && (
                <span class="badge badge-outline">距下次生日 {result.daysToNext} 天</span>
              )}
            </div>

            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">已度过天数</td>
                    <td class="font-mono text-right">{result.totalDays} 天</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">已度过周数</td>
                    <td class="font-mono text-right">{result.totalWeeks} 周</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">下次生日</td>
                    <td class="text-right">{fmtFull(result.next)}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">届时年龄</td>
                    <td class="font-mono text-right">
                      {result.isToday ? result.y : result.nextAge} 岁
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <div class="text-sm font-medium mb-1.5">人生万天里程碑</div>
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>里程碑</th>
                      <th class="text-right">日期</th>
                      <th class="text-right">当天周岁</th>
                      <th class="text-right">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.milestones.map((m) => (
                      <tr key={m.n}>
                        <td class="font-mono">{m.n.toLocaleString('en-US')} 天</td>
                        <td class="text-right">{fmtFull(m.date)}</td>
                        <td class="text-right">{fmtAge(m.age)}</td>
                        <td class="text-right">
                          {m.passed ? (
                            <span class="badge badge-success badge-sm">
                              已达成 · {m.daysAgo} 天前
                            </span>
                          ) : result.nextMilestone?.n === m.n ? (
                            <span class="badge badge-primary badge-sm">还有 {m.daysAgo === 0 ? 0 : -m.daysAgo} 天</span>
                          ) : (
                            <span class="opacity-60">还有 {-m.daysAgo} 天</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        计算的是周岁（国际通用实际年龄），以本机当前日期为基准。闰年 2 月 29
        日出生者在平年按 2 月最后一天推算下次生日。万天里程碑按日历天累加，从出生日起算。所有计算在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
