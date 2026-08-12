/**
 * 本地预览 + 计数反代（仅用于开发/预览验证，不参与生产部署）。
 *
 * 生产环境由 Nginx 反代 /api/* → 本机计数服务 127.0.0.1:18800。
 * 本地没有 Nginx，这里用纯 Node 同时：
 *   1. 从 dist/ 提供静态文件（含 SPA 回退到 index.html）
 *   2. 把 /api/* 转发到 127.0.0.1:18800（计数服务）
 * 这样前端 fetch('/api/count') 在预览面板里能真跑通，数字才会出来。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const TARGET = { host: '127.0.0.1', port: Number(process.env.COUNTER_PORT || 18800) };
const PORT = Number(process.env.PORT || 60990);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
};

function proxyApi(req, res) {
  const opts = {
    host: TARGET.host,
    port: TARGET.port,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${TARGET.host}:${TARGET.port}` },
  };
  const p = http.request(opts, (pr) => {
    res.writeHead(pr.statusCode || 502, pr.headers);
    pr.pipe(res);
  });
  p.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'counter service unreachable' }));
  });
  req.pipe(p);
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  if (u.pathname.startsWith('/api/')) return proxyApi(req, res);

  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(DIST, p);
  if (!file.startsWith(DIST)) {
    res.writeHead(403);
    return res.end('forbidden');
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      fs.readFile(path.join(DIST, 'index.html'), (e2, b2) => {
        if (e2) {
          res.writeHead(404);
          return res.end('not found');
        }
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(b2);
      });
      return;
    }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[preview-counter] http://127.0.0.1:${PORT}/  (proxies /api/* → ${TARGET.host}:${TARGET.port})`);
});
