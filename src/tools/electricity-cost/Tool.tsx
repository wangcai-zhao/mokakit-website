import { useState, useMemo } from 'preact/hooks';

function money(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const PRESETS: { label: string; watts: number; hours: number }[] = [
  { label: '1.5 匹空调（制冷）', watts: 1100, hours: 8 },
  { label: '电热水器 60L', watts: 2000, hours: 1 },
  { label: '冰箱（日均折算）', watts: 40, hours: 24 },
  { label: '台式电脑', watts: 250, hours: 6 },
  { label: '路由器 24h', watts: 10, hours: 24 },
  { label: '电动车充电（折算日均）', watts: 200, hours: 4 },
];

/** 电费 = 功率(W) × 小时 ÷ 1000 × 电价 */
export default function ElectricityCost() {
  const [watts, setWatts] = useState('1100');
  const [hours, setHours] = useState('8');
  const [days, setDays] = useState('30');
  const [price, setPrice] = useState('0.55');

  const r = useMemo(() => {
    const w = Number(watts);
    const h = Number(hours);
    const d = Number(days);
    const p = Number(price);
    if (![w, h, d, p].every(Number.isFinite) || w < 0 || h < 0 || d <= 0 || p < 0) return null;
    const dailyKwh = (w * h) / 1000;
    const dailyCost = dailyKwh * p;
    const monthlyCost = dailyCost * 30;
    const yearlyCost = dailyCost * 365;
    return { dailyKwh, dailyCost, monthlyCost, yearlyCost, totalKwh: dailyKwh * d, periodCost: dailyCost * d, d };
  }, [watts, hours, days, price]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">电器功率（瓦 W）</span>
            <input
              type="number" inputmode="decimal" min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={watts}
              onInput={(e) => setWatts((e.target as HTMLInputElement).value)}
            />
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  type="button"
                  class="btn btn-xs btn-outline"
                  onClick={() => {
                    setWatts(String(p.watts));
                    setHours(String(p.hours));
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </label>
          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span class="text-sm font-medium">每日使用（小时）</span>
              <input type="number" inputmode="decimal" min={0} max={24} step="0.5" class="input input-bordered input-sm mt-1.5 w-full font-mono" value={hours} onInput={(e) => setHours((e.target as HTMLInputElement).value)} />
            </label>
            <label class="block">
              <span class="text-sm font-medium">电价（元/度）</span>
              <input type="number" inputmode="decimal" min={0} step="0.01" class="input input-bordered input-sm mt-1.5 w-full font-mono" value={price} onInput={(e) => setPrice((e.target as HTMLInputElement).value)} />
            </label>
            <label class="block col-span-2">
              <span class="text-sm font-medium">计算时段（天）</span>
              <input type="number" inputmode="decimal" min={1} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={days} onInput={(e) => setDays((e.target as HTMLInputElement).value)} />
            </label>
          </div>
        </div>

        {r && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">{r.d} 天电费</p>
                <p class="text-3xl font-bold font-mono text-warning">{money(r.periodCost)} 元</p>
              </div>
              <span class="badge badge-outline mb-1">共用电 {r.totalKwh.toFixed(1)} 度</span>
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">每日耗电</td>
                    <td class="font-mono text-right">{r.dailyKwh.toFixed(2)} 度</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">每日电费</td>
                    <td class="font-mono text-right">{money(r.dailyCost)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">每月电费（×30 估）</td>
                    <td class="font-mono text-right">{money(r.monthlyCost)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">每年电费（×365 估）</td>
                    <td class="font-mono text-right font-medium">{money(r.yearlyCost)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        耗电量（度）= 功率（W）× 使用小时 ÷ 1000；电费 = 耗电量 × 电价。变频空调、冰箱等设备功率随工况变化，标签功率仅为额定值，实际以电表为准。阶梯电价、峰谷电价用户请按实际档位分别测算；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
