import { useState, useMemo } from 'preact/hooks';

export default function ChildHeight() {
  const [fh, setFh] = useState('175');
  const [mh, setMh] = useState('162');
  const [gender, setGender] = useState('boy');

  const r = useMemo(() => {
    const f = Number(fh), m = Number(mh);
    if (!Number.isFinite(f) || !Number.isFinite(m)) return null;
    if (f <= 0 || m <= 0) return null;
    const mid = (f + m) / 2;
    const target = gender === 'boy' ? mid + 6.5 : mid - 6.5;
    return { target, low: target - 5, high: target + 5 };
  }, [fh, mh, gender]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <Num label="父亲身高（cm）" value={fh} set={setFh} />
        <Num label="母亲身高（cm）" value={mh} set={setMh} />
        <label class="block">
          <span class="text-sm font-medium">孩子性别</span>
          <select
            class="select select-bordered select-sm mt-1.5 w-full"
            value={gender}
            onChange={(e) => setGender((e.target as HTMLSelectElement).value)}
          >
            <option value="boy">男孩</option>
            <option value="girl">女孩</option>
          </select>
        </label>
        {r && (
          <div class="grid grid-cols-1 gap-2 pt-1">
            <Stat label="预测成年身高" value={`${r.target.toFixed(1)} cm`} highlight />
            <Stat label="常见波动范围（±5cm）" value={`${r.low.toFixed(1)} ~ ${r.high.toFixed(1)} cm`} />
          </div>
        )}
        {r === null && <p class="text-xs text-error">请填写有效的父母身高</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        靶身高公式：男孩 =（父 + 母）÷ 2 + 6.5cm，女孩 =（父 + 母）÷ 2 − 6.5cm。这是遗传潜力中点估算，实际受营养、运动、睡眠影响，约 ±5cm 波动。所有计算本地完成。
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
