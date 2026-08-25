import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function factorize(n: number): { prime: number; exp: number }[] {
  const res: { prime: number; exp: number }[] = [];
  let x = n;
  for (let p = 2; p * p <= x; p++) {
    if (x % p === 0) {
      let e = 0;
      while (x % p === 0) {
        x /= p;
        e++;
      }
      res.push({ prime: p, exp: e });
    }
  }
  if (x > 1) res.push({ prime: x, exp: 1 });
  return res;
}

export default function PrimeFactorCalc() {
  const [input, setInput] = useState('360');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const n = Math.floor(Number(input));
    if (!Number.isFinite(n) || n < 2 || n > 1e12) return null;
    const factors = factorize(n);
    const isPrime = factors.length === 1 && factors[0].exp === 1;
    const expr = factors.map((f) => (f.exp === 1 ? `${f.prime}` : `${f.prime}^${f.exp}`)).join(' × ');
    return { n, factors, isPrime, expr };
  }, [input]);

  const copy = async (t: string) => {
    await copyText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <label class="form-control">
          <span class="label-text">待分解的正整数</span>
          <input
            type="number"
            class="input input-bordered input-sm font-mono"
            value={input}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          />
        </label>
        {!res && (
          <p class="text-sm text-error">请输入 2 到 1,000,000,000,000 之间的正整数。</p>
        )}
        {res && (
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm opacity-70">分解结果</span>
              <span class="font-mono font-bold text-lg text-primary">{res.expr}</span>
            </div>
            <p class="text-sm opacity-70">
              {res.n} 是{res.isPrime ? '素数（质数）' : `合数，共 ${res.factors.length} 个质因数`}
            </p>
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() => copy(`${res.n} = ${res.expr}`)}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        )}
      </div>
      <p class="text-xs opacity-55">质因数分解在本地完成；超大数仅作近似展示。</p>
    </div>
  );
}
