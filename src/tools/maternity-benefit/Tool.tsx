import { useState, useMemo } from 'preact/hooks';

export default function MaternityBenefit() {
  const [avgWage, setAvgWage] = useState('8000');
  const [days, setDays] = useState('128');
  const [myWage, setMyWage] = useState('');

  const r = useMemo(() => {
    const a = Number(avgWage), d = Number(days), m = Number(myWage);
    if (!Number.isFinite(a) || !Number.isFinite(d)) return null;
    if (a < 0 || d <= 0) return null;
    const benefit = (a / 30) * d;
    const diff = myWage.trim() !== '' && Number.isFinite(m) ? benefit - m : null;
    return { benefit, diff };
  }, [avgWage, days, myWage]);

  const money = (x: number) =>
    x.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <Num label="单位上年度职工月均工资（元）" value={avgWage} set={setAvgWage} />
        <Num label="产假天数（天）" value={days} set={setDays} />
        <Num label="本人产假前工资（元，可选）" value={myWage} set={setMyWage} />
        {r && (
          <div class="grid grid-cols-1 gap-2 pt-1">
            <Stat label="生育津贴（估算）" value={`${money(r.benefit)} 元`} highlight />
            {r.diff !== null && (
              <Stat
                label={r.diff < 0 ? '单位需补足差额' : '津贴高于本人工资'}
                value={`${money(Math.abs(r.diff))} 元`}
              />
            )}
          </div>
        )}
        {r === null && <p class="text-xs text-error">请填写有效的月均工资与产假天数</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        生育津贴 = 单位上年度职工月均工资 ÷ 30 × 产假天数。若津贴低于本人产假前工资，差额由单位补足。产假天数以当地政策为准（基础 98 天，难产 +15、多胞胎每婴 +15）。所有计算本地完成。
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
