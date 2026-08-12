import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const DAY_MS = 86400000;
const WEEK_LABEL = ['日', '一', '二', '三', '四', '五', '六'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Date → YYYY-MM-DD，用于 <input type="date"> */
function toInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 解析 YYYY-MM-DD，非法日期（如 2 月 30 日）返回 null */
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

/** 友好描述，如「相差 123 天，约 4.0 个月」 */
function friendly(abs: number): string {
  if (abs === 0) return '两个日期是同一天';
  if (abs >= 365) return `相差 ${abs} 天，约 ${(abs / 365.25).toFixed(1)} 年`;
  if (abs >= 31) return `相差 ${abs} 天，约 ${(abs / 30.44).toFixed(1)} 个月`;
  if (abs >= 7) return `相差 ${abs} 天，约 ${(abs / 7).toFixed(1)} 周`;
  return `相差 ${abs} 天`;
}

type Mode = 'diff' | 'shift';

export default function DateCalculator() {
  const today = toInputValue(new Date());
  const [mode, setMode] = useState<Mode>('diff');
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [base, setBase] = useState(today);
  const [offset, setOffset] = useState('30');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const diff = useMemo(() => {
    const s = parseDate(start);
    const e = parseDate(end);
    if (!s || !e) return null;
    const days = Math.round((e.getTime() - s.getTime()) / DAY_MS);
    const abs = Math.abs(days);
    return {
      days,
      abs,
      text: friendly(abs),
      weeks: (abs / 7).toFixed(2),
      months: (abs / 30.44).toFixed(2),
      years: (abs / 365.25).toFixed(2),
      reverse: days < 0,
    };
  }, [start, end]);

  const shifted = useMemo(() => {
    const b = parseDate(base);
    if (!b) return null;
    const raw = offset.trim();
    if (raw === '' || raw === '-') return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const r = new Date(b.getTime());
    r.setDate(r.getDate() + Math.trunc(n));
    return { date: r, n: Math.trunc(n) };
  }, [base, offset]);

  return (
    <div class="space-y-5">
      <div class="join">
        <button
          type="button"
          class={`btn btn-sm join-item ${mode === 'diff' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setMode('diff')}
        >
          日期相差
        </button>
        <button
          type="button"
          class={`btn btn-sm join-item ${mode === 'shift' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setMode('shift')}
        >
          日期加减
        </button>
      </div>

      {mode === 'diff' && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <div class="grid gap-3 sm:grid-cols-2">
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

          <div class="mt-3 flex flex-wrap gap-2">
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

          {!diff && <p class="mt-3 text-sm text-error">请选择两个有效日期</p>}

          {diff && (
            <div class="mt-4 space-y-3">
              <div class="flex items-center gap-2">
                <p class="flex-1 text-lg font-semibold">{diff.text}</p>
                <button
                  type="button"
                  class={`btn btn-xs shrink-0 ${copied === 'diff' ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => copy(diff.text, 'diff')}
                >
                  {copied === 'diff' ? '已复制' : '复制'}
                </button>
              </div>
              {diff.reverse && (
                <span class="badge badge-warning badge-sm">结束日期早于起始日期</span>
              )}
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
        </div>
      )}

      {mode === 'shift' && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium">基准日期</span>
              <input
                type="date"
                class="input input-bordered input-sm mt-1.5 w-full"
                value={base}
                onInput={(e) => setBase((e.target as HTMLInputElement).value)}
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">加减天数（负数往前推）</span>
              <input
                type="number"
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                placeholder="例如 30 或 -15"
                value={offset}
                onInput={(e) => setOffset((e.target as HTMLInputElement).value)}
              />
            </label>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            {[7, 30, 90, 365].map((n) => (
              <button
                type="button"
                class="btn btn-xs btn-outline"
                onClick={() => setOffset(String(n))}
              >
                +{n} 天
              </button>
            ))}
          </div>

          {!shifted && <p class="mt-3 text-sm text-error">请填写有效的日期与天数</p>}

          {shifted && (
            <div class="mt-4 flex items-center gap-2">
              <div class="flex-1">
                <p class="text-xs opacity-60">
                  {shifted.n >= 0 ? `往后 ${shifted.n} 天` : `往前 ${-shifted.n} 天`}
                </p>
                <p class="text-lg font-semibold">{fmtFull(shifted.date)}</p>
                <code class="font-mono text-sm opacity-70">{toInputValue(shifted.date)}</code>
              </div>
              <button
                type="button"
                class={`btn btn-xs shrink-0 ${copied === 'shift' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(toInputValue(shifted.date), 'shift')}
              >
                {copied === 'shift' ? '已复制' : '复制'}
              </button>
            </div>
          )}
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        月数按 30.44 天、年数按 365.25 天折算，属于估算值；精确间隔请以天数为准。所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
