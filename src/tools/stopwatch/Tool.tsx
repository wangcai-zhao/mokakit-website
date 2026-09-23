import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

/** 毫秒 → mm:ss.SSS，超过 60 分钟时分钟位继续累加，不回绕 */
function fmt(ms: number): string {
  const safe = Number.isFinite(ms) && ms > 0 ? Math.floor(ms) : 0;
  const totalSec = Math.floor(safe / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const milli = safe % 1000;
  return `${pad(m)}:${pad(s)}.${pad(milli, 3)}`;
}

interface LapRow {
  index: number;
  lap: number;
  total: number;
  fastest: boolean;
  slowest: boolean;
  diff: number;
}

export default function Stopwatch() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  // base 为本次启动前已累计的毫秒，start 为本次启动时刻，两者相加才是真实用时
  const baseRef = useRef(0);
  const startRef = useRef(0);
  const elapsedRef = useRef(0);
  const runningRef = useRef(false);
  const copyTimer = useRef<number | undefined>(undefined);

  // 运行时按高精度时间戳推进，暂停再继续不会产生累计误差
  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    const id = window.setInterval(() => {
      elapsedRef.current = baseRef.current + (performance.now() - startRef.current);
      setElapsed(elapsedRef.current);
    }, 33);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  // 键盘快捷键：空格 开始/暂停，L 计次，R 复位
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'l') {
        e.preventDefault();
        addLap();
      } else if (key === 'r') {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function toggle() {
    if (runningRef.current) {
      elapsedRef.current = baseRef.current + (performance.now() - startRef.current);
      baseRef.current = elapsedRef.current;
      setElapsed(elapsedRef.current);
      runningRef.current = false;
      setRunning(false);
    } else {
      runningRef.current = true;
      setRunning(true);
    }
  }

  function addLap() {
    if (!runningRef.current) return;
    const now = elapsedRef.current;
    setLaps((prev) => (now > 0 ? [...prev, now] : prev));
  }

  function reset() {
    runningRef.current = false;
    setRunning(false);
    baseRef.current = 0;
    elapsedRef.current = 0;
    setElapsed(0);
    setLaps([]);
  }

  const rows = useMemo<LapRow[]>(() => {
    if (laps.length === 0) return [];
    const items = laps.map((total, i) => ({
      index: i + 1,
      lap: i === 0 ? total : total - laps[i - 1],
      total,
    }));
    const times = items.map((it) => it.lap);
    const fastest = Math.min(...times);
    const slowest = Math.max(...times);
    return items.map((it) => ({
      ...it,
      fastest: items.length > 1 && it.lap === fastest,
      slowest: items.length > 1 && it.lap === slowest,
      diff: it.lap - fastest,
    }));
  }, [laps]);

  const stats = useMemo(() => {
    if (rows.length === 0) return null;
    const times = rows.map((r) => r.lap);
    const sum = times.reduce((a, b) => a + b, 0);
    return {
      count: rows.length,
      fastest: Math.min(...times),
      slowest: Math.max(...times),
      average: sum / times.length,
    };
  }, [rows]);

  const summary = useMemo(() => {
    const head = `总用时 ${fmt(elapsed)}，共 ${rows.length} 次计次`;
    if (rows.length === 0) return head;
    const lines = rows.map((r) => `第 ${r.index} 段 ${fmt(r.lap)}（累计 ${fmt(r.total)}）`);
    return `${head}\n${lines.join('\n')}`;
  }, [elapsed, rows]);

  const copy = async (text: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="text-center">
          <p class="text-xs opacity-60">当前计时</p>
          <p class="mt-1 font-mono text-4xl sm:text-5xl font-bold tabular-nums leading-none">
            {fmt(elapsed)}
          </p>
          <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span class={`badge badge-outline badge-sm ${running ? 'badge-success' : ''}`}>
              {running ? '计时中' : elapsed > 0 ? '已暂停' : '待开始'}
            </span>
            <span class="badge badge-outline badge-sm">已计次 {rows.length}</span>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            class={`btn btn-sm ${running ? 'btn-warning' : 'btn-primary'}`}
            onClick={toggle}
          >
            {running ? '暂停' : elapsed > 0 ? '继续' : '开始'}
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline"
            disabled={!running}
            onClick={addLap}
          >
            计次
          </button>
          <button type="button" class="btn btn-sm btn-ghost" onClick={reset}>
            复位
          </button>
          <button
            type="button"
            class={`btn btn-xs ml-auto ${copied ? 'btn-success' : 'btn-ghost'}`}
            disabled={rows.length === 0}
            onClick={() => copy(summary)}
          >
            {copied ? '已复制' : '复制计次记录'}
          </button>
        </div>

        <p class="mt-2 text-center text-xs opacity-55">
          快捷键：空格 开始/暂停，L 计次，R 复位
        </p>
      </div>

      {stats && (
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div class="rounded-xl bg-base-200 p-3">
            <p class="text-xs opacity-60">计次段数</p>
            <p class="font-mono text-xl font-semibold tabular-nums">{stats.count}</p>
          </div>
          <div class="rounded-xl bg-base-200 p-3">
            <p class="text-xs opacity-60">最快一段</p>
            <p class="font-mono text-xl font-semibold tabular-nums text-success">{fmt(stats.fastest)}</p>
          </div>
          <div class="rounded-xl bg-base-200 p-3">
            <p class="text-xs opacity-60">最慢一段</p>
            <p class="font-mono text-xl font-semibold tabular-nums text-warning">{fmt(stats.slowest)}</p>
          </div>
          <div class="rounded-xl bg-base-200 p-3">
            <p class="text-xs opacity-60">平均每段</p>
            <p class="font-mono text-xl font-semibold tabular-nums">{fmt(stats.average)}</p>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>计次</th>
                <th class="text-right">本段用时</th>
                <th class="text-right">累计用时</th>
                <th class="text-right">与最快差</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.index} class={row.fastest ? 'bg-success/10' : row.slowest ? 'bg-warning/10' : ''}>
                  <td>
                    <span class="font-medium">第 {row.index} 段</span>
                    {row.fastest && <span class="badge badge-xs badge-success ml-1.5">最快</span>}
                    {row.slowest && <span class="badge badge-xs badge-warning ml-1.5">最慢</span>}
                  </td>
                  <td class="font-mono text-right tabular-nums">{fmt(row.lap)}</td>
                  <td class="font-mono text-right tabular-nums opacity-70">{fmt(row.total)}</td>
                  <td class="font-mono text-right tabular-nums">{fmt(row.diff)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        计时基于浏览器高精度时间戳计算，显示格式为 分:秒.毫秒。本段用时 = 本次计次累计时间 - 上一次计次累计时间；暂停后再继续不会丢帧，因为在暂停时会先把已走的一段累加保存。所有数据仅存在于当前页面，刷新即清零。
      </p>
    </div>
  );
}
