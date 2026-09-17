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

const RATIOS: { key: string; label: string; w: number; h: number }[] = [
  { key: 'free', label: '原图比例', w: 0, h: 0 },
  { key: '1-1', label: '1:1 方图', w: 1, h: 1 },
  { key: '4-3', label: '4:3', w: 4, h: 3 },
  { key: '3-2', label: '3:2', w: 3, h: 2 },
  { key: '16-9', label: '16:9', w: 16, h: 9 },
  { key: '9-16', label: '9:16 竖版', w: 9, h: 16 },
  { key: '3-4', label: '3:4 竖版', w: 3, h: 4 },
];

const ANCHORS = ['左上', '上中', '右上', '左中', '正中', '右中', '左下', '下中', '右下'];

export default function ImageCropTool() {
  const { img, error, baseName, pick, clear } = useImageSource();
  const [ratio, setRatio] = useState('1-1');
  const [anchor, setAnchor] = useState('正中');
  const [preview, setPreview] = useState('');
  const [box, setBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [format, setFormat] = useState<ImageMime>('image/png');

  /** 按目标比例在原图上取一个尽可能大的矩形，再按锚点定位 */
  const cropRect = () => {
    if (!img) return null;
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const r = RATIOS.find((x) => x.key === ratio);
    if (!r || !r.w) return { x: 0, y: 0, w: W, h: H };

    const target = r.w / r.h;
    let cw = W;
    let ch = Math.round(W / target);
    if (ch > H) {
      ch = H;
      cw = Math.round(H * target);
    }
    const idx = ANCHORS.indexOf(anchor);
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = col === 0 ? 0 : col === 1 ? Math.round((W - cw) / 2) : W - cw;
    const y = row === 0 ? 0 : row === 1 ? Math.round((H - ch) / 2) : H - ch;
    return { x, y, w: cw, h: ch };
  };

  const makePreview = () => {
    if (!img) return;
    const rect = cropRect();
    if (!rect) return;
    const canvas = document.createElement('canvas');
    canvas.width = rect.w;
    canvas.height = rect.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
    setBox(rect);
    setPreview(canvasToDataUrl(canvas, 'image/png'));
  };

  return (
    <div class="space-y-4">
      {error && <p class="text-sm text-error">{error}</p>}
      <ImageDropzone onPick={pick} hasImage={Boolean(img)} />

      {img && (
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 px-4 py-3 text-sm">
          <span>
            原图 {img.naturalWidth}×{img.naturalHeight}
          </span>
          <button type="button" class="btn btn-xs btn-ghost" onClick={clear}>
            移除
          </button>
        </div>
      )}

      <div>
        <span class="text-sm font-medium">裁剪比例</span>
        <div class="mt-2 flex flex-wrap gap-2">
          {RATIOS.map((r) => (
            <button
              type="button"
              key={r.key}
              class={`btn btn-sm ${ratio === r.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setRatio(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span class="text-sm font-medium">裁剪位置</span>
        <div class="mt-2 grid grid-cols-3 gap-2 sm:max-w-xs">
          {ANCHORS.map((a) => (
            <button
              type="button"
              key={a}
              class={`btn btn-sm ${anchor === a ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setAnchor(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

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
              disabled={!preview}
              onClick={async () => {
                if (!img) return;
                const canvas = drawToCanvas(img, box.w, box.h);
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.clearRect(0, 0, box.w, box.h);
                  ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
                }
                const blob = await canvasToBlob(canvas, format, 0.92);
                downloadBlob(blob, `${baseName}-cropped.${extOfMime(format)}`);
              }}
            >
              下载裁剪结果
            </button>
          </div>

          {preview && (
            <>
              <p class="text-sm">
                裁剪区域：<strong class="text-primary">{box.w}×{box.h}</strong>
                <span class="opacity-60">（起点 {box.x}, {box.y}）</span>
              </p>
              <figure class="rounded-xl border border-base-300 bg-base-200/50 p-3">
                <img src={preview} alt="裁剪预览" class="mx-auto max-h-72 rounded-lg object-contain" />
              </figure>
            </>
          )}
        </>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        裁剪会按目标比例在原图上取一个尽可能大的矩形，再按你选的位置对齐。
        比例固定时不会拉伸变形，只取舍掉哪一部分。全部在本地完成，原图不出浏览器。
      </p>
    </div>
  );
}
