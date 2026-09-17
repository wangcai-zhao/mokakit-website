import { useState } from 'preact/hooks';
import ImageDropzone from '@/tools/_shared/ImageDropzone';
import { useImageSource } from '@/tools/_shared/use-image';
import { drawToCanvas, formatBytes } from '@/tools/_shared/image-utils';

interface Swatch {
  hex: string;
  ratio: number;
}

/** 抽样统计主色：把画面缩到 40×40 后按出现次数排序 */
function dominantColors(img: HTMLImageElement, count = 6): Swatch[] {
  const canvas = drawToCanvas(img, 40, 40);
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, 40, 40).data;
  } catch {
    return [];
  }
  const bucket = new Map<string, number>();
  for (let i = 0; i < data.length; i += 4) {
    // 量化到 32 级，避免相近色各占一个坑位
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const hex = `#${[r, g, b].map((v) => Math.min(255, v).toString(16).padStart(2, '0')).join('')}`;
    bucket.set(hex, (bucket.get(hex) ?? 0) + 1);
  }
  const total = 40 * 40;
  return [...bucket.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([hex, n]) => ({ hex, ratio: n / total }));
}

export default function ImageInfoTool() {
  const { file, img, error, pick, clear } = useImageSource();
  const [colors, setColors] = useState<Swatch[]>([]);

  const onPick = (f: File | null) => {
    pick(f);
    setColors([]);
  };

  const mpx = img ? (img.naturalWidth * img.naturalHeight) / 1_000_000 : 0;
  const ratio = img ? (img.naturalWidth / img.naturalHeight).toFixed(3) : '';
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const ratioText = (() => {
    if (!img) return '';
    const g = gcd(img.naturalWidth, img.naturalHeight);
    return `${img.naturalWidth / g}:${img.naturalHeight / g}`;
  })();

  return (
    <div class="space-y-4">
      {error && <p class="text-sm text-error">{error}</p>}
      <ImageDropzone onPick={onPick} hasImage={Boolean(img)} />

      {img && file && (
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-200 px-4 py-3 text-sm">
          <span class="truncate">{file.name}</span>
          <div class="join">
            <button
              type="button"
              class="btn btn-xs join-item btn-ghost"
              onClick={() => setColors(dominantColors(img))}
            >
              提取主色
            </button>
            <button type="button" class="btn btn-xs join-item btn-ghost" onClick={clear}>
              移除
            </button>
          </div>
        </div>
      )}

      {img && file && (
        <div class="grid gap-3 sm:grid-cols-2">
          {[
            { k: '文件格式', v: file.type || '未知' },
            { k: '文件大小', v: formatBytes(file.size) },
            { k: '像素尺寸', v: `${img.naturalWidth} × ${img.naturalHeight}` },
            { k: '宽高比', v: `${ratioText}（${ratio}）` },
            { k: '像素总量', v: `${mpx.toFixed(2)} MP` },
            {
              k: '最后修改',
              v: file.lastModified
                ? new Date(file.lastModified).toLocaleString('zh-CN')
                : '未知',
            },
          ].map((row) => (
            <div
              class="flex items-baseline justify-between gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3"
              key={row.k}
            >
              <span class="text-sm opacity-60">{row.k}</span>
              <span class="font-mono text-sm font-medium">{row.v}</span>
            </div>
          ))}
        </div>
      )}

      {img && (
        <figure class="rounded-xl border border-base-300 bg-base-200/50 p-3">
          <img
            src={img.src}
            alt="图片预览"
            class="mx-auto max-h-64 rounded-lg object-contain"
          />
        </figure>
      )}

      {colors.length > 0 && (
        <div>
          <span class="text-sm font-medium">主色提取（抽样统计，仅供参考）</span>
          <div class="mt-2 flex flex-wrap gap-3">
            {colors.map((c) => (
              <span class="flex flex-col items-center gap-1" key={c.hex}>
                <span
                  class="h-12 w-12 rounded-lg border border-base-300"
                  style={`background:${c.hex}`}
                />
                <span class="font-mono text-xs opacity-70">{c.hex}</span>
                <span class="text-xs opacity-50">{Math.round(c.ratio * 100)}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        所有信息都从浏览器本地读取，图片不会上传。主色统计把画面缩到 40×40
        后量化取样，适合快速找配色，不适合做精确的色彩分析。
      </p>
    </div>
  );
}
