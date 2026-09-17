import { useState } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';
import { canvasToBlob, canvasToDataUrl, downloadBlob, extOfMime, formatBytes, type ImageMime } from '@/tools/_shared/image-utils';

const PRESETS = [
  { label: '1600×900 横版', w: 1600, h: 900 },
  { label: '1080×1080 方图', w: 1080, h: 1080 },
  { label: '1080×1920 竖版', w: 1080, h: 1920 },
  { label: '800×600 4:3', w: 800, h: 600 },
  { label: '750×420 卡片', w: 750, h: 420 },
];

/** 由背景色明暗决定文字色，保证对比度 */
function readableOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '#ffffff';
  const v = m[1];
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#1f2937' : '#ffffff';
}

export default function PlaceholderImageTool() {
  const [width, setWidth] = useState(1600);
  const [height, setHeight] = useState(900);
  const [bg1, setBg1] = useState('#6b7280');
  const [bg2, setBg2] = useState('#9ca3af');
  const [text, setText] = useState('1600 × 900');
  const [showSize, setShowSize] = useState(true);
  const [format, setFormat] = useState<ImageMime>('image/png');
  const [preview, setPreview] = useState('');
  const [bytes, setBytes] = useState(0);
  const [copied, setCopied] = useState(false);

  const draw = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, bg1);
    grad.addColorStop(1, bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 画个对角叉，一眼能看出是占位图
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = Math.max(1, Math.min(canvas.width, canvas.height) / 200);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();

    const label = showSize ? `${canvas.width} × ${canvas.height}` : text;
    if (label) {
      const fontPx = Math.max(12, Math.round(Math.min(canvas.width, canvas.height) / 8));
      ctx.fillStyle = readableOn(bg1);
      ctx.font = `600 ${fontPx}px system-ui, -apple-system, "PingFang SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, canvas.width / 2, canvas.height / 2);
    }
    return canvas;
  };

  const make = async (download: boolean) => {
    const canvas = draw();
    setPreview(canvasToDataUrl(canvas, format, 0.92));
    const blob = await canvasToBlob(canvas, format, 0.92);
    setBytes(blob.size);
    if (download) downloadBlob(blob, `placeholder-${canvas.width}x${canvas.height}.${extOfMime(format)}`);
  };

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            type="button"
            key={p.label}
            class="btn btn-xs btn-outline"
            onClick={() => {
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
            max="8000"
            class="input input-bordered mt-1.5 w-full"
            value={width}
            onInput={(e) => setWidth(Math.max(1, Number((e.target as HTMLInputElement).value) || 1))}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">高度（px）</span>
          <input
            type="number"
            min="1"
            max="8000"
            class="input input-bordered mt-1.5 w-full"
            value={height}
            onInput={(e) => setHeight(Math.max(1, Number((e.target as HTMLInputElement).value) || 1))}
          />
        </label>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">渐变起始色</span>
          <input
            type="color"
            class="mt-1.5 h-10 w-full rounded-lg border border-base-300 bg-base-100"
            value={bg1}
            onInput={(e) => setBg1((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">渐变结束色</span>
          <input
            type="color"
            class="mt-1.5 h-10 w-full rounded-lg border border-base-300 bg-base-100"
            value={bg2}
            onInput={(e) => setBg2((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <label class="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          class="checkbox checkbox-sm"
          checked={showSize}
          onChange={(e) => setShowSize((e.target as HTMLInputElement).checked)}
        />
        图上标注尺寸
      </label>

      {!showSize && (
        <label class="block">
          <span class="text-sm font-medium">自定义文字</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-full"
            value={text}
            placeholder="例如：图片加载失败"
            onInput={(e) => setText((e.target as HTMLInputElement).value)}
          />
        </label>
      )}

      <div class="flex flex-wrap items-center gap-2">
        <select
          class="select select-bordered select-sm w-auto"
          value={format}
          onChange={(e) => setFormat((e.target as HTMLSelectElement).value as ImageMime)}
        >
          <option value="image/png">PNG</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/webp">WebP</option>
        </select>
        <button type="button" class="btn btn-ghost btn-sm" onClick={() => make(false)}>
          生成预览
        </button>
        <button type="button" class="btn btn-primary btn-sm" onClick={() => make(true)}>
          下载占位图
        </button>
      </div>

      {preview && (
        <figure class="space-y-2 rounded-xl border border-base-300 bg-base-200/50 p-3">
          <img src={preview} alt="占位图预览" class="mx-auto max-h-72 rounded-lg object-contain" />
          <figcaption class="text-center text-xs opacity-60">
            {width}×{height} · {formatBytes(bytes)}
          </figcaption>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-ghost'}`}
            onClick={async () => {
              await copyText(preview);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? '已复制 data URL' : '复制 data URL'}
          </button>
        </figure>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        占位图用于页面骨架屏、设计稿排版与图片加载失败的兜底显示，纯本地生成，不需要联网找素材。
        文字颜色会按背景明暗自动切换黑白，保证看得清。
      </p>
    </div>
  );
}
