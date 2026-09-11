import { useState, useMemo } from 'preact/hooks';

function money(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 二分法解月 IRR：期初 +P，每期 -（本金/期 + 手续费） */
function solveMonthlyIrr(total: number, perPayment: number, n: number): number | null {
  let lo = 0,
    hi = 0.1; // 月利率上界 10%
  const npv = (r: number) => {
    let v = -total;
    for (let t = 1; t <= n; t++) v += perPayment / Math.pow(1 + r, t);
    return v;
  };
  if (npv(0) > 0) return 0; // 手续费为 0
  if (npv(hi) > 0) return null; // 超出上界
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export default function InstallmentApr() {
  const [total, setTotal] = useState('12000');
  const [feeRate, setFeeRate] = useState('0.6');
  const [months, setMonths] = useState('12');

  const r = useMemo(() => {
    const amt = Number(total);
    const fr = Number(feeRate);
    const n = Number(months);
    if (![amt, fr, n].every(Number.isFinite) || amt <= 0 || n <= 0 || fr < 0) return null;
    const feePerMonth = (amt * fr) / 100;
    const principalPerMonth = amt / n;
    const perPayment = principalPerMonth + feePerMonth;
    const nominalAnnual = fr * 12;
    const irrM = solveMonthlyIrr(amt, perPayment, n);
    const aprSimple = irrM === null ? null : irrM * 12 * 100;
    const aprCompound = irrM === null ? null : (Math.pow(1 + irrM, 12) - 1) * 100;
    return { amt, n, feePerMonth, principalPerMonth, perPayment, nominalAnnual, aprSimple, aprCompound, totalFee: feePerMonth * n, totalPay: perPayment * n };
  }, [total, feeRate, months]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="text-sm font-medium">分期总金额（元）</span>
            <input
              type="number" inputmode="decimal" min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={total}
              onInput={(e) => setTotal((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">每期手续费率（%）</span>
            <input
              type="number" inputmode="decimal" min={0} step="0.01"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={feeRate}
              onInput={(e) => setFeeRate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">期数（月）</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={months}
              onChange={(e) => setMonths((e.target as HTMLSelectElement).value)}
            >
              {['3', '6', '9', '12', '18', '24', '36'].map((m) => (
                <option value={m}>{m} 期</option>
              ))}
            </select>
          </label>
        </div>

        {r && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">真实年化利率（IRR，单利口径）</p>
                <p class="text-3xl font-bold font-mono text-warning">
                  {r.aprSimple === null ? '费率过高' : r.aprSimple.toFixed(2) + '%'}
                </p>
              </div>
              <span class="badge badge-outline mb-1">名义年化 {r.nominalAnnual.toFixed(2)}%</span>
              {r.aprCompound !== null && (
                <span class="badge badge-outline mb-1">复利口径 {r.aprCompound.toFixed(2)}%</span>
              )}
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">每期应还（本金 + 手续费）</td>
                    <td class="font-mono text-right">{money(r.perPayment)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">其中手续费 / 本金</td>
                    <td class="font-mono text-right">{money(r.feePerMonth)} / {money(r.principalPerMonth)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">手续费总额</td>
                    <td class="font-mono text-right">{money(r.totalFee)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">本息合计</td>
                    <td class="font-mono text-right font-medium">{money(r.totalPay)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">真实 / 名义利率倍数</td>
                    <td class="font-mono text-right text-warning">
                      {r.aprSimple === null ? '—' : (r.aprSimple / (r.nominalAnnual || 1)).toFixed(2) + ' 倍'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        真实年化利率由内部收益率（IRR）解出：期初拿到分期总额，每期偿还等额款项，解使现金流现值为零的月利率后年化（×12 为单利口径，复利口径为 (1+月利率)^12−1）。本金逐月归还而手续费按初始总额计，故真实利率约为名义费率（每期费率×期数）的 1.6～2 倍。结果为估算，实际以账单为准；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
