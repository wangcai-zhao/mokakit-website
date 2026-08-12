import { useState, useRef, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const DEFAULT_TEXT = ['张三', '李四', '王五', '赵六', '孙七', '周八'].join('\n');

/** 加密级随机整数：[0, max)，拒绝采样消除取模偏差 */
function randomBelow(max: number): number {
  if (max <= 1) return 0;
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0]!;
  } while (v >= limit);
  return v % max;
}

/** Fisher-Yates 洗牌后取前 count 个，保证结果不重复且分布均匀 */
function drawUnique(items: string[], count: number): string[] {
  const pool = [...items];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const j = i + randomBelow(pool.length - i);
    const a = pool[i]!;
    const b = pool[j]!;
    pool[i] = b;
    pool[j] = a;
  }
  return pool.slice(0, n);
}

export default function LotteryDrawTool() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [count, setCount] = useState('1');
  const [winners, setWinners] = useState<string[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const animTimer = useRef<number | undefined>(undefined);

  /** 逐行拆分，去掉空行与首尾空格 */
  const options = useMemo(
    () =>
      text
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    [text],
  );

  const wanted = Math.trunc(Number(count));
  const validCount = Number.isFinite(wanted) && wanted >= 1;
  const tooMany = validCount && wanted > options.length;
  const canDraw = options.length > 0 && validCount && !tooMany && !drawing;

  const draw = () => {
    if (!canDraw) return;
    setDrawing(true);
    setWinners([]);
    // 短暂的"抽取中"动画，让结果更有仪式感
    window.clearTimeout(animTimer.current);
    animTimer.current = window.setTimeout(() => {
      setWinners(drawUnique(options, wanted));
      setDrawing(false);
    }, 600);
  };

  const copy = async (text2: string) => {
    if (!text2) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      {/* 选项输入 */}
      <div>
        <label for="ld-options" class="flex items-center justify-between text-sm font-medium mb-1.5">
          <span>候选选项（每行一个）</span>
          <span class="opacity-55 font-normal text-xs">共 {options.length} 项</span>
        </label>
        <textarea
          id="ld-options"
          class="textarea textarea-bordered w-full h-40 font-mono text-sm leading-relaxed"
          placeholder={'张三\n李四\n王五'}
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      {/* 抽取控制 */}
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label for="ld-count" class="block text-sm font-medium mb-1.5">
            抽取数量
          </label>
          <input
            id="ld-count"
            type="number"
            min={1}
            max={Math.max(1, options.length)}
            class="input input-bordered input-sm w-28"
            value={count}
            onInput={(e) => setCount((e.target as HTMLInputElement).value)}
          />
        </div>
        <button type="button" class="btn btn-sm btn-primary" disabled={!canDraw} onClick={draw}>
          {drawing ? '抽取中…' : '开始抽签'}
        </button>
        {winners.length > 0 && !drawing && (
          <>
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={() => copy(winners.join('\n'))}
            >
              {copied ? '已复制' : '复制结果'}
            </button>
            <button type="button" class="btn btn-sm btn-ghost" onClick={() => setWinners([])}>
              清空
            </button>
          </>
        )}
      </div>

      {options.length === 0 && (
        <p class="text-sm text-error" role="alert">
          请至少输入一个候选选项。
        </p>
      )}
      {!validCount && (
        <p class="text-sm text-error" role="alert">
          抽取数量必须是不小于 1 的整数。
        </p>
      )}
      {tooMany && (
        <p class="text-sm text-error" role="alert">
          抽取数量不能超过候选项总数（当前 {options.length} 项）。
        </p>
      )}

      {/* 结果区 */}
      <div class="rounded-xl bg-base-200 p-4 min-h-[6rem] flex items-center justify-center">
        {drawing && (
          <div class="flex flex-wrap gap-2 justify-center animate-pulse" aria-hidden="true">
            {options.slice(0, Math.max(1, Math.min(wanted || 1, 6))).map((o, i) => (
              <span key={`s-${i}`} class="badge badge-lg badge-primary badge-outline">
                {o}
              </span>
            ))}
          </div>
        )}

        {!drawing && winners.length === 0 && (
          <p class="text-sm opacity-45">点击「开始抽签」查看结果</p>
        )}

        {!drawing && winners.length > 0 && (
          <div class="w-full" aria-live="polite">
            <p class="text-xs opacity-60 mb-2 text-center">
              抽中 {winners.length} 项（不重复）
            </p>
            <div class="flex flex-wrap gap-2 justify-center">
              {winners.map((w, i) => (
                <span
                  key={`${i}-${w}`}
                  class="badge badge-lg badge-primary gap-1.5 py-3 px-3 text-sm font-medium"
                >
                  <span class="opacity-60 text-xs">{i + 1}</span>
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        采用 Web Crypto 加密级随机源配合 Fisher-Yates 洗牌算法，每个选项被抽中的概率完全相同。抽签在浏览器本地完成，名单不会上传。
      </p>
    </div>
  );
}
