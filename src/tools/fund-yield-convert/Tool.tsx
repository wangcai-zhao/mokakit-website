import { useState, useMemo } from 'preact/hooks';

function money(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 万份收益 ↔ 七日年化 互算：万份收益 ≈ 七日年化 × 10000 / 365 */
export default function FundYieldConvert() {
  const [mode, setMode] = useState<'wanfen' | 'annualized'>('wanfen');
  const [wanfen, setWanfen] = useState('0.60');
  const [annualized, setAnnualized] = useState('2.19');
  const [holding, setHolding] = useState('100000');

  const r = useMemo(() => {
    const h = Number(holding);
    if (!Number.isFinite(h) || h < 0) return null;
    let wf: number;
    let ann: number;
    if (mode === 'wanfen') {
      wf = Number(wanfen);
      if (!Number.isFinite(wf) || wf < 0) return null;
      ann = (wf / 10000) * 365 * 100;
    } else {
      ann = Number(annualized);
      if (!Number.isFinite(ann) || ann < 0) return null;
      wf = (ann / 100 / 365) * 10000;
    }
    const daily = (h / 10000) * wf;
    return { wf, ann, daily, monthly: daily * 30, yearly: daily * 365 };
  }, [mode, wanfen, annualized, holding]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex gap-2 mb-3">
          <button
            type="button"
            class={`btn btn-xs ${mode === 'wanfen' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('wanfen')}
          >
            我知道万份收益
          </button>
          <button
            type="button"
            class={`btn btn-xs ${mode === 'annualized' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('annualized')}
          >
            我知道七日年化
          </button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          {mode === 'wanfen' ? (
            <label class="block">
              <span class="text-sm font-medium">万份收益（每万元当日收益，元）</span>
              <input
                type="number" inputmode="decimal" min={0} step="0.01"
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={wanfen}
                onInput={(e) => setWanfen((e.target as HTMLInputElement).value)}
              />
            </label>
          ) : (
            <label class="block">
              <span class="text-sm font-medium">七日年化收益率（%）</span>
              <input
                type="number" inputmode="decimal" min={0} step="0.01"
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={annualized}
                onInput={(e) => setAnnualized((e.target as HTMLInputElement).value)}
              />
            </label>
          )}
          <label class="block">
            <span class="text-sm font-medium">持有金额（元）</span>
            <input
              type="number" inputmode="decimal" min={0}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={holding}
              onInput={(e) => setHolding((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {r && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">换算结果</p>
                <p class="text-2xl font-bold font-mono">
                  万份收益 {r.wf.toFixed(4)} 元 ≈ 七日年化 {r.ann.toFixed(3)}%
                </p>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">每日收益</td>
                    <td class="font-mono text-right">{money(r.daily)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">每月收益（×30 估）</td>
                    <td class="font-mono text-right">{money(r.monthly)} 元</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">一年收益（×365 估）</td>
                    <td class="font-mono text-right font-medium text-warning">{money(r.yearly)} 元</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        换算公式：万份收益 ≈ 七日年化 × 10000 ÷ 365（近似口径，二者因统计窗口不同存在小偏差）。货币基金收益每日浮动，节假日按前一交易日口径，本工具结果仅为估算参考，不构成投资建议；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
