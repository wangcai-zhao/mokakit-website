import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const DAY_MS = 86400000;
const WEEK_LABEL = ['日', '一', '二', '三', '四', '五', '六'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

/** 某年某月的天数，month 为 0-11 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
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
    };

export default function AgeCalculator() {
  const [birth, setBirth] = useState('2000-01-01');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

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
    const raw = new Date();
    const now = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
    if (b.getTime() > now.getTime()) return { ok: false, error: '出生日期不能晚于今天' };

    let y = now.getFullYear() - b.getFullYear();
    let mo = now.getMonth() - b.getMonth();
    let d = now.getDate() - b.getDate();
    if (d < 0) {
      mo -= 1;
      d += daysInMonth(now.getFullYear(), now.getMonth() - 1);
    }
    if (mo < 0) {
      mo += 12;
      y -= 1;
    }

    const totalDays = Math.round((now.getTime() - b.getTime()) / DAY_MS);

    const bm = b.getMonth();
    const bd = b.getDate();
    const birthdayIn = (year: number) =>
      new Date(year, bm, Math.min(bd, daysInMonth(year, bm)));

    const thisYear = birthdayIn(now.getFullYear());
    const isToday = thisYear.getTime() === now.getTime();
    const passed = thisYear.getTime() < now.getTime();
    const next = passed ? birthdayIn(now.getFullYear() + 1) : thisYear;
    const daysToNext = Math.round((next.getTime() - now.getTime()) / DAY_MS);

    return {
      ok: true,
      y,
      mo,
      d,
      totalDays,
      totalWeeks: Math.floor(totalDays / 7),
      isToday,
      passed,
      next,
      daysToNext,
      nextAge: y + 1,
    };
  }, [birth]);

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
            max={toInputValue(new Date())}
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
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        计算的是周岁（国际通用实际年龄），以本机当前日期为基准。闰年 2 月 29
        日出生者在平年按 2 月最后一天推算下次生日。所有计算在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
