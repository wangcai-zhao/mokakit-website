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

export default function LogCalculator() {
  const [a, setA] = useState('10');
  const [b, setB] = useState('1000');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const base = Number(a);
    const x = Number(b);
    if (![base, x].every(Number.isFinite)) return null;
    if (base <= 0 || base === 1 || x <= 0) return null;
    const val = Math.log(x) / Math.log(base);
    return { val, ln: Math.log(x), lg: Math.log10(x) };
  }, [a, b]);

  const copy = async (t: string) => {
    await copyText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <p class="text-sm opacity-70">计算 log<sub>a</sub>(b)（以 a 为底 b 的对数）</p>
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <label class="form-control">
            <span class="label-text">底数 a</span>
            <input
              type="number"
              class="input input-bordered input-sm text-center font-mono"
              value={a}
              onInput={(e) => setA((e.target as HTMLInputElement).value)}
            />
          </label>
          <span class="text-xl font-bold">log</span>
          <label class="form-control">
            <span class="label-text">真数 b</span>
            <input
              type="number"
              class="input input-bordered input-sm text-center font-mono"
              value={b}
              onInput={(e) => setB((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        {!res && (
          <p class="text-sm text-error">需满足：底数 a&gt;0 且 a≠1，真数 b&gt;0。</p>
        )}
        {res && (
          <div class="space-y-2">
            <Row label={`log${a}(${b})`} value={fmt(res.val)} />
            <Row label={`ln(${b})`} value={fmt(res.ln)} />
            <Row label={`lg(${b})`} value={fmt(res.lg)} />
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(`log${a}(${b}) = ${fmt(res.val)}`)}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        )}
      </div>
      <p class="text-xs opacity-55">使用换底公式 log_a(b)=ln(b)/ln(a)。全部本地计算。</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div class="flex items-center justify-between">
      <span class="text-sm opacity-70 font-mono">{label}</span>
      <span class="font-mono font-bold text-lg text-primary">{value}</span>
    </div>
  );
}
