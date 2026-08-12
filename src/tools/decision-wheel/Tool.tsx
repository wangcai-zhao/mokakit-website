import { useState, useRef, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const DEFAULT_TEXT = ['米饭', '面条', '火锅', '烧烤', '沙拉', '饺子', '汉堡', '随便'].join('\n');

const MAX_OPTIONS = 100;

function randInt(max: number): number {
  if (max <= 1) return 0;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let v = 0;
    do {
      crypto.getRandomValues(buf);
      v = buf[0];
    } while (v >= limit);
    return v % max;
  }
  return Math.floor(Math.random() * max);
}

export default function DecisionWheel() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [active, setActive] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [copied, setCopied] = useState(false);

  const spinRef = useRef<number | undefined>(undefined);
  const stopRef = useRef<number | undefined>(undefined);
  const copyTimer = useRef<number | undefined>(undefined);

  const options = useMemo(
    () =>
      text
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, MAX_OPTIONS),
    [text],
  );

  const spin = () => {
    if (spinning || options.length === 0) return;
    setSpinning(true);
    setResult(null);
    setCopied(false);
    window.clearInterval(spinRef.current);
    window.clearTimeout(stopRef.current);

    spinRef.current = window.setInterval(() => {
      setActive(randInt(options.length));
    }, 90);

    stopRef.current = window.setTimeout(() => {
      window.clearInterval(spinRef.current);
      const idx = randInt(options.length);
      setActive(idx);
      setResult(options[idx] ?? null);
      setSpinning(false);
    }, 1500);
  };

  const copy = async () => {
    if (!result) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <label class="block space-y-1">
        <span class="text-sm font-medium">选项列表（每行一个，最多 {MAX_OPTIONS} 个）</span>
        <textarea
          class="textarea textarea-bordered h-40 w-full font-mono text-sm"
          placeholder={'米饭\n面条\n火锅'}
          value={text}
          onInput={(e) => {
            setText((e.target as HTMLTextAreaElement).value);
            setActive(null);
            setResult(null);
          }}
        />
      </label>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class={`btn btn-primary btn-sm ${spinning || options.length === 0 ? 'btn-disabled' : ''}`}
          onClick={spin}
        >
          {spinning ? '转动中…' : '开始转动'}
        </button>
        <span class="badge badge-ghost">{options.length} 个选项</span>
        {result && (
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={copy}
          >
            {copied ? '已复制' : '复制结果'}
          </button>
        )}
      </div>

      <div class="rounded-2xl bg-base-200 p-4">
        {options.length === 0 ? (
          <p class="py-8 text-center text-sm opacity-60">上面每行填一个选项，再点“开始转动”</p>
        ) : (
          <div class="flex flex-wrap justify-center gap-2">
            {options.map((opt, i) => (
              <span
                key={`${opt}-${i}`}
                class={`badge badge-lg transition-all duration-150 ${
                  active === i
                    ? `badge-primary scale-110 ${spinning ? '' : 'animate-pulse'}`
                    : 'badge-ghost opacity-70'
                }`}
              >
                {opt}
              </span>
            ))}
          </div>
        )}
      </div>

      {result && !spinning && (
        <div class="alert alert-success py-3">
          <span class="text-base">
            就它了：<span class="font-bold">{result}</span>
          </span>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        抽取基于 crypto.getRandomValues 并做拒绝采样，每个选项概率完全相等；想给某项加权，把它多写几行即可。
      </p>
    </div>
  );
}
