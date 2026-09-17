import { useRef, useState } from 'preact/hooks';

/**
 * 图片选择区：点击选择 + 拖拽放入，移动端是标准的文件选择按钮。
 * 全站图片工具统一用它，保证交互与文案一致。
 */
export default function ImageDropzone({
  onPick,
  hasImage,
  hint = '点击选择图片，或把图片拖进来',
}: {
  onPick: (f: File | null) => void;
  hasImage: boolean;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      class={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition cursor-pointer ${
        over ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-200/50'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = (e as DragEvent).dataTransfer?.files?.[0] ?? null;
        onPick(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        class="hidden"
        onChange={(e) => {
          const el = e.target as HTMLInputElement;
          onPick(el.files?.[0] ?? null);
          el.value = '';
        }}
      />
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        class="opacity-50"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
      </svg>
      <p class="text-sm font-medium">{hasImage ? '换一张图片' : hint}</p>
      <p class="text-xs opacity-55">图片只在你的浏览器里处理，不会上传到服务器</p>
    </div>
  );
}
