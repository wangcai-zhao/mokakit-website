import { useState, useMemo } from 'preact/hooks';

export default function ProfitMargin() {
  const [cost, setCost] = useState('100');
  const [price, setPrice] = useState('150');
  const [tCost, setTCost] = useState('100');
  const [tMargin, setTMargin] = useState('40');

  const a = useMemo(() => {
    const c = Number(cost), p = Number(price);
    if (!Number.isFinite(c) || !Number.isFinite(p) || c < 0 || p < 0) return null;
    const profit = p - c;
    const gross = p > 0 ? profit / p : 0;
    const costProfit = c > 0 ? profit / c : 0;
    return { profit, gross, costProfit };
  }, [cost, price]);

  const b = useMemo(() => {
    const c = Number(tCost), m = Number(tMargin);
    if (!Number.isFinite(c) || !Number.isFinite(m) || c < 0 || m < 0 || m >= 100) return null;
    const target = c / (1 - m / 100);
    return { target, profit: target - c };
  }, [tCost, tMargin]);

  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <div class="font-medium text-sm">① 成本 + 售价 → 算利润率</div>
        <Num label="成本价（元）" value={cost} set={setCost} />
        <Num label="销售价（元）" value={price} set={setPrice} />
        {a && (
          <div class="grid grid-cols-2 gap-2 pt-1">
            <Stat label="利润" value={`${a.profit.toFixed(2)} 元`} />
            <Stat label="毛利率" value={pct(a.gross)} />
            <Stat label="成本利润率" value={pct(a.costProfit)} />
            <Stat label="加价率" value={pct(a.costProfit)} />
          </div>
        )}
      </div>

      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <div class="font-medium text-sm">② 成本 + 目标毛利率 → 反推售价</div>
        <Num label="成本价（元）" value={tCost} set={setTCost} />
        <Num label="目标毛利率（%）" value={tMargin} set={setTMargin} />
        {b && (
          <div class="grid grid-cols-2 gap-2 pt-1">
            <Stat label="建议售价" value={`${b.target.toFixed(2)} 元`} />
            <Stat label="其中利润" value={`${b.profit.toFixed(2)} 元`} />
          </div>
        )}
        {b === null && <p class="text-xs text-error">目标毛利率需小于 100%</p>}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        毛利率 = 利润 ÷ 售价；成本利润率（加价率） = 利润 ÷ 成本。两者分母不同，数值差异大。运费、平台佣金等请并入成本再算。所有计算本地完成。
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
        inputmode="decimal"
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
    <div class="rounded-lg bg-base-100 p-3">
      <div class="text-xs opacity-60">{label}</div>
      <div class="text-lg font-bold font-mono mt-0.5">{value}</div>
    </div>
  );
}
