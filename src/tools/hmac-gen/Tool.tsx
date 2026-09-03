import { useState } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

function toHex(b: Uint8Array): string {
  return Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}
function toB64(b: Uint8Array): string {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
}
function toB64url(b: Uint8Array): string {
  return toB64(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default function HmacGenTool() {
  const [input, setInput] = useState('hello world');
  const [secret, setSecret] = useState('my-secret-key');
  const [algo, setAlgo] = useState<'SHA-256' | 'SHA-1' | 'SHA-512'>('SHA-256');
  const [fmt, setFmt] = useState<'hex' | 'base64' | 'base64url'>('hex');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);

  const compute = async () => {
    setBusy(true);
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: algo },
        false,
        ['sign'],
      );
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(input));
      const bytes = new Uint8Array(sig);
      setOutput(fmt === 'hex' ? toHex(bytes) : fmt === 'base64' ? toB64(bytes) : toB64url(bytes));
    } catch (e) {
      setOutput(`错误：${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DevTool
      input={input}
      setInput={setInput}
      output={output}
      placeholder="待签名的消息内容…"
      note="使用 Web Crypto（HMAC）在本地计算消息认证码；密钥与内容均不上传。需 HTTPS 或 localhost 安全上下文。"
    >
      <label class="block">
        <span class="text-sm font-medium">密钥（Secret）</span>
        <input
          class="input input-bordered w-full mt-1.5 font-mono text-sm"
          value={secret}
          onInput={(e) => setSecret((e.target as HTMLInputElement).value)}
        />
      </label>
      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="text-sm font-medium">算法</span>
          <select
            class="select select-bordered select-sm w-full mt-1.5"
            value={algo}
            onChange={(e) => setAlgo((e.target as HTMLSelectElement).value as typeof algo)}
          >
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-1">SHA-1</option>
            <option value="SHA-512">SHA-512</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-medium">输出格式</span>
          <select
            class="select select-bordered select-sm w-full mt-1.5"
            value={fmt}
            onChange={(e) => setFmt((e.target as HTMLSelectElement).value as typeof fmt)}
          >
            <option value="hex">Hex</option>
            <option value="base64">Base64</option>
            <option value="base64url">Base64url</option>
          </select>
        </label>
      </div>
      <button type="button" class="btn btn-primary btn-sm" onClick={compute} disabled={busy}>
        {busy ? '计算中…' : '计算 HMAC'}
      </button>
    </DevTool>
  );
}
