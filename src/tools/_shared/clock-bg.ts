export type BgMode = 'theme' | 'dark' | 'light' | 'custom';

export interface ResolvedBg {
  bg: string;
  fg: string;
  sub: string;
}

export interface ThemeColors {
  bg: string;
  fg: string;
  sub?: string;
}

/** 把 #rgb / #rrggbb 归一化为小写 6 位 hex，失败返回 null */
function normalizeHex(hex: string): string | null {
  let h = (hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  return /^[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : null;
}

/** 根据背景亮度返回可读前景色：浅底用深色字，深底用浅色字 */
export function readableFg(hex: string): string {
  const c = normalizeHex(hex);
  if (!c) return '#0f172a';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#0f172a' : '#f8fafc';
}

/** 背景是否偏亮（用于决定卡片叠加色） */
export function isLightBg(hex: string): boolean {
  return readableFg(hex) === '#0f172a';
}

/**
 * 根据背景模式解析出最终的 bg / fg / sub。
 * - theme：沿用主题自带配色
 * - dark / light：纯黑 / 纯白
 * - custom：使用用户取色，前景色自动取可读性最高的深/浅色
 */
export function resolveBg(theme: ThemeColors, mode: BgMode, customColor: string): ResolvedBg {
  if (mode === 'dark') return { bg: '#000000', fg: '#f8fafc', sub: 'rgba(248,250,252,0.6)' };
  if (mode === 'light') return { bg: '#ffffff', fg: '#0f172a', sub: 'rgba(15,23,42,0.55)' };
  if (mode === 'custom') {
    const fg = readableFg(customColor);
    const sub = fg === '#0f172a' ? 'rgba(15,23,42,0.55)' : 'rgba(248,250,252,0.6)';
    return { bg: customColor, fg, sub };
  }
  return { bg: theme.bg, fg: theme.fg, sub: theme.sub ?? 'rgba(248,250,252,0.6)' };
}
