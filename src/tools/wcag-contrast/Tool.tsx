import { useState, useMemo } from 'preact/hooks';

function parseColor(c: string): [number, number, number] | null {
  const m = c.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return null;
  let hex = m[1];
  if (hex.length === 3) hex = hex.split('').map((x) => x + x).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lin(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function WcagContrastTool() {
  const [fg, setFg] = useState('#000000');
  const [bg, setBg] = useState('#ffffff');

  const result = useMemo(() => {
    const f = parseColor(fg);
    const b = parseColor(bg);
    if (!f || !b) return null;
    const l1 = lin(f);
    const l2 = lin(b);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const r = Math.round(ratio * 100) / 100;
    const aa = r >= 4.5;
    const aaa = r >= 7;
    const aaLarge = r >= 3;
    const aaaLarge = r >= 4.5;
    return { ratio: r, aa, aaa, aaLarge, aaaLarge };
  }, [fg, bg]);

  const swatch = (c: string) => ({
    backgroundColor: c.startsWith('#') ? c : `#${c}`,
  });

  return (
    <div class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label class="block">
          <span class="text-sm font-medium">前景色（文字）</span>
          <div class="mt-1.5 flex items-center gap-2">
            <input
              type="color"
              class="h-10 w-12 rounded border border-base-300"
              value={fg.startsWith('#') ? fg : `#${fg}`}
              onInput={(e) => setFg((e.target as HTMLInputElement).value)}
            />
            <input
              class="input input-bordered w-full font-mono text-sm"
              value={fg}
              onInput={(e) => setFg((e.target as HTMLInputElement).value)}
              placeholder="#000000"
            />
          </div>
        </label>
        <label class="block">
          <span class="text-sm font-medium">背景色</span>
          <div class="mt-1.5 flex items-center gap-2">
            <input
              type="color"
              class="h-10 w-12 rounded border border-base-300"
              value={bg.startsWith('#') ? bg : `#${bg}`}
              onInput={(e) => setBg((e.target as HTMLInputElement).value)}
            />
            <input
              class="input input-bordered w-full font-mono text-sm"
              value={bg}
              onInput={(e) => setBg((e.target as HTMLInputElement).value)}
              placeholder="#ffffff"
            />
          </div>
        </label>
      </div>

      <div
        class="rounded-xl p-5 text-center font-semibold"
        style={swatch(bg) as unknown as Record<string, string>}
      >
        <div class={`text-2xl ${result && result.ratio >= 4.5 ? '' : 'opacity-90'}`} style={{ color: fg.startsWith('#') ? fg : `#${fg}` }}>
          对比度预览 Aa
        </div>
        <div
          class="text-sm mt-2"
          style={{ color: fg.startsWith('#') ? fg : `#${fg}` }}
        >
          {result ? `对比度 ${result.ratio}:1` : '颜色格式无效'}
        </div>
      </div>

      {result && (
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class={`rounded-lg p-2 text-center ${result.aaa ? 'bg-success/20' : result.aa ? 'bg-warning/20' : 'bg-error/20'}`}>
            普通文本 AA（≥4.5）：{result.aa ? '通过' : '不通过'}
          </div>
          <div class={`rounded-lg p-2 text-center ${result.aaa ? 'bg-success/20' : result.aa ? 'bg-warning/20' : 'bg-error/20'}`}>
            普通文本 AAA（≥7）：{result.aaa ? '通过' : '不通过'}
          </div>
          <div class={`rounded-lg p-2 text-center ${result.aaaLarge ? 'bg-success/20' : result.aaLarge ? 'bg-warning/20' : 'bg-error/20'}`}>
            大文本 AA（≥3）：{result.aaLarge ? '通过' : '不通过'}
          </div>
          <div class={`rounded-lg p-2 text-center ${result.aaaLarge ? 'bg-success/20' : 'bg-warning/20'}`}>
            大文本 AAA（≥4.5）：{result.aaaLarge ? '通过' : '不通过'}
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        依据 WCAG 2.1 相对亮度公式计算对比度；大文本指 ≥24px 或 ≥18.66px 加粗。全部本地计算。
      </p>
    </div>
  );
}
