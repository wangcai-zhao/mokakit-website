import { useState, useMemo } from 'preact/hooks';

export default function MedicalInsurance() {
  const [total, setTotal] = useState('20000');
  const [self, setSelf] = useState('2000');
  const [deduct, setDeduct] = useState('1300');
  const [ratio, setRatio] = useState('85');
  const [cap, setCap] = useState('300000');

  const r = useMemo(() => {
    const t = Number(total), s = Number(self), d = Number(deduct), p = Number(ratio), c = Number(cap);
    if (![t, s, d, p, c].every(Number.isFinite)) return null;
    if (t < 0 || s < 0 || d < 0 || p < 0 || p > 100 || c < 0) return null;
    const compliant = Math.max(t - s, 0);
    const base = Math.max(compliant - d, 0);
    const reimbursable = base * (p / 100);
    const paid = Math.min(reimbursable, c);
    const selfPay = t - paid;
    return { compliant, base, paid, selfPay };
  }, [total, self, deduct, ratio, cap]);

  const money = (x: number) =>
    x.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <Num label="医疗费用总额（元）" value={total} set={setTotal} />
        <Num label="自费 / 自付部分（不报销，元）" value={self} set={setSelf} />
        <Num label="起付线（元）" value={deduct} set={setDeduct} />
        <Num label="报销比例（%）" value={ratio} set={setRatio} />
        <Num label="封顶线（年度报销上限，元）" value={cap} set={setCap} />
        {r && (
          <div class="grid grid-cols-2 gap-2 pt-1">
            <Stat label="合规费用" value={`${money(r.compliant)} 元`} />
            <Stat label="报销基数" value={`${money(r.base)} 元`} />
            <Stat label="医保报销" value={`${money(r.paid)} 元`} highlight />
            <Stat label="个人自付" value={`${money(r.selfPay)} 元`} />
          </div>
        )}
        {r === null && <p class="text-xs text-error">请检查输入：金额需非负、比例 0–100</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        报销 =（合规费用 − 起付线）× 比例，并受封顶线约束。合规费用 = 总额 − 自费部分。各地起付线、比例、封顶线不同，请以参保地政策为准。所有计算本地完成。
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
