import { useState } from 'preact/hooks';
import ImageDropzone from '@/tools/_shared/ImageDropzone';
import { useImageSource } from '@/tools/_shared/use-image';
import {
  drawToCanvas,
  canvasToBlob,
  canvasToDataUrl,
  downloadBlob,
  extOfMime,
  type ImageMime,
} from '@/tools/_shared/image-utils';

const POSITIONS: { key: string; label: string; x: number; y: number }[] = [
  { key: 'tl', label: '左上', x: 0.03, y: 0.06 },
  { key: 'tc', label: '上中', x: 0.5, y: 0.06 },
  { key: 'tr', label: '右上', x: 0.97, y: 0.06 },
  { key: 'cl', label: '左中', x: 0.03, y: 0.5 },
  { key: 'cc', label: '正中', x: 0.5, y: 0.5 },
  { key: 'cr', label: '右中', x: 0.97, y: 0.5 },
  { key: 'bl', label: '左下', x: 0.03, y: 0.95 },
  { key: 'bc', label: '下中', x: 0.5, y: 0.95 },
  { key: 'br', label: '右下', x: 0.97, y: 0.95 },
];

export default function ImageWatermarkTool() {
  const { img, error, baseName, pick, clear } = useImageSource();
  const [text, setText] = useState('仅供本人使用');
  const [size, setSize] = useState(24);
  const [opacity, setOpacity] = useState(0.45);
  const [color, setColor] = useState('#ffffff');
  const [pos, setPos] = useState('br');
  const [tiled, setTiled] = useState(false);
  const [preview, setPreview] = useState('');
  const [format, setFormat] = useState<ImageMime>('image/png');

  const render = (): HTMLCanvasElement | null => {
    if (!img) return null;
    const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const base = Math.min(canvas.width, canvas.height);
    const fontPx = Math.max(12, Math.round((base * size) / 500));
    ctx.font = `600 ${fontPx}px system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = Math.max(2, fontPx / 6);

    if (tiled) {
      const stepX = ctx.measureText(text).width + fontPx * 2;
      const stepY = fontPx * 3;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((-25 * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      const span = canvas.width + canvas.height;
      for (let y = -span; y < span * 2; y += stepY) {
        for (let x = -span; x < span * 2; x += stepX) {
          ctx.fillText(text, x, y);
        }
      }
      ctx.restore();
    } else {
      const p = POSITIONS.find((q) => q.key === pos) ?? POSITIONS[8];
      ctx.textAlign = p.x < 0.1 ? 'left' : p.x > 0.9 ? 'right' : 'center';
      ctx.textBaseline = p.y < 0.1 ? 'top' : p.y > 0.9 ? 'bottom' : 'middle';
      ctx.fillText(text, canvas.width * p.x, canvas.height * p.y);
    }
    ctx.globalAlpha = 1;
    return canvas;
  };

  const makePreview = () => {
    const canvas = render();
    if (canvas) setPreview(canvasToDataUrl(canvas, 'image/png'));
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

      <label class="block">
        <span class="text-sm font-medium">水印文字</span>
        <input
          type="text"
          class="input input-bordered mt-1.5 w-full"
          value={text}
          placeholder="例如：公司名称 / 仅供本人使用"
          onInput={(e) => setText((e.target as HTMLInputElement).value)}
        />
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="flex items-center justify-between text-sm font-medium">
            <span>字号</span>
            <span class="opacity-60">{size}</span>
          </span>
          <input
            type="range"
            min="10"
            max="80"
            class="range range-primary mt-2 w-full"
            value={size}
            onInput={(e) => setSize(Number((e.target as HTMLInputElement).value))}
          />
        </label>
        <label class="block">
          <span class="flex items-center justify-between text-sm font-medium">
            <span>不透明度</span>
            <span class="opacity-60">{Math.round(opacity * 100)}%</span>
          </span>
          <input
            type="range"
            min="10"
            max="100"
            class="range range-primary mt-2 w-full"
            value={Math.round(opacity * 100)}
            onInput={(e) => setOpacity(Number((e.target as HTMLInputElement).value) / 100)}
          />
        </label>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <label class="flex items-center gap-2 text-sm">
          <span class="font-medium">颜色</span>
          <input
            type="color"
            class="h-9 w-14 rounded-lg border border-base-300 bg-base-100"
            value={color}
            onInput={(e) => setColor((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={tiled}
            onChange={(e) => setTiled((e.target as HTMLInputElement).checked)}
          />
          满屏平铺（防截图外传）
        </label>
      </div>

      {!tiled && (
        <div>
          <span class="text-sm font-medium">水印位置</span>
          <div class="mt-2 grid grid-cols-3 gap-2 sm:max-w-xs">
            {POSITIONS.map((p) => (
              <button
                type="button"
                key={p.key}
                class={`btn btn-sm ${pos === p.key ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPos(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {img && (
        <>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn btn-ghost btn-sm" onClick={makePreview}>
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
              disabled={!text.trim()}
              onClick={async () => {
                const canvas = render();
                if (!canvas) return;
                const blob = await canvasToBlob(canvas, format, 0.92);
                downloadBlob(blob, `${baseName}-watermarked.${extOfMime(format)}`);
              }}
            >
              下载加水印图片
            </button>
          </div>

          {preview && (
            <figure class="rounded-xl border border-base-300 bg-base-200/50 p-3">
              <img src={preview} alt="水印预览" class="mx-auto max-h-72 rounded-lg object-contain" />
            </figure>
          )}
        </>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        水印在本地 canvas 上绘制，原图不会被上传。需要防止截图外传时勾选「满屏平铺」，
        密集斜向水印比单个角标更难被裁掉。注意：任何可见水印都挡不住专业去水印工具，
        涉密材料请走权限管控而不是靠水印。
      </p>
    </div>
  );
}
