import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Scenario = 'static' | 'reverse' | 'spa' | 'php' | 'redirect';

const SCENARIOS: { key: Scenario; label: string; desc: string }[] = [
  { key: 'static', label: '静态站点', desc: '纯 HTML/CSS/JS，带缓存与 gzip' },
  { key: 'spa', label: '单页应用', desc: 'Vue/React 前端路由回退到 index.html' },
  { key: 'reverse', label: '反向代理', desc: '转发到本地 Node/Java 服务' },
  { key: 'php', label: 'PHP 站点', desc: '转发给 PHP-FPM' },
  { key: 'redirect', label: '域名跳转', desc: 'HTTP 跳 HTTPS、裸域跳 www' },
];

export default function NginxConfigGenTool() {
  const [scenario, setScenario] = useState<Scenario>('static');
  const [domain, setDomain] = useState('www.mokakit.com');
  const [aliases, setAliases] = useState('mokakit.com');
  const [root, setRoot] = useState('/var/www/mokakit');
  const [port, setPort] = useState(3000);
  const [ssl, setSsl] = useState(true);
  const [certPath, setCertPath] = useState('/etc/letsencrypt/live/mokakit.com/fullchain.pem');
  const [keyPath, setKeyPath] = useState('/etc/letsencrypt/live/mokakit.com/privkey.pem');
  const [www, setWww] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = useMemo(() => {
    const serverName = [domain, ...(aliases ? aliases.split(/[\s,]+/).filter(Boolean) : [])].join(' ');
    const L: string[] = [];

    if (scenario === 'redirect') {
      L.push('server {');
      L.push('    listen 80;');
      L.push(`    server_name ${serverName};`);
      L.push('    return 301 https://' + (www ? `www.${domain.replace(/^www\./, '')}` : domain.replace(/^www\./, '')) + '$request_uri;');
      L.push('}');
      L.push('');
      L.push('server {');
      L.push('    listen 443 ssl;');
      L.push(`    server_name ${serverName};`);
      L.push(`    ssl_certificate     ${certPath};`);
      L.push(`    ssl_certificate_key ${keyPath};`);
      L.push('    return 301 https://' + (www ? `www.${domain.replace(/^www\./, '')}` : domain.replace(/^www\./, '')) + '$request_uri;');
      L.push('}');
      return L.join('\n');
    }

    L.push('server {');
    L.push('    listen 80;');
    L.push(`    server_name ${serverName};`);
    if (ssl) {
      L.push('    return 301 https://$host$request_uri;');
      L.push('}');
      L.push('');
      L.push('server {');
      L.push('    listen 443 ssl http2;');
      L.push(`    server_name ${serverName};`);
      L.push('');
      L.push(`    ssl_certificate     ${certPath};`);
      L.push(`    ssl_certificate_key ${keyPath};`);
      L.push('    ssl_protocols       TLSv1.2 TLSv1.3;');
      L.push('    ssl_ciphers         HIGH:!aNULL:!MD5;');
      L.push('    ssl_session_cache   shared:SSL:10m;');
    }
    L.push('');
    L.push('    charset utf-8;');
    L.push('    client_max_body_size 20m;');
    L.push('');
    L.push('    access_log /var/log/nginx/' + domain + '.access.log;');
    L.push('    error_log  /var/log/nginx/' + domain + '.error.log;');

    if (scenario === 'static' || scenario === 'spa') {
      L.push('');
      L.push(`    root ${root};`);
      L.push('    index index.html;');
      L.push('');
      L.push('    gzip on;');
      L.push('    gzip_types text/plain text/css application/javascript application/json image/svg+xml;');
      L.push('    gzip_min_length 1024;');
      L.push('');
      L.push('    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {');
      L.push('        expires 30d;');
      L.push('        add_header Cache-Control "public, immutable";');
      L.push('    }');
      if (scenario === 'spa') {
        L.push('');
        L.push('    location / {');
        L.push('        try_files $uri $uri/ /index.html;');
        L.push('    }');
      } else {
        L.push('');
        L.push('    location / {');
        L.push('        try_files $uri $uri/ =404;');
        L.push('    }');
      }
    }

    if (scenario === 'reverse') {
      L.push('');
      L.push('    location / {');
      L.push(`        proxy_pass http://127.0.0.1:${port};`);
      L.push('        proxy_http_version 1.1;');
      L.push('        proxy_set_header Host $host;');
      L.push('        proxy_set_header X-Real-IP $remote_addr;');
      L.push('        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;');
      L.push('        proxy_set_header X-Forwarded-Proto $scheme;');
      L.push('        proxy_set_header Upgrade $http_upgrade;');
      L.push('        proxy_set_header Connection "upgrade";');
      L.push('    }');
    }

    if (scenario === 'php') {
      L.push('');
      L.push(`    root ${root};`);
      L.push('    index index.php index.html;');
      L.push('');
      L.push('    location / {');
      L.push('        try_files $uri $uri/ /index.php?$query_string;');
      L.push('    }');
      L.push('');
      L.push('    location ~ \\.php$ {');
      L.push('        include fastcgi_params;');
      L.push(`        fastcgi_pass unix:/run/php/php8.2-fpm.sock;`);
      L.push('        fastcgi_index index.php;');
      L.push(`        fastcgi_param SCRIPT_FILENAME ${root}$fastcgi_script_name;`);
      L.push('    }');
    }

    L.push('}');
    return L.join('\n');
  }, [scenario, domain, aliases, root, port, ssl, certPath, keyPath, www]);

  return (
    <div class="space-y-4">
      <div>
        <span class="text-sm font-medium">场景</span>
        <div class="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((s) => (
            <button
              type="button"
              key={s.key}
              class={`rounded-xl border p-3 text-left transition ${
                scenario === s.key ? 'border-primary bg-primary/5' : 'border-base-300'
              }`}
              onClick={() => setScenario(s.key)}
            >
              <span class="block text-sm font-medium">{s.label}</span>
              <span class="mt-0.5 block text-xs opacity-55 leading-snug">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm font-medium">主域名</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-full font-mono"
            value={domain}
            onInput={(e) => setDomain((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="block">
          <span class="text-sm font-medium">其他域名（空格或逗号分隔）</span>
          <input
            type="text"
            class="input input-bordered mt-1.5 w-full font-mono"
            value={aliases}
            onInput={(e) => setAliases((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      {scenario !== 'redirect' && (
        <>
          {(scenario === 'static' || scenario === 'spa' || scenario === 'php') && (
            <label class="block">
              <span class="text-sm font-medium">站点根目录</span>
              <input
                type="text"
                class="input input-bordered mt-1.5 w-full font-mono"
                value={root}
                onInput={(e) => setRoot((e.target as HTMLInputElement).value)}
              />
            </label>
          )}
          {scenario === 'reverse' && (
            <label class="block">
              <span class="text-sm font-medium">本地服务端口</span>
              <input
                type="number"
                class="input input-bordered mt-1.5 w-full font-mono"
                value={port}
                onInput={(e) => setPort(Number((e.target as HTMLInputElement).value) || 3000)}
              />
            </label>
          )}
        </>
      )}

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="checkbox checkbox-sm"
            checked={ssl}
            onChange={(e) => setSsl((e.target as HTMLInputElement).checked)}
          />
          启用 HTTPS（80 自动跳 443）
        </label>
        {scenario === 'redirect' && (
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              checked={www}
              onChange={(e) => setWww((e.target as HTMLInputElement).checked)}
            />
            统一跳转到 www
          </label>
        )}
      </div>

      {ssl && (
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="text-sm font-medium">证书路径</span>
            <input
              type="text"
              class="input input-bordered mt-1.5 w-full font-mono text-xs"
              value={certPath}
              onInput={(e) => setCertPath((e.target as HTMLInputElement).value)}
            />
          </label>
          <label class="block">
            <span class="text-sm font-medium">私钥路径</span>
            <input
              type="text"
              class="input input-bordered mt-1.5 w-full font-mono text-xs"
              value={keyPath}
              onInput={(e) => setKeyPath((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
      )}

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">配置文件</span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={async () => {
              await copyText(config);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-96 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-xs leading-relaxed whitespace-pre">
          {config}
        </pre>
      </label>

      <p class="text-xs leading-relaxed opacity-55">
        生成的是可直接落地的片段：存成 /etc/nginx/conf.d/&lt;域名&gt;.conf 后
        <code class="mx-1">nginx -t</code> 校验，再
        <code class="mx-1">systemctl reload nginx</code> 生效。证书建议用 Certbot 自动签发续期，
        私钥路径不要放在 web 根目录里。
      </p>
    </div>
  );
}
