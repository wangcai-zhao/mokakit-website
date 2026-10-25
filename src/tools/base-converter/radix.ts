/**
 * 进制转换 · 纯函数层
 *
 * 借鉴 MaxGrushevsky/numradix（MIT）的 format() 选项设计：
 * prefix（0x / 0b）、groupSize + separator 分组、uppercase 大写输出。
 * 本文件为算法唯一来源：Tool.tsx（运行期）与 [...sub].astro 子页生成
 * （构建期）共同 import，禁止在组件里另写一份。
 *
 * 同时提供 IEEE 754 双精度 ↔ 十六进制的纯函数实现（DataView），
 * 用于兑现 meta.description 里「附 IEEE 754 浮点进制说明」的承诺。
 */

export const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

/** 常用进制预设 */
export const PRESETS = [2, 8, 10, 16, 32, 36] as const;

/** 解析某进制下的数字串为 bigint；非法返回 null。支持下划线分组与负号 */
export function parseRadix(str: string, radix: number): bigint | null {
  let s = str.trim().toLowerCase().replace(/_/g, '');
  if (s === '') return null;
  if (radix < 2 || radix > 36) return null;
  const neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  if (s === '') return null;
  const r = BigInt(radix);
  let result = 0n;
  let seen = false;
  for (const ch of s) {
    const idx = DIGITS.indexOf(ch);
    if (idx < 0 || idx >= radix) return null;
    result = result * r + BigInt(idx);
    seen = true;
  }
  if (!seen) return null;
  return neg ? -result : result;
}

/** bigint 转某进制数字串 */
export function toRadix(n: bigint, radix: number): string {
  if (radix < 2 || radix > 36) return '进制需在 2-36 之间';
  if (n === 0n) return '0';
  const r = BigInt(radix);
  const neg = n < 0n;
  let x = neg ? -n : n;
  let out = '';
  while (x > 0n) {
    out = DIGITS[Number(x % r)]! + out;
    x = x / r;
  }
  return neg ? '-' + out : out;
}

/** 进制输入框钳制 */
export function clampBase(v: number): number {
  if (!Number.isFinite(v)) return 10;
  return Math.min(36, Math.max(2, Math.round(v)));
}

export interface FormatOptions {
  /** 每 groupSize 位插一个分隔符（借鉴 numradix 的 groupSize + separator） */
  group?: boolean;
  groupSize?: number;
  separator?: string;
  /** 16 进制加 0x、2 进制加 0b（借鉴 numradix 的 prefix 选项） */
  prefix?: boolean;
  /** 字母大写（借鉴 numradix 的 uppercase 选项） */
  upper?: boolean;
}

/**
 * 格式化某进制输出：分组 / 前缀 / 大写。
 * radix 决定 prefix 形态（2→0b，16→0x，其余不加）。
 */
export function formatRadix(s: string, radix: number, opts: FormatOptions = {}): string {
  if (!s) return s;
  const neg = s.startsWith('-');
  let body = neg ? s.slice(1) : s;
  const { group = false, groupSize = 4, separator = ' ', prefix = false, upper = false } = opts;
  if (upper) body = body.toUpperCase();
  if (group && body.length > groupSize) {
    const parts: string[] = [];
    for (let i = body.length; i > 0; i -= groupSize) {
      parts.unshift(body.slice(Math.max(0, i - groupSize), i));
    }
    body = parts.join(separator);
  }
  const p = prefix ? (radix === 16 ? '0x' : radix === 2 ? '0b' : '') : '';
  return (neg ? '-' : '') + p + body;
}

/** IEEE 754 双精度浮点 → 十六进制表示（如 3.14 → 0x400921FB54442D18） */
export function float64ToHex(n: number): string {
  const buf = new DataView(new ArrayBuffer(8));
  buf.setFloat64(0, n);
  let hex = '';
  for (let i = 0; i < 8; i++) {
    hex += buf.getUint8(i).toString(16).padStart(2, '0');
  }
  return '0x' + hex.toUpperCase();
}

export interface Ieee754Parts {
  /** 符号位：'0' 正 / '1' 负 */
  sign: string;
  /** 11 位指数（二进制串） */
  exponent: string;
  /** 52 位尾数（二进制串） */
  mantissa: string;
  /** 指数十进制值（含偏置 1023） */
  exponentValue: number;
}

/** 拆解 IEEE 754 双精度十六进制为 符号位 / 指数 / 尾数 三段 */
export function ieee754Parts(hex: string): Ieee754Parts {
  const clean = hex.replace(/^0x/i, '');
  const bin = BigInt('0x' + (clean || '0')).toString(2).padStart(64, '0');
  const exponent = bin.slice(1, 12);
  return {
    sign: bin.slice(0, 1),
    exponent,
    mantissa: bin.slice(12),
    exponentValue: parseInt(exponent, 2),
  };
}
