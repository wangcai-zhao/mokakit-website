import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Mode = 'solve' | 'simplify' | 'allocate';

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

function num(n: number): string {
  return String(Number(n.toFixed(6)));
}

export default function RatioCalculator() {
  const [mode, setMode] = useState<Mode>('solve');

  const [a, setA] = useState('2');
  const [b, setB] = useState('3');
  const [c, setC] = useState('4');

  const [r1, setR1] = useState('4');
  const [r2, setR2] = useState('6');

  const [total, setTotal] = useState('100');
  const [parts, setParts] = useState('2,3,5');

  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const solve = useMemo(() => {
    const A = Number(a);
    const B = Number(b);
    const C = Number(c);
    if (![A, B, C].every(Number.isFinite)) return null;
    if (A === 0) return { error: 'a 不能为 0（否则无法解比例）' };
    const x = (B * C) / A;
    return { x, text: `${num(A)} : ${num(B)} = ${num(C)} : ${num(x)}` };
  }, [a, b, c]);

  const simplify = useMemo(() => {
    const A = Number(r1);
    const B = Number(r2);
    if (![A, B].every(Number.isFinite)) return null;
    if (A === 0 && B === 0) return { error: '两项不能同时为 0' };
    const g = gcd(A, B);
    const sa = A / g;
    const sb = B / g;
    return {
      simple: `${sa}:${sb}`,
      value: B === 0 ? null : A / B,
      text: `${num(A)} : ${num(B)} → ${sa} : ${sb}`,
    };
  }, [r1, r2]);

  const allocate = useMemo(() => {
    const t = Number(total);
    const ps = parts
      .split(/[\s,，、]+/)
      .map((s) => s.trim())
      .filter((s) => s !== '')
      .map(Number)
      .filter((n) => Number.isFinite(n) && n >= 0);
    if (!Number.isFinite(t) || ps.length < 2) return null;
    const sumP = ps.reduce((x, y) => x + y, 0);
    if (sumP === 0) return { error: '各份数之和不能为 0' };
    const shares = ps.map((p) => (t * p) / sumP);
    return { shares, sumP };
  }, [total, parts]);

  return (
    <div class="space-y-5">
      <div class="join flex-wrap">
        {([
          { key: 'solve', label: '解比例求未知项' },
          { key: 'simplify', label: '化简比' },
          { key: 'allocate', label: '按比例分配' },
        ] as { key: Mode; label: string }[]).map((t) => (
          <button
            type="button"
            class={`btn btn-sm join-item ${mode === t.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === 'solve' && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <p class="text-sm font-medium">已知 a : b = c : x，求 x</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <label class="block">
              <span class="text-xs opacity-60">a</span>
              <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={a} onInput={(e) => setA((e.target as HTMLInputElement).value)} />
            </label>
            <label class="block">
              <span class="text-xs opacity-60">b</span>
              <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={b} onInput={(e) => setB((e.target as HTMLInputElement).value)} />
            </label>
            <label class="block">
              <span class="text-xs opacity-60">c</span>
              <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={c} onInput={(e) => setC((e.target as HTMLInputElement).value)} />
            </label>
          </div>
          {!solve && <p class="mt-3 text-sm text-error">请输入有效数值</p>}
          {solve && 'error' in solve && <p class="mt-3 text-sm text-error">{solve.error}</p>}
          {solve && 'x' in solve && (
            <div class="mt-4 flex items-center gap-3">
              <span class="text-3xl font-bold font-mono">x = {num(solve.x)}</span>
              <button type="button" class={`btn btn-xs ml-auto ${copied === 's' ? 'btn-success' : 'btn-ghost'}`} onClick={() => copy(solve.text, 's')}>
                {copied === 's' ? '已复制' : '复制'}
              </button>
            </div>
          )}
          <p class="mt-3 text-xs opacity-55">公式：x = b × c ÷ a（内项积 = 外项积）</p>
        </div>
      )}

      {mode === 'simplify' && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <p class="text-sm font-medium">把 a : b 化为最简整数比</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-xs opacity-60">a</span>
              <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={r1} onInput={(e) => setR1((e.target as HTMLInputElement).value)} />
            </label>
            <label class="block">
              <span class="text-xs opacity-60">b</span>
              <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={r2} onInput={(e) => setR2((e.target as HTMLInputElement).value)} />
            </label>
          </div>
          {!simplify && <p class="mt-3 text-sm text-error">请输入有效数值</p>}
          {simplify && 'error' in simplify && <p class="mt-3 text-sm text-error">{simplify.error}</p>}
          {simplify && 'simple' in simplify && (
            <div class="mt-4 flex items-center gap-3">
              <span class="text-3xl font-bold font-mono">{simplify.simple}</span>
              {simplify.value !== null && <span class="badge badge-outline">比值 {num(simplify.value)}</span>}
              <button type="button" class={`btn btn-xs ml-auto ${copied === 'sm' ? 'btn-success' : 'btn-ghost'}`} onClick={() => copy(simplify.text, 'sm')}>
                {copied === 'sm' ? '已复制' : '复制'}
              </button>
            </div>
          )}
          <p class="mt-3 text-xs opacity-55">公式：两边同除以最大公约数</p>
        </div>
      )}

      {mode === 'allocate' && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <p class="text-sm font-medium">把总量按给定份数分配</p>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="block">
              <span class="text-xs opacity-60">总量</span>
              <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={total} onInput={(e) => setTotal((e.target as HTMLInputElement).value)} />
            </label>
            <label class="block">
              <span class="text-xs opacity-60">各份数（逗号分隔）</span>
              <input type="text" class="input input-bordered input-sm mt-1 w-full font-mono" value={parts} onInput={(e) => setParts((e.target as HTMLInputElement).value)} />
            </label>
          </div>
          {!allocate && <p class="mt-3 text-sm text-error">请输入总量与至少两份数</p>}
          {allocate && 'error' in allocate && <p class="mt-3 text-sm text-error">{allocate.error}</p>}
          {allocate && 'shares' in allocate && (
            <div class="mt-4 space-y-2">
              {allocate.shares.map((s, i) => (
                <div class="flex items-center justify-between rounded-lg bg-base-100 px-3 py-2">
                  <span class="opacity-70">第 {i + 1} 份</span>
                  <span class="font-mono font-bold">{num(s)}</span>
                </div>
              ))}
            </div>
          )}
          <p class="mt-3 text-xs opacity-55">公式：每份 = 总量 × 单份 ÷ 总份数</p>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
