import { useState, useMemo } from 'preact/hooks';
import { copyText } from '@/tools/_shared/copy';

type Lang = 'fetch' | 'axios' | 'python' | 'go' | 'php';

interface Parsed {
  url: string;
  method: string;
  headers: Record<string, string>;
  data?: string;
  form?: Record<string, string>;
}

/** 简易 curl 解析：够用就好，不追求覆盖 curl 的全部语法 */
function parseCurl(cmd: string): Parsed {
  const tokens: string[] = [];
  const re = /"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cmd))) tokens.push(m[1] ?? m[2] ?? m[3]);

  const out: Parsed = { url: '', method: 'GET', headers: {} };
  let i = 0;
  if (tokens[i] === 'curl') i += 1;

  while (i < tokens.length) {
    const t = tokens[i];
    if (t === '-X' || t === '--request') {
      out.method = tokens[i + 1]?.toUpperCase() ?? 'GET';
      i += 2;
    } else if (t === '-H' || t === '--header') {
      const h = tokens[i + 1] ?? '';
      const at = h.indexOf(':');
      if (at > 0) out.headers[h.slice(0, at).trim()] = h.slice(at + 1).trim();
      i += 2;
    } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-binary') {
      const body = tokens[i + 1] ?? '';
      const ct = Object.entries(out.headers).find(([k]) => k.toLowerCase() === 'content-type');
      if (body.includes('=') && (!ct || ct[1].includes('x-www-form-urlencoded'))) {
        out.form = {};
        for (const [k, v] of new URLSearchParams(body)) out.form[k] = v;
      } else {
        out.data = body;
      }
      if (out.method === 'GET') out.method = 'POST';
      i += 2;
    } else if (t === '-F' || t === '--form') {
      out.method = 'POST';
      i += 2;
    } else if (t === '-u' || t === '--user') {
      out.headers['Authorization'] = `Basic ${tokens[i + 1] ?? ''}`;
      i += 2;
    } else if (t === '-A' || t === '--user-agent') {
      out.headers['User-Agent'] = tokens[i + 1] ?? '';
      i += 2;
    } else if (t === '--compressed') {
      i += 1;
    } else if (t.startsWith('-')) {
      i += 1;
    } else {
      if (!out.url) out.url = t;
      i += 1;
    }
  }
  return out;
}

const SAMPLE = `curl -X POST https://api.example.com/v1/orders \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer abc123" \\
  -d '{"sku": "A-01", "qty": 2}'`;

export default function CurlConverterTool() {
  const [cmd, setCmd] = useState(SAMPLE);
  const [lang, setLang] = useState<Lang>('fetch');
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseCurl(cmd), [cmd]);

  const code = useMemo(() => {
    const { url, method, headers, data, form } = parsed;
    if (!url) return '// 没解析到 URL，请检查 curl 命令';
    const isJson = (headers['Content-Type'] ?? headers['content-type'] ?? '').includes('json');

    if (lang === 'fetch') {
      const h = Object.keys(headers).length
        ? `headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n    ')},`
        : '';
      let body = '';
      if (data) {
        body = isJson ? `body: JSON.stringify(${data}),\n    ` : `body: ${JSON.stringify(data)},\n    `;
      } else if (form) {
        body = `body: new URLSearchParams(${JSON.stringify(form)}),\n    `;
      }
      return `const res = await fetch(${JSON.stringify(url)}, {\n  method: ${JSON.stringify(method)},\n    ${h}\n    ${body}});\nconst data = await res.json();`;
    }

    if (lang === 'axios') {
      const h = Object.keys(headers).length ? `headers: ${JSON.stringify(headers)},` : '';
      let body = '';
      if (data) body = isJson ? `data: ${data},` : `data: ${JSON.stringify(data)},`;
      else if (form) body = `data: new URLSearchParams(${JSON.stringify(form)}),`;
      return `import axios from 'axios';\n\nconst { data } = await axios({\n  url: ${JSON.stringify(url)},\n  method: ${JSON.stringify(method.toLowerCase())},\n  ${h}\n  ${body}\n});`;
    }

    if (lang === 'python') {
      const h = Object.entries(headers)
        .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
        .join('\n');
      let body = '';
      if (data) body = isJson ? `, json=${data}` : `, data=${JSON.stringify(data)}`;
      else if (form) body = `, data=${JSON.stringify(form)}`;
      return `import requests\n\nresp = requests.request(\n    ${JSON.stringify(method)},\n    ${JSON.stringify(url)},\n    headers={\n${h}\n    }${body},\n    timeout=10,\n)\nresp.raise_for_status()\nprint(resp.json())`;
    }

    if (lang === 'go') {
      let bodyExpr = 'nil';
      if (data) bodyExpr = `strings.NewReader(${JSON.stringify(data)})`;
      else if (form) {
        bodyExpr = `strings.NewReader(${JSON.stringify(
          Object.entries(form).map(([k, v]) => `${k}=${v}`).join('&'),
        )})`;
      }
      const h = Object.entries(headers)
        .map(([k, v]) => `req.Header.Set(${JSON.stringify(k)}, ${JSON.stringify(v)})`)
        .join('\n');
      return `package main

import (
\t"io"
\t"net/http"
\t"os"
${bodyExpr !== 'nil' ? '\t"strings"\n' : ''})

func main() {
\treq, _ := http.NewRequest(${JSON.stringify(method)}, ${JSON.stringify(url)}, ${bodyExpr})
${h}
\tresp, err := http.DefaultClient.Do(req)
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer resp.Body.Close()
\tio.Copy(os.Stdout, resp.Body)
}`;
    }

    // PHP
    const h = Object.entries(headers)
      .map(([k, v]) => `    ${JSON.stringify(`${k}: ${v}`)},`)
      .join('\n');
    let body = '';
    if (data) {
      body = isJson
        ? `\n$body = ${JSON.stringify(data)};`
        : `\n$body = ${JSON.stringify(data)};`;
    } else if (form) {
      body = `\n$body = http_build_query(${JSON.stringify(form)});`;
    }
    return `<?php
$url = ${JSON.stringify(url)};${body}
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => ${JSON.stringify(method)},
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
${h}
    ],
${body ? '    CURLOPT_POSTFIELDS => $body,\n' : ''}]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;`;
  }, [parsed, lang]);

  return (
    <div class="space-y-4">
      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">curl 命令</span>
          <button type="button" class="btn btn-xs btn-ghost" onClick={() => setCmd(SAMPLE)}>
            填入示例
          </button>
        </div>
        <textarea
          class="textarea textarea-bordered w-full font-mono text-sm"
          rows={6}
          placeholder="curl -X POST https://api.example.com/ ..."
          value={cmd}
          onInput={(e) => setCmd((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      <div class="flex flex-wrap gap-2">
        {(
          [
            ['fetch', 'JavaScript fetch'],
            ['axios', 'Axios'],
            ['python', 'Python requests'],
            ['go', 'Go'],
            ['php', 'PHP cURL'],
          ] as [Lang, string][]
        ).map(([k, label]) => (
          <button
            type="button"
            key={k}
            class={`btn btn-sm ${lang === k ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setLang(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {parsed.url && (
        <div class="flex flex-wrap gap-2 text-sm">
          <span class="badge badge-primary badge-outline">{parsed.method}</span>
          <span class="badge badge-ghost break-all">{parsed.url}</span>
          <span class="badge badge-outline">{Object.keys(parsed.headers).length} 个请求头</span>
        </div>
      )}

      <label class="block">
        <div class="mb-1.5 flex items-center justify-between">
          <span class="text-sm font-medium">转换结果</span>
          <button
            type="button"
            class={`btn btn-xs ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={async () => {
              await copyText(code);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <pre class="max-h-96 overflow-auto rounded-xl bg-base-200 p-3 font-mono text-sm whitespace-pre">
          {code}
        </pre>
      </label>

      <p class="text-xs leading-relaxed opacity-55">
        浏览器「复制为 cURL」出来的命令可以直接粘进来转成各语言代码，联调时省得手敲。
        解析器按常见写法实现，不支持 -F 文件上传、cookie jar 等复杂参数，
        遇到解析不对的地方手动改一下即可。全部在本地完成。
      </p>
    </div>
  );
}
