import { useState, useRef, type ComponentChildren } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/**
 * 开发者工具通用 IO 布局。
 * 多数 dev 工具都是「输入文本 → 输出文本（+ 中间控件）」形态，
 * 用这个组件统一承载 textarea + 输出区 + 复制按钮 + 说明，避免 20 个工具重复样板。
 *
 * - 同步工具：父组件用 useMemo 由 input 算出 output 传入即可实时更新。
 * - 异步工具（如 HMAC/JWT 用 Web Crypto）：父组件用按钮触发计算并把结果置于 output state。
 * - children 渲染在输入框与输出框之间，用于放算法下拉、生成按钮等控件。
 */
export default function DevTool({
  input,
  setInput,
  output,
  note,
  placeholder,
  inputLabel = '输入',
  outputLabel = '输出',
  rows = 10,
  children,
}: {
  input: string;
  setInput: (v: string) => void;
  output: string;
  note?: string;
  placeholder?: string;
  inputLabel?: string;
  outputLabel?: string;
  rows?: number;
  children?: ComponentChildren;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const copy = async () => {
    if (!output) return;
    await copyText(output);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <label class="block">
        <span class="text-sm font-medium">{inputLabel}</span>
        <textarea
          class="textarea textarea-bordered mt-1.5 w-full font-mono text-sm"
          rows={rows}
          placeholder={placeholder}
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      {children}

      <label class="block">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">{outputLabel}</span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
            onClick={copy}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="textarea textarea-bordered mt-1.5 w-full whitespace-pre-wrap break-all bg-base-200 font-mono text-sm">
          {output || '（结果将显示在这里）'}
        </pre>
      </label>

      {note && <p class="text-xs opacity-55 leading-relaxed">{note}</p>}
    </div>
  );
}
