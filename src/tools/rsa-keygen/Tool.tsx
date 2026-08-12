import { useState } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function arrayBufferToPem(buf: ArrayBuffer, type: 'PUBLIC KEY' | 'PRIVATE KEY'): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin);
  const lines = b64.match(/.{1,64}/g)?.join('\n') ?? b64;
  return `-----BEGIN ${type}-----\n${lines}\n-----END ${type}-----\n`;
}

export default function RsaKeygen() {
  const [bits, setBits] = useState(2048);
  const [pub, setPub] = useState('');
  const [priv, setPriv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const gen = async () => {
    setError('');
    setLoading(true);
    setPub('');
    setPriv('');
    try {
      if (!crypto?.subtle) throw new Error('当前环境不支持 Web Crypto（需 https 或 localhost）');
      const kp = await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: bits,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify'],
      );
      const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
      const pkcs8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
      setPub(arrayBufferToPem(spki, 'PUBLIC KEY'));
      setPriv(arrayBufferToPem(pkcs8, 'PRIVATE KEY'));
    } catch (e: any) {
      setError(e?.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (which: 'pub' | 'priv') => {
    await copyText(which === 'pub' ? pub : priv);
    setCopied(which);
    window.setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm opacity-70">密钥长度：</span>
        <div class="join">
          {[2048, 4096].map((b) => (
            <button
              type="button"
              key={b}
              class={`btn btn-sm join-item ${bits === b ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setBits(b)}
            >
              {b} bit
            </button>
          ))}
        </div>
        <button
          type="button"
          class={`btn btn-primary btn-sm ${loading ? 'loading' : ''}`}
          onClick={gen}
          disabled={loading}
        >
          {loading ? '生成中…' : '生成密钥对'}
        </button>
      </div>

      {error && <div class="alert alert-error text-sm py-2">{error}</div>}

      {pub && (
        <div class="space-y-3">
          <div class="rounded-xl border border-base-300 p-3 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium opacity-70">公钥（PUBLIC KEY / SPKI）</span>
              <button
                type="button"
                class={`btn btn-xs ${copied === 'pub' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy('pub')}
              >
                {copied === 'pub' ? '已复制' : '复制'}
              </button>
            </div>
            <textarea
              id="rsa-pub"
              class="textarea textarea-bordered w-full h-28 text-xs font-mono"
              readOnly
              aria-label="生成的公钥（PEM / SPKI 格式）"
              value={pub}
            />
          </div>

          <div class="rounded-xl border border-base-300 p-3 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium opacity-70 text-error">私钥（PRIVATE KEY / PKCS#8，请妥善保管）</span>
              <button
                type="button"
                class={`btn btn-xs ${copied === 'priv' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy('priv')}
              >
                {copied === 'priv' ? '已复制' : '复制'}
              </button>
            </div>
            <textarea
              id="rsa-priv"
              class="textarea textarea-bordered w-full h-32 text-xs font-mono"
              readOnly
              aria-label="生成的私钥（PEM / PKCS#8 格式，请妥善保管）"
              value={priv}
            />
          </div>
          <p class="text-xs opacity-55">
            私钥仅在本地生成与显示，本工具不存储也不上传。请勿将测试密钥用于真实生产环境。
          </p>
        </div>
      )}

      {!pub && !loading && (
        <p class="text-sm opacity-55 text-center py-4">
          选择密钥长度后点击「生成密钥对」，即可在浏览器本地得到一对 PEM 格式 RSA 密钥。
        </p>
      )}
    </div>
  );
}
