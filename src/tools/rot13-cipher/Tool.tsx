import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { rot13 } from '@/lib/crypto-tools';
import { parseNumber } from '@/lib/tool-result';

export default function Rot13Cipher() {
  const [text, setText] = useState('Hello MokaKit');
  const [shift, setShift] = useState('13');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text) return null;
    const s = parseNumber(shift, { name: '偏移量', min: 0, max: 25 });
    if (!s.ok) return s;
    return rot13(text, Math.round(s.data));
  }, [text, shift]);

  const copy = async () => {
    if (!result || !result.ok) return;
    await copyText(result.data);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="text-sm font-medium" for="rot-input">
          输入文本
        </label>
        <textarea
          id="rot-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={5}
          placeholder="输入要移位的英文字母文本"
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
        />
        <label class="mt-3 block text-sm font-medium">偏移量 (0-25)</label>
        <input
          type="number"
          min="0"
          max="25"
          class="input input-bordered input-sm mt-1.5 w-full font-mono"
          value={shift}
          onInput={(e) => setShift((e.target as HTMLInputElement).value)}
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
            <span class="text-sm font-medium">结果</span>
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={copy}
            >
              {copied ? '已复制' : '复制结果'}
            </button>
          </div>
          <p class="mt-3 break-all font-mono text-sm">{result.data}</p>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        计算在浏览器本地完成。仅对英文字母移位，数字与符号不变；ROT13（偏移 13）加解密为同一操作，适合趣味加密与谜题。
      </p>
    </div>
  );
}
