import { useState, useRef, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/**
 * 在 [0, max) 内取一个加密级随机整数。
 *
 * 不能直接 `random % max`，那会产生取模偏差（modulo bias），
 * 让区间前段的数字出现概率偏高。这里用拒绝采样丢弃落在不完整区间的取样值。
 */
function randomBelow(max: number): number {
  if (max <= 1) return 0;
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0]!;
  } while (v >= limit);
  return v % max;
}

/** 在 [min, max] 闭区间内取一个随机整数 */
function randomInt(min: number, max: number): number {
  return min + randomBelow(max - min + 1);
}

/** 不重复取样：区间小时用洗牌，区间大时用集合去重，避免浪费内存 */
function sampleUnique(min: number, max: number, count: number): number[] {
  const span = max - min + 1;
  if (span <= 100000) {
    const pool = Array.from({ length: span }, (_, i) => min + i);
    // Fisher-Yates 部分洗牌，只洗前 count 个位置即可
    for (let i = 0; i < count; i++) {
      const j = i + randomBelow(span - i);
      const a = pool[i]!;
      const b = pool[j]!;
      pool[i] = b;
      pool[j] = a;
    }
    return pool.slice(0, count);
  }
  const seen = new Set<number>();
  const out: number[] = [];
  while (out.length < count) {
    const n = randomInt(min, max);
    if (!seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

export default function RandomNumberTool() {
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [count, setCount] = useState('10');
  const [unique, setUnique] = useState(false);
  const [sorted, setSorted] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const parsed = useMemo(() => {
    const lo = Math.trunc(Number(min));
    const hi = Math.trunc(Number(max));
    const n = Math.trunc(Number(count));
    const numeric =
      min.trim() !== '' &&
      max.trim() !== '' &&
      count.trim() !== '' &&
      Number.isFinite(lo) &&
      Number.isFinite(hi) &&
      Number.isFinite(n);

    if (!numeric) return { ok: false as const, error: '请填写有效的数字。' };
    if (lo > hi) return { ok: false as const, error: '最小值不能大于最大值。' };
    if (n < 1) return { ok: false as const, error: '生成数量至少为 1。' };
    if (n > 1000) return { ok: false as const, error: '单次生成数量最多 1000 个。' };

    const span = hi - lo + 1;
    if (unique && n > span) {
      return {
        ok: false as const,
        error: `区间 ${lo} ~ ${hi} 内只有 ${span} 个整数，不重复模式下最多生成 ${span} 个。`,
      };
    }
    return { ok: true as const, lo, hi, n, span };
  }, [min, max, count, unique]);

  const generate = () => {
    if (!parsed.ok) return;
    const { lo, hi, n } = parsed;
    const out = unique
      ? sampleUnique(lo, hi, n)
      : Array.from({ length: n }, () => randomInt(lo, hi));
    setResults(sorted ? [...out].sort((a, b) => a - b) : out);
  };

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div class="space-y-4">
      {/* 参数区 */}
      <div class="grid gap-3 sm:grid-cols-3">
        <div>
          <label for="rn-min" class="block text-sm font-medium mb-1.5">
            最小值
          </label>
          <input
            id="rn-min"
            type="number"
            class="input input-bordered input-sm w-full"
            value={min}
            onInput={(e) => setMin((e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label for="rn-max" class="block text-sm font-medium mb-1.5">
            最大值
          </label>
          <input
            id="rn-max"
            type="number"
            class="input input-bordered input-sm w-full"
            value={max}
            onInput={(e) => setMax((e.target as HTMLInputElement).value)}
          />
        </div>
        <div>
          <label for="rn-count" class="block text-sm font-medium mb-1.5">
            生成数量
          </label>
          <input
            id="rn-count"
            type="number"
            min={1}
            max={1000}
            class="input input-bordered input-sm w-full"
            value={count}
            onInput={(e) => setCount((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-primary"
            checked={unique}
            onChange={(e) => setUnique((e.target as HTMLInputElement).checked)}
          />
          <span class="text-sm">不允许重复</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-primary"
            checked={sorted}
            onChange={(e) => setSorted((e.target as HTMLInputElement).checked)}
          />
          <span class="text-sm">结果升序排列</span>
        </label>
      </div>

      {!parsed.ok && (
        <p class="text-sm text-error" role="alert">
          {parsed.error}
        </p>
      )}

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-primary"
          disabled={!parsed.ok}
          onClick={generate}
        >
          生成随机数
        </button>
        {results.length > 0 && (
          <>
            <button
              type="button"
              class={`btn btn-sm ${copied === 'line' ? 'btn-success' : 'btn-outline'}`}
              onClick={() => copy(results.join('\n'), 'line')}
            >
              {copied === 'line' ? '已复制' : '复制（每行一个）'}
            </button>
            <button
              type="button"
              class={`btn btn-sm ${copied === 'comma' ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(results.join(', '), 'comma')}
            >
              {copied === 'comma' ? '已复制' : '复制（逗号分隔）'}
            </button>
            <button
              type="button"
              class="btn btn-sm btn-ghost"
              onClick={() => setResults([])}
            >
              清空
            </button>
          </>
        )}
      </div>

      {/* 结果区 */}
      {results.length > 0 && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
            <span class="text-sm opacity-70">
              共 {results.length} 个
              {unique && <span class="badge badge-sm badge-ghost ml-2">不重复</span>}
            </span>
          </div>
          <div class="flex flex-wrap gap-1.5" aria-live="polite">
            {results.map((n, i) => (
              <span
                key={`${i}-${n}`}
                class="badge badge-lg font-mono tabular-nums bg-base-100 border-base-300"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        使用浏览器 Web Crypto 加密级随机源生成，并通过拒绝采样消除取模偏差，保证区间内每个整数概率相同。全部本地运算，不上传数据。
      </p>
    </div>
  );
}
