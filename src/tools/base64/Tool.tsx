import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import {
  utf8ToBase64,
  base64ToUtf8,
  urlSafeEncode,
  bytesToBase64,
  b64Stats,
} from './b64';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // >2MB 给性能提示

interface FileResult {
  name: string;
  size: number;
  type: string;
  b64: string;
  preview: string; // 图片的 dataURL
}

export default function Base64Tool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [keepPad, setKeepPad] = useState(true);
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const [file, setFile] = useState<FileResult | null>(null);
  const [fileWarn, setFileWarn] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const { result, error } = useMemo(() => {
    if (!input) return { result: '', error: '' };
    try {
      if (mode === 'encode') {
        return { result: urlSafe ? urlSafeEncode(input, { padding: keepPad }) : utf8ToBase64(input), error: '' };
      }
      // 解码自动兼容 URL-safe 串与缺 padding 的 JWT 串
      return { result: base64ToUtf8(input), error: '' };
    } catch (e) {
      return { result: '', error: (e as Error).message || '解码失败' };
    }
  }, [input, mode, urlSafe, keepPad]);

  const stats = useMemo(
    () => (input && result ? b64Stats(input, result) : null),
    [input, result],
  );

  const copy = async (text: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const readFile = (f: File) => {
    setFileWarn(
      f.size > MAX_FILE_SIZE
        ? `文件 ${(f.size / 1048576).toFixed(1)}MB 较大（>2MB），转换可能需要几秒，页面可能短暂卡顿`
        : '',
    );
    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result as ArrayBuffer);
      const b64 = bytesToBase64(bytes);
      setFile({
        name: f.name,
        size: f.size,
        type: f.type || 'application/octet-stream',
        b64,
        preview: f.type.startsWith('image/') ? `data:${f.type};base64,${b64}` : '',
      });
    };
    reader.onerror = () => setFileWarn('文件读取失败，请重试或换个小文件');
    reader.readAsArrayBuffer(f);
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
        {mode === 'encode' && (
          <label class="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              class="checkbox checkbox-xs"
              checked={urlSafe}
              onChange={(e) => setUrlSafe((e.target as HTMLInputElement).checked)}
            />
            URL-safe 模式（<code class="text-xs">-_</code> 替代 <code class="text-xs">+/</code>）
          </label>
        )}
        {mode === 'encode' && urlSafe && (
          <label class="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              class="checkbox checkbox-xs"
              checked={!keepPad}
              onChange={(e) => setKeepPad(!(e.target as HTMLInputElement).checked)}
            />
            去掉 <code class="text-xs">=</code> 补位
          </label>
        )}
        {mode === 'decode' && <span class="text-xs opacity-60">解码自动识别 URL-safe 串，缺 padding 自动补全</span>}
      </div>

      <div>
        <label class="text-sm font-medium" for="b64-input">
          输入文本
        </label>
        <textarea
          id="b64-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={4}
          placeholder={mode === 'encode' ? '输入要编码的文本，支持中文' : '粘贴 Base64 串（标准或 URL-safe 均可）'}
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

      {stats && (
        <div class="flex flex-wrap gap-x-5 gap-y-1 text-xs opacity-70">
          <span>字符数 <b>{stats.chars}</b></span>
          <span>UTF-8 字节 <b>{stats.bytes}</b></span>
          <span>输出长度 <b>{stats.outLen}</b></span>
          <span>
            膨胀率 <b>{(stats.ratio * 100).toFixed(0)}%</b>（理论 4/3 ≈ 133%）
          </span>
        </div>
      )}

      {/* 文件 → Base64 */}
      <div class="card bg-base-200 p-4 space-y-3">
        <div class="font-medium text-sm">📎 文件转 Base64</div>
        <div
          class={`border-2 border-dashed rounded-lg p-4 text-center text-sm transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-base-300'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer?.files?.[0];
            if (f) readFile(f);
          }}
        >
          拖拽文件到这里，或
          <label class="link link-primary cursor-pointer mx-1">
            选择文件
            <input
              type="file"
              class="hidden"
              onChange={(e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) readFile(f);
              }}
            />
          </label>
          <span class="opacity-60">（图片可预览，超过 2MB 会有性能提示）</span>
        </div>
        {fileWarn && <p class="text-xs text-warning">{fileWarn}</p>}
        {file && (
          <div class="space-y-2">
            <div class="text-xs opacity-70">
              {file.name} · {(file.size / 1024).toFixed(1)} KB · {file.type} · Base64 长 {file.b64.length}
            </div>
            {file.preview && (
              <img src={file.preview} alt="预览" class="max-h-40 rounded-lg border border-base-300" />
            )}
            <div class="relative">
              <pre class="rounded-lg bg-base-100 p-2 font-mono text-xs break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
                {file.b64.length > 2000 ? file.b64.slice(0, 2000) + '…' : file.b64}
              </pre>
              <button
                type="button"
                class="btn btn-xs btn-primary absolute top-1 right-1"
                onClick={() => copy(file.b64)}
              >
                复制全部
              </button>
            </div>
          </div>
        )}
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        Base64 是编码而非加密；中文与 emoji 均按 UTF-8 正确处理，全部本地完成，文件不会上传。
      </p>
    </div>
  );
}
