import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function fact(n: bigint): bigint {
  let r = 1n;
  for (let i = 2n; i <= n; i++) r *= i;
  return r;
}

export default function PermutationCombination() {
  const [n, setN] = useState('10');
  const [k, setK] = useState('3');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const res = useMemo(() => {
    const N = Number(n);
    const K = Number(k);
    if (!Number.isInteger(N) || !Number.isInteger(K) || N < 0 || K < 0) return { error: '请输入非负整数' };
    if (K > N) return { error: '选取数 k 不能大于总数 n' };
    if (N > 1000) return { error: 'n 超过 1000，结果过大已超出计算范围' };
    const bn = BigInt(N);
    const bk = BigInt(K);
    const factorialN = fact(bn);
    const permutation = factorialN / fact(bn - bk);
    const combination = permutation / fact(bk);
    return {
      nFact: factorialN.toString(),
      p: permutation.toString(),
      c: combination.toString(),
    };
  }, [n, k]);

  const text =
    res && 'p' in res ? `排列数 P(${n},${k}) = ${res.p}；组合数 C(${n},${k}) = ${res.c}` : '';

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-xs opacity-60">总数 n</span>
            <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={n} onInput={(e) => setN((e.target as HTMLInputElement).value)} />
          </label>
          <label class="block">
            <span class="text-xs opacity-60">选取数 k</span>
            <input type="number" class="input input-bordered input-sm mt-1 w-full font-mono" value={k} onInput={(e) => setK((e.target as HTMLInputElement).value)} />
          </label>
        </div>

        {res && 'error' in res && <p class="mt-3 text-sm text-error">{res.error}</p>}

        {res && 'p' in res && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">排列数 P(n,k)</p>
                <p class="text-2xl font-bold font-mono break-all">{res.p}</p>
              </div>
              <div>
                <p class="text-xs opacity-60">组合数 C(n,k)</p>
                <p class="text-2xl font-bold font-mono break-all">{res.c}</p>
              </div>
              <button type="button" class={`btn btn-xs ml-auto ${copied === 'pc' ? 'btn-success' : 'btn-ghost'}`} onClick={() => copy(text, 'pc')}>
                {copied === 'pc' ? '已复制' : '复制'}
              </button>
            </div>
            <p class="text-xs opacity-55">
              公式：P(n,k)=n!/(n−k)!，C(n,k)=n!/(k!·(n−k)!)。n! = {res.nFact}
            </p>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有计算均在浏览器本地完成，不会上传任何数据。
      </p>
    </div>
  );
}
