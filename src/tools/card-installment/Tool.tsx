import { useState, useMemo } from 'preact/hooks';

export default function CardInstallment() {
  const [principal, setPrincipal] = useState('12000');
  const [periods, setPeriods] = useState('12');
  const [feeRate, setFeeRate] = useState('0.6');

  const r = useMemo(() => {
    const P = Number(principal), n = Math.round(Number(periods)), m = Number(feeRate);
    if (!Number.isFinite(P) || !Number.isFinite(n) || !Number.isFinite(m)) return null;
    if (P <= 0 || n < 1 || m < 0) return null;
    const monthly = P / n + (P * m) / 100;
    const f = (rate: number) => {
      let npv = P;
      for (let i = 1; i <= n; i++) npv -= monthly / Math.pow(1 + rate, i);
      return npv;
    };
    let lo = 0;
    let hi = 2;
    if (f(hi) > 0) hi = 10;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) < 0) lo = mid;
      else hi = mid;
    }
    const mr = (lo + hi) / 2;
    const apr = (Math.pow(1 + mr, 12) - 1) * 100;
    const nominalApr = m * 12;
    const totalPay = monthly * n;
    return { monthly, mr: mr * 100, apr, nominalApr, totalPay, fee: totalPay - P };
  }, [principal, periods, feeRate]);

  const money = (x: number) =>
    x.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <Num label="分期本金（元）" value={principal} set={setPrincipal} />
        <Num label="分期期数（月）" value={periods} set={setPeriods} />
        <Num label="月手续费率（%，如 0.6）" value={feeRate} set={setFeeRate} />
        {r && (
          <div class="grid grid-cols-2 gap-2 pt-1">
            <Stat label="每月还款" value={`${money(r.monthly)} 元`} />
            <Stat label="总手续费" value={`${money(r.fee)} 元`} />
            <Stat label="名义年化" value={`${r.nominalApr.toFixed(2)}%`} />
            <Stat label="真实年化 APR" value={`${r.apr.toFixed(2)}%`} highlight />
          </div>
        )}
        {r === null && <p class="text-xs text-error">请填写有效的本金、期数与费率</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        每月手续费按全额本金计收，但你逐月还本，真实占用资金递减，因此真实年化远高于「月费率 × 12」。本工具用内部收益率（IRR）估算真实月利率后换算年化。所有计算本地完成。
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
