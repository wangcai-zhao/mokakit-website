import { useState, useMemo } from 'preact/hooks';

function fmtClock(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 90 分钟周期 + 15 分钟入睡缓冲 */
const CYCLE = 90;
const BUFFER = 15;

export default function SleepCycle() {
  const [mode, setMode] = useState<'wake' | 'now'>('wake');
  const [wakeH, setWakeH] = useState('7');
  const [wakeM, setWakeM] = useState('30');
  const [sleepH, setSleepH] = useState('23');
  const [sleepM, setSleepM] = useState('30');

  const r = useMemo(() => {
    if (mode === 'wake') {
      const wh = Number(wakeH);
      const wm = Number(wakeM);
      if (![wh, wm].every(Number.isFinite)) return null;
      const wakeMin = (wh * 60 + wm + 24 * 60) % (24 * 60);
      // 倒推：入睡时刻 = 起床 − 15 分钟缓冲 − n×90
      const options = [6, 5, 4, 3].map((n) => {
        const bed = (wakeMin - BUFFER - n * CYCLE + 24 * 60 * 10) % (24 * 60);
        return { cycles: n, hours: (n * CYCLE) / 60, bed };
      });
      return { mode: 'wake', options };
    } else {
      const sh = Number(sleepH);
      const sm = Number(sleepM);
      if (![sh, sm].every(Number.isFinite)) return null;
      const sleepMin = sh * 60 + sm;
      const options = [6, 5, 4, 3].map((n) => {
        const wake = (sleepMin + BUFFER + n * CYCLE) % (24 * 60);
        return { cycles: n, hours: (n * CYCLE) / 60, bed: wake };
      });
      return { mode: 'now', options };
    }
  }, [mode, wakeH, wakeM, sleepH, sleepM]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex gap-2 mb-3">
          <button
            type="button"
            class={`btn btn-xs ${mode === 'wake' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('wake')}
          >
            我要几点起 → 推荐入睡时间
          </button>
          <button
            type="button"
            class={`btn btn-xs ${mode === 'now' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('now')}
          >
            我现在睡 → 预估醒来时间
          </button>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          {mode === 'wake' ? (
            <div class="grid grid-cols-2 gap-2">
              <label class="block">
                <span class="text-sm font-medium">起床时间（时）</span>
                <input type="number" min={0} max={23} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={wakeH} onInput={(e) => setWakeH((e.target as HTMLInputElement).value)} />
              </label>
              <label class="block">
                <span class="text-sm font-medium">起床时间（分）</span>
                <input type="number" min={0} max={59} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={wakeM} onInput={(e) => setWakeM((e.target as HTMLInputElement).value)} />
              </label>
            </div>
          ) : (
            <div class="grid grid-cols-2 gap-2">
              <label class="block">
                <span class="text-sm font-medium">入睡时间（时）</span>
                <input type="number" min={0} max={23} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={sleepH} onInput={(e) => setSleepH((e.target as HTMLInputElement).value)} />
              </label>
              <label class="block">
                <span class="text-sm font-medium">入睡时间（分）</span>
                <input type="number" min={0} max={59} class="input input-bordered input-sm mt-1.5 w-full font-mono" value={sleepM} onInput={(e) => setSleepM((e.target as HTMLInputElement).value)} />
              </label>
            </div>
          )}
          <div class="text-xs opacity-60 self-center leading-relaxed">
            每个睡眠周期约 90 分钟，另预留 15 分钟入睡缓冲。健康成人每晚建议 4～6 个周期（6～9 小时）。
          </div>
        </div>

        {r && (
          <div class="mt-4 overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>{r.mode === 'wake' ? '入睡时刻' : '醒来时刻'}</th>
                  <th>周期数</th>
                  <th>睡眠时长</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {r.options.map((o) => (
                  <tr>
                    <td class="font-mono font-medium">{fmtClock(Math.floor(o.bed / 60), o.bed % 60)}</td>
                    <td class="font-mono">{o.cycles} 个</td>
                    <td class="font-mono">{o.hours.toFixed(1)} 小时</td>
                    <td class="text-xs opacity-60">
                      {o.cycles >= 6 ? '睡眠充足' : o.cycles === 5 ? '多数人推荐' : o.cycles === 4 ? '最低限度' : '严重不足'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        睡眠周期因人在 80～120 分钟之间浮动，90 分钟为通用估计；在周期交界的浅睡阶段醒来最轻松。连续几天记录自然醒来的时间点，比任何计算器都准。本工具结果仅供参考，长期失眠或日间严重困倦请咨询医生；计算在本地完成，不上传数据。
      </p>
    </div>
  );
}
