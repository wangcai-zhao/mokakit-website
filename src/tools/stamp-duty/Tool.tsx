import { useState, useMemo } from 'preact/hooks';

const TYPES = [
  { key: 'loan', label: '借款合同', ratePct: 0.005 },
  { key: 'sales', label: '买卖合同（购销）', ratePct: 0.03 },
  { key: 'process', label: '承揽合同', ratePct: 0.03 },
  { key: 'build', label: '建设工程合同', ratePct: 0.03 },
  { key: 'transport', label: '运输合同', ratePct: 0.03 },
  { key: 'tech', label: '技术合同', ratePct: 0.03 },
  { key: 'lease', label: '租赁合同', ratePct: 0.1 },
  { key: 'storage', label: '保管 / 仓储合同', ratePct: 0.1 },
  { key: 'insurance', label: '财产保险合同', ratePct: 0.1 },
  { key: 'property', label: '产权转移书据', ratePct: 0.05 },
  { key: 'ledger', label: '营业账簿（资金）', ratePct: 0.025 },
];

export default function StampDuty() {
  const [typeKey, setTypeKey] = useState('sales');
  const [customRate, setCustomRate] = useState('');
  const [amount, setAmount] = useState('100000');
  const [half, setHalf] = useState(false);

  const ratePct = useMemo(() => {
    if (customRate.trim() !== '') {
      const r = Number(customRate);
      if (Number.isFinite(r) && r >= 0) return r;
    }
    const t = TYPES.find((x) => x.key === typeKey);
    return t ? t.ratePct : 0;
  }, [typeKey, customRate]);

  const result = useMemo(() => {
    const a = Number(amount);
    if (!Number.isFinite(a) || a < 0) return null;
    const raw = (a * ratePct) / 100;
    const tax = half ? raw / 2 : raw;
    return { raw, tax };
  }, [amount, ratePct, half]);

  const money = (x: number) =>
    x.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <label class="block">
          <span class="text-sm font-medium">合同类型</span>
          <select
            class="select select-bordered select-sm mt-1.5 w-full"
            value={typeKey}
            onChange={(e) => setTypeKey((e.target as HTMLSelectElement).value)}
          >
            {TYPES.map((t) => (
              <option value={t.key}>
                {t.label}（{t.ratePct}%）
              </option>
            ))}
          </select>
        </label>
        <Num label="自定义税率（%，留空则用上方类型）" value={customRate} set={setCustomRate} />
        <Num label="计税金额（元）" value={amount} set={setAmount} />
        <label class="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={half}
            onChange={(e) => setHalf((e.target as HTMLInputElement).checked)}
          />
          小规模纳税人减半优惠（×50%）
        </label>
        {result && (
          <div class="grid grid-cols-2 gap-2 pt-1">
            <Stat label="适用税率" value={`${ratePct}%`} />
            <Stat label="应缴印花税" value={`${money(result.tax)} 元`} highlight />
            {half && <Stat label="未优惠应缴" value={`${money(result.raw)} 元`} />}
            {half && <Stat label="本次减免" value={`${money(result.raw - result.tax)} 元`} />}
          </div>
        )}
        {result === null && <p class="text-xs text-error">请填写有效的计税金额</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        税率为《印花税法》常见税目：买卖合同万分之三、租赁千分之一、产权转移书据万分之五等。实际计税口径以主管税务机关规定为准。所有计算本地完成。
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
