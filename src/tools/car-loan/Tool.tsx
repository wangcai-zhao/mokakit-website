import { useState, useMemo } from 'preact/hooks';

export default function CarLoan() {
  const [price, setPrice] = useState('150000');
  const [down, setDown] = useState('30000');
  const [apr, setApr] = useState('4.9');
  const [months, setMonths] = useState('36');

  const r = useMemo(() => {
    const p = Number(price), d = Number(down), a = Number(apr), n = Math.round(Number(months));
    if (![p, d, a, n].every(Number.isFinite)) return null;
    if (p <= 0 || d < 0 || d >= p || a < 0 || n < 1) return null;
    const principal = p - d;
    const mr = a / 100 / 12;
    const monthly = mr === 0
      ? principal / n
      : (principal * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1);
    const total = monthly * n;
    const interest = total - principal;
    return { principal, monthly, total, interest };
  }, [price, down, apr, months]);

  const money = (x: number) =>
    x.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <Num label="车价（元）" value={price} set={setPrice} />
        <Num label="首付（元）" value={down} set={setDown} />
        <Num label="贷款年利率（%）" value={apr} set={setApr} />
        <Num label="贷款期数（月）" value={months} set={setMonths} />
        {r && (
          <div class="grid grid-cols-2 gap-2 pt-1">
            <Stat label="贷款本金" value={`${money(r.principal)} 元`} />
            <Stat label="每月月供" value={`${money(r.monthly)} 元`} highlight />
            <Stat label="总利息" value={`${money(r.interest)} 元`} />
            <Stat label="总还款" value={`${money(r.total)} 元`} />
          </div>
        )}
        {r === null && <p class="text-xs text-error">请检查输入：车价需大于首付、利率与期数非负</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        按等额本息计算：每月还款固定，前期利息占比高。月利率 = 年利率 ÷ 12。提高首付或缩短期限都能降低总利息。所有计算本地完成。
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
