import { useState, useMemo } from 'preact/hooks';

export default function IdealWeight() {
  const [height, setHeight] = useState('170');
  const [gender, setGender] = useState('male');

  const r = useMemo(() => {
    const h = Number(height);
    if (!Number.isFinite(h) || h <= 0) return null;
    const broca = gender === 'male' ? h - 105 : (h - 105) * 0.9;
    const bmiW = 22 * Math.pow(h / 100, 2);
    return { broca, bmiW };
  }, [height, gender]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <Num label="身高（cm）" value={height} set={setHeight} />
        <label class="block">
          <span class="text-sm font-medium">性别</span>
          <select
            class="select select-bordered select-sm mt-1.5 w-full"
            value={gender}
            onChange={(e) => setGender((e.target as HTMLSelectElement).value)}
          >
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </label>
        {r && (
          <div class="grid grid-cols-2 gap-2 pt-1">
            <Stat label="改良 Broca 标准体重" value={`${r.broca.toFixed(1)} kg`} />
            <Stat label="BMI 法（目标 22）" value={`${r.bmiW.toFixed(1)} kg`} highlight />
          </div>
        )}
        {r === null && <p class="text-xs text-error">请填写有效的身高</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        改良 Broca：男 = 身高 − 105，女 =（身高 − 105）× 0.9；BMI 法：标准体重 = 22 × 身高(m)²。两者给出参考区间，实际还看肌肉量、骨架与体脂。所有计算本地完成。
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
