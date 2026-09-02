import { useState, useMemo } from 'preact/hooks';

export default function RentalYield() {
  const [price, setPrice] = useState('2000000');
  const [rent, setRent] = useState('4000');

  const r = useMemo(() => {
    const p = Number(price), m = Number(rent);
    if (!Number.isFinite(p) || !Number.isFinite(m)) return null;
    if (p <= 0 || m <= 0) return null;
    const ratioMonths = p / m;
    const ratioYears = p / (m * 12);
    const yieldPct = (m * 12) / p * 100;
    return { ratioMonths, ratioYears, yieldPct };
  }, [price, rent]);

  const money = (x: number) =>
    x.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <Num label="房产总价（元）" value={price} set={setPrice} />
        <Num label="月租金（元）" value={rent} set={setRent} />
        {r && (
          <div class="grid grid-cols-2 gap-2 pt-1">
            <Stat label="租售比（月）" value={`${money(r.ratioMonths)} 个月`} />
            <Stat label="售租比（年）" value={`${r.ratioYears.toFixed(1)} 年`} />
            <Stat label="年化毛租金回报" value={`${r.yieldPct.toFixed(2)}%`} highlight />
            <Stat label="回本年限（毛）" value={`${(r.ratioYears).toFixed(1)} 年`} />
          </div>
        )}
        {r === null && <p class="text-xs text-error">请填写有效的房价与月租金</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        租售比 = 总价 ÷ 月租金（回本月数）；售租比 = 总价 ÷ 年租金（年）；年化毛回报 = 月租 × 12 ÷ 总价。均为毛口径，未扣空置、维修、税费。所有计算本地完成。
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

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div class={`rounded-lg p-3 ${highlight ? 'bg-primary text-primary-content' : 'bg-base-100'}`}>
      <div class="text-xs opacity-60">{label}</div>
      <div class="text-lg font-bold font-mono mt-0.5">{value}</div>
    </div>
  );
}
