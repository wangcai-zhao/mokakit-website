import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Op = '+' | '-' | '*' | '/';

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

interface Frac {
  n: number;
  d: number;
}

function simplify(f: Frac): Frac {
  if (f.d === 0) return f;
  let n = f.n;
  let d = f.d;
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

function add(a: Frac, b: Frac): Frac {
  return simplify({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
}
function sub(a: Frac, b: Frac): Frac {
  return simplify({ n: a.n * b.d - b.n * a.d, d: a.d * b.d });
}
function mul(a: Frac, b: Frac): Frac {
  return simplify({ n: a.n * b.n, d: a.d * b.d });
}
function div(a: Frac, b: Frac): Frac {
  return simplify({ n: a.n * b.d, d: a.d * b.n });
}

function toMixed(f: Frac): string {
  if (f.d === 0) return '—';
  const sign = f.n < 0 ? '-' : '';
  const an = Math.abs(f.n);
  const whole = Math.floor(an / f.d);
  const rem = an % f.d;
  if (rem === 0) return `${sign}${whole}`;
  if (whole === 0) return `${sign}${rem}/${f.d}`;
  return `${sign}${whole} 又 ${rem}/${f.d}`;
}

function parseFrac(nStr: string, dStr: string): Frac | null {
  const n = Number(nStr);
  const d = Number(dStr);
  if (!Number.isFinite(n) || !Number.isFinite(d)) return null;
  if (d === 0) return { n, d: 0 };
  return { n, d };
}

const OPS: { key: Op; label: string }[] = [
  { key: '+', label: '加 +' },
  { key: '-', label: '减 −' },
  { key: '*', label: '乘 ×' },
  { key: '/', label: '除 ÷' },
];

export default function FractionCalculator() {
  const [n1, setN1] = useState('3');
  const [d1, setD1] = useState('4');
  const [op, setOp] = useState<Op>('+');
  const [n2, setN2] = useState('1');
  const [d2, setD2] = useState('2');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const f1 = parseFrac(n1, d1);
  const f2 = parseFrac(n2, d2);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const result = useMemo(() => {
    if (!f1 || !f2) return { error: '请输入有效的分子和分母' };
    if (f1.d === 0 || f2.d === 0) return { error: '分母不能为 0' };
    if (op === '/' && f2.n === 0) return { error: '除以 0 无意义' };
    let r: Frac;
    if (op === '+') r = add(f1, f2);
    else if (op === '-') r = sub(f1, f2);
    else if (op === '*') r = mul(f1, f2);
    else r = div(f1, f2);
    return {
      improper: `${r.n}/${r.d}`,
      mixed: toMixed(r),
      decimal: String(Number((r.n / r.d).toFixed(6))),
    };
  }, [f1, f2, op]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
          <div class="space-y-1">
            <input
              type="number"
              class="input input-bordered input-sm w-full text-center font-mono"
              value={n1}
              onInput={(e) => setN1((e.target as HTMLInputElement).value)}
            />
            <div class="border-t border-base-content/30" />
            <input
              type="number"
              class="input input-bordered input-sm w-full text-center font-mono"
              value={d1}
              onInput={(e) => setD1((e.target as HTMLInputElement).value)}
            />
          </div>

          <select
            class="select select-bordered select-sm font-mono"
            value={op}
            onChange={(e) => setOp((e.target as HTMLSelectElement).value as Op)}
          >
            {OPS.map((o) => (
              <option value={o.key}>{o.label}</option>
            ))}
          </select>

          <div class="space-y-1">
            <input
              type="number"
              class="input input-bordered input-sm w-full text-center font-mono"
              value={n2}
              onInput={(e) => setN2((e.target as HTMLInputElement).value)}
            />
            <div class="border-t border-base-content/30" />
            <input
              type="number"
              class="input input-bordered input-sm w-full text-center font-mono"
              value={d2}
              onInput={(e) => setD2((e.target as HTMLInputElement).value)}
            />
          </div>
        </div>

        {typeof result === 'object' && 'error' in result && (
          <p class="mt-3 text-sm text-error">{result.error}</p>
        )}

        {typeof result === 'object' && 'improper' in result && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">最简假分数</p>
                <p class="text-2xl font-bold font-mono">{result.improper}</p>
              </div>
              <div>
                <p class="text-xs opacity-60">带分数</p>
                <p class="text-2xl font-bold font-mono">{result.mixed}</p>
              </div>
              <div>
                <p class="text-xs opacity-60">小数</p>
                <p class="text-2xl font-bold font-mono">{result.decimal}</p>
              </div>
              <button
                type="button"
                class={`btn btn-xs ml-auto ${copied === 'r' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() =>
                  copy(`结果 = ${result.improper}（${result.mixed}）`, 'r')
                }
              >
                {copied === 'r' ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        )}
        <p class="mt-3 text-xs opacity-55">结果自动约分；带分数 = 整数 + 真分数。</p>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
