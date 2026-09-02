import { useState, useMemo } from 'preact/hooks';

export default function Factorial() {
  const [n, setN] = useState('10');
  const [k, setK] = useState('3');

  const r = useMemo(() => {
    const N = Math.trunc(Number(n));
    const K = Math.trunc(Number(k));
    if (!Number.isFinite(N) || N < 0) return null;
    if (N > 5000) return { tooBig: true as const };
    let fact = 1n;
    for (let i = 2n; i <= BigInt(N); i++) fact *= i;
    if (!Number.isFinite(K) || K < 0 || K > N) {
      return { fact: fact.toString() };
    }
    let perm = 1n;
    for (let i = BigInt(N - K + 1); i <= BigInt(N); i++) perm *= i;
    let kf = 1n;
    for (let i = 2n; i <= BigInt(K); i++) kf *= i;
    const comb = perm / kf;
    return { fact: fact.toString(), perm: perm.toString(), comb: comb.toString() };
  }, [n, k]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <Num label="n（阶乘 / 总数）" value={n} set={setN} />
        <Num label="k（选几个，算排列组合，可选）" value={k} set={setK} />
        {r && 'tooBig' in r && (
          <p class="text-xs text-warning">n 超过 5000，数字过长已省略，请减小 n。</p>
        )}
        {r && 'fact' in r && (
          <div class="space-y-2 pt-1">
            <Stat label={`${Math.trunc(Number(n))}!`} value={r.fact} />
            {('perm' in r && 'comb' in r) && (
              <>
                <Stat label={`排列数 P(${Math.trunc(Number(n))},${Math.trunc(Number(k))})`} value={r.perm} />
                <Stat label={`组合数 C(${Math.trunc(Number(n))},${Math.trunc(Number(k))})`} value={r.comb} />
              </>
            )}
          </div>
        )}
        {r === null && <p class="text-xs text-error">请填写有效的非负整数 n</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        n! = 1×2×…×n；P(n,k) = n! ÷ (n−k)!（顺序有关）；C(n,k) = n! ÷ ((n−k)!·k!)（顺序无关）。使用大整数精确计算，不丢精度。所有计算本地完成。
      </p>
    </div>
  );
}

function Num({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return (
    <label class="block">
      <span class="text-sm font-medium">{label}</span>
      <input
        type="number"
        inputmode="numeric"
        min={0}
        class="input input-bordered input-sm mt-1.5 w-full font-mono"
        value={value}
        onInput={(e) => set((e.target as HTMLInputElement).value)}
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div class="rounded-lg bg-base-100 p-3 break-all">
      <div class="text-xs opacity-60">{label}</div>
      <div class="text-base font-bold font-mono mt-0.5">{value}</div>
    </div>
  );
}
