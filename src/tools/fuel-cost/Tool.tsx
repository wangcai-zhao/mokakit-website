import { useState, useMemo } from 'preact/hooks';

function money(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 油费 = 里程 × 百公里油耗 ÷ 100 × 油价 */
export default function FuelCost() {
  const [km, setKm] = useState('500');
  const [consumption, setConsumption] = useState('8');
  const [price, setPrice] = useState('7.8');
  const [monthlyKm, setMonthlyKm] = useState('1500');

  const r = useMemo(() => {
    const d = Number(km);
    const c = Number(consumption);
    const p = Number(price);
    const mk = Number(monthlyKm);
    if (![d, c, p].every(Number.isFinite) || d < 0 || c <= 0 || p < 0) return null;
    const perKm = (c / 100) * p;
    const fuel = (d * c) / 100;
    const cost = fuel * p;
    const monthly = Number.isFinite(mk) && mk >= 0 ? perKm * mk : null;
    const yearly = monthly !== null ? monthly * 12 : null;
    return { perKm, fuel, cost, monthly, yearly };
  }, [km, consumption, price, monthlyKm]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">行驶里程（公里）</span>
            <input
              type="number" inputmode="decimal" min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={km}
              onInput={(e) => setKm((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">百公里油耗（升）</span>
            <input
              type="number" inputmode="decimal" min={0} step="0.1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={consumption}
              onInput={(e) => setConsumption((e.target as HTMLInputElement).value)}
            />
            <p class="mt-1 text-xs opacity-50">家用油车市区常见 8–10，高速 6–7</p>
          </label>
          <label class="block">
            <span class="text-sm font-medium">油价（元/升）</span>
            <input
              type="number" inputmode="decimal" min={0} step="0.01"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={price}
              onInput={(e) => setPrice((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">月均里程（公里，用于月/年估算）</span>
            <input
              type="number" inputmode="decimal" min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={monthlyKm}
              onInput={(e) => setMonthlyKm((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {r && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">这段路程油费</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(r.cost)} 元</p>
              </div>
              <span class="badge badge-outline mb-1">需燃油 {r.fuel.toFixed(1)} 升</span>
              <span class="badge badge-outline mb-1">每公里 {r.perKm.toFixed(2)} 元</span>
            </div>
            {r.monthly !== null && (
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td class="opacity-60">每月油费（按月均里程）</td>
                      <td class="font-mono text-right">{money(r.monthly)} 元</td>
                    </tr>
                    <tr>
                      <td class="opacity-60">每年油费</td>
                      <td class="font-mono text-right font-medium">{money(r.yearly!)} 元</td>
                    </tr>
                    <tr>
                      <td class="opacity-60">对比电动车（15kWh/100km、0.55 元/度）</td>
                      <td class="font-mono text-right">
                        电费约 {money((15 / 100) * 0.55 * (Number(monthlyKm) || 0) * 12)} 元/年，省 {money((r.yearly ?? 0) - (15 / 100) * 0.55 * (Number(monthlyKm) || 0) * 12)} 元/年
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        油费 = 里程 ÷ 100 × 百公里油耗 × 油价。实际油耗受驾驶习惯、路况、空调影响，可比表显高 5%～10%；市区与高速建议分别测算。电动车对比按百公里 15 度电、民用电价 0.55 元/度的常见口径估算，仅含能源成本、不含保养折旧；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
