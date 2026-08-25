import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function fmt(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  let s: string;
  if (a !== 0 && (a >= 1e15 || a < 1e-9)) s = v.toExponential(6);
  else s = v.toFixed(6);
  if (s.includes('.')) s = s.replace(/\.?0+$/, '');
  return s;
}

export default function PowerRootCalc() {
  const [mode, setMode] = useState<'pow' | 'root'>('pow');
  const [base, setBase] = useState('2');
  const [exp, setExp] = useState('10');
  const [radicand, setRadicand] = useState('8');
  const [n, setN] = useState('3');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    if (mode === 'pow') {
      const b = Number(base);
      const e = Number(exp);
      if (![b, e].every(Number.isFinite)) return null;
      const v = Math.pow(b, e);
      if (!Number.isFinite(v)) return null;
      return { v };
    }
    const r = Number(radicand);
    const k = Number(n);
    if (![r, k].every(Number.isFinite) || k <= 0) return null;
    const v = Math.pow(r, 1 / k);
    if (!Number.isFinite(v)) return null;
    return { v };
  }, [mode, base, exp, radicand, n]);

  const copy = async (t: string) => {
    await copyText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <div class="tabs tabs-boxed">
          <button
            type="button"
            class={`tab ${mode === 'pow' ? 'tab-active' : ''}`}
            onClick={() => setMode('pow')}
          >
            幂 a^b
          </button>
          <button
            type="button"
            class={`tab ${mode === 'root' ? 'tab-active' : ''}`}
            onClick={() => setMode('root')}
          >
            根式 ⁿ√a
          </button>
        </div>

        {mode === 'pow' ? (
          <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <label class="form-control">
              <span class="label-text">底数 a</span>
              <input
                type="number"
                class="input input-bordered input-sm text-center font-mono"
                value={base}
                onInput={(e) => setBase((e.target as HTMLInputElement).value)}
              />
            </label>
            <span class="text-xl font-bold">^</span>
            <label class="form-control">
              <span class="label-text">指数 b</span>
              <input
                type="number"
                class="input input-bordered input-sm text-center font-mono"
                value={exp}
                onInput={(e) => setExp((e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
        ) : (
          <div class="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2">
            <span class="text-lg font-bold">ⁿ√</span>
            <label class="form-control">
              <span class="label-text">被开方数 a</span>
              <input
                type="number"
                class="input input-bordered input-sm text-center font-mono"
                value={radicand}
                onInput={(e) => setRadicand((e.target as HTMLInputElement).value)}
              />
            </label>
            <span class="text-lg font-bold">n=</span>
            <label class="form-control">
              <span class="label-text">根次 n</span>
              <input
                type="number"
                class="input input-bordered input-sm text-center font-mono"
                value={n}
                onInput={(e) => setN((e.target as HTMLInputElement).value)}
              />
            </label>
          </div>
        )}

        {!res && (
          <p class="text-sm text-error">输入无效或结果溢出（如负数开偶次根）。</p>
        )}
        {res && (
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm opacity-70 font-mono">
                {mode === 'pow' ? 'a^b' : `${n}√a`}
              </span>
              <span class="font-mono font-bold text-lg text-primary">{fmt(res.v)}</span>
            </div>
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() =>
                copy(`${mode === 'pow' ? `${base}^${exp}` : `${n}√${radicand}`} = ${fmt(res.v)}`)
              }
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        )}
      </div>
      <p class="text-xs opacity-55">使用 Math.pow；负数开偶次根无实数解。计算在本地完成。</p>
    </div>
  );
}
