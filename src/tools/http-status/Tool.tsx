import { useState } from 'preact/hooks';

interface Code {
  code: number;
  name: string;
  cat: string;
  desc: string;
}

const CODES: Code[] = [
  { code: 100, name: 'Continue', cat: '1xx', desc: '服务器已收到请求头，客户端应继续发送请求体' },
  { code: 101, name: 'Switching Protocols', cat: '1xx', desc: '服务器同意切换协议（如升级到 WebSocket）' },
  { code: 102, name: 'Processing', cat: '1xx', desc: '服务器正在处理，尚未完成' },
  { code: 200, name: 'OK', cat: '2xx', desc: '请求成功，响应包含所请求的数据' },
  { code: 201, name: 'Created', cat: '2xx', desc: '请求成功并创建了新资源' },
  { code: 202, name: 'Accepted', cat: '2xx', desc: '请求已接受，但处理尚未完成' },
  { code: 204, name: 'No Content', cat: '2xx', desc: '请求成功，但响应无内容' },
  { code: 206, name: 'Partial Content', cat: '2xx', desc: '服务器返回了部分内容（断点续传）' },
  { code: 301, name: 'Moved Permanently', cat: '3xx', desc: '资源已永久移动到新 URL' },
  { code: 302, name: 'Found', cat: '3xx', desc: '资源临时位于另一个 URL' },
  { code: 304, name: 'Not Modified', cat: '3xx', desc: '资源未修改，客户端可使用缓存' },
  { code: 307, name: 'Temporary Redirect', cat: '3xx', desc: '临时重定向，方法不变' },
  { code: 308, name: 'Permanent Redirect', cat: '3xx', desc: '永久重定向，方法不变' },
  { code: 400, name: 'Bad Request', cat: '4xx', desc: '服务器无法理解请求（语法错误）' },
  { code: 401, name: 'Unauthorized', cat: '4xx', desc: '需要身份验证' },
  { code: 403, name: 'Forbidden', cat: '4xx', desc: '服务器拒绝执行（无权限）' },
  { code: 404, name: 'Not Found', cat: '4xx', desc: '资源不存在' },
  { code: 405, name: 'Method Not Allowed', cat: '4xx', desc: '请求方法不被允许' },
  { code: 408, name: 'Request Timeout', cat: '4xx', desc: '请求超时' },
  { code: 409, name: 'Conflict', cat: '4xx', desc: '请求与资源当前状态冲突' },
  { code: 410, name: 'Gone', cat: '4xx', desc: '资源已永久删除' },
  { code: 413, name: 'Payload Too Large', cat: '4xx', desc: '请求体过大' },
  { code: 415, name: 'Unsupported Media Type', cat: '4xx', desc: '不支持的媒体类型' },
  { code: 418, name: "I'm a teapot", cat: '4xx', desc: '彩蛋：我是茶壶（RFC 2324）' },
  { code: 422, name: 'Unprocessable Entity', cat: '4xx', desc: '语义错误，无法处理' },
  { code: 429, name: 'Too Many Requests', cat: '4xx', desc: '请求过于频繁，被限流' },
  { code: 500, name: 'Internal Server Error', cat: '5xx', desc: '服务器内部错误' },
  { code: 501, name: 'Not Implemented', cat: '5xx', desc: '服务器不支持该功能' },
  { code: 502, name: 'Bad Gateway', cat: '5xx', desc: '网关或代理收到无效响应' },
  { code: 503, name: 'Service Unavailable', cat: '5xx', desc: '服务暂时不可用（过载或维护）' },
  { code: 504, name: 'Gateway Timeout', cat: '5xx', desc: '网关或代理等待超时' },
  { code: 505, name: 'HTTP Version Not Supported', cat: '5xx', desc: '不支持的 HTTP 版本' },
];

const CATS = ['全部', '1xx', '2xx', '3xx', '4xx', '5xx'];

export default function HttpStatus() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('全部');

  const filtered = CODES.filter((c) => {
    if (cat !== '全部' && c.cat !== cat) return false;
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      String(c.code).includes(s) ||
      c.name.toLowerCase().includes(s) ||
      c.desc.toLowerCase().includes(s)
    );
  });

  return (
    <div class="space-y-3">
      <label class="sr-only" for="http-status-q">搜索状态码</label>
      <input
        id="http-status-q"
        class="input input-bordered w-full text-sm"
        aria-label="搜索状态码或含义"
        placeholder="搜索状态码或含义（如 404、timeout、重定向）"
        value={q}
        onInput={(e) => setQ((e.target as HTMLInputElement).value)}
      />

      <div class="flex flex-wrap gap-1">
        {CATS.map((c) => (
          <button
            type="button"
            key={c}
            class={`btn btn-xs ${cat === c ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div class="overflow-x-auto rounded-xl border border-base-300">
        <table class="table table-sm text-sm">
          <thead>
            <tr>
              <th class="w-20">状态码</th>
              <th>名称</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.code}>
                <td>
                  <span
                    class={`font-mono font-semibold ${
                      c.cat === '2xx'
                        ? 'text-success'
                        : c.cat === '3xx'
                          ? 'text-info'
                          : c.cat === '4xx'
                            ? 'text-warning'
                            : c.cat === '5xx'
                              ? 'text-error'
                              : 'opacity-70'
                    }`}
                  >
                    {c.code}
                  </span>
                </td>
                <td class="font-medium whitespace-nowrap">{c.name}</td>
                <td class="opacity-70">{c.desc}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} class="text-center opacity-55 py-4">
                  没有匹配的状态码
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p class="text-xs opacity-55">收录开发调试中最常见的一批状态码，纯静态数据，离线可用。</p>
    </div>
  );
}
