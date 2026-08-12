import { useState, useEffect, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

export default function QrcodeGenerator() {
  const [text, setText] = useState('https://mokakit.com');
  const [size, setSize] = useState(256);
  const [dataUrl, setDataUrl] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    if (!text.trim()) {
      setDataUrl('');
      setErr('');
      return;
    }
    import('qrcode')
      .then((mod) => {
        const QR = (mod as any).default ?? mod;
        return QR.toDataURL(text, {
          width: size,
          margin: 2,
          errorCorrectionLevel: 'M',
        });
      })
      .then((url: string) => {
        if (alive) {
          setDataUrl(url);
          setErr('');
        }
      })
      .catch((e: unknown) => {
        if (alive) setErr(e instanceof Error ? e.message : '二维码生成失败');
      });
    return () => {
      alive = false;
    };
  }, [text, size]);

  const download = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'qrcode.png';
    a.click();
  };

  const handleCopy = async () => {
    if (!text) return;
    await copyText(text);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium" for="qr-text">
          内容（网址 / 文本 / WIFI 等）
        </label>
        <textarea
          id="qr-text"
          class="textarea textarea-bordered mt-2 w-full h-24 font-mono text-sm"
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          placeholder="https://mokakit.com"
        />
      </div>

      <div>
        <label class="text-sm font-medium">
          尺寸：{size} × {size} px
        </label>
        <input
          type="range"
          min={128}
          max={512}
          step={16}
          value={size}
          class="range range-primary mt-2 w-full"
          onInput={(e) => setSize(Number((e.target as HTMLInputElement).value))}
        />
      </div>

      <div class="flex justify-center rounded-xl bg-base-200 p-4">
        {dataUrl ? (
          <img src={dataUrl} alt="二维码" class="h-56 w-56 rounded bg-white p-2" />
        ) : (
          <div class="flex h-56 w-56 items-center justify-center text-center text-sm opacity-40">
            {err || '输入内容后自动生成'}
          </div>
        )}
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          onClick={download}
          disabled={!dataUrl}
        >
          下载 PNG
        </button>
        <button
          type="button"
          class={`btn btn-sm ${copied ? 'btn-success' : 'btn-ghost'}`}
          onClick={handleCopy}
          disabled={!text}
        >
          {copied ? '已复制' : '复制内容'}
        </button>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        二维码在浏览器本地生成，输入内容不会上传服务器。
      </p>
    </div>
  );
}
