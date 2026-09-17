import { useState } from 'preact/hooks';
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

const TARGETS: { value: ImageMime; label: string; note: string }[] = [
  { value: 'image/png', label: 'PNG', note: '无损、支持透明，适合截图与图标' },
  { value: 'image/jpeg', label: 'JPEG', note: '体积最小，不支持透明，适合照片' },
  { value: 'image/webp', label: 'WebP', note: '比 JPEG 更小且支持透明，现代浏览器通用' },
];

export default function ImageConvertTool() {
  const { file, img, error, baseName, pick, clear } = useImageSource();
  const [target, setTarget] = useState<ImageMime>('image/webp');
  const [quality, setQuality] = useState(0.9);
  const [bg, setBg] = useState('#ffffff');
  const [outSize, setOutSize] = useState(0);
  const [busy, setBusy] = useState(false);

  const convert = async (download: boolean) => {
    if (!img) return;
    setBusy(true);
    // JPEG 不支持透明，透明区域会变黑，所以先铺一层背景色
    const canvas = drawToCanvas(
      img,
      img.naturalWidth,
      img.naturalHeight,
      target === 'image/jpeg' ? bg : undefined,
    );
    const blob = await canvasToBlob(canvas, target, quality);
    setOutSize(blob.size);
    setBusy(false);
    if (download) downloadBlob(blob, `${baseName}.${extOfMime(target)}`);
  };

  return (
    <div class="space-y-4">
      {error && <p class="text-sm text-error">{error}</p>}
      <ImageDropzone onPick={pick} hasImage={Boolean(img)} />

      {img && (
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 px-4 py-3 text-sm">
          <span>
            {file?.name} · {img.naturalWidth}×{img.naturalHeight} · {formatBytes(file?.size ?? 0)}
          </span>
          <button type="button" class="btn btn-xs btn-ghost" onClick={clear}>
            移除
          </button>
        </div>
      )}

      <div class="grid gap-3 sm:grid-cols-3">
        {TARGETS.map((t) => (
          <button
            type="button"
            key={t.value}
            class={`rounded-xl border p-4 text-left transition ${
              target === t.value
                ? 'border-primary bg-primary/5'
                : 'border-base-300 hover:border-primary/50'
            }`}
            onClick={() => setTarget(t.value)}
          >
            <span class="block font-semibold">{t.label}</span>
            <span class="mt-1 block text-xs opacity-60 leading-snug">{t.note}</span>
          </button>
        ))}
      </div>

      {target !== 'image/png' && (
        <label class="block">
          <span class="flex items-center justify-between text-sm font-medium">
            <span>导出质量</span>
            <span class="opacity-60">{Math.round(quality * 100)}%</span>
          </span>
          <input
            type="range"
            min="10"
            max="100"
            class="range range-primary mt-2 w-full"
            value={Math.round(quality * 100)}
            onInput={(e) => setQuality(Number((e.target as HTMLInputElement).value) / 100)}
          />
        </label>
      )}

      {target === 'image/jpeg' && (
        <label class="block">
          <span class="text-sm font-medium">透明区域填充色</span>
          <div class="mt-1.5 flex items-center gap-3">
            <input
              type="color"
              class="h-10 w-16 rounded-lg border border-base-300 bg-base-100"
              value={bg}
              onInput={(e) => setBg((e.target as HTMLInputElement).value)}
            />
            <span class="font-mono text-sm opacity-70">{bg}</span>
          </div>
          <span class="mt-1 block text-xs opacity-55">
            JPEG 不支持透明通道，不填白底的话透明部分会变成黑色
          </span>
        </label>
      )}

      {img && (
        <>
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-ghost">原图 {formatBytes(file?.size ?? 0)}</span>
            {outSize > 0 && (
              <span class="badge badge-primary badge-outline">
                转换后 {busy ? '计算中…' : formatBytes(outSize)}
              </span>
            )}
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={() => convert(false)}
            >
              试算目标体积
            </button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              disabled={busy}
              onClick={() => convert(true)}
            >
              转换并下载
            </button>
          </div>
        </>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        转换过程完全在你的浏览器里完成，图片不上传、不留痕。WebP 在同等画质下通常比 JPEG
        小 25%-35%，是目前网页图片的首选格式。
      </p>
    </div>
  );
}
