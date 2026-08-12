import { useState, useMemo, useEffect, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Unit = 's' | 'ms';

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0');
}

/** 本地时间，YYYY-MM-DD HH:mm:ss.SSS 周X */
function fmtLocal(d: Date): string {
  const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)} ` +
    `周${wd}`
  );
}

function fmtUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)} ` +
    `UTC`
  );
}

export default function TimestampConverter() {
  const [unit, setUnit] = useState<Unit>('s');
  const [ts, setTs] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  // 时间戳 → 日期
  const tsResult = useMemo(() => {
    const v = ts.trim();
    if (v === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isSafeInteger(n)) {
      return { error: '请输入有效的整数时间戳' };
    }
    const ms = unit === 's' ? n * 1000 : n;
    const d = new Date(ms);
    if (!Number.isFinite(d.getTime())) return { error: '时间戳超出可表示范围' };
    return { date: d };
  }, [ts, unit]);

  // 日期 → 时间戳
  const dateResult = useMemo(() => {
    const v = dateStr.trim();
    if (v === '') return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return { error: '请输入有效的日期时间' };
    const out = unit === 's' ? Math.floor(d.getTime() / 1000) : d.getTime();
    return { ts: out };
  }, [dateStr, unit]);

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const useNow = () => {
    setUnit('s');
    setTs(String(Math.floor(Date.now() / 1000)));
  };

  return (
    <div class="space-y-5">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium">时间单位</span>
        <div class="join">
          <button
            type="button"
            class={`btn btn-sm join-item ${unit === 's' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setUnit('s')}
          >
            秒 (s)
          </button>
          <button
            type="button"
            class={`btn btn-sm join-item ${unit === 'ms' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setUnit('ms')}
          >
            毫秒 (ms)
          </button>
        </div>
      </div>

      {/* 时间戳 → 日期 */}
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="text-sm font-medium" for="ts-input">
          时间戳 → 日期
        </label>
        <div class="mt-2 flex gap-2">
          <input
            id="ts-input"
            type="text"
            inputmode="numeric"
            class="input input-bordered flex-1 font-mono"
            placeholder="例如 1762000000"
            value={ts}
            onInput={(e) => setTs((e.target as HTMLInputElement).value)}
          />
          <button type="button" class="btn btn-sm btn-outline shrink-0" onClick={useNow}>
            用当前时间
          </button>
        </div>
        {tsResult && 'error' in tsResult && (
          <p class="mt-2 text-sm text-error">{tsResult.error}</p>
        )}
        {tsResult && 'date' in tsResult && (
          <div class="mt-3 space-y-1.5 text-sm">
            <div class="flex items-center gap-2">
              <span class="opacity-60 w-16 shrink-0">本地时间</span>
              <code class="font-mono break-all flex-1">{fmtLocal(tsResult.date)}</code>
              <button
                type="button"
                class={`btn btn-xs shrink-0 ${copied === 'local' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(fmtLocal(tsResult.date), 'local')}
              >
                {copied === 'local' ? '已复制' : '复制'}
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span class="opacity-60 w-16 shrink-0">UTC</span>
              <code class="font-mono break-all flex-1">{fmtUtc(tsResult.date)}</code>
              <button
                type="button"
                class={`btn btn-xs shrink-0 ${copied === 'utc' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(fmtUtc(tsResult.date), 'utc')}
              >
                {copied === 'utc' ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 日期 → 时间戳 */}
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="text-sm font-medium" for="date-input">
          日期 → 时间戳
        </label>
        <div class="mt-2 flex gap-2">
          <input
            id="date-input"
            type="text"
            class="input input-bordered flex-1 font-mono"
            placeholder="例如 2026-08-04 12:00:00"
            value={dateStr}
            onInput={(e) => setDateStr((e.target as HTMLInputElement).value)}
          />
        </div>
        <p class="mt-1.5 text-xs opacity-55">
          支持本地时间字符串，如 2026-08-04 12:00:00 或 ISO 格式 2026-08-04T12:00:00。
        </p>
        {dateResult && 'error' in dateResult && (
          <p class="mt-2 text-sm text-error">{dateResult.error}</p>
        )}
        {dateResult && 'ts' in dateResult && (
          <div class="mt-3 flex items-center gap-2">
            <code class="font-mono break-all flex-1">{dateResult.ts}</code>
            <button
              type="button"
              class={`btn btn-xs shrink-0 ${copied === 'ts' ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(String(dateResult.ts), 'ts')}
            >
              {copied === 'ts' ? '已复制' : '复制'}
            </button>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算都在你的浏览器本地完成，不依赖服务器。Unix 时间戳是从 1970-01-01 00:00:00
        UTC 起经过的秒数（或毫秒）。
      </p>
    </div>
  );
}
