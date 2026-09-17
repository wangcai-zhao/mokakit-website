import { useState } from 'preact/hooks';
import { loadImageFromFile } from './image-utils';

/**
 * 图片工具通用的「选图」状态。
 * 各工具都需要：记住原始 File（导出文件名要用）、解码后的 <img>（画 canvas 要用）、
 * 以及出错提示。抽成 hook，省掉 10 个工具各写一遍。
 */
export interface ImageSource {
  file: File | null;
  img: HTMLImageElement | null;
  error: string;
  /** 原始文件名（不含扩展名） */
  baseName: string;
  pick: (f: File | null) => void;
  clear: () => void;
}

export function useImageSource(): ImageSource {
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState('');

  const pick = (f: File | null) => {
    setError('');
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('请选择图片文件（PNG / JPEG / WebP / GIF 等）');
      return;
    }
    loadImageFromFile(f)
      .then((el) => {
        setFile(f);
        setImg(el);
      })
      .catch(() => setError('图片读取失败，可能是文件损坏或格式不支持'));
  };

  const clear = () => {
    setFile(null);
    setImg(null);
    setError('');
  };

  return {
    file,
    img,
    error,
    baseName: file ? file.name.replace(/\.[^.]+$/, '') || 'image' : 'image',
    pick,
    clear,
  };
}
