import { useState, useMemo } from 'preact/hooks';

const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const DAY = 86400000;

export default function DueDate() {
  const [lmp, setLmp] = useState(() => fmtDate(new Date(Date.now() - 70 * DAY)));
  const [cycle, setCycle] = useState('28');

  const result = useMemo(() => {
    if (!lmp) return null;
    const lmpDate = new Date(lmp + 'T00:00:00');
    if (isNaN(lmpDate.getTime())) return null;
    const c = Math.max(20, Math.min(45, Number(cycle) || 28));
    const due = new Date(lmpDate.getTime() + (280 + (c - 28)) * DAY);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - lmpDate.getTime()) / DAY);
    const daysLeft = Math.floor((due.getTime() - now.getTime()) / DAY);
    const weeks = Math.max(0, Math.floor(daysPassed / 7));
    const remDays = ((daysPassed % 7) + 7) % 7;
    const trimester = weeks < 13 ? '孕早期' : weeks < 27 ? '孕中期' : weeks < 40 ? '孕晚期' : '已足月';
    return { due: fmtDate(due), weeks, remDays, daysPassed, daysLeft, trimester };
  }, [lmp, cycle]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 grid gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">末次月经第一天</span>
          <input
            type="date"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={lmp}
            onInput={(e) => setLmp((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">月经周期（天）</span>
          <input
            type="number"
            min={20}
            max={45}
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={cycle}
            onInput={(e) => setCycle((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      {!result && <p class="text-sm text-error">请填写有效的末次月经日期</p>}

      {result && (
        <div class="grid grid-cols-2 gap-3">
          <Stat label="预产期" value={result.due} />
          <Stat label="当前阶段" value={result.trimester} />
          <Stat label="当前孕周" value={result.daysPassed >= 0 ? `${result.weeks} 周 ${result.remDays} 天` : '尚未开始'} />
          <Stat label="距预产期" value={result.daysLeft >= 0 ? `${result.daysLeft} 天` : '已过期'} />
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        预产期 = 末次月经 + 280 天（40 周），周期非 28 天按差值微调。仅约 5% 宝宝在预产期当天出生。结果仅供参考，请以产检医生为准。所有计算在本地完成。
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div class="rounded-lg bg-base-100 p-3">
      <div class="text-xs opacity-60">{label}</div>
      <div class="text-lg font-bold font-mono mt-0.5">{value}</div>
    </div>
  );
}
