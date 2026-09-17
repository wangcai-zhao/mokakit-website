import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

interface Row {
  from: string;
  to: string;
  regex: boolean;
  caseSensitive: boolean;
}

const emptyRow = (): Row => ({ from: '', to: '', regex: false, caseSensitive: true });

export default function TextReplaceTool() {
  const [input, setInput] = useState('');
  const [rows, setRows] = useState<Row[]>([{ from: 'MokaKit', to: '摩卡工具箱', regex: false, caseSensitive: true }]);
  const [copied, setCopied] = useState(false);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const { output, hits, error } = useMemo(() => {
    let text = input;
    let count = 0;
    let err = '';
    for (const row of rows) {
      if (!row.from) continue;
      try {
        if (row.regex) {
          const flags = row.caseSensitive ? 'g' : 'gi';
          const re = new RegExp(row.from, flags);
          const found = text.match(re);
          count += found?.length ?? 0;
          text = text.replace(re, row.to);
        } else if (row.caseSensitive) {
          const parts = text.split(row.from);
          count += parts.length - 1;
          text = parts.join(row.to);
        } else {
          const lower = text.toLowerCase();
          const needle = row.from.toLowerCase();
          let idx = 0;
          let out = '';
          while (true) {
            const at = lower.indexOf(needle, idx);
            if (at === -1) break;
            out += text.slice(idx, at) + row.to;
            idx = at + needle.length;
            count += 1;
          }
          text = out + text.slice(idx);
        }
      } catch (e) {
        err = `第 ${rows.indexOf(row) + 1} 条规则的正则写法有问题：${(e as Error).message}`;
        break;
      }
    }
    return { output: text, hits: count, error: err };
  }, [input, rows]);

  return (
    <div class="space-y-4">
      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">原始文本</span>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            onClick={() =>
              setInput(
                'MokaKit 是一个在线工具箱。\nMokaKit 的所有计算都在本地完成。\n访问 mokakit.com 试试看。',
              )
            }
          >
            填入示例
          </button>
        </div>
        <textarea
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={6}
          placeholder="粘贴需要批量替换的文本"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">替换规则（按顺序依次执行）</span>
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            onClick={() => setRows((prev) => [...prev, emptyRow()])}
          >
            + 加一条
          </button>
        </div>

        <div class="space-y-3">
          {rows.map((row, i) => (
            <div class="rounded-xl border border-base-300 bg-base-100 p-3" key={i}>
              <div class="grid gap-2 sm:grid-cols-2">
                <input
                  type="text"
                  class="input input-bordered input-sm font-mono"
                  placeholder="查找内容"
                  value={row.from}
                  onInput={(e) => update(i, { from: (e.target as HTMLInputElement).value })}
                />
                <input
                  type="text"
                  class="input input-bordered input-sm font-mono"
                  placeholder="替换为（留空等于删除）"
                  value={row.to}
                  onInput={(e) => update(i, { to: (e.target as HTMLInputElement).value })}
                />
              </div>
              <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap gap-4">
                  <label class="flex cursor-pointer items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-xs"
                      checked={row.regex}
                      onChange={(e) => update(i, { regex: (e.target as HTMLInputElement).checked })}
                    />
                    正则
                  </label>
                  <label class="flex cursor-pointer items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-xs"
                      checked={row.caseSensitive}
                      onChange={(e) =>
                        update(i, { caseSensitive: (e.target as HTMLInputElement).checked })
                      }
                    />
                    区分大小写
                  </label>
                </div>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost text-error"
                  disabled={rows.length <= 1}
                  onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p class="text-sm text-error">{error}</p>}

      <div class="flex flex-wrap gap-2">
        <span class="badge badge-ghost">共替换 {hits} 处</span>
        <span class="badge badge-outline">{rows.filter((r) => r.from).length} 条生效规则</span>
      </div>

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">替换结果</span>
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
        规则自上而下依次作用在同一段文本上，前一条的输出是后一条的输入。
        开启正则后「替换为」里可以用 $1、$2 引用捕获组，用 $&amp; 引用整个匹配。
        全部在本地完成，文本不上传。
      </p>
    </div>
  );
}
