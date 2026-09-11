import { useState, useMemo } from 'preact/hooks';

function fmtPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}'${String(s).padStart(2, '0')}"`;
}

function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

const PRESETS = [
  { label: '5 公里', km: 5 },
  { label: '10 公里', km: 10 },
  { label: '半程马拉松', km: 21.0975 },
  { label: '全程马拉松', km: 42.195 },
];

/** Riegel 公式：T2 = T1 × (D2/D1)^1.06 */
function riegel(t1: number, d1: number, d2: number): number {
  return t1 * Math.pow(d2 / d1, 1.06);
}

export default function RunningPace() {
  const [mode, setMode] = useState<'time' | 'pace'>('time');
  const [km, setKm] = useState('5');
  const [hh, setHh] = useState('0');
  const [mm, setMm] = useState('25');
  const [ss, setSs] = useState('0');
  const [paceM, setPaceM] = useState('5');
  const [paceS, setPaceS] = useState('0');

  const r = useMemo(() => {
    const d = Number(km);
    if (!Number.isFinite(d) || d <= 0) return null;
    if (mode === 'time') {
      const t = Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
      if (!Number.isFinite(t) || t <= 0) return null;
      const pace = t / d;
      return { d, t, pace, marathon: riegel(t, d, 42.195), half: riegel(t, d, 21.0975) };
    } else {
      const pace = Number(paceM) * 60 + Number(paceS);
      if (!Number.isFinite(pace) || pace <= 0) return null;
      const t = pace * d;
      return { d, t, pace, marathon: riegel(t, d, 42.195), half: riegel(t, d, 21.0975) };
    }
  }, [mode, km, hh, mm, ss, paceM, paceS]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex gap-2 mb-3">
          <button
            type="button"
            class={`btn btn-xs ${mode === 'time' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('time')}
          >
            按完赛时间算配速
          </button>
          <button
            type="button"
            class={`btn btn-xs ${mode === 'pace' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('pace')}
          >
            按配速算完赛时间
          </button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">距离（公里）</span>
            <input
              type="number" inputmode="decimal" min={0} step="0.5"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={km}
              onInput={(e) => setKm((e.target as HTMLInputElement).value)}
            />
            <div class="mt-1.5 flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button type="button" class="btn btn-xs btn-outline" onClick={() => setKm(String(p.km))}>
                  {p.label}
                </button>
              ))}
            </div>
          </label>
          {mode === 'time' ? (
            <div class="grid grid-cols-3 gap-2">
              <label class="block">
                <span class="text-sm font-medium">时</span>
                <input type="number" min={0} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={hh} onInput={(e) => setHh((e.target as HTMLInputElement).value)} />
              </label>
              <label class="block">
                <span class="text-sm font-medium">分</span>
                <input type="number" min={0} max={59} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={mm} onInput={(e) => setMm((e.target as HTMLInputElement).value)} />
              </label>
              <label class="block">
                <span class="text-sm font-medium">秒</span>
                <input type="number" min={0} max={59} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={ss} onInput={(e) => setSs((e.target as HTMLInputElement).value)} />
              </label>
            </div>
          ) : (
            <div class="grid grid-cols-2 gap-2">
              <label class="block">
                <span class="text-sm font-medium">配速（分/公里）</span>
                <input type="number" min={0} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={paceM} onInput={(e) => setPaceM((e.target as HTMLInputElement).value)} />
              </label>
              <label class="block">
                <span class="text-sm font-medium">配速（秒/公里）</span>
                <input type="number" min={0} max={59} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={paceS} onInput={(e) => setPaceS((e.target as HTMLInputElement).value)} />
              </label>
            </div>
          )}
        </div>

        {r && (
          <div class="mt-4 space-y-3">
            <div class="flex flex-wrap items-end gap-3">
              <div>
                <p class="text-xs opacity-60">配速</p>
                <p class="text-3xl font-bold font-mono text-warning">{fmtPace(r.pace)} / 公里</p>
              </div>
              <span class="badge badge-outline mb-1">完赛时间 {fmtTime(r.t)}</span>
            </div>
            <div class="overflow-x-auto">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td class="opacity-60">速度（公里/小时）</td>
                    <td class="font-mono text-right">{(3600 / r.pace).toFixed(2)} km/h</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">同状态半马预估（Riegel）</td>
                    <td class="font-mono text-right">{fmtTime(r.half)}（配速 {fmtPace(r.half / 21.0975)}）</td>
                  </tr>
                  <tr>
                    <td class="opacity-60">同状态全马预估（Riegel）</td>
                    <td class="font-mono text-right font-medium">{fmtTime(r.marathon)}（配速 {fmtPace(r.marathon / 42.195)}）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        配速 = 完赛时间 ÷ 距离；跨距离成绩预估采用 Riegel 公式 T₂ = T₁ × (D₂/D₁)^1.06，假设长距离训练量到位，实际成绩受耐力、天气、赛道影响。常见目标：全马破 4 需 5'41" 配速，破 330 需 4'59"，破 3 需 4'15"；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
