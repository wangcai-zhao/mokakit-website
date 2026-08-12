import { useState, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/**
 * AES-256-GCM 加解密，密钥由 PBKDF2-SHA256（10 万次迭代）从密码派生。
 * 密文格式：base64(iv) : base64(salt) : base64(ciphertext)
 */

const ITERATIONS = 100_000;
const SALT_LEN = 16;
const IV_LEN = 12;

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64.trim());
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptText(plain: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await deriveKey(password, salt);
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain)),
  );
  return `${bytesToB64(iv)}:${bytesToB64(salt)}:${bytesToB64(cipher)}`;
}

async function decryptText(payload: string, password: string): Promise<string> {
  const parts = payload.trim().split(':');
  if (parts.length !== 3) {
    throw new Error('密文格式不正确，应为 iv:salt:ciphertext 三段 Base64');
  }
  const iv = b64ToBytes(parts[0]!);
  const salt = b64ToBytes(parts[1]!);
  const cipher = b64ToBytes(parts[2]!);
  const key = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return new TextDecoder().decode(plain);
}

export default function AesEncrypt() {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const switchMode = (m: 'encrypt' | 'decrypt') => {
    setMode(m);
    setOutput('');
    setError('');
  };

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  const run = async () => {
    if (busy) return;
    setError('');
    setOutput('');
    setBusy(true);
    try {
      const result =
        mode === 'encrypt'
          ? await encryptText(input, password)
          : await decryptText(input, password);
      setOutput(result);
    } catch (e) {
      setError((e as Error).message || '处理失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="space-y-4">
      <div class="join">
        <button
          type="button"
          class={`btn btn-sm join-item ${mode === 'encrypt' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => switchMode('encrypt')}
        >
          加密
        </button>
        <button
          type="button"
          class={`btn btn-sm join-item ${mode === 'decrypt' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => switchMode('decrypt')}
        >
          解密
        </button>
      </div>

      <div>
        <label class="text-sm font-medium" for="aes-input">
          {mode === 'encrypt' ? '明文内容' : '密文（iv:salt:ciphertext）'}
        </label>
        <textarea
          id="aes-input"
          class="textarea textarea-bordered mt-2 w-full font-mono text-sm"
          rows={5}
          placeholder={
            mode === 'encrypt' ? '输入要加密的文本…' : '粘贴由本工具生成的三段式 Base64 密文…'
          }
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
        />
      </div>

      <div>
        <label class="text-sm font-medium" for="aes-pwd">
          密码
        </label>
        <div class="join mt-2 w-full">
          <input
            id="aes-pwd"
            type={showPwd ? 'text' : 'password'}
            class="input input-bordered join-item w-full font-mono text-sm"
            placeholder="用于派生密钥的密码"
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            spellcheck={false}
            autocomplete="off"
          />
          <button
            type="button"
            class="btn btn-outline join-item"
            onClick={() => setShowPwd((v) => !v)}
          >
            {showPwd ? '隐藏' : '显示'}
          </button>
        </div>
        <p class="mt-1 text-xs opacity-55">
          密码越长越安全，忘记密码将无法恢复内容，本工具不保存任何密码。
        </p>
      </div>

      <button
        type="button"
        class={`btn btn-primary btn-sm ${busy ? 'loading' : ''}`}
        onClick={run}
        disabled={busy}
      >
        {busy ? '处理中…' : mode === 'encrypt' ? '加密' : '解密'}
      </button>

      {error && <div class="alert alert-error text-sm py-2">{error}</div>}

      {output && (
        <div class="rounded-xl bg-base-200 p-3 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium opacity-70">
              {mode === 'encrypt' ? '密文结果' : '解密结果'}
            </span>
            <div class="flex items-center gap-2">
              <span class="badge badge-ghost badge-sm">AES-256-GCM</span>
              <button
                type="button"
                class={`btn btn-xs ${copied === 'out' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(output, 'out')}
              >
                {copied === 'out' ? '已复制' : '复制'}
              </button>
            </div>
          </div>
          <textarea
            class="textarea textarea-bordered w-full h-28 text-xs font-mono"
            readOnly
            value={output}
          />
        </div>
      )}

      <div class="rounded-xl border border-base-300 p-3 text-xs opacity-70 space-y-1">
        <div class="flex justify-between">
          <span>密钥派生</span>
          <span class="font-mono">PBKDF2-SHA256 × {ITERATIONS.toLocaleString('en-US')}</span>
        </div>
        <div class="flex justify-between">
          <span>加密算法</span>
          <span class="font-mono">AES-GCM 256 位</span>
        </div>
        <div class="flex justify-between">
          <span>随机盐值 / 初始向量</span>
          <span class="font-mono">
            {SALT_LEN} 字节 / {IV_LEN} 字节
          </span>
        </div>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        加解密全部在浏览器本地完成，明文与密码不会离开你的设备。密文包含随机盐值与初始向量，
        因此相同内容每次加密结果都不同，属正常现象。
      </p>
    </div>
  );
}
