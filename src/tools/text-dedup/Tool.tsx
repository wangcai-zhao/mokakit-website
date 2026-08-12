import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const SAMPLE = `苹果\n香蕉\n苹果\n  香蕉  \n橙子\nAPPLE\n橙子`;

export default function TextDedupTool() {
  const [input, setInput] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [trimLine, setTrimLine] = useState(true);
  const [dropEmpty, setDropEmpty] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const result = useMemo(() => {
    if (!input) return { text: '', total: 0, kept: 0, removed: 0 };

    const lines = input.split(/\r?\n/);
    const seen = new Set<string>();
    const kept: string[] = [];

    for (const line of lines) {
      if (dropEmpty && line.trim() === '') continue;
      let key = trimLine ? line.trim() : line;
      if (ignoreCase) key = key.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      kept.push(line);
    }

    return {
      text: kept.join('\n'),
      total: lines.length,
      kept: kept.length,
      removed: lines.length - kept.length,
    };
  }, [input, ignoreCase, trimLine, dropEmpty]);

  const copy = async (text: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div>
        <div class="mb-2 flex items-center justify-between">
          <label class="text-sm font-medium" for="dedup-input">
            原始文本（每行一条）
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
          id="dedup-input"
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={8}
          placeholder="每行一条内容，粘贴后自动去重"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div class="flex flex-wrap gap-4 rounded-xl bg-base-200 px-4 py-3">
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={ignoreCase}
            onChange={(e) => setIgnoreCase((e.target as HTMLInputElement).checked)}
          />
          忽略大小写
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={trimLine}
            onChange={(e) => setTrimLine((e.target as HTMLInputElement).checked)}
          />
          忽略首尾空白
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={dropEmpty}
            onChange={(e) => setDropEmpty((e.target as HTMLInputElement).checked)}
          />
          删除空行
        </label>
      </div>

      <div class="flex flex-wrap gap-2">
        <span class="badge badge-ghost">原始 {result.total} 行</span>
        <span class="badge badge-primary badge-outline">去重后 {result.kept} 行</span>
        <span class="badge badge-outline">删除 {result.removed} 行</span>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">去重结果</span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={() => copy(result.text)}
            disabled={!result.text}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-80 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre-wrap">
          {result.text || <span class="opacity-40">去重后的内容会显示在这里</span>}
        </pre>
      </div>

      <p class="text-xs leading-relaxed opacity-55">
        按行判重并保留首次出现的顺序，输出的是原始行内容。全部计算在本地浏览器完成，文本不会上传。
      </p>
    </div>
  );
}
