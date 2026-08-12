import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { parseTime } from './time';

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface Row {
  start: string;
  end: string;
  brk: string;
}

export default function WorkHours({ title }: { title?: string }) {
  const [rows, setRows] = useState<Row[]>(() =>
    DAYS.map(() => ({ start: '09:00', end: '18:00', brk: '1' })),
  );
  const [copied, setCopied] = useState(false);

  const setRow = (i: number, key: keyof Row, val: string) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  const calc = useMemo(() => {
    const daily = rows.map((r) => {
      const s = parseTime(r.start);
      const e = parseTime(r.end);
      const b = Number(r.brk);
      if (!s || !e || !Number.isFinite(b) || b < 0) return null;
      const mins = e.h * 60 + e.m - (s.h * 60 + s.m) - b * 60;
      return mins;
    });
    if (daily.some((d) => d === null)) return null;
    const totalMin = daily.reduce((a, b) => a + (b as number), 0);
    return { daily: daily as number[], totalMin };
  }, [rows]);

  const copy = async (text: string) => {
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const totalHours = calc ? calc.totalMin / 60 : 0;
  const avgHours = calc ? totalHours / 7 : 0;
  const overtime = calc ? Math.max(0, totalHours - 40) : 0;

  return (
    <div class="space-y-4">
      {title && <p class="text-sm opacity-70">{title}</p>}

      <div class="overflow-x-auto rounded-xl bg-base-200 p-2 sm:p-3">
        <table class="table table-sm">
          <thead>
            <tr>
              <td class="opacity-60">日期</td>
              <td class="opacity-60">上班</td>
              <td class="opacity-60">下班</td>
              <td class="opacity-60">休息(小时)</td>
              <td class="opacity-60">当日工时</td>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const s = parseTime(r.start);
              const e = parseTime(r.end);
              const b = Number(r.brk);
              const valid = s && e && Number.isFinite(b) && b >= 0;
              const mins =
                valid && s && e ? e.h * 60 + e.m - (s.h * 60 + s.m) - b * 60 : null;
              return (
                <tr key={DAYS[i]}>
                  <td>{DAYS[i]}</td>
                  <td>
                    <input
                      type="time"
                      class="input input-bordered input-xs w-24 font-mono"
                      value={r.start}
                      onInput={(ev) => setRow(i, 'start', (ev.target as HTMLInputElement).value)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      class="input input-bordered input-xs w-24 font-mono"
                      value={r.end}
                      onInput={(ev) => setRow(i, 'end', (ev.target as HTMLInputElement).value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      class="input input-bordered input-xs w-16 font-mono"
                      value={r.brk}
                      onInput={(ev) => setRow(i, 'brk', (ev.target as HTMLInputElement).value)}
                    />
                  </td>
                  <td class="font-mono">
                    {mins === null ? '—' : `${(mins / 60).toFixed(2)} h`}
                    {mins !== null && mins < 0 && (
                      <span class="badge badge-warning badge-xs ml-1">下班早于上班</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!calc && <p class="text-sm text-error">请填写有效的上班/下班时间与非负休息小时</p>}

      {calc && (
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-base-100 p-3">
            <p class="text-xs opacity-60">本周总工时</p>
            <p class="text-xl font-semibold">{totalHours.toFixed(2)} 小时</p>
          </div>
          <div class="rounded-xl bg-base-100 p-3">
            <p class="text-xs opacity-60">日均工时</p>
            <p class="text-xl font-semibold">{avgHours.toFixed(2)} 小时</p>
          </div>
          <div class="rounded-xl bg-base-100 p-3">
            <p class="text-xs opacity-60">加班时长（&gt;40h）</p>
            <p class="text-xl font-semibold text-warning">{overtime.toFixed(2)} 小时</p>
          </div>
        </div>
      )}

      {calc && (
        <button
          type="button"
          class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
          onClick={() => copy(`${totalHours.toFixed(2)} 小时（加班 ${overtime.toFixed(2)} 小时）`)}
        >
          {copied ? '已复制' : '复制周总工时'}
        </button>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        工时 = 下班 − 上班 − 休息；加班按超过 40 小时计。全部本地计算，不上传数据。
      </p>
    </div>
  );
}
