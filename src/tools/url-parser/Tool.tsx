import { useState, useMemo, useRef } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

const SAMPLE =
  'https://www.mokakit.com:8443/tools/url-parser?utm_source=weixin&utm_medium=share&kw=在线工具#faq';

interface Field {
  key: string;
  label: string;
  value: string;
  desc: string;
}

interface Parsed {
  error: string;
  fields: Field[];
  params: { key: string; value: string }[];
}

function parse(raw: string): Parsed {
  const empty: Parsed = { error: '', fields: [], params: [] };
  const text = raw.trim();
  if (!text) return empty;
  let u: URL | null = null;
  try {
    u = new URL(text);
  } catch {
    return { error: '不是合法的 URL（需以 http:// 或 https:// 开头）', fields: [], params: [] };
  }
  const fields: Field[] = [
    { key: 'protocol', label: '协议', value: u.protocol, desc: '通信协议' },
    { key: 'host', label: '主机', value: u.host, desc: '域名 + 端口' },
    { key: 'hostname', label: '域名', value: u.hostname, desc: '主机名' },
    { key: 'port', label: '端口', value: u.port || '(默认)', desc: '端口号' },
    { key: 'pathname', label: '路径', value: u.pathname, desc: '资源路径' },
    { key: 'hash', label: '锚点', value: u.hash || '(无)', desc: '# 之后的片段' },
  ];
  const params: { key: string; value: string }[] = [];
  u.searchParams.forEach((v, k) => params.push({ key: k, value: v }));
  return { error: '', fields, params };
}

export default function UrlParser() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const parsed = useMemo(() => parse(input), [input]);

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
        <div class="mb-2 flex items-center justify-between">
          <label class="text-sm font-medium" for="up-input">
            网址 URL
          </label>
          <button type="button" class="btn btn-xs btn-ghost" onClick={() => setInput(SAMPLE)}>
            填入示例
          </button>
        </div>
        <input
          id="up-input"
          type="text"
          class="input input-bordered w-full font-mono text-sm"
          placeholder="https://example.com/path?a=1&b=2#top"
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
        />
      </div>

      {parsed.error && <p class="text-sm text-error">{parsed.error}</p>}

      {parsed.fields.length > 0 && (
        <div>
          <h3 class="mb-2 text-sm font-medium">结构拆解</h3>
          <div class="overflow-x-auto rounded-xl bg-base-200 p-1">
            <table class="table table-sm">
              <tbody>
                {parsed.fields.map((f) => (
                  <tr key={f.key}>
                    <td class="whitespace-nowrap font-medium">{f.label}</td>
                    <td class="font-mono break-all">{f.value}</td>
                    <td class="whitespace-nowrap text-xs opacity-55">{f.desc}</td>
                    <td class="text-right">
                      <button
                        type="button"
                        class={`btn btn-xs ${copied === f.key ? 'btn-success' : 'btn-ghost'}`}
                        onClick={() => copy(f.value, f.key)}
                      >
                        {copied === f.key ? '已复制' : '复制'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {parsed.fields.length > 0 && (
        <div>
          <div class="mb-2 flex items-center gap-2">
            <h3 class="text-sm font-medium">查询参数</h3>
            <span class="badge badge-sm badge-ghost">{parsed.params.length} 个</span>
          </div>
          {parsed.params.length === 0 ? (
            <p class="rounded-xl bg-base-200 p-3 text-sm opacity-55">该网址没有查询参数</p>
          ) : (
            <div class="overflow-x-auto rounded-xl bg-base-200 p-1">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>参数名</th>
                    <th>参数值（已解码）</th>
                    <th class="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.params.map((p, i) => (
                    <tr key={`${p.key}-${i}`}>
                      <td class="whitespace-nowrap font-mono font-medium">{p.key}</td>
                      <td class="font-mono break-all">{p.value || <span class="opacity-40">(空)</span>}</td>
                      <td class="text-right">
                        <button
                          type="button"
                          class={`btn btn-xs ${copied === `p${i}` ? 'btn-success' : 'btn-ghost'}`}
                          onClick={() => copy(p.value, `p${i}`)}
                        >
                          {copied === `p${i}` ? '已复制' : '复制'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <p class="text-xs leading-relaxed opacity-55">
        基于浏览器原生 URL 标准解析，参数值自动百分号解码，同名参数会逐条列出。全部处理在本地完成，链接不会上传。
      </p>
    </div>
  );
}
