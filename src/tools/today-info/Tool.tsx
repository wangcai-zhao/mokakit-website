import { useState, useRef, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const WEEK_CN = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/** 四年一闰，百年不闰，四百年再闰 */
function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** 一年中的第几天，1 月 1 日为第 1 天 */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000) + 1;
}

/**
 * ISO 8601 周数：每周从周一开始，含当年第一个星期四的那周为第 1 周。
 * 做法是把日期挪到本周的星期四，再看它是当年第几个 7 天。
 */
function isoWeek(d: Date): { week: number; year: number } {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // getDay() 周日为 0，转成 ISO 的 1(周一)~7(周日)
  const dayNum = t.getDay() === 0 ? 7 : t.getDay();
  t.setDate(t.getDate() + 4 - dayNum); // 挪到本周星期四
  const yearStart = new Date(t.getFullYear(), 0, 1);
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: t.getFullYear() };
}

function toLocalDateInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function TodayInfoTool() {
  const [dateStr, setDateStr] = useState(() => toLocalDateInput(new Date()));
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const info = useMemo(() => {
    const parts = dateStr.split('-').map(Number);
    const y = parts[0];
    const m = parts[1];
    const dd = parts[2];
    if (
      parts.length !== 3 ||
      y === undefined ||
      m === undefined ||
      dd === undefined ||
      !Number.isFinite(y) ||
      !Number.isFinite(m) ||
      !Number.isFinite(dd)
    ) {
      return null;
    }
    // 用本地时区构造，避免 new Date('2026-08-05') 被当成 UTC 造成差一天
    const d = new Date(y, m - 1, dd);
    if (Number.isNaN(d.getTime())) return null;

    const leap = isLeapYear(y);
    const totalDays = leap ? 366 : 365;
    const doy = dayOfYear(d);
    const { week, year: weekYear } = isoWeek(d);
    const daysLeft = totalDays - doy;
    const monthDays = new Date(y, m, 0).getDate();

    return {
      date: d,
      y,
      m,
      dd,
      leap,
      totalDays,
      doy,
      week,
      weekYear,
      daysLeft,
      monthDays,
      weekday: WEEK_CN[d.getDay()] ?? '',
      quarter: Math.floor((m - 1) / 3) + 1,
      progress: ((doy / totalDays) * 100).toFixed(1),
    };
  }, [dateStr]);

  const isToday = useMemo(() => dateStr === toLocalDateInput(new Date()), [dateStr]);

  const summary = useMemo(() => {
    if (!info) return '';
    return [
      `${info.y} 年 ${info.m} 月 ${info.dd} 日 ${info.weekday}`,
      `第 ${info.quarter} 季度 · 本年第 ${info.week} 周`,
      `今年第 ${info.doy} 天，距年末还有 ${info.daysLeft} 天`,
      `${info.y} 年是${info.leap ? '闰年' : '平年'}，全年 ${info.totalDays} 天`,
    ].join('\n');
  }, [info]);

  const copy = async (text: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const stat = (label: string, value: string, hint?: string) => (
    <div class="rounded-xl bg-base-100 px-3 py-3 shadow-sm">
      <div class="text-xs opacity-60">{label}</div>
      <div class="mt-1 font-mono text-xl font-semibold tabular-nums leading-none">{value}</div>
      {hint && <div class="mt-1 text-[11px] opacity-45">{hint}</div>}
    </div>
  );

  return (
    <div class="space-y-4">
      {/* 日期选择 */}
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label for="ti-date" class="block text-sm font-medium mb-1.5">
            查询日期
          </label>
          <input
            id="ti-date"
            type="date"
            class="input input-bordered input-sm"
            value={dateStr}
            onInput={(e) => setDateStr((e.target as HTMLInputElement).value)}
          />
        </div>
        {!isToday && (
          <button
            type="button"
            class="btn btn-sm btn-outline"
            onClick={() => setDateStr(toLocalDateInput(new Date()))}
          >
            回到今天
          </button>
        )}
      </div>

      {!info && (
        <p class="text-sm text-error" role="alert">
          请选择一个有效的日期。
        </p>
      )}

      {info && (
        <>
          {/* 主日期展示 */}
          <div class="rounded-xl bg-base-200 p-4 text-center">
            {isToday && <span class="badge badge-sm badge-primary mb-2">今天</span>}
            <div class="font-mono text-3xl sm:text-4xl font-semibold tabular-nums">
              {info.y}-{String(info.m).padStart(2, '0')}-{String(info.dd).padStart(2, '0')}
            </div>
            <div class="mt-1.5 text-base opacity-75">
              {info.y} 年 {info.m} 月 {info.dd} 日 · {info.weekday}
            </div>
          </div>

          {/* 详细信息 */}
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {stat('本年第几周', `${info.week}`, `ISO 8601 · ${info.weekYear} 年周历`)}
            {stat('今年第几天', `${info.doy}`, `全年共 ${info.totalDays} 天`)}
            {stat('距年末天数', `${info.daysLeft}`, `已过 ${info.progress}%`)}
            {stat('是否闰年', info.leap ? '闰年' : '平年', info.leap ? '2 月 29 天' : '2 月 28 天')}
            {stat('所属季度', `Q${info.quarter}`, `第 ${info.quarter} 季度`)}
            {stat('本月天数', `${info.monthDays}`, `${info.m} 月`)}
          </div>

          {/* 年度进度条 */}
          <div>
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="opacity-70">{info.y} 年度进度</span>
              <span class="opacity-60 font-mono">{info.progress}%</span>
            </div>
            <div
              class="h-1.5 w-full rounded-full bg-base-300 overflow-hidden"
              role="progressbar"
              aria-valuenow={Number(info.progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="年度进度"
            >
              <div
                class="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${info.progress}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            class={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
            onClick={() => copy(summary)}
          >
            {copied ? '已复制' : '复制日期信息'}
          </button>
        </>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        周数按 ISO 8601 标准计算（周一为每周第一天，含首个星期四的周为第 1 周）。所有计算基于你设备的本地时区，在浏览器内完成。
      </p>
    </div>
  );
}
