import { useState, useMemo } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

const ALPH = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function b58encode(bytes: Uint8Array): string {
  const b: number[] = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < b.length; j++) {
      carry += b[j] * 256;
      b[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      b.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let s = '';
  for (let k = 0; k < bytes.length && bytes[k] === 0; k++) s += ALPH[0];
  for (let k = b.length - 1; k >= 0; k--) s += ALPH[b[k]];
  return s;
}

function b58decode(str: string): Uint8Array {
  const idx = (c: string) => ALPH.indexOf(c);
  const bytes: number[] = [0];
  for (let i = 0; i < str.length; i++) {
    const ci = idx(str[i]);
    if (ci < 0) throw new Error(`非法 Base58 字符：${str[i]}`);
    let carry = ci;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry % 256;
      carry = Math.floor(carry / 256);
    }
    while (carry > 0) {
      bytes.push(carry % 256);
      carry = Math.floor(carry / 256);
    }
  }
  const out: number[] = [];
  for (let k = 0; k < str.length && str[k] === ALPH[0]; k++) out.push(0);
  for (let k = bytes.length - 1; k >= 0; k--) out.push(bytes[k]);
  return new Uint8Array(out);
}

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/\s+/g, '').replace(/^0x/, '');
  if (h.length % 2 !== 0) throw new Error('十六进制长度必须为偶数');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) {
    const v = parseInt(h.substr(i * 2, 2), 16);
    if (Number.isNaN(v)) throw new Error('含非法十六进制字符');
    out[i] = v;
  }
  return out;
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

export default function Base58Tool() {
  const [mode, setMode] = useState<'enc-text' | 'enc-hex' | 'dec'>('enc-text');
  const [input, setInput] = useState('Hello, Base58!');

  const result = useMemo(() => {
    const v = input.trim();
    if (v === '') return { ok: true, out: '' };
    try {
      if (mode === 'enc-text') {
        const bytes = new TextEncoder().encode(v);
        return { ok: true, out: b58encode(bytes) };
      }
      if (mode === 'enc-hex') {
        const bytes = hexToBytes(v);
        return { ok: true, out: b58encode(bytes) };
      }
      // decode
      const bytes = b58decode(v);
      const text = new TextDecoder().decode(bytes);
      return { ok: true, out: `文本: ${text}\n十六进制: ${bytesToHex(bytes)}` };
    } catch (e) {
      return { ok: false, out: `错误：${(e as Error).message}` };
    }
  }, [mode, input]);

  const out = result.ok ? result.out : result.out;

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={out}
      placeholder="粘贴文本、十六进制 或 Base58 字符串"
      note="使用比特币 Base58 字母表（去除了 0/O/I/l）。编码全程本地计算，不上传数据。"
    >
      <div class="form-control">
        <select
          class="select select-bordered select-sm w-full"
          value={mode}
          onChange={(e) => setMode((e.target as HTMLSelectElement).value as typeof mode)}
        >
          <option value="enc-text">编码：文本 → Base58</option>
          <option value="enc-hex">编码：十六进制 → Base58</option>
          <option value="dec">解码：Base58 → 文本 + 十六进制</option>
        </select>
      </div>
    </DevTool>
  );
}
