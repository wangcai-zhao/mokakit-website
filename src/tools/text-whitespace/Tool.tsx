import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

export default function TextWhitespaceTool() {
  const [input, setInput] = useState('');
  const [trimEnds, setTrimEnds] = useState(true);
  const [collapseSpace, setCollapseSpace] = useState(true);
  const [fullToHalf, setFullToHalf] = useState(true);
  const [dropTabs, setDropTabs] = useState(true);
  const [dropEmptyLines, setDropEmptyLines] = useState(false);
  const [collapseBlankLines, setCollapseBlankLines] = useState(true);
  const [dropAllNewline, setDropAllNewline] = useState(false);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    let t = input;
    if (fullToHalf) t = t.replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\u3000/g, ' ');
    if (dropTabs) t = t.replace(/[\t\u000B\u000C]/g, ' ');
    if (dropAllNewline) t = t.replace(/\r?\n/g, '');
    if (collapseBlankLines) t = t.replace(/\n{3,}/g, '\n\n');
    if (collapseSpace) t = t.replace(/ {2,}/g, ' ');
    if (trimEnds) t = t.replace(/[ \t]+$/gm, '').replace(/^[ \t]+/gm, '');
    if (dropEmptyLines) t = t.replace(/^\s*$(?:\r?\n)?/gm, '');
    return t;
  }, [
    input,
    trimEnds,
    collapseSpace,
    fullToHalf,
    dropTabs,
    dropEmptyLines,
    collapseBlankLines,
    dropAllNewline,
  ]);

  const bytes = new Blob([output]).size;
  const changed = output !== input;

  const opts: { label: string; value: boolean; set: (v: boolean) => void; hint: string }[] = [
    { label: '全角转半角', value: fullToHalf, set: setFullToHalf, hint: 'ＡＢＣ １２３ → ABC 123，全角空格转普通空格' },
    { label: 'Tab 转空格', value: dropTabs, set: setDropTabs, hint: '把制表符统一成空格' },
    { label: '合并连续空格', value: collapseSpace, set: setCollapseSpace, hint: '多个空格压成一个' },
    { label: '去掉每行首尾空白', value: trimEnds, set: setTrimEnds, hint: '行首行尾的空格、Tab 清掉' },
    { label: '合并连续空行', value: collapseBlankLines, set: setCollapseBlankLines, hint: '三个以上换行压成两个' },
    { label: '删除所有空行', value: dropEmptyLines, set: setDropEmptyLines, hint: '空行整行删掉' },
    { label: '去掉所有换行', value: dropAllNewline, set: setDropAllNewline, hint: '整段合成一行' },
  ];

  return (
    <div class="space-y-4">
      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">原始文本</span>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            onClick={() =>
              setInput('  姓名：张三\n\n\n　电　话：１３８００００００００\t\t\n   地址：北京市朝阳区   \n\n')
            }
          >
            填入示例
          </button>
        </div>
        <textarea
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={7}
          placeholder="粘贴需要清理空白的文本"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <div class="grid gap-2 sm:grid-cols-2">
        {opts.map((o) => (
          <label class="flex cursor-pointer items-start gap-2 rounded-xl bg-base-200 px-3 py-2" key={o.label}>
            <input
              type="checkbox"
              class="checkbox checkbox-sm mt-0.5"
              checked={o.value}
              onChange={(e) => o.set((e.target as HTMLInputElement).checked)}
            />
            <span>
              <span class="block text-sm">{o.label}</span>
              <span class="block text-xs opacity-50 leading-snug">{o.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <div class="flex flex-wrap gap-2">
        <span class="badge badge-ghost">输入 {input.length} 字符</span>
        <span class="badge badge-primary badge-outline">输出 {output.length} 字符</span>
        <span class="badge badge-outline">{bytes} 字节</span>
        {changed && <span class="badge badge-success badge-outline">已清理</span>}
      </div>

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">清理结果</span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            disabled={!output}
            onClick={async () => {
              await copyText(output);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-72 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre-wrap break-all">
          {output || <span class="opacity-40">清理后的文本会实时显示在这里</span>}
        </pre>
      </label>

      <p class="text-xs leading-relaxed opacity-55">
        从网页、PDF、微信里复制出来的文字常带着全角空格、不规则缩进和一堆空行，
        直接粘进代码或表格就会错位。这个工具一次性把它们收拾干净，全程在本地浏览器完成。
      </p>
    </div>
  );
}
