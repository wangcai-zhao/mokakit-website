import { useState, useMemo } from 'preact/hooks';

const BRACKETS = [
  { upTo: 36000, rate: 0.03, deduct: 0 },
  { upTo: 144000, rate: 0.1, deduct: 2520 },
  { upTo: 300000, rate: 0.2, deduct: 16920 },
  { upTo: 420000, rate: 0.25, deduct: 31920 },
  { upTo: 660000, rate: 0.3, deduct: 52920 },
  { upTo: 960000, rate: 0.35, deduct: 85920 },
  { upTo: Infinity, rate: 0.45, deduct: 181920 },
];

function calcTax(taxable: number) {
  if (taxable <= 0) return { tax: 0, rate: 0, deduct: 0 };
  for (const b of BRACKETS) {
    if (taxable <= b.upTo) return { tax: Math.max(0, taxable * b.rate - b.deduct), rate: b.rate, deduct: b.deduct };
  }
  return { tax: 0, rate: 0, deduct: 0 };
}

const fmt = (n: number) =>
  n.toLocaleString('zh-CN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export default function AnnualTaxSettlement() {
  const [income, setIncome] = useState('200000');
  const [insurance, setInsurance] = useState('30000');
  const [special, setSpecial] = useState('24000');
  const [other, setOther] = useState('0');
  const [prepaid, setPrepaid] = useState('12000');

  const result = useMemo(() => {
    const inc = Number(income.trim());
    const ins = Number(insurance.trim());
    const sp = Number(special.trim());
    const ot = Number(other.trim());
    const pre = Number(prepaid.trim());
    if (![inc, ins, sp, ot, pre].every(Number.isFinite) || inc < 0) return null;
    const taxable = Math.max(0, inc - 60000 - ins - sp - ot);
    const { tax, rate } = calcTax(taxable);
    const diff = tax - pre;
    return { taxable, tax, rate, pre, diff };
  }, [income, insurance, special, other, prepaid]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <Num label="全年综合所得收入（元）" value={income} set={setIncome} placeholder="如 200000" />
        <Num label="三险一金（专项扣除）年总额（元）" value={insurance} set={setInsurance} placeholder="如 30000" />
        <Num label="专项附加扣除年总额（元）" value={special} set={setSpecial} placeholder="如 24000" />
        <Num label="其他依法扣除（元）" value={other} set={setOther} placeholder="如 0" />
        <Num label="已预缴税额（元）" value={prepaid} set={setPrepaid} placeholder="如 12000" />
      </div>

      {!result && <p class="text-sm text-error">请填写有效的非负数金额</p>}

      {result && (
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <Stat label="应纳税所得额" value={`${fmt(result.taxable)} 元`} />
            <Stat label="适用税率" value={result.rate > 0 ? `${(result.rate * 100).toFixed(0)}%` : '0（无需纳税）'} />
            <Stat label="全年应纳税额" value={`${fmt(result.tax)} 元`} />
            <Stat label="已预缴税额" value={`${fmt(result.pre)} 元`} />
          </div>

          <div class={`rounded-xl p-4 text-center ${result.diff > 0 ? 'bg-error/10' : result.diff < 0 ? 'bg-success/10' : 'bg-base-200'}`}>
            {result.diff > 0 ? (
              <p class="text-lg font-bold">需补税 <span class="font-mono">{fmt(result.diff)} 元</span></p>
            ) : result.diff < 0 ? (
              <p class="text-lg font-bold">可退税 <span class="font-mono">{fmt(-result.diff)} 元</span></p>
            ) : (
              <p class="text-lg font-bold">不退不补</p>
            )}
            <p class="text-xs opacity-60 mt-1">全年应纳税额 − 已预缴 = 应补 / 退税额</p>
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        公式：应纳税所得额 = 收入 − 6 万 − 三险一金 − 专项附加扣除 − 其他扣除；按 7 级超额累进税率计算。
        结果仅供参考，最终以个税 App 预填数据为准。所有计算在浏览器本地完成。
      </p>
    </div>
  );
}

function Num({ label, value, set, placeholder }: { label: string; value: string; set: (v: string) => void; placeholder?: string }) {
  return (
    <label class="block">
      <span class="text-sm font-medium">{label}</span>
      <input
        type="number"
        inputmode="decimal"
        min={0}
        class="input input-bordered input-sm mt-1.5 w-full font-mono"
        placeholder={placeholder}
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
