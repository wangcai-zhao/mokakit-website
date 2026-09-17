import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Side = 'left' | 'right' | 'both';
type Align = 'left' | 'center' | 'right';

export default function TextPadTool() {
  const [input, setInput] = useState('');
  const [width, setWidth] = useState(20);
  const [char, setChar] = useState('0');
  const [side, setSide] = useState<Side>('left');
  const [align, setAlign] = useState<Align>('left');
  const [perLine, setPerLine] = useState(true);
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => (perLine ? input.split(/\r?\n/) : [input]), [input, perLine]);

  const padOne = (s: string): string => {
    const w = Math.max(1, width);
    if (s.length >= w) return s;
    const pad = char === '' ? ' ' : char;
    const need = w - s.length;
    if (side === 'left') return pad.repeat(Math.ceil(need / pad.length)).slice(0, need) + s;
    if (side === 'right') return s + pad.repeat(Math.ceil(need / pad.length)).slice(0, need);
    const leftCount = align === 'left' ? 0 : align === 'right' ? need : Math.floor(need / 2);
    const rightCount = need - leftCount;
    return (
      pad.repeat(Math.ceil(leftCount / pad.length)).slice(0, leftCount) +
      s +
      pad.repeat(Math.ceil(rightCount / pad.length)).slice(0, rightCount)
    );
  };

  const output = useMemo(
    () => lines.map(padOne).join('\n'),
    [lines, width, char, side, align],
  );

  const maxLen = useMemo(() => Math.max(0, ...lines.map((l) => l.length)), [lines]);

  return (
    <div class="space-y-4">
      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">原始文本</span>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            onClick={() => setInput('7\n42\n108\n9')}
          >
            填入示例
          </button>
        </div>
        <textarea
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={6}
          placeholder="每行一条，或整段一起处理"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <div class="grid gap-4 sm:grid-cols-3">
        <label class="block">
          <span class="text-sm font-medium">目标长度</span>
          <input
            type="number"
            min="1"
            max="200"
            class="input input-bordered mt-1.5 w-full"
            value={width}
            onInput={(e) => setWidth(Math.max(1, Number((e.target as HTMLInputElement).value) || 1))}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">填充字符</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-full font-mono"
            maxlength="4"
            value={char}
            onInput={(e) => setChar((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">填充位置</span>
          <select
            class="select select-bordered mt-1.5 w-full"
            value={side}
            onChange={(e) => setSide((e.target as HTMLSelectElement).value as Side)}
          >
            <option value="left">左侧补</option>
            <option value="right">右侧补</option>
            <option value="both">两侧补</option>
          </select>
        </label>
      </div>

      {side === 'both' && (
        <label class="block">
          <span class="text-sm font-medium">两侧分配</span>
          <select
            class="select select-bordered mt-1.5 w-full sm:max-w-xs"
            value={align}
            onChange={(e) => setAlign((e.target as HTMLSelectElement).value as Align)}
          >
            <option value="left">全部补右边（左对齐）</option>
            <option value="center">平均分配（居中）</option>
            <option value="right">全部补左边（右对齐）</option>
          </select>
        </label>
      )}

      <label class="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          checked={perLine}
          onChange={(e) => setPerLine((e.target as HTMLInputElement).checked)}
        />
        逐行处理（取消则整段当一个整体）
      </label>

      <div class="flex flex-wrap gap-2">
        <span class="badge badge-ghost">{lines.length} 行</span>
        <span class="badge badge-outline">最长 {maxLen} 字符</span>
        {maxLen > width && (
          <span class="badge badge-warning badge-outline">有行超过目标长度，不会被截断</span>
        )}
      </div>

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">补齐结果</span>
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
        <pre class="max-h-72 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre">
          {output || <span class="opacity-40">补齐后的内容会实时显示在这里</span>}
        </pre>
      </label>

      <p class="text-xs leading-relaxed opacity-55">
        典型用途：订单号补零到固定位数（7 → 00000007）、日志按列对齐、生成等宽编号。
        中文是全角字符，一个汉字占两个显示宽度，纯按字符数补齐在等宽字体下会对不齐，
        需要视觉对齐时建议搭配空格填充。
      </p>
    </div>
  );
}
