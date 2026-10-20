import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { textToNato } from '@/lib/text-tools';

export default function NatoPhonetic() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return textToNato(input);
  }, [input]);

  const copy = async (text: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="text-sm font-medium" for="nato-input">
          输入要拼读的文本
        </label>
        <input
          id="nato-input"
          type="text"
          class="input input-bordered mt-2 w-full font-mono text-sm"
          placeholder="HELLO 2026"
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
          spellcheck={false}
        />
      </div>

      {result && !result.ok && (
        <p class="text-sm text-error" role="alert">
          {result.error}
        </p>
      )}

      {result && result.ok && (
        <div class="rounded-xl bg-base-200 p-3 sm:p-4">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">拼读结果</span>
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={() => copy(result.data.joined)}
            >
              {copied ? '已复制' : '复制拼音串'}
            </button>
          </div>
          <p class="mt-2 break-words font-mono text-sm">{result.data.joined}</p>
          <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {result.data.rows.map((r, i) => (
              <div class="rounded-lg bg-base-100 px-2 py-1.5 text-center" key={i}>
                <div class="font-mono text-sm">{r.char}</div>
                <div class="text-xs opacity-70">{r.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        采用国际 NATO 拼音表：A=Alfa、B=Bravo。数字 0-9 也对应固定词，便于口头准确报读。
      </p>
    </div>
  );
}
