import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Mode = 'split' | 'join';

const SPLITTERS: { key: string; label: string; value: string }[] = [
  { key: 'newline', label: '换行', value: '\n' },
  { key: 'comma', label: '英文逗号', value: ',' },
  { key: 'commaCN', label: '中文逗号', value: '，' },
  { key: 'space', label: '空格', value: ' ' },
  { key: 'tab', label: 'Tab', value: '\t' },
  { key: 'semicolon', label: '分号', value: ';' },
  { key: 'pipe', label: '竖线', value: '|' },
  { key: 'custom', label: '自定义', value: '' },
];

export default function TextSplitJoinTool() {
  const [mode, setMode] = useState<Mode>('split');
  const [input, setInput] = useState('');
  const [splitterKey, setSplitterKey] = useState('newline');
  const [customSplitter, setCustomSplitter] = useState('');
  const [joiner, setJoiner] = useState('\n');
  const [trimItem, setTrimItem] = useState(true);
  const [dropEmpty, setDropEmpty] = useState(true);
  const [quote, setQuote] = useState(false);
  const [unique, setUnique] = useState(false);
  const [copied, setCopied] = useState(false);

  const splitter =
    splitterKey === 'custom' ? customSplitter : SPLITTERS.find((s) => s.key === splitterKey)?.value ?? '\n';

  const items = useMemo(() => {
    if (!input) return [];
    let list = splitter === '' ? [input] : input.split(splitter);
    if (trimItem) list = list.map((s) => s.trim());
    if (dropEmpty) list = list.filter((s) => s !== '');
    if (unique) list = [...new Set(list)];
    return list;
  }, [input, splitter, trimItem, dropEmpty, unique]);

  const wrap = (s: string) => (quote ? `'${s.replace(/'/g, "''")}'` : s);
  const output = mode === 'split' ? items.map(wrap).join(joiner) : items.map(wrap).join(joiner);

  const joinerLabel = (j: string) =>
    j === '\n' ? '换行' : j === ',' ? '逗号' : j === '\t' ? 'Tab' : j === ' ' ? '空格' : j;

  return (
    <div class="space-y-4">
      <div class="tabs tabs-box w-full">
        <button
          type="button"
          class={`tab flex-1 ${mode === 'split' ? 'tab-active' : ''}`}
          onClick={() => setMode('split')}
        >
          拆分
        </button>
        <button
          type="button"
          class={`tab flex-1 ${mode === 'join' ? 'tab-active' : ''}`}
          onClick={() => setMode('join')}
        >
          合并
        </button>
      </div>

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">{mode === 'split' ? '待拆分的文本' : '待合并的多项（每行或按分隔符）'}</span>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            onClick={() => {
              setMode('split');
              setInput('张三，李四，王五，赵六');
              setSplitterKey('commaCN');
            }}
          >
            填入示例
          </button>
        </div>
        <textarea
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={7}
          placeholder={mode === 'split' ? '粘贴一长串文本，按分隔符拆开' : '一行一项，或用上面的分隔符隔开'}
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <span class="text-sm font-medium">输入分隔符</span>
          <div class="mt-2 flex flex-wrap gap-2">
            {SPLITTERS.map((s) => (
              <button
                type="button"
                key={s.key}
                class={`btn btn-xs ${splitterKey === s.key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSplitterKey(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
          {splitterKey === 'custom' && (
            <input
              type="text"
              class="input input-bordered input-sm mt-2 w-full font-mono"
              placeholder="输入自定义分隔符，支持正则如 \s+"
              value={customSplitter}
              onInput={(e) => setCustomSplitter((e.target as HTMLInputElement).value)}
            />
          )}
        </div>

        <div>
          <span class="text-sm font-medium">输出连接符</span>
          <div class="mt-2 flex flex-wrap gap-2">
            {[
              { label: '换行', v: '\n' },
              { label: '逗号', v: ',' },
              { label: '逗号+空格', v: ', ' },
              { label: '空格', v: ' ' },
              { label: 'Tab', v: '\t' },
              { label: '竖线', v: ' | ' },
            ].map((j) => (
              <button
                type="button"
                key={j.label}
                class={`btn btn-xs ${joiner === j.v ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setJoiner(j.v)}
              >
                {j.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            class="input input-bordered input-sm mt-2 w-full font-mono"
            placeholder="或手写连接符"
            value={joiner}
            onInput={(e) => setJoiner((e.target as HTMLInputElement).value)}
          />
        </div>
      </div>

      <div class="flex flex-wrap gap-4 rounded-xl bg-base-200 px-4 py-3">
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={trimItem}
            onChange={(e) => setTrimItem((e.target as HTMLInputElement).checked)}
          />
          去掉每项首尾空白
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={dropEmpty}
            onChange={(e) => setDropEmpty((e.target as HTMLInputElement).checked)}
          />
          跳过空项
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={unique}
            onChange={(e) => setUnique((e.target as HTMLInputElement).checked)}
          />
          去重
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={quote}
            onChange={(e) => setQuote((e.target as HTMLInputElement).checked)}
          />
          每项加单引号
        </label>
      </div>

      <div class="flex flex-wrap gap-2">
        <span class="badge badge-ghost">共 {items.length} 项</span>
        <span class="badge badge-outline">用「{joinerLabel(joiner)}」连接</span>
      </div>

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">结果</span>
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
          {output || <span class="opacity-40">结果会实时显示在这里</span>}
        </pre>
      </label>

      <p class="text-xs leading-relaxed opacity-55">
        「每项加单引号」是给写 SQL 的 IN 条件准备的，勾上后输出可直接粘进
        <code class="mx-1">WHERE name IN (...)</code>。自定义分隔符支持正则写法，比如用
        <code class="mx-1">\s+</code> 按任意空白切分。全部在本地完成。
      </p>
    </div>
  );
}
