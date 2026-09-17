import { useState, useEffect } from 'preact/hooks';
import ImageDropzone from '@/tools/_shared/ImageDropzone';
import { useImageSource } from '@/tools/_shared/use-image';
import {
  formatBytes,
  drawToCanvas,
  canvasToBlob,
  downloadBlob,
  extOfMime,
  type ImageMime,
} from '@/tools/_shared/image-utils';

const FORMATS: { value: ImageMime; label: string }[] = [
  { value: 'image/jpeg', label: 'JPEG（体积最小）' },
  { value: 'image/webp', label: 'WebP（推荐）' },
  { value: 'image/png', label: 'PNG（无损）' },
];

export default function ImageCompressTool() {
  const { file, img, error, baseName, pick, clear } = useImageSource();
  const [format, setFormat] = useState<ImageMime>('image/webp');
  const [quality, setQuality] = useState(0.75);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [outSize, setOutSize] = useState(0);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!img) {
      setOutSize(0);
      setPreview('');
      return;
    }
    setBusy(true);
    const w = img.naturalWidth;
    const scale = maxWidth > 0 && w > maxWidth ? maxWidth / w : 1;
    const canvas = drawToCanvas(
      img,
      Math.max(1, Math.round(w * scale)),
      Math.max(1, Math.round(img.naturalHeight * scale)),
    );
    canvasToBlob(canvas, format, quality)
      .then((blob) => {
        if (!alive) return;
        setOutSize(blob.size);
        setPreview(URL.createObjectURL(blob));
        setBusy(false);
      })
      .catch(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [img, format, quality, maxWidth]);

  const inSize = file?.size ?? 0;
  const saved = inSize > 0 && outSize > 0 ? 1 - outSize / inSize : 0;

  return (
    <div class="space-y-4">
      {error && <p class="text-sm text-error">{error}</p>}

      <ImageDropzone onPick={pick} hasImage={Boolean(img)} />

      {img && (
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 px-4 py-3 text-sm">
          <span>
            {file?.name} · {img.naturalWidth}×{img.naturalHeight}
          </span>
          <button type="button" class="btn btn-xs btn-ghost" onClick={clear}>
            移除
          </button>
        </div>
      )}

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">输出格式</span>
          <select
            class="select select-bordered mt-1.5 w-full"
            value={format}
            onChange={(e) => setFormat((e.target as HTMLSelectElement).value as ImageMime)}
          >
            {FORMATS.map((f) => (
              <option value={f.value}>{f.label}</option>
            ))}
          </select>
        </label>

        <label class="block">
          <span class="text-sm font-medium">最大宽度（px，0 为不改尺寸）</span>
          <input
            type="number"
            min="0"
            class="input input-bordered mt-1.5 w-full"
            value={maxWidth}
            onInput={(e) => setMaxWidth(Number((e.target as HTMLInputElement).value) || 0)}
          />
        </label>
      </div>

      <label class="block">
        <span class="flex items-center justify-between text-sm font-medium">
          <span>压缩质量</span>
          <span class="opacity-60">{Math.round(quality * 100)}%</span>
        </span>
        <input
          type="range"
          min="10"
          max="100"
          class="range range-primary mt-2 w-full"
          value={Math.round(quality * 100)}
          disabled={format === 'image/png'}
          onInput={(e) => setQuality(Number((e.target as HTMLInputElement).value) / 100)}
        />
        <span class="text-xs opacity-55">PNG 为无损格式，不参与质量调节</span>
      </label>

      {img && (
        <>
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-ghost">原图 {formatBytes(inSize)}</span>
            <span class="badge badge-primary badge-outline">
              压缩后 {busy ? '计算中…' : formatBytes(outSize)}
            </span>
            {saved > 0 && (
              <span class="badge badge-success badge-outline">
                省了 {Math.round(saved * 100)}%
              </span>
            )}
            {saved < 0 && (
              <span class="badge badge-warning badge-outline">体积变大了，换个格式试试</span>
            )}
          </div>

          {preview && (
            <figure class="rounded-xl border border-base-300 bg-base-200/50 p-3">
              <img
                src={preview}
                alt="压缩预览"
                class="mx-auto max-h-64 rounded-lg object-contain"
              />
            </figure>
          )}

          <button
            type="button"
            class="btn btn-primary w-full sm:w-auto"
            disabled={!preview || busy}
            onClick={async () => {
              const w = img.naturalWidth;
              const scale = maxWidth > 0 && w > maxWidth ? maxWidth / w : 1;
              const canvas = drawToCanvas(
                img,
                Math.max(1, Math.round(w * scale)),
                Math.max(1, Math.round(img.naturalHeight * scale)),
              );
              const blob = await canvasToBlob(canvas, format, quality);
              downloadBlob(blob, `${baseName}-compressed.${extOfMime(format)}`);
            }}
          >
            下载压缩后的图片
          </button>
        </>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        压缩在浏览器本地用 canvas 完成，图片不会离开你的设备。JPEG / WebP 为有损压缩，
        质量调到 70%-85% 通常肉眼几乎无差别但体积能减半；需要保留透明通道时选 PNG 或 WebP。
      </p>
    </div>
  );
}
