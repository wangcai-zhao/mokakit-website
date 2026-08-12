import { useState, useEffect, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

/**
 * RFC 6238 TOTP 实现（HMAC-SHA1 / 30 秒周期 / 6 位）。
 * 全部依赖浏览器原生 Web Crypto，密钥不出本机。
 */

const PERIOD = 30;
const DIGITS = 6;
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Base32 解码（RFC 4648，无填充要求），失败时抛出中文错误 */
function base32Decode(input: string): Uint8Array<ArrayBuffer> {
  const s = input
    .replace(/[\s-]/g, '')
    .replace(/=+$/, '')
    .toUpperCase();
  if (!s) throw new Error('请输入 Base32 密钥');

  let value = 0;
  let bits = 0;
  const out: number[] = [];
  for (const ch of s) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`密钥含非法字符「${ch}」，Base32 只允许 A-Z 与 2-7`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  if (out.length === 0) throw new Error('密钥太短，至少需要 2 个字符');
  return new Uint8Array(out);
}

/** 8 字节大端时间计数器 */
function counterToBytes(counter: number): ArrayBuffer {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);
  return buf;
}

async function totp(secret: Uint8Array<ArrayBuffer>, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterToBytes(counter)));

  // 动态截断：取最后一字节低 4 位作偏移，读 4 字节大端并抹掉符号位
  const offset = sig[sig.length - 1]! & 0x0f;
  const bin =
    ((sig[offset]! & 0x7f) << 24) |
    (sig[offset + 1]! << 16) |
    (sig[offset + 2]! << 8) |
    sig[offset + 3]!;

  return String(bin % 10 ** DIGITS).padStart(DIGITS, '0');
}

export default function TotpGenerator() {
  const [secret, setSecret] = useState('JBSWY3DPEHPK3PXP');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const timer = useRef<number | undefined>(undefined);

  // 每秒推进一次时钟
  useEffect(() => {
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const counter = Math.floor(now / PERIOD);
  const remain = PERIOD - (now % PERIOD);

  // 密钥或时间窗变化时重算
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const secretBytes = base32Decode(secret);
        const c = Math.floor(now / PERIOD);
        const otp = await totp(secretBytes, c);
        if (!cancelled) setCode(otp);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [secret, now]);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await copyText(text);
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium" for="totp-secret">
          Base32 密钥（Secret）
        </label>
        <input
          id="totp-secret"
          class="input input-bordered mt-2 w-full font-mono text-sm tracking-wider"
          placeholder="例如 JBSWY3DPEHPK3PXP"
          value={secret}
          onInput={(e) => setSecret((e.target as HTMLInputElement).value)}
          spellcheck={false}
          autocomplete="off"
        />
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <span class="text-xs opacity-55">示例：</span>
          {['JBSWY3DPEHPK3PXP', 'GEZDGNBVGY3TQOJQ'].map((s) => (
            <button
              type="button"
              key={s}
              class="btn btn-xs btn-outline font-mono"
              onClick={() => setSecret(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <div class="alert alert-error text-sm py-2">{error}</div>}

      {!error && (
        <div class="rounded-xl bg-base-200 p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium opacity-70">当前验证码</span>
            <div class="flex items-center gap-2">
              <span class="badge badge-ghost badge-sm">周期 {PERIOD}s</span>
              <button
                type="button"
                class={`btn btn-xs ${copied === 'code' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy(code, 'code')}
                disabled={!code}
              >
                {copied === 'code' ? '已复制' : '复制'}
              </button>
            </div>
          </div>

          <div class="text-center font-mono text-4xl sm:text-5xl font-bold tracking-[0.2em] tabular-nums">
            {code ? `${code.slice(0, 3)} ${code.slice(3)}` : '— — —'}
          </div>

          <div class="space-y-1">
            <progress
              class={`progress w-full ${remain <= 5 ? 'progress-error' : 'progress-primary'}`}
              value={remain}
              max={PERIOD}
            />
            <div class="flex justify-between text-xs opacity-60">
              <span>{remain <= 5 ? '即将刷新' : '有效中'}</span>
              <span class="tabular-nums">剩余 {remain} 秒</span>
            </div>
          </div>
        </div>
      )}

      <div class="rounded-xl border border-base-300 p-3 text-xs opacity-70 space-y-1">
        <div class="flex justify-between">
          <span>算法</span>
          <span class="font-mono">HMAC-SHA1（RFC 6238）</span>
        </div>
        <div class="flex justify-between">
          <span>时间计数器</span>
          <span class="font-mono">{counter}</span>
        </div>
        <div class="flex justify-between">
          <span>位数</span>
          <span class="font-mono">{DIGITS}</span>
        </div>
      </div>

      <p class="text-xs opacity-55 leading-relaxed">
        密钥仅在浏览器本地参与运算，不会上传或保存。验证码依赖设备时间，若与 App
        结果不一致，请先校准系统时钟。请勿在公共设备上输入真实账号的 2FA 密钥。
      </p>
    </div>
  );
}
