import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/** 把任意命名风格拆成单词数组 */
function splitWords(s: string): string[] {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_.\-]+/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

const lo = (w: string) => w.toLowerCase();
const cap = (w: string) => {
  const l = w.toLowerCase();
  return l.charAt(0).toUpperCase() + l.slice(1);
};

const MODES = [
  { id: 'camel', label: 'camelCase', fn: (w: string[]) => w.map((x, i) => (i === 0 ? lo(x) : cap(x))).join('') },
  { id: 'pascal', label: 'PascalCase', fn: (w: string[]) => w.map(cap).join('') },
  { id: 'snake', label: 'snake_case', fn: (w: string[]) => w.map(lo).join('_') },
  { id: 'kebab', label: 'kebab-case', fn: (w: string[]) => w.map(lo).join('-') },
  { id: 'upper', label: '大写', fn: (w: string[]) => w.map(lo).join(' ').toUpperCase() },
  { id: 'lower', label: '小写', fn: (w: string[]) => w.map(lo).join(' ') },
  { id: 'title', label: '标题大小写', fn: (w: string[]) => w.map(cap).join(' ') },
] as const;

export default function CaseConverter() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const words = useMemo(() => splitWords(input), [input]);

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium" for="case-input">
          输入文本
        </label>
        <input
          id="case-input"
          type="text"
          class="input input-bordered mt-2 w-full"
          placeholder="例如 myUserName 或 Hello World"
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        {MODES.map((m) => {
          const out = m.fn(words);
          return (
            <div class="rounded-xl bg-base-200 p-3">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-xs font-medium opacity-70">{m.label}</span>
                <button
                  type="button"
                  class={`btn btn-xs ${copied === m.id ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => copy(out, m.id)}
                  disabled={!out}
                >
                  {copied === m.id ? '已复制' : '复制'}
                </button>
              </div>
              <code class="block font-mono text-sm break-all">
                {out || <span class="opacity-40">—</span>}
              </code>
            </div>
          );
        })}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有转换都在本地完成，常用于变量命名、SQL 字段、文件名规范化等场景。
      </p>
    </div>
  );
}
