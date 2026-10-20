import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { wordFrequency } from '@/lib/text-tools';

export default function WordFrequency() {
  const [text, setText] = useState('');
  const [ignoreStop, setIgnoreStop] = useState(true);
  const [minLen, setMinLen] = useState('1');
  const [topN, setTopN] = useState('20');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const result = useMemo(() => {
    if (!text.trim()) return null;
    const ml = Math.max(1, Math.floor(Number(minLen) || 1));
    const tn = Math.max(1, Math.floor(Number(topN) || 20));
    return wordFrequency(text, { ignoreStopwords: ignoreStop, minLen: ml, topN: tn });
  }, [text, ignoreStop, minLen, topN]);

  const copy = async () => {
    if (!result || !result.ok) return;
    const lines = result.data.rows.map((r) => `${r.word}\t${r.count}\t${r.pct}%`);
    await copyText(lines.join('\n'));
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="text-sm font-medium" for="wf-input">
          输入文本
        </label>
        <textarea
          id="wf-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={7}
          placeholder="粘贴一段中英文文本，例如：The cat sat on the mat. 猫坐在垫子上。"
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
        />

        <div class="mt-3 flex flex-wrap items-center gap-4">
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={ignoreStop}
              onInput={(e) => setIgnoreStop((e.target as HTMLInputElement).checked)}
            />
            忽略停用词
          </label>
          <label class="flex items-center gap-2 text-sm">
            最小词长
            <input
              type="number"
              min="1"
              class="input input-bordered input-sm w-20 font-mono"
              value={minLen}
              onInput={(e) => setMinLen((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="flex items-center gap-2 text-sm">
            TopN
            <input
              type="number"
              min="1"
              class="input input-bordered input-sm w-20 font-mono"
              value={topN}
              onInput={(e) => setTopN((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
      </div>

      {result && !result.ok && (
        <p class="text-sm text-error" role="alert">
          {result.error}
        </p>
      )}

      {result && result.ok && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm opacity-60">共 {result.data.total} 个词，展示前 {result.data.rows.length} 个</span>
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={copy}
            >
              {copied ? '已复制' : '复制结果'}
            </button>
          </div>
          <div class="mt-3 overflow-x-auto">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>词语</th>
                  <th class="text-right">次数</th>
                  <th class="text-right">占比</th>
                </tr>
              </thead>
              <tbody>
                {result.data.rows.map((r) => (
                  <tr>
                    <td class="font-mono">{r.word}</td>
                    <td class="text-right font-mono">{r.count}</td>
                    <td class="text-right font-mono">{r.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        统计在浏览器本地完成，不上传文本。英文按词、中文按字分别计数；停用词指 the、and 等高频低信息词。
      </p>
    </div>
  );
}
