import { useState } from 'preact/hooks';

const SIZES: { id: string; name: string; w: number; h: number }[] = [
  { id: 'A0', name: 'A0', w: 841, h: 1189 },
  { id: 'A1', name: 'A1', w: 594, h: 841 },
  { id: 'A2', name: 'A2', w: 420, h: 594 },
  { id: 'A3', name: 'A3', w: 297, h: 420 },
  { id: 'A4', name: 'A4', w: 210, h: 297 },
  { id: 'A5', name: 'A5', w: 148, h: 210 },
  { id: 'A6', name: 'A6', w: 105, h: 148 },
  { id: 'A7', name: 'A7', w: 74, h: 105 },
  { id: 'A8', name: 'A8', w: 52, h: 74 },
  { id: 'B4', name: 'B4', w: 250, h: 353 },
  { id: 'B5', name: 'B5', w: 176, h: 250 },
  { id: 'B6', name: 'B6', w: 125, h: 176 },
  { id: 'C4', name: 'C4（信封）', w: 229, h: 324 },
  { id: 'C5', name: 'C5（信封）', w: 162, h: 229 },
  { id: 'C6', name: 'C6（信封）', w: 114, h: 162 },
  { id: 'Letter', name: 'Letter', w: 215.9, h: 279.4 },
  { id: 'Legal', name: 'Legal', w: 215.9, h: 355.6 },
  { id: 'Tabloid', name: 'Tabloid', w: 279.4, h: 431.8 },
];

export default function PaperSizeConvert() {
  const [id, setId] = useState('A4');
  const sel = SIZES.find((s) => s.id === id) ?? SIZES[4];
  const toIn = (n: number) => Number((n / 25.4).toFixed(2));
  const toCm = (n: number) => Number((n / 10).toFixed(2));

  return (
    <div class="space-y-5">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <label class="block">
          <span class="text-sm font-medium">选择纸张规格</span>
          <select
            class="select select-bordered select-sm mt-1.5 w-full"
            value={id}
            onChange={(e) => setId((e.target as HTMLSelectElement).value)}
          >
            {SIZES.map((s) => (
              <option value={s.id}>
                {s.name}（{s.w}×{s.h} mm）
              </option>
            ))}
          </select>
        </label>
        <div class="mt-4 grid grid-cols-1 gap-2">
          <div class="flex items-center gap-2 rounded-lg bg-base-100 px-3 py-2">
            <span class="w-20 shrink-0 text-sm opacity-60">毫米</span>
            <code class="flex-1 font-mono text-lg font-semibold">
              {sel.w} × {sel.h} mm
            </code>
          </div>
          <div class="flex items-center gap-2 rounded-lg bg-base-100 px-3 py-2">
            <span class="w-20 shrink-0 text-sm opacity-60">厘米</span>
            <code class="flex-1 font-mono text-lg font-semibold">
              {toCm(sel.w)} × {toCm(sel.h)} cm
            </code>
          </div>
          <div class="flex items-center gap-2 rounded-lg bg-base-100 px-3 py-2">
            <span class="w-20 shrink-0 text-sm opacity-60">英寸</span>
            <code class="flex-1 font-mono text-lg font-semibold">
              {toIn(sel.w)} × {toIn(sel.h)} in
            </code>
          </div>
        </div>
        <p class="mt-3 text-xs opacity-55 leading-relaxed">
          ISO A/B/C 系列长宽为 √2 比例，每张对半得下一号（A4 对半 = A5）。Letter/Legal 为北美标准，比 A4
          略宽略短。全部计算均在浏览器本地完成，不会上传任何数据。
        </p>
      </div>
    </div>
  );
}
