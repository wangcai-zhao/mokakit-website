import { useState } from 'preact/hooks';

type Row = { type: 'same' | 'add' | 'del'; text: string };

function diffLines(a: string[], b: string[]): Row[] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const res: Row[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      res.push({ type: 'same', text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      res.push({ type: 'del', text: a[i] });
      i++;
    } else {
      res.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < n) res.push({ type: 'del', text: a[i++] });
  while (j < m) res.push({ type: 'add', text: b[j++] });
  return res;
}

export default function TextDiff() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');

  const rows = diffLines(left.split('\n'), right.split('\n'));
  const adds = rows.filter((r) => r.type === 'add').length;
  const dels = rows.filter((r) => r.type === 'del').length;

  const rowCls = (t: Row['type']) =>
    t === 'add'
      ? 'bg-success/15 text-success'
      : t === 'del'
        ? 'bg-error/15 text-error'
        : 'text-base-content/70';

  return (
    <div class="space-y-4">
      <div class="grid gap-3 md:grid-cols-2">
        <div>
          <label class="text-xs opacity-60 mb-1" for="diff-left">原文本（旧）</label>
          <textarea
            id="diff-left"
            class="textarea textarea-bordered w-full h-40 text-xs font-mono"
            placeholder="粘贴原文本……"
            value={left}
            onInput={(e) => setLeft((e.target as HTMLTextAreaElement).value)}
          />
        </div>
        <div>
          <label class="text-xs opacity-60 mb-1" for="diff-right">新文本（新）</label>
          <textarea
            id="diff-right"
            class="textarea textarea-bordered w-full h-40 text-xs font-mono"
            placeholder="粘贴新文本……"
            value={right}
            onInput={(e) => setRight((e.target as HTMLTextAreaElement).value)}
          />
        </div>
      </div>

      {left || right ? (
        <>
          <div class="text-xs opacity-60">
            共 {rows.length} 行 ｜ <span class="text-error">删除 {dels}</span> ｜{' '}
            <span class="text-success">新增 {adds}</span>
          </div>
          <div class="rounded-xl border border-base-300 overflow-hidden text-xs font-mono">
            <pre class="max-h-80 overflow-auto">
              {rows.map((r, idx) => (
                <div key={idx} class={`flex gap-2 px-2 py-0.5 ${rowCls(r.type)}`}>
                  <span class="select-none opacity-50 w-4">
                    {r.type === 'add' ? '+' : r.type === 'del' ? '-' : ' '}
                  </span>
                  <span class="whitespace-pre-wrap break-words flex-1">{r.text || ' '}</span>
                </div>
              ))}
            </pre>
          </div>
        </>
      ) : (
        <p class="text-sm opacity-55 text-center py-4">在上方粘贴两段文本，这里会逐行高亮差异。</p>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        比较完全在浏览器本地进行，文本不会上传。基于行级 LCS 算法，适合代码、文案、配置的改动核对。
      </p>
    </div>
  );
}
