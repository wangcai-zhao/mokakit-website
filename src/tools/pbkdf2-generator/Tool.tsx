import { useState, useEffect } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type HashAlgo = 'SHA-1' | 'SHA-256' | 'SHA-512';

export default function Pbkdf2Generator() {
  const [password, setPassword] = useState('mokakit-secret');
  const [salt, setSalt] = useState('mokakit-salt');
  const [iterations, setIterations] = useState('100000');
  const [keylen, setKeylen] = useState('32');
  const [hash, setHash] = useState<HashAlgo>('SHA-256');
  const [hex, setHex] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const iter = Number(iterations);
      const len = Number(keylen);
      if (!password) {
        setError('请输入密码');
        setHex('');
        return;
      }
      if (!salt) {
        setError('请输入盐值');
        setHex('');
        return;
      }
      if (!Number.isFinite(iter) || iter < 1) {
        setError('迭代次数须为正整数');
        setHex('');
        return;
      }
      if (!Number.isFinite(len) || len < 1 || len > 1024) {
        setError('密钥长度须为 1-1024 字节');
        setHex('');
        return;
      }
      setError('');
      setBusy(true);
      try {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          enc.encode(password),
          'PBKDF2',
          false,
          ['deriveBits'],
        );
        const bits = await crypto.subtle.deriveBits(
          { name: 'PBKDF2', salt: enc.encode(salt), iterations: iter, hash },
          keyMaterial,
          len * 8,
        );
        const bytes = new Uint8Array(bits);
        let out = '';
        for (let i = 0; i < bytes.length; i++) {
          out += bytes[i].toString(16).padStart(2, '0');
        }
        if (!cancelled) setHex(out);
      } catch (e) {
        if (!cancelled) setError(`计算失败：${(e as Error).message}`);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [password, salt, iterations, keylen, hash]);

  const copy = async () => {
    if (!hex) return;
    await copyText(hex);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">密码</span>
            <input
              type="text"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={password}
              onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">盐值 (salt)</span>
            <input
              type="text"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={salt}
              onInput={(e) => setSalt((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">迭代次数</span>
            <input
              type="number"
              step="1"
              min="1"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={iterations}
              onInput={(e) => setIterations((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">密钥长度 (字节)</span>
            <input
              type="number"
              step="1"
              min="1"
              max="1024"
              class="input input-bordered input-sm mt-1.5 w-full font-mono"
              value={keylen}
              onInput={(e) => setKeylen((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block sm:col-span-2">
            <span class="text-sm font-medium">哈希算法</span>
            <select
              class="select select-bordered select-sm mt-1.5 w-full"
              value={hash}
              onChange={(e) => setHash((e.target as HTMLSelectElement).value as HashAlgo)}
            >
              <option value="SHA-1">SHA-1</option>
              <option value="SHA-256">SHA-256</option>
              <option value="SHA-512">SHA-512</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <p class="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <div class="rounded-xl bg-base-200 p-3 sm:p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">
            派生密钥 (Hex){busy ? ' · 计算中…' : ''}
          </span>
          <button
            type="button"
            class={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={copy}
            disabled={!hex}
          >
            {copied ? '已复制' : '复制结果'}
          </button>
        </div>
        <p class="mt-3 break-all font-mono text-sm">{hex || '—'}</p>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        计算在浏览器本地通过 Web Crypto 完成，密码不上传。PBKDF2 用盐和多次迭代拉伸口令，迭代次数越高越抗暴力破解；建议不低于 10 万次。
      </p>
    </div>
  );
}
