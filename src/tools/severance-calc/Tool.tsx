import { useState, useMemo } from 'preact/hooks';

function money(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 经济补偿金：N / N+1 / 2N；月工资超社平3倍封顶且年限上限12 */
export default function SeveranceCalc() {
  const [years, setYears] = useState('5');
  const [months, setMonths] = useState('8');
  const [avgWage, setAvgWage] = useState('15000');
  const [capWage, setCapWage] = useState('30000');

  const r = useMemo(() => {
    const y = Number(years);
    const mo = Number(months);
    const wage = Number(avgWage);
    const cap = Number(capWage);
    if (![y, mo, wage, cap].every(Number.isFinite) || y < 0 || wage <= 0 || cap <= 0) return null;
    // 工龄折算：满1年按1，≥6个月按1，<6个月按0.5
    const totalYears = y + mo / 12;
    let nRaw: number;
    if (mo >= 6) nRaw = y + 1;
    else if (mo > 0) nRaw = y + 0.5;
    else nRaw = y;
    // 封顶：月工资 > 社平3倍 → 按3倍计，年限最多12年
    const capped = wage > cap;
    const effWage = capped ? cap : wage;
    const effN = capped ? Math.min(nRaw, 12) : nRaw;
    const n = effN * effWage;
    const plus1 = effWage; // 代通知金按上月工资，此处以平均工资近似
    return { totalYears, nRaw, capped, effWage, effN, n, plus1, nPlus1: n + plus1, n2: n * 2 };
  }, [years, months, avgWage, capWage]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">整工作年限（年）</span>
            <input
              type="number" inputmode="decimal" min={0} step="1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={years}
              onInput={(e) => setYears((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">不足一年部分（月，0–11）</span>
            <input
              type="number" inputmode="decimal" min={0} max={11} step="1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={months}
              onInput={(e) => setMonths((e.target as HTMLInputElement).value)}
            />
            <p class="mt-1 text-xs opacity-50">≥6 个月按 1 年算，&lt;6 个月按半个月工资</p>
          </label>
          <label class="block">
            <span class="text-sm font-medium">解除前 12 个月平均月工资（元）</span>
            <input
              type="number" inputmode="decimal" min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={avgWage}
              onInput={(e) => setAvgWage((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">当地社平工资 3 倍（元/月，封顶线）</span>
            <input
              type="number" inputmode="decimal" min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={capWage}
              onInput={(e) => setCapWage((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {r && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">补偿月数 N</p>
                <p class="text-3xl font-bold font-mono text-warning">{r.nRaw} 个月</p>
              </div>
              {r.capped && <span class="badge badge-warning mb-1">工资超社平 3 倍，已封顶且年限按 12 年计</span>}
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">适用月工资</td>
                    <td class="font-mono text-right">{money(r.effWage)} 元{r.capped ? '（按社平 3 倍）' : ''}</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">N（协商解除 / 裁员 / 到期不续签）</td>
                    <td class="font-mono text-right font-medium">{money(r.n)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">N+1（三种法定情形未提前 30 日通知）</td>
                    <td class="font-mono text-right font-medium">{money(r.nPlus1)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">2N（违法解除赔偿金）</td>
                    <td class="font-mono text-right font-medium text-warning">{money(r.n2)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        依据《劳动合同法》第 46、47、87 条计算。"+1"代通知金严格口径为解除前上一个月工资，此处以 12 个月平均工资近似；月平均工资 = 应得工资（含奖金、津贴）÷12，高于当地社平 3 倍的部分封顶。2008 年前入职的长工龄可能分段计算，个案建议咨询律师或当地仲裁委；本结果仅为参考估算；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
