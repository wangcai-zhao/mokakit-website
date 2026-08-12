import { useState, useMemo } from 'preact/hooks';

export default function TextCounter() {
  const [input, setInput] = useState('');

  const stats = useMemo(() => {
    const chars = input.length;
    const noSpace = input.replace(/\s/g, '').length;
    const cn = (input.match(/[一-龥]/g) || []).length;
    const words = (input.trim().match(/[\w'-]+/g) || []).length;
    const lines = input ? input.split(/\r\n|\r|\n/).length : 0;
    const bytes = new TextEncoder().encode(input).length;
    return { chars, noSpace, cn, words, lines, bytes };
  }, [input]);

  const items = [
    { label: '字符数（含空格）', value: stats.chars },
    { label: '字符数（不含空格）', value: stats.noSpace },
    { label: '中文字数', value: stats.cn },
    { label: '英文词数', value: stats.words },
    { label: '行数', value: stats.lines },
    { label: 'UTF-8 字节数', value: stats.bytes },
  ];

  return (
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium" for="tc-input">
          输入文本
        </label>
        <textarea
          id="tc-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={6}
          placeholder="粘贴或输入要统计的文本……"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div class="grid gap-3 grid-cols-2 sm:grid-cols-3">
        {items.map((it) => (
          <div class="rounded-xl bg-base-200 p-3">
            <div class="text-2xl font-bold tabular-nums">{it.value}</div>
            <div class="text-xs opacity-60 mt-0.5">{it.label}</div>
          </div>
        ))}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        统计在本地实时计算，刷新或关闭页面不会留存你的文本。
      </p>
    </div>
  );
}
