import { useState, useMemo } from 'preact/hooks';

export default function Trigonometry() {
  const [deg, setDeg] = useState('30');

  const r = useMemo(() => {
    const d = Number(deg);
    if (!Number.isFinite(d)) return null;
    const rad = (d * Math.PI) / 180;
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    const eps = 1e-12;
    const tan = Math.abs(cos) < eps ? null : Math.tan(rad);
    const cot = Math.abs(sin) < eps ? null : cos / sin;
    const sec = Math.abs(cos) < eps ? null : 1 / cos;
    const csc = Math.abs(sin) < eps ? null : 1 / sin;
    return { sin, cos, tan, cot, sec, csc };
  }, [deg]);

  const fmt = (x: number | null) => (x === null ? '不存在' : x.toFixed(4));

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <label class="block">
          <span class="text-sm font-medium">角度（度）</span>
          <input
            type="number"
            inputmode="decimal"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={deg}
            onInput={(e) => setDeg((e.target as HTMLInputElement).value)}
          />
        </label>
        {r && (
          <div class="grid grid-cols-3 gap-2 pt-1">
            <Stat label="sin" value={fmt(r.sin)} />
            <Stat label="cos" value={fmt(r.cos)} />
            <Stat label="tan" value={fmt(r.tan)} highlight />
            <Stat label="cot" value={fmt(r.cot)} />
            <Stat label="sec" value={fmt(r.sec)} />
            <Stat label="csc" value={fmt(r.csc)} />
          </div>
        )}
        {r === null && <p class="text-xs text-error">请填写有效的角度</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        输入为角度（度），工具内部自动转弧度。tan/cot 在 90°、270° 等分母为 0 处不存在；sec 在 90°、270° 不存在；csc 在 0°、180° 不存在，会显示「不存在」。所有计算本地完成。
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
