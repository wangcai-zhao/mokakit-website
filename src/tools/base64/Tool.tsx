import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function base64ToUtf8(b64: string): string {
  const clean = b64.replace(/\s/g, '');
  const bin = atob(clean);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default function Base64Tool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const { result, error } = useMemo(() => {
    if (!input) return { result: '', error: '' };
    try {
      const out = mode === 'encode' ? utf8ToBase64(input) : base64ToUtf8(input);
      return { result: out, error: '' };
    } catch (e) {
      return { result: '', error: (e as Error).message || '解码失败' };
    }
  }, [input, mode]);

  const copy = async (text: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="join">
        <button
          type="button"
          class={`btn btn-sm join-item ${mode === 'encode' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setMode('encode')}
        >
          编码
        </button>
        <button
          type="button"
          class={`btn btn-sm join-item ${mode === 'decode' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setMode('decode')}
        >
          解码
        </button>
      </div>

      <div>
        <label class="text-sm font-medium" for="b64-input">
          输入文本
        </label>
        <textarea
          id="b64-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={4}
          placeholder={mode === 'encode' ? '输入要编码的文本，支持中文' : '粘贴 Base64 串'}
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium">结果</span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
            onClick={() => copy(result)}
            disabled={!result}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        {error ? (
          <p class="text-sm text-error">{error}</p>
        ) : (
          <pre class="rounded-xl bg-base-200 p-3 font-mono text-sm break-all whitespace-pre-wrap">
            {result || <span class="opacity-40">结果会显示在这里</span>}
          </pre>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        Base64 是编码而非加密；中文与 emoji 均按 UTF-8 正确处理，全部本地完成。
      </p>
    </div>
  );
}
