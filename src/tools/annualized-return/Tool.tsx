import { useState, useMemo } from 'preact/hooks';

export default function AnnualizedReturn() {
  const [principal, setPrincipal] = useState('10000');
  const [final, setFinal] = useState('11000');
  const [days, setDays] = useState('180');

  const r = useMemo(() => {
    const P = Number(principal), F = Number(final), d = Number(days);
    if (![P, F, d].every(Number.isFinite)) return null;
    if (P <= 0 || d <= 0) return null;
    const holding = F / P - 1;
    const annual = Math.pow(F / P, 365 / d) - 1;
    return { holding, annual };
  }, [principal, final, days]);

  const pct = (x: number) => `${(x * 100).toFixed(2)}%`;

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <Num label="投资本金（元）" value={principal} set={setPrincipal} />
        <Num label="期末金额（元）" value={final} set={setFinal} />
        <Num label="持有天数（天）" value={days} set={setDays} />
        {r && (
          <div class="grid grid-cols-2 gap-2 pt-1">
            <Stat label="持有期收益率" value={pct(r.holding)} />
            <Stat label="年化收益率" value={pct(r.annual)} highlight />
          </div>
        )}
        {r === null && <p class="text-xs text-error">请填写有效的本金与持有天数</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        年化 =（期末 ÷ 本金）^(365 ÷ 天数) − 1，按复利折算到一年，便于跨期限比较。亏损时同样适用，结果为负。所有计算本地完成。
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
