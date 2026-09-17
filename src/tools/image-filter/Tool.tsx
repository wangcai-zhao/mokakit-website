import { useState } from 'preact/hooks';
import ImageDropzone from '@/tools/_shared/ImageDropzone';
import { useImageSource } from '@/tools/_shared/use-image';
import {
  canvasToBlob,
  canvasToDataUrl,
  downloadBlob,
  extOfMime,
  type ImageMime,
} from '@/tools/_shared/image-utils';

type Preset = 'none' | 'grayscale' | 'invert' | 'sepia' | 'vivid' | 'cool';

const PRESETS: { key: Preset; label: string; css: string }[] = [
  { key: 'none', label: '原图', css: 'none' },
  { key: 'grayscale', label: '黑白', css: 'grayscale(100%)' },
  { key: 'invert', label: '反色', css: 'invert(100%)' },
  { key: 'sepia', label: '复古', css: 'sepia(70%)' },
  { key: 'vivid', label: '鲜艳', css: 'saturate(160%) contrast(112%)' },
  { key: 'cool', label: '冷调', css: 'hue-rotate(200deg) saturate(115%)' },
];

export default function ImageFilterTool() {
  const { img, error, baseName, pick, clear } = useImageSource();
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [blur, setBlur] = useState(0);
  const [preset, setPreset] = useState<Preset>('none');
  const [preview, setPreview] = useState('');
  const [format, setFormat] = useState<ImageMime>('image/png');

  const cssFilter = () => {
    const parts = [
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturate}%)`,
    ];
    if (blur > 0) parts.push(`blur(${blur}px)`);
    const p = PRESETS.find((x) => x.key === preset);
    if (p && p.css !== 'none') parts.unshift(p.css);
    return parts.join(' ');
  };

  /** ctx.filter 必须在 drawImage 之前设置，并在此后复位，否则会污染后续绘制 */
  const safeRender = () => {
    if (!img) return null;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.filter = cssFilter();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
    return canvas;
  };

  return (
    <div class="space-y-4">
      {error && <p class="text-sm text-error">{error}</p>}
      <ImageDropzone onPick={pick} hasImage={Boolean(img)} />

      {img && (
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 px-4 py-3 text-sm">
          <span>
            {img.naturalWidth}×{img.naturalHeight}
          </span>
          <button type="button" class="btn btn-xs btn-ghost" onClick={clear}>
            移除
          </button>
        </div>
      )}

      <div>
        <span class="text-sm font-medium">预设效果</span>
        <div class="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.key}
              class={`btn btn-sm ${preset === p.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        {[
          { label: '亮度', value: brightness, set: setBrightness, min: 20, max: 200, unit: '%' },
          { label: '对比度', value: contrast, set: setContrast, min: 20, max: 200, unit: '%' },
          { label: '饱和度', value: saturate, set: setSaturate, min: 0, max: 250, unit: '%' },
          { label: '模糊', value: blur, set: setBlur, min: 0, max: 20, unit: 'px' },
        ].map((s) => (
          <label class="block" key={s.label}>
            <span class="flex items-center justify-between text-sm font-medium">
              <span>{s.label}</span>
              <span class="opacity-60">
                {s.value}
                {s.unit}
              </span>
            </span>
            <input
              type="range"
              min={s.min}
              max={s.max}
              class="range range-primary mt-2 w-full"
              value={s.value}
              onInput={(e) => s.set(Number((e.target as HTMLInputElement).value))}
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        class="btn btn-ghost btn-sm"
        onClick={() => {
          setBrightness(100);
          setContrast(100);
          setSaturate(100);
          setBlur(0);
          setPreset('none');
        }}
      >
        全部复位
      </button>

      {img && (
        <>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              onClick={() => {
                const c = safeRender();
                if (c) setPreview(canvasToDataUrl(c, 'image/png'));
              }}
            >
              生成预览
            </button>
            <select
              class="select select-bordered select-sm w-auto"
              value={format}
              onChange={(e) => setFormat((e.target as HTMLSelectElement).value as ImageMime)}
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              disabled={!preview}
              onClick={async () => {
                const c = safeRender();
                if (!c) return;
                const blob = await canvasToBlob(c, format, 0.92);
                downloadBlob(blob, `${baseName}-filtered.${extOfMime(format)}`);
              }}
            >
              下载处理后的图片
            </button>
          </div>

          {preview && (
            <figure class="rounded-xl border border-base-300 bg-base-200/50 p-3">
              <img src={preview} alt="滤镜预览" class="mx-auto max-h-72 rounded-lg object-contain" />
            </figure>
          )}
        </>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        滤镜走浏览器原生的 canvas filter，所见即所得，不上传原图。模糊单位是像素，
        数值越大越糊；做马赛克遮挡时建议模糊 8-12px 起。导出为 JPEG 会丢掉透明通道。
      </p>
    </div>
  );
}
