import { useState, useMemo } from 'preact/hooks';

function fmt(n: number): string {
  return Number.isFinite(n) ? n.toFixed(2) : '—';
}

/** 体积重 = L×W×H ÷ 除数；计费重 = max(实重, 体积重) */
export default function VolumeWeight() {
  const [l, setL] = useState('40');
  const [w, setW] = useState('30');
  const [h, setH] = useState('20');
  const [actual, setActual] = useState('2');
  const [divisor, setDivisor] = useState('8000');
  const [custom, setCustom] = useState('6000');

  const div = divisor === 'custom' ? custom : divisor;

  const r = useMemo(() => {
    const L = Number(l);
    const W = Number(w);
    const H = Number(h);
    const a = Number(actual);
    const d = Number(div);
    if (![L, W, H, a].every(Number.isFinite) || L <= 0 || W <= 0 || H <= 0 || a < 0) return null;
    if (!Number.isFinite(d) || d <= 0) return null;
    const volume = L * W * H;
    const volWeight = volume / d;
    const chargeable = Math.max(a, volWeight);
    return { volume, volWeight, chargeable, byVolume: volWeight > a };
  }, [l, w, h, actual, div]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="grid grid-cols-3 gap-2">
            <label class="block">
              <span class="text-sm font-medium">长（cm）</span>
              <input type="number" inputmode="decimal" min={0} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={l} onInput={(e) => setL((e.target as HTMLInputElement).value)} />
            </label>
            <label class="block">
              <span class="text-sm font-medium">宽（cm）</span>
              <input type="number" inputmode="decimal" min={0} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={w} onInput={(e) => setW((e.target as HTMLInputElement).value)} />
            </label>
            <label class="block">
              <span class="text-sm font-medium">高（cm）</span>
              <input type="number" inputmode="decimal" min={0} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={h} onInput={(e) => setH((e.target as HTMLInputElement).value)} />
            </label>
          </div>
          <label class="block">
            <span class="text-sm font-medium">实际重量（kg）</span>
            <input
              type="number" inputmode="decimal" min={0} step="0.01"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={actual}
              onInput={(e) => setActual((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">体积重除数</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={divisor}
              onChange={(e) => setDivisor((e.target as HTMLSelectElement).value)}
            >
              <option value="8000">8000（国内快递主流：顺丰/通达系）</option>
              <option value="5000">5000（国际 DHL/FedEx/UPS）</option>
              <option value="12000">12000（部分电商特惠件）</option>
              <option value="6000">6000（国际空运常见）</option>
              <option value="custom">自定义…</option>
            </select>
            {divisor === 'custom' && (
              <input
                type="number" inputmode="decimal" min={1}
                class="input input-bordered input-sm mt-1.5 w-full font-mono"
                value={custom}
                onInput={(e) => setCustom((e.target as HTMLInputElement).value)}
              />
            )}
          </label>
        </div>

        {r && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">计费重量</p>
                <p class="text-3xl font-bold font-mono text-warning">{fmt(r.chargeable)} kg</p>
              </div>
              <span class={`badge mb-1 ${r.byVolume ? 'badge-warning' : 'badge-outline'}`}>
                {r.byVolume ? '轻抛货：按体积重计费' : '按实际重量计费'}
              </span>
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">包裹体积</td>
                    <td class="font-mono text-right">{r.volume.toLocaleString('zh-CN')} cm³</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">体积重量（÷{div}）</td>
                    <td class="font-mono text-right">{fmt(r.volWeight)} kg</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">实际重量</td>
                    <td class="font-mono text-right">{fmt(Number(actual))} kg</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">计费重量（取大者）</td>
                    <td class="font-mono text-right font-medium">{fmt(r.chargeable)} kg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        体积重量（抛重）= 长 × 宽 × 高（cm）÷ 除数，计费重量取实重与体积重的较大值。除数以各承运商最新公示规则为准，同一家公司不同产品线（如顺丰标快与特惠）也可能不同；本工具结果供寄件前预估，实际费用以揽收计量为准；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
