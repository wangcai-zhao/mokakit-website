import { useState, useMemo } from 'preact/hooks';

export default function WaterIntake() {
  const [w, setW] = useState('60');

  const r = useMemo(() => {
    const kg = Number(w);
    if (!Number.isFinite(kg) || kg <= 0) return null;
    return { low: kg * 30, mid: kg * 35, high: kg * 40 };
  }, [w]);

  const cup = (ml: number) => `${(ml / 250).toFixed(1)} 杯`;

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <label class="block">
          <span class="text-sm font-medium">体重（kg）</span>
          <input
            type="number"
            inputmode="decimal"
            min={0}
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={w}
            onInput={(e) => setW((e.target as HTMLInputElement).value)}
          />
        </label>
        {r && (
          <div class="grid grid-cols-2 gap-2 pt-1">
            <Stat label="下限（30ml/kg）" value={`${r.low.toFixed(0)} ml`} />
            <Stat label="推荐（35ml/kg）" value={`${r.mid.toFixed(0)} ml`} highlight />
            <Stat label="上限（40ml/kg）" value={`${r.high.toFixed(0)} ml`} />
            <Stat label="约折合" value={cup(r.mid)} />
          </div>
        )}
        {r === null && <p class="text-xs text-error">请填写有效的体重</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        按「体重 × 30–40 毫升」估算每日总饮水（含白水、茶、咖啡，不含酒精）。运动多、出汗多、炎热或哺乳期往上靠；分次随渴喝，不必硬灌到上限。所有计算本地完成。
      </p>
    </div>
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
