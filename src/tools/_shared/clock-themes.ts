/**
 * 时钟统一主题注册表 + 背景/辉光配置
 * 主题色值部分移植自 analogclockj/analogclockj.github.io (MIT) 的 7 套主题，
 * 另补充 aurora / mocha / mono 三套，覆盖翻页/数字/模拟/世界四类工具的观感。
 */

export interface ClockTheme {
  id: string;
  name: string;
  bg: string; // 页面背景（渐变或纯色）
  fg: string; // 主文字
  sub: string; // 次级文字
  accent: string; // 强调色（翻页卡边、高亮）
  glow: string; // 辉光 rgba
  card: string; // 翻页/数字卡片底
  cardFg: string; // 卡片数字色
  face: string; // 模拟时钟表盘渐变
  border: string; // 模拟表盘边框 / 翻页卡边
  handH: string; // 时针
  handM: string; // 分针
  handS: string; // 秒针
  tick: string; // 主刻度
  tickMinor: string; // 次刻度
  center: string; // 中心圆点
  num: string; // 数字色
}

export const CLOCK_THEMES: ClockTheme[] = [
  {
    id: 'midnight',
    name: '午夜红',
    bg: 'linear-gradient(145deg,#16213e,#0f0f23)',
    fg: '#ffffff',
    sub: 'rgba(255,255,255,0.7)',
    accent: '#e94560',
    glow: 'rgba(233,69,96,0.5)',
    card: 'linear-gradient(145deg,#16213e,#0f0f23)',
    cardFg: '#ffffff',
    face: 'linear-gradient(145deg,#16213e,#0f0f23)',
    border: '#e94560',
    handH: '#e94560',
    handM: '#ffffff',
    handS: '#00d9ff',
    tick: '#e94560',
    tickMinor: 'rgba(255,255,255,0.3)',
    center: '#e94560',
    num: 'rgba(255,255,255,0.9)',
  },
  {
    id: 'ocean',
    name: '深海蓝',
    bg: 'linear-gradient(145deg,#0d2137,#0a1628)',
    fg: '#caf0f8',
    sub: 'rgba(202,240,248,0.7)',
    accent: '#00b4d8',
    glow: 'rgba(0,180,216,0.5)',
    card: 'linear-gradient(145deg,#0d2137,#0a1628)',
    cardFg: '#caf0f8',
    face: 'linear-gradient(145deg,#0d2137,#0a1628)',
    border: '#00b4d8',
    handH: '#00b4d8',
    handM: '#90e0ef',
    handS: '#48cae4',
    tick: '#00b4d8',
    tickMinor: 'rgba(144,224,239,0.3)',
    center: '#00b4d8',
    num: 'rgba(202,240,248,0.9)',
  },
  {
    id: 'forest',
    name: '森林绿',
    bg: 'linear-gradient(145deg,#2d4a2d,#1a2f1a)',
    fg: '#d8f3dc',
    sub: 'rgba(216,243,220,0.7)',
    accent: '#90be6d',
    glow: 'rgba(144,190,109,0.5)',
    card: 'linear-gradient(145deg,#2d4a2d,#1a2f1a)',
    cardFg: '#d8f3dc',
    face: 'linear-gradient(145deg,#2d4a2d,#1a2f1a)',
    border: '#90be6d',
    handH: '#90be6d',
    handM: '#d8f3dc',
    handS: '#52b788',
    tick: '#90be6d',
    tickMinor: 'rgba(216,243,220,0.3)',
    center: '#90be6d',
    num: 'rgba(216,243,220,0.9)',
  },
  {
    id: 'sunset',
    name: '日落橙',
    bg: 'linear-gradient(145deg,#3d1a3d,#1f1020)',
    fg: '#fff5e1',
    sub: 'rgba(255,245,225,0.7)',
    accent: '#ff6b6b',
    glow: 'rgba(255,107,107,0.5)',
    card: 'linear-gradient(145deg,#3d1a3d,#1f1020)',
    cardFg: '#fff5e1',
    face: 'linear-gradient(145deg,#3d1a3d,#1f1020)',
    border: '#ff6b6b',
    handH: '#ff6b6b',
    handM: '#ffd93d',
    handS: '#ff8c42',
    tick: '#ff6b6b',
    tickMinor: 'rgba(255,217,61,0.3)',
    center: '#ff6b6b',
    num: 'rgba(255,245,225,0.9)',
  },
  {
    id: 'lavender',
    name: '薰衣草',
    bg: 'linear-gradient(145deg,#2d2640,#1a1625)',
    fg: '#f0e6ff',
    sub: 'rgba(240,230,255,0.7)',
    accent: '#b388eb',
    glow: 'rgba(179,136,235,0.5)',
    card: 'linear-gradient(145deg,#2d2640,#1a1625)',
    cardFg: '#f0e6ff',
    face: 'linear-gradient(145deg,#2d2640,#1a1625)',
    border: '#b388eb',
    handH: '#b388eb',
    handM: '#e0c3fc',
    handS: '#8093f1',
    tick: '#b388eb',
    tickMinor: 'rgba(224,195,252,0.3)',
    center: '#b388eb',
    num: 'rgba(240,230,255,0.9)',
  },
  {
    id: 'minimal',
    name: '极简白',
    bg: 'linear-gradient(145deg,#ffffff,#f0f0f0)',
    fg: '#333333',
    sub: 'rgba(0,0,0,0.6)',
    accent: '#333333',
    glow: 'rgba(0,0,0,0.1)',
    card: 'linear-gradient(145deg,#ffffff,#f0f0f0)',
    cardFg: '#333333',
    face: 'linear-gradient(145deg,#ffffff,#f0f0f0)',
    border: '#333333',
    handH: '#333333',
    handM: '#555555',
    handS: '#e74c3c',
    tick: '#333333',
    tickMinor: 'rgba(0,0,0,0.2)',
    center: '#333333',
    num: 'rgba(0,0,0,0.8)',
  },
  {
    id: 'gold',
    name: '流金',
    bg: 'linear-gradient(145deg,#2d2418,#1a1510)',
    fg: '#f5e6a3',
    sub: 'rgba(245,230,163,0.7)',
    accent: '#d4af37',
    glow: 'rgba(212,175,55,0.5)',
    card: 'linear-gradient(145deg,#2d2418,#1a1510)',
    cardFg: '#f5e6a3',
    face: 'linear-gradient(145deg,#2d2418,#1a1510)',
    border: '#d4af37',
    handH: '#d4af37',
    handM: '#f5e6a3',
    handS: '#c9a227',
    tick: '#d4af37',
    tickMinor: 'rgba(245,230,163,0.3)',
    center: '#d4af37',
    num: 'rgba(245,230,163,0.9)',
  },
  {
    id: 'aurora',
    name: '极光',
    bg: 'linear-gradient(145deg,#0c3a30,#03110d)',
    fg: '#d6fff5',
    sub: 'rgba(214,255,245,0.7)',
    accent: '#2ee6a6',
    glow: 'rgba(46,230,166,0.5)',
    card: 'linear-gradient(145deg,#0c3a30,#03110d)',
    cardFg: '#d6fff5',
    face: 'linear-gradient(145deg,#0c3a30,#03110d)',
    border: '#2ee6a6',
    handH: '#2ee6a6',
    handM: '#9bffe0',
    handS: '#5effc4',
    tick: '#2ee6a6',
    tickMinor: 'rgba(155,255,224,0.3)',
    center: '#2ee6a6',
    num: 'rgba(214,255,245,0.9)',
  },
  {
    id: 'mocha',
    name: '摩卡',
    bg: 'linear-gradient(145deg,#2a1d12,#1c140d)',
    fg: '#f3e3cf',
    sub: 'rgba(243,227,207,0.7)',
    accent: '#c9a961',
    glow: 'rgba(201,169,97,0.5)',
    card: 'linear-gradient(145deg,#2a1d12,#1c140d)',
    cardFg: '#f3e3cf',
    face: 'linear-gradient(145deg,#2a1d12,#1c140d)',
    border: '#c9a961',
    handH: '#c9a961',
    handM: '#f3e3cf',
    handS: '#e0b86b',
    tick: '#c9a961',
    tickMinor: 'rgba(243,227,207,0.3)',
    center: '#c9a961',
    num: 'rgba(243,227,207,0.9)',
  },
  {
    id: 'mono',
    name: '纯黑',
    bg: 'linear-gradient(145deg,#141414,#0a0a0a)',
    fg: '#f5f5f5',
    sub: 'rgba(245,245,245,0.6)',
    accent: '#f5f5f5',
    glow: 'rgba(255,255,255,0.18)',
    card: 'linear-gradient(145deg,#141414,#0a0a0a)',
    cardFg: '#f5f5f5',
    face: 'linear-gradient(145deg,#141414,#0a0a0a)',
    border: '#f5f5f5',
    handH: '#f5f5f5',
    handM: '#cccccc',
    handS: '#ff5252',
    tick: '#f5f5f5',
    tickMinor: 'rgba(255,255,255,0.2)',
    center: '#f5f5f5',
    num: 'rgba(245,245,245,0.85)',
  },
];

export type BgMode = 'theme' | 'solid' | 'image';

/** 内置精选背景图（本地 SVG，零外网依赖，可直接 /clock-bg/<id>.svg 访问） */
export interface PresetBackground {
  id: string;
  name: string;
  url: string;
}
export const PRESET_BACKGROUNDS: PresetBackground[] = [
  { id: 'starry', name: '星空', url: '/clock-bg/starry.svg' },
  { id: 'aurora', name: '极光', url: '/clock-bg/aurora.svg' },
  { id: 'sunrise', name: '晨曦', url: '/clock-bg/sunrise.svg' },
  { id: 'ocean', name: '深海', url: '/clock-bg/ocean.svg' },
  { id: 'forest', name: '森林雾', url: '/clock-bg/forest.svg' },
  { id: 'neon', name: '霓虹城', url: '/clock-bg/neon.svg' },
  { id: 'desert', name: '沙漠落日', url: '/clock-bg/desert.svg' },
  { id: 'galaxy', name: '银河', url: '/clock-bg/galaxy.svg' },
  /* 照片背景（AI 生成，本地自包含，零外网依赖） */
  { id: 'photo-mountain', name: '雪山湖泊', url: '/clock-bg/photo-mountain.png' },
  { id: 'photo-ocean', name: '海洋日落', url: '/clock-bg/photo-ocean.png' },
  { id: 'photo-forest', name: '晨雾森林', url: '/clock-bg/photo-forest.png' },
  { id: 'photo-cat', name: '猫咪', url: '/clock-bg/photo-cat.png' },
  { id: 'photo-fox', name: '狐狸', url: '/clock-bg/photo-fox.png' },
  { id: 'photo-deer', name: '鹿', url: '/clock-bg/photo-deer.png' },
  { id: 'photo-portrait', name: '人像', url: '/clock-bg/photo-portrait.png' },
  { id: 'photo-beach', name: '海边剪影', url: '/clock-bg/photo-beach.png' },
  { id: 'photo-citynight', name: '都市夜', url: '/clock-bg/photo-citynight.png' },
];
export function presetUrl(id: string): string {
  return PRESET_BACKGROUNDS.find((p) => p.id === id)?.url ?? '';
}
export type FontScale = 'sm' | 'md' | 'lg';

export interface ClockSettings {
  theme: string;
  hour12: boolean;
  showSeconds: boolean;
  showDate: boolean;
  fontScale: FontScale;
  bgMode: BgMode;
  bgSolid: string;
  bgImage: string;
  bgPresetId: string; // 选中的内置预设 id（'starry' 等），空=未选
  bgUploadId: string; // 上传照片在 IndexedDB 的 key，空=无
  bgBlur: number;
  bgScrim: number;
  vignette: boolean;
  glow: boolean;
  wake: boolean;
  bgAuto: boolean;
  bgAutoInterval: number;
}

export const DEFAULT_CLOCK_SETTINGS: ClockSettings = {
  theme: 'midnight',
  hour12: false,
  showSeconds: true,
  showDate: true,
  fontScale: 'md',
  bgMode: 'image',
  bgSolid: '#0f0f23',
  bgImage: '',
  bgPresetId: 'photo-mountain',
  bgUploadId: '',
  bgBlur: 0,
  bgScrim: 0.35,
  vignette: true,
  glow: false,
  wake: false,
  bgAuto: false,
  bgAutoInterval: 12,
};

export function getTheme(id: string): ClockTheme {
  return CLOCK_THEMES.find((t) => t.id === id) ?? CLOCK_THEMES[0];
}

/** 把 #rgb / #rrggbb 归一化为小写 6 位 hex，失败返回 null */
function normalizeHex(hex: string): string | null {
  let h = (hex || '').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  return /^[0-9a-fA-F]{6}$/.test(h) ? h.toLowerCase() : null;
}

/** 根据背景亮度返回可读前景色 */
export function readableFg(hex: string): string {
  const c = normalizeHex(hex);
  if (!c) return '#0f172a';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? '#0f172a' : '#f8fafc';
}
