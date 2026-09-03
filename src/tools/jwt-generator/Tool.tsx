import { useState } from 'preact/hooks';
import DevTool from '@/tools/_shared/dev-io';

function toB64url(b: Uint8Array): string {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const ALG_HASH: Record<string, string> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
};

export default function JwtGeneratorTool() {
  const [input, setInput] = useState('{\n  "sub": "1234567890",\n  "name": "张三",\n  "iat": 1516239022\n}');
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [alg, setAlg] = useState<'HS256' | 'HS384' | 'HS512'>('HS256');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const payload = JSON.parse(input);
      const header = { alg, typ: 'JWT' };
      const enc = (obj: unknown) => toB64url(new TextEncoder().encode(JSON.stringify(obj)));
      const data = `${enc(header)}.${enc(payload)}`;
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: ALG_HASH[alg] },
        false,
        ['sign'],
      );
      const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
      setOutput(`${data}.${toB64url(new Uint8Array(sig))}`);
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
      placeholder="粘贴 JWT payload（JSON 对象）…"
      note="生成 HS256/384/512 签名 JWT；密钥与 payload 均不上传，使用 Web Crypto 本地签名。需 HTTPS 或 localhost。"
    >
      <label class="block">
        <span class="text-sm font-medium">签名密钥（Secret）</span>
        <input
          class="input input-bordered w-full mt-1.5 font-mono text-sm"
          value={secret}
          onInput={(e) => setSecret((e.target as HTMLInputElement).value)}
        />
      </label>
      <label class="block">
        <span class="text-sm font-medium">算法</span>
        <select
          class="select select-bordered select-sm w-full mt-1.5"
          value={alg}
          onChange={(e) => setAlg((e.target as HTMLSelectElement).value as typeof alg)}
        >
          <option value="HS256">HS256</option>
          <option value="HS384">HS384</option>
          <option value="HS512">HS512</option>
        </select>
      </label>
      <button type="button" class="btn btn-primary btn-sm" onClick={generate} disabled={busy}>
        {busy ? '生成中…' : '生成 JWT'}
      </button>
    </DevTool>
  );
}
