import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { removeAccents } from '@/lib/text-tools';

export default function RemoveAccents() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input) return null;
    return removeAccents(input);
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
        <label class="text-sm font-medium" for="acc-input">
          输入文本
        </label>
        <textarea
          id="acc-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={4}
          placeholder="café, naïve, señor, résumé"
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
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
            <span class="text-sm font-medium">清洗结果</span>
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={() => copy(result.data)}
            >
              {copied ? '已复制' : '复制结果'}
            </button>
          </div>
          <pre class="mt-2 whitespace-pre-wrap break-words rounded-lg bg-base-100 p-3 font-mono text-sm">
            {result.data}
          </pre>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        仅剥离拉丁字母的变音记号（é→e、ñ→n），中文与符号原样保留，全部在浏览器本地完成。
      </p>
    </div>
  );
}
