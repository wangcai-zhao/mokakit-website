import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function addDays(s: string, d: number): string {
  const dt = new Date(s + 'T00:00:00');
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
}

export default function MenstrualCycleCalc() {
  const [lmp, setLmp] = useState('2026-08-01');
  const [cycle, setCycle] = useState('28');
  const [period, setPeriod] = useState('5');
  const [copied, setCopied] = useState(false);

  const res = useMemo(() => {
    if (!lmp) return null;
    const c = Number(cycle);
    const p = Number(period);
    if (!Number.isFinite(c) || c < 15 || c > 45) return null;
    if (!Number.isFinite(p) || p < 1 || p > 15) return null;
    const next = addDays(lmp, c);
    const ovulation = addDays(next, -14);
    const fertileStart = addDays(ovulation, -2);
    const fertileEnd = addDays(ovulation, 2);
    return { next, ovulation, fertileStart, fertileEnd };
  }, [lmp, cycle, period]);

  const copy = async (t: string) => {
    await copyText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <label class="form-control">
          <span class="label-text">末次月经第一天</span>
          <input
            type="date"
            class="input input-bordered input-sm"
            value={lmp}
            onInput={(e) => setLmp((e.target as HTMLInputElement).value)}
          />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="form-control">
            <span class="label-text">周期长度（天）</span>
            <input
              type="number"
              class="input input-bordered input-sm font-mono"
              value={cycle}
              onInput={(e) => setCycle((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="form-control">
            <span class="label-text">经期长度（天）</span>
            <input
              type="number"
              class="input input-bordered input-sm font-mono"
              value={period}
              onInput={(e) => setPeriod((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        {!res && (
          <p class="text-sm text-error">请选择日期，周期填 15–45 天、经期填 1–15 天之间。</p>
        )}
        {res && (
          <div class="space-y-2">
            <Row label="下次月经预计" value={res.next} />
            <Row label="排卵日预计" value={res.ovulation} highlight />
            <Row label="易孕窗口" value={`${res.fertileStart} ~ ${res.fertileEnd}`} />
            <button
              type="button"
              class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
              onClick={() =>
                copy(`排卵日约 ${res.ovulation}，易孕窗口 ${res.fertileStart}~${res.fertileEnd}`)
              }
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        )}
      </div>
      <p class="text-xs opacity-55">
        按“周期 − 14 天 = 排卵日”估算，仅供参考，不替代医学判断。全部本地计算。
      </p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div class="flex items-center justify-between">
      <span class="text-sm opacity-70">{label}</span>
      <span class={`font-mono font-bold ${highlight ? 'text-primary' : ''}`}>{value}</span>
    </div>
  );
}
