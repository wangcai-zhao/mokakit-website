import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const MODES = [
  { id: 'component', label: 'encodeURIComponent', enc: encodeURIComponent, dec: decodeURIComponent },
  { id: 'uri', label: 'encodeURI', enc: encodeURI, dec: decodeURI },
] as const;

export default function UrlEncoder() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [encId, setEncId] = useState<string>('component');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const enc = MODES.find((e) => e.id === encId)!;

  const result = useMemo(() => {
    if (!input) return { value: '', error: '' };
    try {
      const out = mode === 'encode' ? enc.enc(input) : enc.dec(input);
      return { value: out, error: '' };
    } catch (e) {
      return { value: '', error: (e as Error).message || '处理失败' };
    }
  }, [input, mode, enc]);

  const copy = async (text: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-3">
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
        <select
          class="select select-bordered select-sm"
          value={encId}
          onChange={(e) => setEncId((e.target as HTMLSelectElement).value)}
        >
          {MODES.map((m) => (
            <option value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label class="text-sm font-medium" for="url-input">
          输入文本
        </label>
        <textarea
          id="url-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={4}
          placeholder={mode === 'encode' ? '例如 摩卡工具箱 hello world' : '例如 %E6%91%A9%E5%8D%A1'}
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
            onClick={() => copy(result.value)}
            disabled={!result.value}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        {result.error ? (
          <p class="text-sm text-error">{result.error}</p>
        ) : (
          <pre class="rounded-xl bg-base-200 p-3 font-mono text-sm break-all whitespace-pre-wrap">
            {result.value || <span class="opacity-40">结果会显示在这里</span>}
          </pre>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        所有编解码都在本地浏览器完成，不上传任何数据。
      </p>
    </div>
  );
}
