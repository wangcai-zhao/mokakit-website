import { useState, useEffect, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/**
 * 纯 JS 实现的 SHA-1 / SHA-256。
 * 不使用 Web Crypto 的 crypto.subtle，因为它只在 HTTPS 等安全上下文可用；
 * 站点在 ICP 备案通过、启用 SSL 之前是 http，subtle 会拿不到。纯 JS 在任何环境都能跑。
 */

function utf8Bytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function sha1(msg: string): string {
  const rotl = (n: number, s: number) => (n << s) | (n >>> (32 - s));
  const bytes = utf8Bytes(msg);
  const ml = bytes.length * 8;
  const total = Math.ceil((bytes.length + 1 + 8) / 64) * 64;
  const buf = new Uint8Array(total);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(total - 4, ml >>> 0, false);
  view.setUint32(total - 8, Math.floor(ml / 0x100000000), false);

  let h0 = 0x67452301,
    h1 = 0xefcdab89,
    h2 = 0x98badcfe,
    h3 = 0x10325476,
    h4 = 0xc3d2e1f0;
  const w = new Uint32Array(80);
  for (let i = 0; i < total; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
    for (let t = 16; t < 80; t++)
      w[t] = rotl(w[t - 3]! ^ w[t - 8]! ^ w[t - 14]! ^ w[t - 16]!, 1);
    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4;
    for (let t = 0; t < 80; t++) {
      let f: number, k: number;
      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const tmp = (rotl(a, 5) + f + e + k + w[t]!) >>> 0;
      e = d;
      d = c;
      c = rotl(b, 30);
      b = a;
      a = tmp;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }
  return [h0, h1, h2, h3, h4].map((x) => x.toString(16).padStart(8, '0')).join('');
}

function sha256(msg: string): string {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
    0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
    0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
    0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
    0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
    0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
    0xc67178f2,
  ]);
  const rotr = (n: number, s: number) => (n >>> s) | (n << (32 - s));
  const bytes = utf8Bytes(msg);
  const ml = bytes.length * 8;
  const total = Math.ceil((bytes.length + 1 + 8) / 64) * 64;
  const buf = new Uint8Array(total);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(total - 4, ml >>> 0, false);
  view.setUint32(total - 8, Math.floor(ml / 0x100000000), false);

  let h0 = 0x6a09e667,
    h1 = 0xbb67ae85,
    h2 = 0x3c6ef372,
    h3 = 0xa54ff53a,
    h4 = 0x510e527f,
    h5 = 0x9b05688c,
    h6 = 0x1f83d9ab,
    h7 = 0x5be0cd19;
  const w = new Uint32Array(64);
  for (let i = 0; i < total; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15]!, 7) ^ rotr(w[t - 15]!, 18) ^ (w[t - 15]! >>> 3);
      const s1 = rotr(w[t - 2]!, 17) ^ rotr(w[t - 2]!, 19) ^ (w[t - 2]! >>> 10);
      w[t] = (w[t - 16]! + s0 + w[t - 7]! + s1) >>> 0;
    }
    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[t]! + w[t]!) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((x) => x.toString(16).padStart(8, '0'))
    .join('');
}

const ALGOS = [
  { id: 'SHA-1', fn: sha1 },
  { id: 'SHA-256', fn: sha256 },
] as const;
type AlgoId = (typeof ALGOS)[number]['id'];

export default function HashCalculator() {
  const [text, setText] = useState('');
  const [sel, setSel] = useState<AlgoId[]>(['SHA-256']);
  const [results, setResults] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (text === '') {
      setResults({});
      setBusy(false);
      return;
    }
    let cancelled = false;
    setBusy(true);
    (async () => {
      const next: Record<string, string> = {};
      for (const a of sel) {
        const algo = ALGOS.find((x) => x.id === a);
        if (algo) next[a] = algo.fn(text);
      }
      if (!cancelled) {
        setResults(next);
        setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [text, sel]);

  const toggle = (a: AlgoId) =>
    setSel((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const copy = async (key: string, value: string) => {
    if (!value) return;
      await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium" for="hash-input">
          输入文本
        </label>
        <textarea
          id="hash-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows="5"
          placeholder="输入要计算哈希的内容…"
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
        />
      </div>

      <div>
        <span class="text-sm font-medium">算法（可多选）</span>
        <div class="mt-2 flex flex-wrap gap-3">
          {ALGOS.map((a) => (
            <label class="cursor-pointer flex items-center gap-1.5 text-sm select-none">
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-primary"
                checked={sel.includes(a.id)}
                onChange={() => toggle(a.id)}
              />
              {a.id}
            </label>
          ))}
        </div>
      </div>

      {text !== '' && (
        <div class="space-y-2">
          {sel.length === 0 && <p class="text-sm opacity-60">请至少选择一种算法。</p>}
          {sel.map((a) => (
            <div class="rounded-xl bg-base-200 p-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-medium opacity-70">{a}</span>
                <button
                  type="button"
                  class={`btn btn-xs ${copied === a ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => copy(a, results[a] ?? '')}
                  disabled={!results[a]}
                >
                  {copied === a ? '已复制' : '复制'}
                </button>
              </div>
              <code class="block font-mono text-sm break-all">
                {busy && !results[a]
                  ? '计算中…'
                  : (results[a] ?? '—')}
              </code>
            </div>
          ))}
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        使用纯本地算法计算（SHA 系列），内容不会离开你的设备，也不需要 HTTPS。注意：MD5
        已被证明不安全，本工具不提供；Web Crypto 同样不支持 MD5。
      </p>
    </div>
  );
}
