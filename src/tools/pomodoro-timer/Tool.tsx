import { useState, useEffect, useMemo, useRef } from 'preact/hooks';

type Phase = 'focus' | 'short' | 'long';

const PHASE_LABEL: Record<Phase, string> = {
  focus: '专注',
  short: '短休',
  long: '长休',
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** 毫秒 → mm:ss（倒计时向上取整，保证最后一秒不会显示 00:00 后还停着） */
function fmt(ms: number): string {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  const totalSec = Math.ceil(safe / 1000);
  return `${pad(Math.floor(totalSec / 60))}:${pad(totalSec % 60)}`;
}

const EMPTY: Config = { ok: false, focus: 0, short: 0, long: 0, every: 4 };

interface Config {
  ok: boolean;
  error?: string;
  focus: number;
  short: number;
  long: number;
  every: number;
}

type Status = 'idle' | 'running' | 'paused';

export default function PomodoroTimer() {
  const [focusMin, setFocusMin] = useState('25');
  const [shortMin, setShortMin] = useState('5');
  const [longMin, setLongMin] = useState('15');
  const [everyN, setEveryN] = useState('4');
  const [sound, setSound] = useState(true);

  const [phase, setPhase] = useState<Phase>('focus');
  const [status, setStatus] = useState<Status>('idle');
  const [remaining, setRemaining] = useState(0);
  const [pomodoros, setPomodoros] = useState(0);
  const [seq, setSeq] = useState(0);

  const deadlineRef = useRef(0);
  const leftRef = useRef(0);
  const phaseRef = useRef<Phase>('focus');
  const pomodorosRef = useRef(0);
  const soundRef = useRef(true);
  const ctxRef = useRef<AudioContext | null>(null);

  const cfg = useMemo<Config>(() => {
    const f = Number(focusMin.trim());
    const s = Number(shortMin.trim());
    const l = Number(longMin.trim());
    const n = Math.round(Number(everyN.trim()));
    if (!Number.isFinite(f) || !Number.isFinite(s) || !Number.isFinite(l) || !Number.isFinite(n)) {
      return { ...EMPTY, error: '时长请填写有效数字，不要留空' };
    }
    if (f <= 0) return { ...EMPTY, error: '专注时长必须大于 0 分钟' };
    if (s <= 0) return { ...EMPTY, error: '短休时长必须大于 0 分钟' };
    if (l <= 0) return { ...EMPTY, error: '长休时长必须大于 0 分钟' };
    if (f > 180 || s > 60 || l > 60) {
      return { ...EMPTY, error: '专注最长 180 分钟，休息最长 60 分钟，请调整时长' };
    }
    if (n < 1 || n > 12) return { ...EMPTY, error: '长休间隔请填 1 到 12 之间的整数' };
    return { ok: true, focus: f * 60000, short: s * 60000, long: l * 60000, every: n };
  }, [focusMin, shortMin, longMin, everyN]);

  // 让定时器回调始终读到最新的阶段、番茄数与提示音开关
  useEffect(() => {
    phaseRef.current = phase;
    pomodorosRef.current = pomodoros;
    soundRef.current = sound;
  }, [phase, pomodoros, sound]);

  useEffect(() => () => {
    if (ctxRef.current) void ctxRef.current.close();
    ctxRef.current = null;
  }, []);

  function totalOf(mode: Phase): number {
    if (!cfg.ok) return 0;
    if (mode === 'focus') return cfg.focus;
    return mode === 'short' ? cfg.short : cfg.long;
  }

  /** 用 Web Audio 现场合成蜂鸣，不依赖任何外部音频文件 */
  function playAlert() {
    if (!soundRef.current) return;
    try {
      if (!ctxRef.current) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        ctxRef.current = new Ctor();
      }
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') void ctx.resume();
      const base = ctx.currentTime;
      for (let i = 0; i < 3; i += 1) {
        const start = base + i * 0.32;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(i === 2 ? 990 : 760, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.22, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.28);
      }
    } catch {
      // 浏览器不允许发声时静默降级，不影响计时本身
    }
  }

  function enterPhase(mode: Phase, auto: boolean) {
    const duration = totalOf(mode);
    if (duration <= 0) return;
    phaseRef.current = mode;
    setPhase(mode);
    if (auto) {
      deadlineRef.current = Date.now() + duration;
      leftRef.current = duration;
      setRemaining(duration);
      setStatus('running');
      setSeq((n) => n + 1);
    } else {
      leftRef.current = duration;
      setRemaining(duration);
      setStatus('idle');
    }
  }

  function complete() {
    const current = phaseRef.current;
    playAlert();
    let next: Phase;
    if (current === 'focus') {
      const done = pomodorosRef.current + 1;
      pomodorosRef.current = done;
      setPomodoros(done);
      next = done % cfg.every === 0 ? 'long' : 'short';
    } else {
      next = 'focus';
    }
    enterPhase(next, true);
  }

  const completeRef = useRef(complete);
  useEffect(() => {
    completeRef.current = complete;
  });

  // 每 200ms 用「截止时间戳 - 当前时间」推剩余量，页面卡顿也不会累积误差
  useEffect(() => {
    if (status !== 'running') return;
    const id = window.setInterval(() => {
      const left = deadlineRef.current - Date.now();
      if (left <= 0) {
        window.clearInterval(id);
        setRemaining(0);
        completeRef.current();
        return;
      }
      leftRef.current = left;
      setRemaining(left);
    }, 200);
    return () => window.clearInterval(id);
  }, [status, seq]);

  function start() {
    if (!cfg.ok) return;
    const mode = phaseRef.current;
    const duration = totalOf(mode);
    deadlineRef.current = Date.now() + duration;
    leftRef.current = duration;
    setRemaining(duration);
    setStatus('running');
    setSeq((n) => n + 1);
  }

  function pause() {
    leftRef.current = Math.max(0, deadlineRef.current - Date.now());
    setRemaining(leftRef.current);
    setStatus('paused');
  }

  function resume() {
    const left = leftRef.current > 0 ? leftRef.current : totalOf(phaseRef.current);
    if (left <= 0) return;
    deadlineRef.current = Date.now() + left;
    leftRef.current = left;
    setRemaining(left);
    setStatus('running');
    setSeq((n) => n + 1);
  }

  function reset() {
    setStatus('idle');
    setRemaining(0);
    enterPhase(phaseRef.current, false);
  }

  function skip() {
    const current = phaseRef.current;
    if (current === 'focus') {
      enterPhase('short', false);
      return;
    }
    enterPhase('focus', false);
  }

  const total = totalOf(phase);
  const shown = status === 'idle' ? total : remaining;
  const percent = total > 0 ? Math.min(100, Math.max(0, (1 - shown / total) * 100)) : 0;
  const round = cfg.ok ? Math.floor(pomodoros / cfg.every) : 0;

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-4">
          <label class="block">
            <span class="text-sm font-medium">专注（分钟）</span>
            <input
              type="number"
              inputmode="numeric"
              min={1}
              max={180}
              step={1}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={focusMin}
              onInput={(e) => setFocusMin((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">短休（分钟）</span>
            <input
              type="number"
              inputmode="numeric"
              min={1}
              max={60}
              step={1}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={shortMin}
              onInput={(e) => setShortMin((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">长休（分钟）</span>
            <input
              type="number"
              inputmode="numeric"
              min={1}
              max={60}
              step={1}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={longMin}
              onInput={(e) => setLongMin((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">几个番茄后长休</span>
            <input
              type="number"
              inputmode="numeric"
              min={1}
              max={12}
              step={1}
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={everyN}
              onInput={(e) => setEveryN((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>

        {!cfg.ok && <p class="mt-3 text-sm text-error">{cfg.error}</p>}

        <label class="mt-3 flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-primary"
            checked={sound}
            onChange={(e) => setSound((e.target as HTMLInputElement).checked)}
          />
          <span>阶段结束时播放提示音（浏览器本地合成，无需联网）</span>
        </label>
      </div>

      <div class="rounded-xl bg-base-200 p-4 sm:p-6 text-center">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <span
            class={`badge badge-sm ${
              phase === 'focus' ? 'badge-primary' : phase === 'short' ? 'badge-info' : 'badge-accent'
            }`}
          >
            {PHASE_LABEL[phase]}阶段
          </span>
          <span class="badge badge-outline badge-sm">
            {status === 'running' ? '进行中' : status === 'paused' ? '已暂停' : '待开始'}
          </span>
          <span class="badge badge-outline badge-sm">今日番茄 {pomodoros}</span>
        </div>

        <p class="mt-3 font-mono text-5xl sm:text-6xl font-bold tabular-nums leading-none">
          {fmt(shown)}
        </p>

        <progress class="progress progress-primary mt-4 w-full" value={percent} max={100} />

        <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
          {status === 'idle' && (
            <button type="button" class="btn btn-sm btn-primary" disabled={!cfg.ok} onClick={start}>
              开始{PHASE_LABEL[phase]}
            </button>
          )}
          {status === 'running' && (
            <button type="button" class="btn btn-sm btn-warning" onClick={pause}>
              暂停
            </button>
          )}
          {status === 'paused' && (
            <button type="button" class="btn btn-sm btn-primary" disabled={!cfg.ok} onClick={resume}>
              继续
            </button>
          )}
          {status !== 'idle' && (
            <>
              <button type="button" class="btn btn-sm btn-ghost" onClick={reset}>
                复位本段
              </button>
              <button type="button" class="btn btn-sm btn-outline" onClick={skip}>
                跳过本段
              </button>
            </>
          )}
        </div>

        <p class="mt-3 text-xs opacity-60">
          已完成 {pomodoros} 个番茄，完成第 {cfg.ok ? cfg.every : 4} 个后进入长休
          {round > 0 ? `，已进行 ${round} 轮长休` : ''}
        </p>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        番茄工作法的节奏是：专注一段时间算一个番茄，之后短休一次，累计若干个番茄后安排一次长休。倒计时按「截止时间戳 减去 当前时间」推算，切后台或页面卡顿也不会跑偏；提示音由浏览器 Web
        Audio 实时合成，不联网、不加载任何音频文件。
      </p>
    </div>
  );
}
