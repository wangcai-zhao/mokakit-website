import { useState, useMemo } from 'preact/hooks';

const ACTIVITIES = [
  { key: 'walk', label: '步行（5km/h）', met: 3.5 },
  { key: 'jog', label: '慢跑（8km/h）', met: 8.0 },
  { key: 'run', label: '快跑（10km/h）', met: 9.8 },
  { key: 'bike', label: '骑车（休闲）', met: 4.0 },
  { key: 'swim', label: '游泳（自由泳）', met: 7.0 },
  { key: 'rope', label: '跳绳', met: 11.0 },
  { key: 'yoga', label: '瑜伽', met: 2.5 },
  { key: 'strength', label: '力量训练', met: 5.0 },
  { key: 'stairs', label: '爬楼梯', met: 8.0 },
  { key: 'taichi', label: '太极', met: 3.0 },
];

export default function CalorieBurn() {
  const [act, setAct] = useState('jog');
  const [weight, setWeight] = useState('60');
  const [mins, setMins] = useState('30');

  const r = useMemo(() => {
    const item = ACTIVITIES.find((x) => x.key === act);
    const met = item ? item.met : 0;
    const kg = Number(weight), t = Number(mins);
    if (!Number.isFinite(kg) || !Number.isFinite(t) || kg <= 0 || t <= 0) return null;
    const kcal = met * kg * (t / 60);
    return { kcal, met };
  }, [act, weight, mins]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <label class="block">
          <span class="text-sm font-medium">运动类型</span>
          <select
            class="select select-bordered select-sm mt-1.5 w-full"
            value={act}
            onChange={(e) => setAct((e.target as HTMLSelectElement).value)}
          >
            {ACTIVITIES.map((a) => (
              <option value={a.key}>
                {a.label}（MET {a.met}）
              </option>
            ))}
          </select>
        </label>
        <Num label="体重（kg）" value={weight} set={setWeight} />
        <Num label="时长（分钟）" value={mins} set={setMins} />
        {r && (
          <div class="grid grid-cols-2 gap-2 pt-1">
            <Stat label="热量消耗" value={`${r.kcal.toFixed(0)} kcal`} highlight />
            <Stat label="MET 值" value={r.met.toFixed(1)} />
          </div>
        )}
        {r === null && <p class="text-xs text-error">请填写有效的体重与时长</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        消耗(kcal) = MET × 体重(kg) × 时长(小时)。MET 为人群平均参考，体重越大、强度越高消耗越多。结果为估算，用于横向比较不同运动。所有计算本地完成。
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
