import { useState } from 'preact/hooks';
import ImageDropzone from '@/tools/_shared/ImageDropzone';
import { useImageSource } from '@/tools/_shared/use-image';
import { canvasToBlob, canvasToDataUrl, downloadBlob, formatBytes } from '@/tools/_shared/image-utils';

const SIZES = [16, 32, 48, 64, 128, 180, 192, 512];

export default function FaviconGeneratorTool() {
  const { img, error, pick, clear } = useImageSource();
  const [padding, setPadding] = useState(8);
  const [round, setRound] = useState(true);
  const [bg, setBg] = useState('#ffffff');
  const [thumbs, setThumbs] = useState<{ size: number; url: string; bytes: number }[]>([]);

  const renderOne = async (size: number) => {
    if (!img) return null;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    const pad = Math.round((size * padding) / 100);
    const inner = Math.max(1, size - pad * 2);
    if (round) {
      const r = inner / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }
    ctx.drawImage(img, pad, pad, inner, inner);
    if (round) ctx.restore();

    const blob = await canvasToBlob(canvas, 'image/png');
    return { size, url: canvasToDataUrl(canvas, 'image/png'), bytes: blob.size };
  };

  const generate = async () => {
    if (!img) return;
    const list = await Promise.all(SIZES.map((s) => renderOne(s)));
    setThumbs(list.filter((x): x is { size: number; url: string; bytes: number } => Boolean(x)));
  };

  const snippet = `<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />`;

  return (
    <div class="space-y-4">
      {error && <p class="text-sm text-error">{error}</p>}
      <ImageDropzone
        onPick={pick}
        hasImage={Boolean(img)}
        hint="选择一张正方形 logo，建议 512×512 以上"
      />

      {img && (
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 px-4 py-3 text-sm">
          <span>
            源图 {img.naturalWidth}×{img.naturalHeight}
            {img.naturalWidth !== img.naturalHeight && '（非正方形，会被拉伸填满）'}
          </span>
          <button type="button" class="btn btn-xs btn-ghost" onClick={clear}>
            移除
          </button>
        </div>
      )}

      <div class="grid gap-4 sm:grid-cols-3">
        <label class="block">
          <span class="flex items-center justify-between text-sm font-medium">
            <span>留白</span>
            <span class="opacity-60">{padding}%</span>
          </span>
          <input
            type="range"
            min="0"
            max="30"
            class="range range-primary mt-2 w-full"
            value={padding}
            onInput={(e) => setPadding(Number((e.target as HTMLInputElement).value))}
          />
        </label>
        <label class="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={round}
            onChange={(e) => setRound((e.target as HTMLInputElement).checked)}
          />
          圆形裁切
        </label>
        <label class="block">
          <span class="text-sm font-medium">背景色</span>
          <input
            type="color"
            class="mt-1.5 h-10 w-full rounded-lg border border-base-300 bg-base-100"
            value={bg}
            onInput={(e) => setBg((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      {img && (
        <button type="button" class="btn btn-primary btn-sm" onClick={generate}>
          生成全部尺寸
        </button>
      )}

      {thumbs.length > 0 && (
        <>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {thumbs.map((t) => (
              <div
                class="flex flex-col items-center gap-2 rounded-xl border border-base-300 bg-base-100 p-3"
                key={t.size}
              >
                <img
                  src={t.url}
                  alt={`${t.size}px`}
                  width={Math.min(t.size, 64)}
                  height={Math.min(t.size, 64)}
                  class="rounded"
                />
                <span class="text-xs opacity-60">
                  {t.size}×{t.size} · {formatBytes(t.bytes)}
                </span>
                <button
                  type="button"
                  class="btn btn-xs btn-outline"
                  onClick={async () => {
                    const res = await fetch(t.url);
                    downloadBlob(await res.blob(), `favicon-${t.size}x${t.size}.png`);
                  }}
                >
                  下载
                </button>
              </div>
            ))}
          </div>

          <label class="block">
            <span class="text-sm font-medium">复制这段代码到页面 &lt;head&gt;</span>
            <pre class="mt-1.5 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-xs whitespace-pre-wrap">
              {snippet}
            </pre>
          </label>
        </>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        favicon 至少要出 16×16 与 32×32；180×180 是 iOS 添加到主屏用的 apple-touch-icon，
        192 与 512 供 PWA 的 manifest 使用。ICO 容器本站不生成，直接用 32×32 的 PNG
        浏览器同样认，或者把多尺寸 PNG 打包成 ico 再上传。
      </p>
    </div>
  );
}
