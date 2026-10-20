/**
 * 安全加密工具纯函数层（crc32 / base32 / rot13）。
 * 全部纯函数、无浏览器 API，前端与未来 MCP 可共用同一份。
 * 注：PBKDF2 依赖 Web Crypto，放在对应 Tool.tsx（仅浏览器调用）。
 */
import { type ToolResult, ok, err } from './tool-result';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(input: string): ToolResult<string> {
  if (!input) return err('请输入要计算的文本');
  const bytes = new TextEncoder().encode(input);
  let crc = 0xffffffff;
  for (const b of bytes) {
    crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  }
  const out = (crc ^ 0xffffffff) >>> 0;
  return ok(out.toString(16).toUpperCase().padStart(8, '0'));
}

const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(input: string): ToolResult<string> {
  if (!input) return err('请输入要编码的文本');
  const bytes = new TextEncoder().encode(input);
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += B32_ALPHABET[(value << (5 - bits)) & 31];
  }
  while (out.length % 8 !== 0) out += '=';
  return ok(out);
}

export function base32Decode(input: string): ToolResult<string> {
  if (!input) return err('请输入 Base32 字符串');
  const clean = input.replace(/=+$/g, '').toUpperCase().replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) return err(`非法 Base32 字符：${ch}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  try {
    return ok(new TextDecoder().decode(new Uint8Array(out)));
  } catch {
    return err('Base32 解码失败，请检查输入');
  }
}

/** ROT13（及任意偏移的凯撒密码）。shift 默认 13 */
export function rot13(text: string, shift = 13): ToolResult<string> {
  if (!text) return err('请输入文本');
  const s = ((shift % 26) + 26) % 26;
  const out = text.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + s) % 26) + base);
  });
  return ok(out);
}
