import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { crc32 } from '@/lib/crypto-tools';

export default function Crc32Checksum() {
  const [text, setText] = useState('MokaKit');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!text) return null;
    return crc32(text);
  }, [text]);

  const copy = async () => {
    if (!result || !result.ok) return;
    await copyText(result.data);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="text-sm font-medium" for="crc-input">
          输入文本
        </label>
        <textarea
          id="crc-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={5}
          placeholder="输入要计算 CRC32 校验和的文本"
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
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
            <span class="text-sm font-medium">CRC32 校验和</span>
            <button
              type="button"
              class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              onClick={copy}
            >
              {copied ? '已复制' : '复制结果'}
            </button>
          </div>
          <p class="mt-3 break-all font-mono text-lg">{result.data}</p>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        计算在浏览器本地完成。CRC32 是常用的循环冗余校验算法，结果为 8 位十六进制，常用于文件完整性校验与通信检错。
      </p>
    </div>
  );
}
