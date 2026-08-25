import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

export default function HourlyWageCalc() {
  const [mode, setMode] = useState<'toMonthly' | 'toHourly'>('toMonthly');
  const [wage, setWage] = useState('50');
  const [monthly, setMonthly] = useState('8000');
  const [hoursPerDay, setHoursPerDay] = useState('8');
  const [daysPerMonth, setDaysPerMonth] = useState('21.75');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    const hpd = Number(hoursPerDay);
    const dpm = Number(daysPerMonth);
    if (![hpd, dpm].every(Number.isFinite) || hpd <= 0 || dpm <= 0) return null;
    const totalHours = hpd * dpm;
    if (mode === 'toMonthly') {
      const w = Number(wage);
      if (!Number.isFinite(w) || w < 0) return null;
      const day = w * hpd;
      const mon = day * dpm;
      return { day, mon, year: mon * 12, hourly: w };
    }
    const m = Number(monthly);
    if (!Number.isFinite(m) || m < 0) return null;
    const h = m / totalHours;
    return { day: h * hpd, mon: m, year: m * 12, hourly: h };
  }, [mode, wage, monthly, hoursPerDay, daysPerMonth]);

  const copy = async (t: string) => {
    await copyText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <div class="tabs tabs-boxed">
          <button
            type="button"
            class={`tab ${mode === 'toMonthly' ? 'tab-active' : ''}`}
            onClick={() => setMode('toMonthly')}
          >
            时薪 → 月薪
          </button>
          <button
            type="button"
            class={`tab ${mode === 'toHourly' ? 'tab-active' : ''}`}
            onClick={() => setMode('toHourly')}
          >
            月薪 → 时薪
          </button>
        </div>

        {mode === 'toMonthly' ? (
          <label class="form-control">
            <span class="label-text">时薪（元/小时）</span>
            <input
              type="number"
              class="input input-bordered input-sm font-mono"
              value={wage}
              onInput={(e) => setWage((e.target as HTMLInputElement).value)}
            />
          </label>
        ) : (
          <label class="form-control">
            <span class="label-text">月薪（元/月）</span>
            <input
              type="number"
              class="input input-bordered input-sm font-mono"
              value={monthly}
              onInput={(e) => setMonthly((e.target as HTMLInputElement).value)}
            />
          </label>
        )}

        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <span class="label-text">每天工时</span>
            <input
              type="number"
              class="input input-bordered input-sm font-mono"
              value={hoursPerDay}
              onInput={(e) => setHoursPerDay((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="form-control">
            <span class="label-text">每月工作天数</span>
            <input
              type="number"
              class="input input-bordered input-sm font-mono"
              value={daysPerMonth}
              onInput={(e) => setDaysPerMonth((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {!res && <p class="text-sm text-error">请输入有效正数，且工时/天数大于 0。</p>}
        {res && (
          <div class="space-y-2">
            <Row label="时薪" value={`¥${res.hourly.toFixed(2)}`} highlight />
            <Row label="日薪" value={`¥${res.day.toFixed(2)}`} />
            <Row label="月薪" value={`¥${res.mon.toFixed(2)}`} highlight />
            <Row label="年薪" value={`¥${res.year.toFixed(2)}`} />
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() =>
                copy(
                  `时薪¥${res.hourly.toFixed(2)} / 月薪¥${res.mon.toFixed(2)} / 年薪¥${res.year.toFixed(2)}`
                )
              }
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        )}
      </div>
      <p class="text-xs opacity-55">
        默认 21.75 天为法定月计薪天数（含 11 天法定假日折算）。全部本地计算。
      </p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div class="flex items-center justify-between">
      <span class="text-sm opacity-70">{label}</span>
      <span class={`font-mono font-bold ${highlight ? 'text-lg text-primary' : ''}`}>{value}</span>
    </div>
  );
}
