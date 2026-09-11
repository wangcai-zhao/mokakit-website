import { useState, useMemo } from 'preact/hooks';

function money(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** A股交易费用：佣金(双向,最低5元) + 印花税(卖出0.05%) + 过户费(双向0.001%) */
export default function StockFeeCalc() {
  const [amount, setAmount] = useState('10000');
  const [rate, setRate] = useState('0.025');
  const [minFee, setMinFee] = useState('5');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');

  const r = useMemo(() => {
    const amt = Number(amount);
    const rt = Number(rate);
    const mn = Number(minFee);
    if (![amt, rt, mn].every(Number.isFinite) || amt <= 0 || rt < 0) return null;
    const commissionRaw = (amt * rt) / 100;
    const commission = Math.max(commissionRaw, mn);
    const stamp = side === 'sell' ? amt * 0.0005 : 0;
    const transfer = amt * 0.00001;
    const total = commission + stamp + transfer;
    // 保本卖出价：买入总成本 + 卖出费用 = 卖出金额
    const breakeven = amt * (1 + 0.00001) / (1 - rt / 100 - 0.0005 - 0.00001);
    return { amt, commission, commissionRaw, stamp, transfer, total, breakeven, usedMin: commissionRaw < mn };
  }, [amount, rate, minFee, side]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">成交金额（元）</span>
            <input
              type="number" inputmode="decimal" min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={amount}
              onInput={(e) => setAmount((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">佣金费率（%，万 2.5 填 0.025）</span>
            <input
              type="number" inputmode="decimal" min={0} step="0.001"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={rate}
              onInput={(e) => setRate((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">单笔最低佣金（元）</span>
            <input
              type="number" inputmode="decimal" min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={minFee}
              onInput={(e) => setMinFee((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">方向</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={side}
              onChange={(e) => setSide((e.target as HTMLSelectElement).value as 'buy' | 'sell')}
            >
              <option value="buy">买入</option>
              <option value="sell">卖出（含印花税 0.05%）</option>
            </select>
          </label>
        </div>

        {r && (
          <div class="mt-4 overflow-x-auto">
            <table class="table table-sm">
              <tbody>
                <tr>
                  <td class="opacity-60">券商佣金{r.usedMin ? '（触发最低收费）' : ''}</td>
                  <td class="font-mono text-right">{money(r.commission)} 元</td>
                </tr>
                <tr>
                  <td class="opacity-60">印花税（仅卖出）</td>
                  <td class="font-mono text-right">{money(r.stamp)} 元</td>
                </tr>
                <tr>
                  <td class="opacity-60">过户费（万 0.1）</td>
                  <td class="font-mono text-right">{money(r.transfer)} 元</td>
                </tr>
                <tr>
                  <td class="opacity-60">费用合计</td>
                  <td class="font-mono text-right text-warning">{money(r.total)} 元</td>
                </tr>
                <tr>
                  <td class="opacity-60">费用占比</td>
                  <td class="font-mono text-right">{((r.total / r.amt) * 100).toFixed(4)}%</td>
                </tr>
                <tr>
                  <td class="opacity-60">保本卖出价参考（原价买、原价卖）</td>
                  <td class="font-mono text-right font-medium">{money(r.breakeven)} 元（涨 {((r.breakeven / r.amt - 1) * 100).toFixed(3)}% 回本）</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        印花税按 2023 年 8 月 28 日起执行的 0.05%（仅卖出方）计算；过户费按 0.001%（万 0.1）计，沪深两市现均收取；证管费/经手费等规费（合计约万 0.69）多数券商已含在佣金内，未含时可自行上调佣金费率近似。结果为估算，实际以券商账单为准；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
