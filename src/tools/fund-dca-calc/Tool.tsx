import { useState, useMemo } from 'preact/hooks';

function money(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 基金定投收益：每期投入独立复利到期 */
export default function FundDcaCalc() {
  const [perPeriod, setPerPeriod] = useState('1000');
  const [freq, setFreq] = useState<'month' | 'week'>('month');
  const [annualRate, setAnnualRate] = useState('6');
  const [years, setYears] = useState('10');

  const r = useMemo(() => {
    const p = Number(perPeriod);
    const ar = Number(annualRate);
    const y = Number(years);
    if (![p, ar, y].every(Number.isFinite) || p <= 0 || y <= 0) return null;
    const periodsPerYear = freq === 'month' ? 12 : 52;
    const n = Math.round(y * periodsPerYear);
    const pr = Math.pow(1 + ar / 100, 1 / periodsPerYear) - 1;
    let total = 0;
    for (let i = 1; i <= n; i++) total += p * Math.pow(1 + pr, n - i);
    const principal = p * n;
    return { p, n, pr, total, principal, profit: total - principal };
  }, [perPeriod, freq, annualRate, years]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">每期投入（元）</span>
            <input
              type="number" inputmode="decimal" min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={perPeriod}
              onInput={(e) => setPerPeriod((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">定投频率</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={freq}
              onChange={(e) => setFreq((e.target as HTMLSelectElement).value as 'month' | 'week')}
            >
              <option value="month">每月一次</option>
              <option value="week">每周一次</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium">预期年化收益率（%）</span>
            <input
              type="number" inputmode="decimal" step="0.1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={annualRate}
              onInput={(e) => setAnnualRate((e.target as HTMLInputElement).value)}
            />
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              {['4', '6', '8', '10'].map((v) => (
                <button type="button" class="btn btn-xs btn-outline" onClick={() => setAnnualRate(v)}>
                  {v}%
                </button>
              ))}
            </div>
          </label>
          <label class="block">
            <span class="text-sm font-medium">定投年限（年）</span>
            <input
              type="number" inputmode="decimal" min={0} step="1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={years}
              onInput={(e) => setYears((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {r && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">到期资产总额</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(r.total)}</p>
              </div>
              <span class="badge badge-outline mb-1">累计投入 {money(r.principal)} 元</span>
              <span class="badge badge-outline mb-1">收益 {money(r.profit)} 元</span>
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">累计投入本金</td>
                    <td class="font-mono text-right">{money(r.principal)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">投资收益</td>
                    <td class="font-mono text-right text-warning">{money(r.profit)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">总收益率</td>
                    <td class="font-mono text-right">{((r.profit / r.principal) * 100).toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">投入期数 / 期收益率</td>
                    <td class="font-mono text-right">{r.n} 期 / {(r.pr * 100).toFixed(4)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        按"每期投入独立复利到期"的简化口径计算（期收益率 = (1+年化)^(1/期数) − 1），等价于净值匀速上涨的理想情形。实际基金净值有波动，收益随赎回时点变化，结果仅为长期规划参考，不构成投资建议；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
