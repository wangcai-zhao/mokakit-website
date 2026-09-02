import { useState, useMemo } from 'preact/hooks';

function keyOf(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function WorkdaysCount() {
  const [start, setStart] = useState('2026-09-01');
  const [end, setEnd] = useState('2026-09-30');
  const [includeWeekend, setIncludeWeekend] = useState(false);
  const [holidays, setHolidays] = useState('');

  const r = useMemo(() => {
    if (!start || !end) return null;
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e) return null;
    const holidaySet = new Set(
      holidays.split(/[\s,，、]+/).map((x) => x.trim()).filter(Boolean)
    );
    let total = 0;
    let weekend = 0;
    let work = 0;
    const cur = new Date(s);
    while (cur <= e) {
      total++;
      const dow = cur.getDay();
      const isWeekend = dow === 0 || dow === 6;
      if (isWeekend) weekend++;
      let isWork = includeWeekend ? true : !isWeekend;
      if (isWork && holidaySet.has(keyOf(cur))) isWork = false;
      if (isWork) work++;
      cur.setDate(cur.getDate() + 1);
    }
    return { total, weekend, work };
  }, [start, end, includeWeekend, holidays]);

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4 space-y-3">
        <label class="block">
          <span class="text-sm font-medium">开始日期</span>
          <input
            type="date"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={start}
            onInput={(e) => setStart((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">结束日期</span>
          <input
            type="date"
            class="input input-bordered input-sm mt-1.5 w-full font-mono"
            value={end}
            onInput={(e) => setEnd((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={includeWeekend}
            onChange={(e) => setIncludeWeekend((e.target as HTMLInputElement).checked)}
          />
          包含周末（算自然日）
        </label>
        <label class="block">
          <span class="text-sm font-medium">法定节假日（YYYY-MM-DD，逗号或换行分隔，可选）</span>
          <textarea
            class="textarea textarea-bordered textarea-sm mt-1.5 w-full font-mono"
            rows={2}
            value={holidays}
            onInput={(e) => setHolidays((e.target as HTMLTextAreaElement).value)}
          />
        </label>
        {r && (
          <div class="grid grid-cols-3 gap-2 pt-1">
            <Stat label="总天数" value={`${r.total} 天`} />
            <Stat label="周末" value={`${r.weekend} 天`} />
            <Stat label="工作日" value={`${r.work} 天`} highlight />
          </div>
        )}
        {r === null && <p class="text-xs text-error">请填写有效的起止日期（开始不晚于结束）</p>}
      </div>
      <p class="text-xs opacity-55 leading-relaxed">
        默认排除周六周日；勾选包含周末即算自然日。填入的法定节假日会从工作日中再扣除（调休上班的周末不会自动加回）。起止日都计入。所有计算本地完成。
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
