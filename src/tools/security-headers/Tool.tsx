import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Kind = 'nginx' | 'apache' | 'vercel' | 'netlify' | 'express' | 'meta';

interface Header {
  key: string;
  value: string;
  desc: string;
}

export default function SecurityHeadersTool() {
  const [domain, setDomain] = useState('mokakit.com');
  const [https, setHttps] = useState(true);
  const [maxAge, setMaxAge] = useState(31536000);
  const [cdn, setCdn] = useState(false);
  const [inlineScript, setInlineScript] = useState(false);
  const [frame, setFrame] = useState<'none' | 'self' | 'allow'>('none');
  const [kind, setKind] = useState<Kind>('nginx');
  const [copied, setCopied] = useState(false);
  /** 被用户手动关掉的响应头；HSTS 还会额外受 https 开关约束 */
  const [off, setOff] = useState<string[]>(['Cross-Origin-Opener-Policy', 'Cross-Origin-Resource-Policy']);

  const toggle = (key: string) =>
    setOff((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const headers = useMemo<Header[]>(() => {
    const list: Header[] = [];
    list.push({
      key: 'Strict-Transport-Security',
      value: `max-age=${maxAge}${https ? '; includeSubDomains; preload' : ''}`,
      desc: '强制浏览器只用 HTTPS 访问，防降级劫持',
    });
    list.push({
      key: 'X-Content-Type-Options',
      value: 'nosniff',
      desc: '禁止浏览器猜测 MIME 类型，防脚本伪装成图片执行',
    });
    list.push({
      key: 'X-Frame-Options',
      value: frame === 'none' ? 'DENY' : frame === 'self' ? 'SAMEORIGIN' : `ALLOW-FROM https://${domain}`,
      desc: '防止页面被嵌进 iframe 遭受点击劫持',
    });
    list.push({
      key: 'Referrer-Policy',
      value: 'strict-origin-when-cross-origin',
      desc: '跨站请求只带来源域名，不带完整路径',
    });
    list.push({
      key: 'Permissions-Policy',
      value: 'geolocation=(), microphone=(), camera=()',
      desc: '默认关掉定位、麦克风、摄像头等高敏能力',
    });
    const cspParts = [
      "default-src 'self'",
      `script-src 'self'${inlineScript ? " 'unsafe-inline'" : ''}${cdn ? ' https://cdn.jsdelivr.net' : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];
    list.push({
      key: 'Content-Security-Policy',
      value: cspParts.join('; '),
      desc: '白名单机制，从源头挡住大部分 XSS',
    });
    list.push({
      key: 'Cross-Origin-Opener-Policy',
      value: 'same-origin',
      desc: '隔离跨窗口引用，配合 COEP 可用 SharedArrayBuffer',
    });
    list.push({
      key: 'Cross-Origin-Resource-Policy',
      value: 'same-origin',
      desc: '阻止别的站点把你的资源当子资源加载',
    });
    return list;
  }, [domain, https, maxAge, cdn, inlineScript, frame]);

  const active = headers.filter(
    (h) => !off.includes(h.key) && (h.key !== 'Strict-Transport-Security' || https),
  );

  const snippet = useMemo(() => {
    const L: string[] = [];
    if (kind === 'nginx') {
      for (const h of active) {
        L.push(`add_header ${h.key} "${h.value}" always;`);
      }
      return L.join('\n');
    }
    if (kind === 'apache') {
      for (const h of active) {
        L.push(`Header always set ${h.key} "${h.value}"`);
      }
      return L.join('\n');
    }
    if (kind === 'vercel') {
      return JSON.stringify(
        {
          headers: [
            {
              source: '/(.*)',
              headers: active.map((h) => ({ key: h.key, value: h.value })),
            },
          ],
        },
        null,
        2,
      );
    }
    if (kind === 'netlify') {
      return `[[headers]]\n  for = "/*"\n\n  [headers.values]\n${active
        .map((h) => `    ${h.key} = "${h.value}"`)
        .join('\n')}`;
    }
    if (kind === 'express') {
      const obj = active.map((h) => `  res.setHeader('${h.key}', '${h.value}');`).join('\n');
      return `app.use((req, res, next) => {\n${obj}\n  next();\n});`;
    }
    // meta
    return active
      .filter((h) => h.key === 'Content-Security-Policy' || h.key === 'Referrer-Policy')
      .map((h) => `<meta http-equiv="${h.key}" content="${h.value}">`)
      .join('\n');
  }, [active, kind]);

  return (
    <div class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">站点域名</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-full font-mono"
            value={domain}
            onInput={(e) => setDomain((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="flex items-center justify-between text-sm font-medium">
            <span>HSTS 有效期（秒）</span>
            <span class="opacity-60">{maxAge}</span>
          </span>
          <input
            type="range"
            min="300"
            max="63072000"
            step="3600"
            class="range range-primary mt-2 w-full"
            value={maxAge}
            disabled={!https}
            onInput={(e) => setMaxAge(Number((e.target as HTMLInputElement).value))}
          />
        </label>
      </div>

      <div class="flex flex-wrap gap-4 rounded-xl bg-base-200 px-4 py-3">
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={https}
            onChange={(e) => setHttps((e.target as HTMLInputElement).checked)}
          />
          站点已全站 HTTPS
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={cdn}
            onChange={(e) => setCdn((e.target as HTMLInputElement).checked)}
          />
          用 jsDelivr 等 CDN 加载脚本
        </label>
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={inlineScript}
            onChange={(e) => setInlineScript((e.target as HTMLInputElement).checked)}
          />
          页面里有内联脚本
        </label>
      </div>

      <label class="block">
        <span class="text-sm font-medium">是否允许被 iframe 嵌入</span>
        <select
          class="select select-bordered mt-1.5 w-full sm:max-w-xs"
          value={frame}
          onChange={(e) => setFrame((e.target as HTMLSelectElement).value as 'none' | 'self' | 'allow')}
        >
          <option value="none">完全禁止</option>
          <option value="self">只允许本站</option>
          <option value="allow">允许指定域名</option>
        </select>
      </label>

      <div class="space-y-2">
        <span class="text-sm font-medium">响应头清单</span>
        {headers.map((h) => {
          const isHsts = h.key === 'Strict-Transport-Security';
          const checked = !off.includes(h.key) && (!isHsts || https);
          return (
          <label
            class="flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 bg-base-100 p-3"
            key={h.key}
          >
            <input
              type="checkbox"
              class="checkbox checkbox-sm mt-0.5"
              checked={checked}
              disabled={isHsts && !https}
              onChange={() => toggle(h.key)}
            />
            <span class="min-w-0 flex-1">
              <span class="block font-mono text-sm font-medium">{h.key}</span>
              <span class="mt-0.5 block break-all font-mono text-xs opacity-60">{h.value}</span>
              <span class="mt-1 block text-xs opacity-55 leading-snug">{h.desc}</span>
            </span>
          </label>
          );
        })}
      </div>

      <div class="flex flex-wrap gap-2">
        {(
          [
            ['nginx', 'Nginx'],
            ['apache', 'Apache'],
            ['express', 'Express'],
            ['vercel', 'Vercel'],
            ['netlify', 'Netlify'],
            ['meta', 'HTML meta'],
          ] as [Kind, string][]
        ).map(([k, label]) => (
          <button
            type="button"
            key={k}
            class={`btn btn-sm ${kind === k ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setKind(k)}
          >
            {label}
          </button>
        ))}
      </div>

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">配置片段</span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={async () => {
              await copyText(snippet);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-80 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
          {snippet}
        </pre>
      </label>

      <p class="text-xs leading-relaxed opacity-55">
        CSP 是最有用也最容易把站点搞挂的一条：加了之后第三方统计、广告、内联脚本都会被拦，
        上线前记得开着控制台走一遍全站。建议先用 Content-Security-Policy-Report-Only 观察一周再切正式。
      </p>
    </div>
  );
}
