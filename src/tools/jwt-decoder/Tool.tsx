import { useState, useEffect, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

function b64urlDecode(s: string): string {
  let t = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = t.length % 4;
  if (pad) t += '='.repeat(4 - pad);
  const bin = atob(t);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function pretty(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
function fmtTime(v: unknown): string {
  if (typeof v === 'number') {
    const d = new Date(v * 1000);
    if (!isNaN(d.getTime())) return `${d.toLocaleString('zh-CN')}（${v}）`;
  }
  return String(v);
}

interface Parsed {
  header: any;
  payload: any;
  sigLen: number;
}

export default function JwtDecoder() {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const t = input.trim();
    if (!t) {
      setParsed(null);
      setError('');
      return;
    }
    const parts = t.split('.');
    if (parts.length !== 3) {
      setParsed(null);
      setError('格式应为 3 段（用 . 分隔）：header.payload.signature');
      return;
    }
    try {
      const header = JSON.parse(b64urlDecode(parts[0]));
      const payload = JSON.parse(b64urlDecode(parts[1]));
      setParsed({ header, payload, sigLen: parts[2].length });
      setError('');
    } catch {
      setParsed(null);
      setError('解码失败：Header 或 Payload 不是合法 base64url 编码的 JSON');
    }
  }, [input]);

  const copy = async (label: string, text: string) => {
    try {
      await copyText(text);
      setCopied(label);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  };

  const sample =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuWbvueUqCIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  return (
    <div class="space-y-4">
      <label class="text-sm font-medium opacity-70" for="jwt-input">JWT 内容</label>
      <textarea
        id="jwt-input"
        class="textarea textarea-bordered w-full h-28 text-xs font-mono"
        placeholder="粘贴 JWT（三段，用 . 分隔）……"
        value={input}
        onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
      />

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          onClick={() => {
            setInput(sample);
            setCopied(null);
          }}
        >
          填入示例
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-xs"
          onClick={() => {
            setInput('');
            setParsed(null);
            setError('');
          }}
        >
          清空
        </button>
      </div>

      {error && <div class="alert alert-error text-sm py-2">{error}</div>}

      {parsed && (
        <div class="space-y-3">
          <div class="rounded-xl border border-base-300 p-3 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium opacity-70">Header（头部 / 算法）</span>
              <button
                type="button"
                class={`btn btn-xs ${copied === 'h' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy('h', pretty(parsed.header))}
              >
                {copied === 'h' ? '已复制' : '复制'}
              </button>
            </div>
            <pre class="whitespace-pre-wrap break-words text-xs bg-base-200 p-2 rounded-lg overflow-auto max-h-48">
              {pretty(parsed.header)}
            </pre>
          </div>

          <div class="rounded-xl border border-base-300 p-3 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium opacity-70">Payload（声明 / 数据）</span>
              <button
                type="button"
                class={`btn btn-xs ${copied === 'p' ? 'btn-success' : 'btn-ghost'}`}
                onClick={() => copy('p', pretty(parsed.payload))}
              >
                {copied === 'p' ? '已复制' : '复制'}
              </button>
            </div>
            <pre class="whitespace-pre-wrap break-words text-xs bg-base-200 p-2 rounded-lg overflow-auto max-h-64">
              {pretty(parsed.payload)
                .replace(/("(?:exp|iat|nbf|auth_time|updated_at|created_at)"\s*:\s*)(\d+)/g, '$1$2')}
            </pre>
            {parsed.payload && (
              <div class="text-xs opacity-55">
                {['exp', 'iat', 'nbf'].map((k) =>
                  parsed.payload[k] != null ? (
                    <div key={k}>
                      {k}：{fmtTime(parsed.payload[k])}
                    </div>
                  ) : null,
                )}
              </div>
            )}
          </div>

          <div class="rounded-xl bg-base-200 p-3 text-xs space-y-1">
            <div>
              Signature（签名）：{parsed.sigLen} 字符
              <span class="opacity-55">（本工具不验证签名，仅显示是否存在）</span>
            </div>
            <div class="opacity-70">
              算法：{parsed.header?.alg ?? '未知'} ｜ 类型：{parsed.header?.typ ?? '未知'}
            </div>
          </div>
        </div>
      )}

      <p class="text-xs opacity-55 leading-relaxed">
        解码完全在浏览器本地进行，令牌不会上传。注意：本工具不对签名做密码学验证，仅用于查看 claims 内容。
      </p>
    </div>
  );
}
