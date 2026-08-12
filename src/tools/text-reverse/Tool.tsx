import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Mode = 'char' | 'word' | 'line';

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'char', label: '字符反转', hint: '整段文字按字符倒序，换行位置也会改变' },
  { id: 'word', label: '单词反转', hint: '每行内按空格拆分后颠倒词序，行的顺序不变' },
  { id: 'line', label: '行序反转', hint: '每行内容保持不变，仅把行的先后顺序对调' },
];

const SAMPLE = `Hello World 你好 🌙\n第二行 文本 反转\n第三行 示例`;

function reverse(text: string, mode: Mode): string {
  if (!text) return '';
  if (mode === 'char') return Array.from(text).reverse().join('');
  if (mode === 'line') return text.split(/\r?\n/).reverse().join('\n');
  return text
    .split(/\r?\n/)
    .map((line) => {
      const words = line.trim().split(/\s+/).filter(Boolean);
      return words.reverse().join(' ');
    })
    .join('\n');
}

export default function TextReverseTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('char');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const output = useMemo(() => reverse(input, mode), [input, mode]);
  const current = MODES.find((m) => m.id === mode)!;

  const copy = async (text: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="join">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            class={`btn btn-sm join-item ${mode === m.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p class="text-xs opacity-55">{current.hint}</p>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <label class="text-sm font-medium" for="tr-input">
            原始文本
          </label>
          <div class="join">
            <button
              type="button"
              class="btn btn-xs join-item btn-ghost"
              onClick={() => setInput(SAMPLE)}
            >
              填入示例
            </button>
            <button
              type="button"
              class="btn btn-xs join-item btn-ghost"
              onClick={() => setInput('')}
              disabled={!input}
            >
              清空
            </button>
          </div>
        </div>
        <textarea
          id="tr-input"
          class="textarea textarea-bordered w-full text-sm"
          rows={7}
          placeholder="在这里输入或粘贴需要反转的文本"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium">反转结果</span>
            {output && (
              <span class="badge badge-sm badge-ghost">{Array.from(output).length} 字符</span>
            )}
          </div>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={() => copy(output)}
            disabled={!output}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-80 overflow-auto rounded-xl bg-base-200 p-3 text-sm break-all whitespace-pre-wrap">
          {output || <span class="opacity-40">反转后的内容会显示在这里</span>}
        </pre>
      </div>

      <p class="text-xs leading-relaxed opacity-55">
        按 Unicode 码点切分，中文与 emoji 不会被拆散。全部计算在本地浏览器完成，文本不会上传。
      </p>
    </div>
  );
}
