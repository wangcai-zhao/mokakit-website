#!/usr/bin/env node
/**
 * MokaKit 匿名访问量计数器（零依赖，仅用 node:http / node:fs / node:path）。
 *
 * 监听 127.0.0.1:18800，仅响应本机 Nginx 反代，不做跨站响应（不返回任何 CORS 头）。
 * 数据落地 /var/lib/mokakit/counters.json（systemd StateDirectory=mokakit 自动创建）。
 *
 * 内存 Map 为唯一真相源；启动加载 → 5s 防抖原子落盘 + 60s 兜底 flush + 信号同步 flush。
 * 服务永远起得来：文件缺失从空启动；JSON 解析失败则改名 .bad.<ts> 留档后从空启动。
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 18800);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = process.env.DATA_DIR || '/var/lib/mokakit';
const DATA_FILE = path.join(DATA_DIR, 'counters.json');

const MAX_KEYS = 50000;
const BODY_LIMIT = 8 * 1024; // 8KB
const KEY_RE = /^(view|use|site):[A-Za-z0-9/_\-.]{1,150}$/;

/** @type {Map<string, number>} */
const counts = new Map();

let debounceTimer = null;
let hardTimer = null;

function load() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        if (KEY_RE.test(k) && Number.isFinite(v)) counts.set(k, v);
      }
    }
  } catch (err) {
    if (err && err.code === 'ENOENT') return; // 首次启动，文件不存在，从空
    // 解析失败：保留损坏文件供排查，从空启动
    try {
      fs.renameSync(DATA_FILE, `${DATA_FILE}.bad.${Date.now()}`);
    } catch {}
  }
}

function persistSync() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  const obj = {};
  for (const [k, v] of counts) obj[k] = v;
  fs.writeFileSync(tmp, JSON.stringify(obj));
  fs.renameSync(tmp, DATA_FILE); // 原子替换
}

function persist() {
  try {
    persistSync();
  } catch {}
}

function scheduleFlush() {
  if (!debounceTimer) {
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      persist();
    }, 5000);
  }
  if (!hardTimer) {
    // 兜底：每 60s 强制落盘一次，防止高频写入把防抖不断打散导致永不落盘
    hardTimer = setInterval(persist, 60000);
    if (typeof hardTimer.unref === 'function') hardTimer.unref();
  }
}

function inc(key, delta) {
  const cur = counts.get(key) || 0;
  const next = cur + (Number.isFinite(delta) ? delta : 1);
  counts.set(key, next);
  scheduleFlush();
  return next;
}

function send(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > BODY_LIMIT) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseKeys(raw) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((k) => KEY_RE.test(k));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/health') {
    send(res, 200, { ok: true, keys: counts.size });
    return;
  }

  if (url.pathname !== '/api/count') {
    send(res, 404, { error: 'not found' });
    return;
  }

  try {
    if (req.method === 'GET') {
      let ks = parseKeys(url.searchParams.get('keys') || '');
      if (ks.length === 0) ks = parseKeys(url.searchParams.get('key') || ''); // 兼容单 key
      if (ks.length > 40) {
        send(res, 400, { error: 'too many keys' });
        return;
      }
      const out = {};
      for (const k of ks) out[k] = counts.get(k) || 0;
      send(res, 200, { counts: out });
      return;
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        send(res, 400, { error: 'bad json' });
        return;
      }
      const ks = Array.isArray(parsed.keys)
        ? parsed.keys.filter((k) => typeof k === 'string' && KEY_RE.test(k))
        : [];
      if (ks.length === 0) {
        send(res, 400, { error: 'no keys' });
        return;
      }
      const delta = Number.isFinite(parsed.delta) ? parsed.delta : 1;
      // 仅拒「新建」超出上限的 key，已存在的 key 仍可继续累加
      const fresh = ks.filter((k) => !counts.has(k));
      if (counts.size + fresh.length > MAX_KEYS) {
        send(res, 507, { error: 'key limit reached' });
        return;
      }
      const out = {};
      for (const k of ks) out[k] = inc(k, delta);
      send(res, 200, { counts: out });
      return;
    }

    send(res, 405, { error: 'method not allowed' });
  } catch {
    send(res, 500, { error: 'internal' });
  }
});

// 优雅退出：同步落盘后再退
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    if (hardTimer) clearInterval(hardTimer);
    if (debounceTimer) clearTimeout(debounceTimer);
    persist();
    server.close(() => process.exit(0));
    // 兜底强制退出
    const killer = setTimeout(() => process.exit(0), 1000);
    if (typeof killer.unref === 'function') killer.unref();
  });
}

load();
server.listen(PORT, HOST, () => {
  console.log(`[mokakit-counter] listening on ${HOST}:${PORT}, data=${DATA_FILE}`);
});
