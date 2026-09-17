import { useState } from 'preact/hooks';
import ImageDropzone from '@/tools/_shared/ImageDropzone';
import { useImageSource } from '@/tools/_shared/use-image';
import {
  formatBytes,
  fitSize,
  drawToCanvas,
  canvasToBlob,
  downloadBlob,
  extOfMime,
  type ImageMime,
} from '@/tools/_shared/image-utils';

const PRESETS: { label: string; w: number; h: number }[] = [
  { label: '头像 256×256', w: 256, h: 256 },
  { label: '小红书 1080×1440', w: 1080, h: 1440 },
  { label: '公众号封面 900×383', w: 900, h: 383 },
  { label: '手机壁纸 1080×1920', w: 1080, h: 1920 },
  { label: '电脑壁纸 1920×1080', w: 1920, h: 1080 },
  { label: '电商主图 800×800', w: 800, h: 800 },
];

export default function ImageResizeTool() {
  const { file, img, error, baseName, pick, clear } = useImageSource();
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);
  const [percent, setPercent] = useState(100);
  const [format, setFormat] = useState<ImageMime>('image/png');

  const syncFromImage = () => {
    if (!img) return;
    setWidth(img.naturalWidth);
    setHeight(img.naturalHeight);
    setPercent(100);
  };

  const setByPercent = (p: number) => {
    setPercent(p);
    if (!img) return;
    setWidth(Math.max(1, Math.round((img.naturalWidth * p) / 100)));
    setHeight(Math.max(1, Math.round((img.naturalHeight * p) / 100)));
  };

  const target = img ? fitSize(img.naturalWidth, img.naturalHeight, width, height, keepRatio) : null;
  const changedPercent =
    img && target ? Math.round((target.width / img.naturalWidth) * 100) : 0;

  return (
    <div class="space-y-4">
      {error && <p class="text-sm text-error">{error}</p>}
      <ImageDropzone onPick={pick} hasImage={Boolean(img)} />

      {img && (
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 px-4 py-3 text-sm">
          <span>
            原图 {img.naturalWidth}×{img.naturalHeight} · {formatBytes(file?.size ?? 0)}
          </span>
          <div class="join">
            <button type="button" class="btn btn-xs join-item btn-ghost" onClick={syncFromImage}>
              还原原尺寸
            </button>
            <button type="button" class="btn btn-xs join-item btn-ghost" onClick={clear}>
              移除
            </button>
          </div>
        </div>
      )}

      {img && (
        <>
          <div class="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p.label}
                class="btn btn-xs btn-outline"
                onClick={() => {
                  setKeepRatio(false);
                  setWidth(p.w);
                  setHeight(p.h);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-medium">宽度（px）</span>
              <input
                type="number"
                min="1"
                class="input input-bordered mt-1.5 w-full"
                value={width}
                onInput={(e) => setWidth(Number((e.target as HTMLInputElement).value) || 0)}
              />
            </label>
            <label class="block">
              <span class="text-sm font-medium">高度（px）</span>
              <input
                type="number"
                min="1"
                class="input input-bordered mt-1.5 w-full"
                value={height}
                onInput={(e) => setHeight(Number((e.target as HTMLInputElement).value) || 0)}
              />
            </label>
          </div>

          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={keepRatio}
              onChange={(e) => setKeepRatio((e.target as HTMLInputElement).checked)}
            />
            锁定原图比例（只填一边时自动算另一边；两边都填则按填写值）
          </label>

          <label class="block">
            <span class="flex items-center justify-between text-sm font-medium">
              <span>按百分比缩放</span>
              <span class="opacity-60">{percent}%</span>
            </span>
            <input
              type="range"
              min="10"
              max="300"
              class="range range-primary mt-2 w-full"
              value={percent}
              onInput={(e) => setByPercent(Number((e.target as HTMLInputElement).value))}
            />
          </label>

          {target && (
            <p class="text-sm">
              输出尺寸：<strong class="text-primary">{target.width}×{target.height}</strong>
              <span class="opacity-60">（约为原图的 {changedPercent}%）</span>
            </p>
          )}

          <label class="block">
            <span class="text-sm font-medium">导出格式</span>
            <select
              class="select select-bordered mt-1.5 w-full"
              value={format}
              onChange={(e) => setFormat((e.target as HTMLSelectElement).value as ImageMime)}
            >
              <option value="image/png">PNG（保留透明）</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </label>

          <button
            type="button"
            class="btn btn-primary w-full sm:w-auto"
            disabled={!target}
            onClick={async () => {
              if (!img || !target) return;
              const canvas = drawToCanvas(img, target.width, target.height);
              const blob = await canvasToBlob(canvas, format, 0.92);
              downloadBlob(blob, `${baseName}-${target.width}x${target.height}.${extOfMime(format)}`);
            }}
          >
            下载调整后的图片
          </button>
        </>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        放大图片不会凭空变清晰，只会用插值把像素铺开；需要高清大图建议找原图重新导出。
        缩小后再导出为 PNG 是无损的，但文件通常比 JPEG / WebP 大不少。
      </p>
    </div>
  );
}
