import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { textToMorse, morseToText } from '@/lib/text-tools';

export default function MorseCode() {
  const [dir, setDir] = useState<'toMorse' | 'toText'>('toMorse');
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return dir === 'toMorse' ? textToMorse(input) : morseToText(input);
  }, [input, dir]);

  const copy = async (text: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="flex gap-2">
        <button
          type="button"
          class={`btn btn-sm ${dir === 'toMorse' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setDir('toMorse')}
        >
          文本 → 摩斯
        </button>
        <button
          type="button"
          class={`btn btn-sm ${dir === 'toText' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setDir('toText')}
        >
          摩斯 → 文本
        </button>
      </div>

      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="text-sm font-medium" for="morse-input">
          {dir === 'toMorse' ? '输入文本（A-Z、0-9、常用标点）' : '输入摩斯（空格分隔，/ 分词）'}
        </label>
        <textarea
          id="morse-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={4}
          placeholder={dir === 'toMorse' ? 'SOS' : '... --- ...'}
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
            <span class="text-sm font-medium">转换结果</span>
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
        转换在浏览器本地完成。字母用空格分隔，词与词之间用斜杠 / 分隔；中文会原样保留。
      </p>
    </div>
  );
}
