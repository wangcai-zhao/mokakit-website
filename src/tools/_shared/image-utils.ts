/**
 * 图片工具共享层。
 *
 * 站上 10 个图片工具都是「选文件 → 画到 canvas → 导出」这套流程，
 * 把文件读取、等比缩放、导出下载、体积格式化抽到一处，
 * 单个工具只关心自己的那一步像素运算。
 *
 * 全部在浏览器本地完成，不上传服务器，这是本站图片类工具的卖点。
 */

/** 人类可读的文件体积 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n < 10 && i > 0 ? n.toFixed(2) : n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** 从 File 读成 <img>，用完记得 revokeObjectURL（本函数已在 onload 里释放） */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片读取失败，请换一张试试'));
    };
    img.src = url;
  });
}

/** 从 data URL / 远程地址读成 <img> */
export function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片读取失败'));
    img.src = src;
  });
}

/** 按目标宽高算出等比后的尺寸（都不传则原尺寸） */
export function fitSize(
  w: number,
  h: number,
  targetW?: number,
  targetH?: number,
  keepRatio = true,
): { width: number; height: number } {
  const width = targetW && targetW > 0 ? Math.round(targetW) : w;
  const height = targetH && targetH > 0 ? Math.round(targetH) : h;
  if (!keepRatio) return { width, height };
  // 只填了一项时按原比例补另一项
  if (!targetH || targetH <= 0) {
    return { width, height: Math.max(1, Math.round((h * width) / w)) };
  }
  if (!targetW || targetW <= 0) {
    return { height, width: Math.max(1, Math.round((w * height) / h)) };
  }
  return { width, height };
}

/** 建一块 canvas 并把图片画上去 */
export function drawToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  background?: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持 canvas');
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export type ImageMime = 'image/png' | 'image/jpeg' | 'image/webp';

/** canvas 导出成 Blob。PNG 不支持 quality，会自动忽略 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: ImageMime = 'image/png',
  quality = 0.92,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('图片导出失败'))),
      type,
      type === 'image/png' ? undefined : quality,
    );
  });
}

/** canvas 导出成 data URL，用于预览与 Base64 */
export function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  type: ImageMime = 'image/png',
  quality = 0.92,
): string {
  return canvas.toDataURL(type, type === 'image/png' ? undefined : quality);
}

/** 触发浏览器下载 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 由 MIME 推出文件扩展名 */
export function extOfMime(mime: ImageMime): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

/** 去掉原文件名扩展名，方便拼新名字 */
export function baseNameOf(name: string): string {
  return name.replace(/\.[^.]+$/, '') || 'image';
}
