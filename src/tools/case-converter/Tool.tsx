import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { MODES, convertLines } from './case';

export default function CaseConverter(props: { initialInput?: string }) {
  const [input, setInput] = useState(props.initialInput ?? '');
  const [sepNum, setSepNum] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  /** 多行批量：每行独立切词转换，空行原样保留占位 */
  const outputs = useMemo(
    () =>
      MODES.map((m) => ({
        id: m.id,
        label: m.label,
        text: convertLines(input, m, sepNum).join('\n'),
      })),
    [input, sepNum],
  );

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
          输入文本（每行一个，支持批量）
        </label>
        <textarea
          id="case-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={4}
          placeholder={'例如 myUserName 或 Hello World\n多行时每行独立转换，一次粘一列变量名也可以'}
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
        />
      </div>

      <label class="flex items-center gap-2 text-sm cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          class="checkbox checkbox-sm checkbox-primary"
          checked={sepNum}
          onChange={(e) => setSepNum((e.target as HTMLInputElement).checked)}
        />
        数字切分（user2Name → user 2 Name，对标 change-case 的 separateNumbers）
      </label>

      <div class="grid gap-3 sm:grid-cols-2">
        {outputs.map((m) => (
          <div class="rounded-xl bg-base-200 p-3">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-medium opacity-70">{m.label}</span>
              <button
                type="button"
                class={`btn btn-xs ${copied === m.id ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(m.text, m.id)}
                disabled={!m.text}
              >
                {copied === m.id ? '已复制' : '复制'}
              </button>
            </div>
            <code class="block font-mono text-sm break-all whitespace-pre-line">
              {m.text || <span class="opacity-40">—</span>}
            </code>
          </div>
        ))}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有转换都在本地完成，常用于变量命名、SQL 字段、文件名规范化等场景。多行输入时每行独立转换，复制按钮复制的是整篇结果。
      </p>
    </div>
  );
}
