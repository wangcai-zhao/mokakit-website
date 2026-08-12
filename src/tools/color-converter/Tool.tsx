import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type RGB = [number, number, number];

function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();
  // HEX: #fff / #ffffff
  const hex = s.replace(/^#/, '');
  if (/^[0-9a-f]{3}$/.test(hex)) {
    return [0, 2, 4].map((i) => parseInt(hex[i] + hex[i], 16)) as RGB;
  }
  if (/^[0-9a-f]{6}$/.test(hex)) {
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
  }
  // rgb(255, 140, 0)
  const m = s.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])] as RGB;
  // hsl(30, 100%, 50%)
  const h = s.match(/hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?/);
  if (h) return hslToRgb(Number(h[1]), Number(h[2]), Number(h[3]));
  return null;
}

function rgbToHex([r, g, b]: RGB): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function rgbToHsl([r, g, b]: RGB): string {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function hslToRgb(hh: number, ss: number, ll: number): RGB {
  hh /= 360; ss /= 100; ll /= 100;
  let r: number, g: number, b: number;
  if (ss === 0) {
    r = g = b = ll;
  } else {
    const hue = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    r = hue(p, q, hh + 1 / 3);
    g = hue(p, q, hh);
    b = hue(p, q, hh - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)] as RGB;
}

export default function ColorConverter() {
  const [input, setInput] = useState('#ff8c00');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const rgb = useMemo(() => parseColor(input), [input]);
  const hex = rgb ? rgbToHex(rgb) : '';
  const hsl = rgb ? rgbToHsl(rgb) : '';
  const rgbStr = rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : '';

  const copy = async (text: string, key: string) => {
    if (!text) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <input
          type="color"
          class="w-12 h-12 rounded-lg border border-base-300 bg-transparent cursor-pointer"
          aria-label="颜色选择器"
          value={hex || '#000000'}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
        />
        <input
          type="text"
          class="input input-bordered flex-1 font-mono"
          aria-label="颜色值（HEX / RGB / HSL）"
          placeholder="输入 #ff8c00 / rgb(255,140,0) / hsl(30,100%,50%)"
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
        />
      </div>

      {rgb ? (
        <div class="flex items-center gap-4">
          <div
            class="w-16 h-16 rounded-xl border border-base-300 shrink-0"
            style={`background:${hex}`}
          />
          <div class="grid gap-2 flex-1">
            {[
              { label: 'HEX', value: hex },
              { label: 'RGB', value: rgbStr },
              { label: 'HSL', value: hsl },
            ].map((it) => (
              <div class="flex items-center justify-between rounded-lg bg-base-200 px-3 py-2">
                <code class="font-mono text-sm">{it.value}</code>
                <button
                  type="button"
                  class={`btn btn-xs ${copied === it.label ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => copy(it.value, it.label)}
                >
                  {copied === it.label ? '已复制' : '复制'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p class="text-sm text-error">无法识别的颜色格式，请检查输入。</p>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        支持 HEX / RGB / HSL 自动识别互转，色块预览，全部本地计算。
      </p>
    </div>
  );
}
