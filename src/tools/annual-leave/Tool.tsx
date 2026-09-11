import { useState, useMemo } from 'preact/hooks';

function money(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 法定年假：累计工龄 <1 年 0 天；1–10 年 5 天；10–20 年 10 天；≥20 年 15 天 */
export default function AnnualLeave() {
  const [years, setYears] = useState('5');
  const [unused, setUnused] = useState('2');
  const [dailyWage, setDailyWage] = useState('300');

  const r = useMemo(() => {
    const y = Number(years);
    const u = Number(unused);
    const d = Number(dailyWage);
    if (!Number.isFinite(y) || y < 0) return null;
    const days = y < 1 ? 0 : y < 10 ? 5 : y < 20 ? 10 : 15;
    const band =
      y < 1 ? '不满 1 年，暂无法定年假' : y < 10 ? '满 1 年不满 10 年' : y < 20 ? '满 10 年不满 20 年' : '满 20 年';
    const validUnused = Number.isFinite(u) && u >= 0 ? Math.min(u, days) : 0;
    const compensation = Number.isFinite(d) && d >= 0 ? validUnused * d * 3 : 0;
    const extra200 = compensation - validUnused * (Number.isFinite(d) ? d : 0);
    return { days, band, validUnused, compensation, extra200 };
  }, [years, unused, dailyWage]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="block">
            <span class="text-sm font-medium">累计工作年限（年，可填小数）</span>
            <input
              type="number" inputmode="decimal" min={0} step="0.5"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={years}
              onInput={(e) => setYears((e.target as HTMLInputElement).value)}
            />
            <p class="mt-1 text-xs opacity-50">不同单位的工龄可合并计算</p>
          </label>
          <label class="block">
            <span class="text-sm font-medium">未休年假天数</span>
            <input
              type="number" inputmode="decimal" min={0} step="0.5"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={unused}
              onInput={(e) => setUnused((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">日工资（元，月工资÷21.75）</span>
            <input
              type="number" inputmode="decimal" min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={dailyWage}
              onInput={(e) => setDailyWage((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {r && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">你每年应享受的法定年假</p>
                <p class="text-3xl font-bold font-mono text-warning">{r.days} 天</p>
              </div>
              <span class="badge badge-outline mb-1">{r.band}</span>
            </div>
            {r.validUnused > 0 && (
              <div class="overflow-x-auto">
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td class="opacity-60">未休年假天数（已按法定上限截断）</td>
                      <td class="font-mono text-right">{r.validUnused} 天</td>
                    </tr>
                    <tr>
                      <td class="opacity-60">300% 折算补偿（含正常工资）</td>
                      <td class="font-mono text-right">{money(r.compensation)} 元</td>
                    </tr>
                    <tr>
                      <td class="opacity-60">其中单位需额外支付（200% 部分）</td>
                      <td class="font-mono text-right text-warning">{money(r.extra200)} 元</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        依据《职工带薪年休假条例》（国务院令第 514 号）与《企业职工带薪年休假实施办法》：累计工龄满 1 年不满 10 年年假 5 天、满 10 年不满 20 年 10 天、满 20 年 15 天；应休未休经职工同意不安排的，按日工资 300% 支付（含正常工作期间工资）。日工资 = 月工资 ÷ 21.75。结果为参考，个案以当地仲裁口径为准；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
