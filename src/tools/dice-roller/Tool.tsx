import { useState, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/** 返回 1..max 的均匀随机整数，优先用加密级随机源并做拒绝采样消除取模偏差 */
function rollOne(max: number): number {
  if (max <= 1) return 1;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let v = 0;
    do {
      crypto.getRandomValues(buf);
      v = buf[0];
    } while (v >= limit);
    return (v % max) + 1;
  }
  return Math.floor(Math.random() * max) + 1;
}

const PRESETS = [4, 6, 8, 10, 12, 20, 100];

export default function DiceRoller() {
  const [sides, setSides] = useState(6);
  const [count, setCount] = useState(1);
  const [dice, setDice] = useState<number[]>([1]);
  const [rolling, setRolling] = useState(false);
  const [copied, setCopied] = useState(false);

  const spinRef = useRef<number | undefined>(undefined);
  const stopRef = useRef<number | undefined>(undefined);
  const copyTimer = useRef<number | undefined>(undefined);

  const throwDice = () => {
    if (rolling) return;
    setRolling(true);
    setCopied(false);
    window.clearInterval(spinRef.current);
    window.clearTimeout(stopRef.current);

    spinRef.current = window.setInterval(() => {
      setDice(Array.from({ length: count }, () => rollOne(sides)));
    }, 60);

    stopRef.current = window.setTimeout(() => {
      window.clearInterval(spinRef.current);
      setDice(Array.from({ length: count }, () => rollOne(sides)));
      setRolling(false);
    }, 520);
  };

  const total = dice.reduce((a, b) => a + b, 0);
  const average = dice.length ? total / dice.length : 0;
  const summary = `D${sides} × ${dice.length}：${dice.join(', ')}　总和 ${total}　平均 ${average.toFixed(2)}`;

  const copy = async () => {
    const text = summary;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap items-end gap-3">
        <label class="text-sm font-medium flex items-center gap-2">
          面数
          <input
            type="number"
            min={2}
            max={1000}
            class="input input-bordered input-sm w-24"
            value={sides}
            onInput={(e) => {
              const n = Number((e.target as HTMLInputElement).value);
              setSides(Math.max(2, Math.min(1000, Math.floor(n) || 2)));
            }}
          />
        </label>
        <label class="text-sm font-medium flex items-center gap-2">
          数量
          <input
            type="number"
            min={1}
            max={30}
            class="input input-bordered input-sm w-20"
            value={count}
            onInput={(e) => {
              const n = Number((e.target as HTMLInputElement).value);
              const c = Math.max(1, Math.min(30, Math.floor(n) || 1));
              setCount(c);
              setDice((prev) =>
                Array.from({ length: c }, (_, i) => prev[i] ?? 1),
              );
            }}
          />
        </label>
        <button
          type="button"
          class={`btn btn-primary btn-sm ${rolling ? 'btn-disabled' : ''}`}
          onClick={throwDice}
        >
          {rolling ? '掷骰中…' : '掷 骰 子'}
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs opacity-60">常用骰型</span>
        <div class="join">
          {PRESETS.map((p) => (
            <button
              type="button"
              class={`btn btn-xs join-item ${sides === p ? 'btn-active btn-primary' : 'btn-outline'}`}
              onClick={() => setSides(p)}
            >
              D{p}
            </button>
          ))}
        </div>
      </div>

      <div class="rounded-2xl bg-base-200 p-4">
        <div class="flex flex-wrap gap-3 justify-center">
          {dice.map((d, i) => (
            <div
              class={`flex items-center justify-center rounded-xl bg-base-100 shadow-sm border border-base-300 font-mono font-bold tabular-nums transition-all duration-150 ${
                rolling ? 'scale-95 opacity-70' : 'scale-100 opacity-100'
              } ${dice.length > 12 ? 'w-12 h-12 text-lg' : 'w-16 h-16 text-2xl'}`}
              key={i}
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="badge badge-primary badge-lg font-mono">总和 {total}</span>
        <span class="badge badge-ghost badge-lg font-mono">平均 {average.toFixed(2)}</span>
        <span class="badge badge-ghost badge-lg font-mono">
          {dice.length} 颗 D{sides}
        </span>
        <button
          type="button"
          class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
          onClick={copy}
        >
          {copied ? '已复制' : '复制结果'}
        </button>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        点数由 crypto.getRandomValues 生成并做拒绝采样，各面概率完全均等，全部在本地完成，不联网也能用。
      </p>
    </div>
  );
}
