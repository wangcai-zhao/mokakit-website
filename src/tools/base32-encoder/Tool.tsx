import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { base32Encode, base32Decode } from '@/lib/crypto-tools';

type Mode = 'encode' | 'decode';

export default function Base32Encoder() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('MokaKit');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return mode === 'encode' ? base32Encode(input) : base32Decode(input);
  }, [input, mode]);

  const copy = async () => {
    if (!result || !result.ok) return;
    await copyText(result.data);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class={`btn btn-xs ${mode === 'encode' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('encode')}
          >
            编码
          </button>
          <button
            type="button"
            class={`btn btn-xs ${mode === 'decode' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('decode')}
          >
            解码
          </button>
        </div>
        <label class="mt-3 block text-sm font-medium">
          {mode === 'encode' ? '输入文本' : '输入 Base32 字符串'}
        </label>
        <textarea
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={5}
          placeholder={mode === 'encode' ? '输入要编码的文本' : '输入 Base32 字符串（可含 = 填充）'}
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
            <span class="text-sm font-medium">{mode === 'encode' ? 'Base32 结果' : '解码结果'}</span>
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
        计算在浏览器本地完成。采用 RFC 4648 标准字母表（A-Z、2-7），编码结果以 = 补齐至 8 的倍数；解码时自动忽略空格与大小写。
      </p>
    </div>
  );
}
