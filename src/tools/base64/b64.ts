/**
 * Base64 编解码 · 纯函数层
 *
 * 借鉴：
 * - dankogai/js-base64（BSD-3-Clause）：URL-safe 字符表切换（`-_` 替代 `+/`）、
 *   解码容错（自动识别 `-_`、补全缺失 padding）、严格字符校验；
 * - beatgammit/base64-js（MIT）：Uint8Array ↔ Base64 直转链路，服务文件编码。
 *
 * 本文件为算法唯一来源：Tool.tsx（运行期）与 [...sub].astro 子页生成
 * （构建期）共同 import，禁止在组件里另写一份。
 */

/** 标准 Base64 字符表 */
export const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** 字节数组 → 标准 Base64（base64-js 的 fromByteArray 思路） */
export function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const CHUNK = 0x8000; // 分块拼接，避免超大字符串参数上限
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/** UTF-8 文本 → 标准 Base64 */
export function utf8ToBase64(str: string): string {
  return bytesToBase64(new TextEncoder().encode(str));
}

/**
 * 归一化 Base64 串：去空白 → URL-safe 还原（`-_` → `+/`）→ 严格校验 → 补全 padding。
 * 借鉴 js-base64 的解码容错思路；非法字符直接抛错，由调用方转成红字提示。
 */
export function normalizeBase64(input: string): string {
  let s = input.replace(/\s+/g, '');
  if (s === '') return '';
  if (s.includes('-') || s.includes('_')) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) {
    throw new Error('含有非 Base64 字符（仅支持 A-Z a-z 0-9 + / = 与 URL-safe 的 - _）');
  }
  const pad = s.length % 4;
  if (pad === 1) throw new Error('长度非法：Base64 串长度除以 4 余 1，请检查是否复制完整');
  if (pad > 0) s += '='.repeat(4 - pad);
  return s;
}

/** 标准 Base64 → UTF-8 文本（自动兼容 URL-safe 串与缺 padding 的 JWT 串） */
export function base64ToUtf8(b64: string): string {
  const clean = normalizeBase64(b64);
  if (!clean) return '';
  const bin = atob(clean);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** URL-safe 编码：`+/` → `-_`，可选去 `=` padding */
export function urlSafeEncode(str: string, opts: { padding?: boolean } = {}): string {
  let s = utf8ToBase64(str).replace(/\+/g, '-').replace(/\//g, '_');
  if (opts.padding === false) s = s.replace(/=+$/, '');
  return s;
}

/** 判断串是否使用了 URL-safe 字符表 */
export function isUrlSafe(s: string): boolean {
  return s.includes('-') || s.includes('_');
}

export interface B64Stats {
  /** 字符数（按 Unicode 码点计，emoji 算 1 个） */
  chars: number;
  /** UTF-8 字节数 */
  bytes: number;
  /** Base64 输出长度 */
  outLen: number;
  /** 膨胀率（输出 / 字节，理论约 4/3） */
  ratio: number;
}

/** 统计：字符数 / UTF-8 字节数 / 输出长度 / 膨胀率 */
export function b64Stats(input: string, output: string): B64Stats {
  const bytes = new TextEncoder().encode(input).length;
  return {
    chars: [...input].length,
    bytes,
    outLen: output.length,
    ratio: bytes > 0 ? output.length / bytes : 0,
  };
}
