import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

function identify(hash: string): string {
  const h = hash.trim();
  if (h === '') return '';
  const isHex = /^[0-9a-fA-F]+$/.test(h);
  const isB64 = /^[A-Za-z0-9+/=]+$/.test(h) && h.length % 4 === 0;
  const isB58 =
    /^[1-9A-HJ-NP-Za-km-z]+$/.test(h) && !/^\d+$/.test(h);
  const lines: string[] = [];
  lines.push(`长度：${h.length} 字符`);
  lines.push(`字符集：${isHex ? '十六进制' : isB64 ? 'Base64' : isB58 ? 'Base58' : '含特殊字符'}`);

  const cands: string[] = [];
  if (isHex) {
    const bits = h.length * 4;
    lines.push(`比特长度：${bits} bit`);
    if (h.length === 32) cands.push('MD5（128-bit）');
    if (h.length === 40) cands.push('SHA-1（160-bit）');
    if (h.length === 56) cands.push('SHA-224（224-bit）');
    if (h.length === 64) cands.push('SHA-256（256-bit）');
    if (h.length === 96) cands.push('SHA-384（384-bit）');
    if (h.length === 128) cands.push('SHA-512（512-bit）');
    if (h.length === 16) cands.push('CRC32 / 截断 MD5');
  }
  if (h.startsWith('$2a$') || h.startsWith('$2b$') || h.startsWith('$2y$')) cands.push('bcrypt');
  if (h.startsWith('$1$')) cands.push('MD5-crypt');
  if (h.startsWith('$5$')) cands.push('SHA-256-crypt');
  if (h.startsWith('$6$')) cands.push('SHA-512-crypt');
  if (h.startsWith('$argon2')) cands.push('Argon2');
  if (h.startsWith('$pbkdf2') || h.startsWith('pbkdf2$')) cands.push('PBKDF2');
  if (h.toLowerCase().startsWith('scrypt$')) cands.push('scrypt');

  lines.push('');
  lines.push(cands.length ? `可能的类型：${cands.join('、')}` : '未匹配到常见哈希格式（可能是自定义或截断）');
  lines.push('');
  lines.push('提示：哈希本身不可逆，识别只能按长度/前缀猜测，不能反推原文。');
  return lines.join('\n');
}

export default function HashIdentifyTool() {
  const [input, setInput] = useState('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');

  const result = useMemo(() => identify(input), [input]);

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={result}
      placeholder="粘贴哈希串，例如 9f86d081…（SHA-256）"
      note="按长度与字符集猜测哈希类型；仅本地识别，不上传。"
    />
  );
}
