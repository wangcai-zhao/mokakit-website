#!/usr/bin/env node
// ============================================================
// MokaKit IndexNow 主动推送脚本
//
// 用途：构建/部署后，把站点所有 URL 主动 ping 给 Bing/Yandex 等，
//       让搜索引擎分钟级来抓取，不再被动等 sitemap 重新发现。
//
// 协议：https://www.indexnow.org/
//   - key 文件必须放在站点根目录，内容就是 key 本身
//   - 推送时 POST 一个 JSON：{ host, key, keyLocation, urlList }
//   - 单批最多 10000 个 URL
//
// 用法：
//   npm run indexnow                              # 推默认 host（生产）
//   npm run indexnow -- --host=https://staging...  # 推送自定义 host
//   INDEXNOW_KEY=xxx npm run indexnow             # 临时换 key
//
// 设计选择：
//   - key 直接硬编码（key 文件本身就在站点根目录公开可访问，无秘密）
//   - URL 列表来源：dist/sitemap-0.xml（Astro @astrojs/sitemap 产出，
//     已含 507 个绝对 URL，含主页/工具页/单位换算子页/好站导航等）
//   - 推送目标用统一 endpoint（api.indexnow.org）—— Bing/Yandex/Naver/Seznam 都共享
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(__dirname, '..');

// ---- 配置 ----
const DEFAULT_KEY = 'b5b1cf529bd3caec8ea20babd4741a84';
const DEFAULT_HOST = 'www.mokakit.com';
const SITEMAP_PATH = path.join(PROJECT_DIR, 'dist', 'sitemap-0.xml');
const SITEMAP_INDEX_PATH = path.join(PROJECT_DIR, 'dist', 'sitemap-index.xml');
const API_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_PER_BATCH = 10000;

// ---- 解析 CLI 参数 ----
function parseArgs() {
  const args = { host: DEFAULT_HOST, key: process.env.DEFAULT_KEY || DEFAULT_KEY };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--host' && argv[i + 1]) {
      args.host = argv[i + 1].replace(/\/+$/, '');
      i++;
    } else if (argv[i] === '--key' && argv[i + 1]) {
      args.key = argv[i + 1];
      i++;
    }
  }
  return args;
}

// ---- 颜色输出 ----
const c = {
  ok: (s) => `\x1b[32m  ✓ ${s}\x1b[0m`,
  warn: (s) => `\x1b[33m  ⚠ ${s}\x1b[0m`,
  err: (s) => `\x1b[31m  ✗ ${s}\x1b[0m`,
  head: (s) => `\n\x1b[1m${s}\x1b[0m`,
};

// ---- 从 sitemap 提取 URL 列表 ----
function extractUrls(sitemapPath) {
  if (!fs.existsSync(sitemapPath)) return [];
  const xml = fs.readFileSync(sitemapPath, 'utf-8');
  // 匹配 <loc>...</loc>
  const matches = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)];
  return matches.map((m) => m[1].trim()).filter(Boolean);
}

// ---- 找到站点根的 key 文件名（Astro 会把 public/* 原样复制到 dist/） ----
function getKeyFileName(key) {
  return `${key}.txt`;
}

// ---- 推送一批 URL ----
async function pushBatch(host, key, urls) {
  const keyLocation = `https://${host}/${key}.txt`;
  const body = JSON.stringify({
    host,
    key,
    keyLocation,
    urlList: urls,
  });

  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body,
  });

  // IndexNow 文档：200 OK = 成功；4xx = 请求问题；2xx（除 200）通常没问题
  const text = await res.text();
  return { status: res.status, text };
}

// ---- 主流程 ----
async function main() {
  const { host, key } = parseArgs();
  const keyFileName = getKeyFileName(key);

  console.log(c.head(`IndexNow 推送 — ${host}`));

  // 1. 校验 key 文件确实在 dist 里（Astro 构建会把 public/* 复制到 dist/）
  const keyFileInDist = path.join(PROJECT_DIR, 'dist', keyFileName);
  if (!fs.existsSync(keyFileInDist)) {
    console.log(c.err(`站点根目录缺少 key 文件：dist/${keyFileName}`));
    console.log(c.err(`请先 npm run build（public/${keyFileName} 会自动复制到 dist/）`));
    process.exit(1);
  }
  console.log(c.ok(`key 文件就位：dist/${keyFileName}`));

  // 2. 提取 URL 列表
  let urls = extractUrls(SITEMAP_PATH);
  if (urls.length === 0) {
    // 兜底：有些构建顺序下 sitemap-0.xml 还没生成，看看 sitemap-index.xml 是否存在
    if (!fs.existsSync(SITEMAP_INDEX_PATH)) {
      console.log(c.err(`找不到 ${path.relative(PROJECT_DIR, SITEMAP_PATH)}`));
      console.log(c.err(`请先 npm run build 生成 sitemap`));
      process.exit(1);
    }
    console.log(c.warn(`sitemap-0.xml 为空，回退检查 sitemap-index.xml`));
    urls = extractUrls(SITEMAP_INDEX_PATH);
  }
  if (urls.length === 0) {
    console.log(c.err('sitemap 里没有 URL 可推'));
    process.exit(1);
  }
  console.log(c.ok(`从 sitemap 提取 ${urls.length} 个 URL`));

  // 3. 按 MAX_PER_BATCH 分批
  const batches = [];
  for (let i = 0; i < urls.length; i += MAX_PER_BATCH) {
    batches.push(urls.slice(i, i + MAX_PER_BATCH));
  }
  console.log(c.ok(`分为 ${batches.length} 批推送（每批最多 ${MAX_PER_BATCH}）`));

  // 4. 推送
  let totalOk = 0;
  let totalFail = 0;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const { status, text } = await pushBatch(host, key, batch);
      // IndexNow 文档：200/202 都算成功
      if (status === 200 || status === 202) {
        totalOk += batch.length;
        console.log(c.ok(`批次 ${i + 1}/${batches.length} 推送成功 [HTTP ${status}]（${batch.length} URL）`));
      } else {
        totalFail += batch.length;
        console.log(c.err(`批次 ${i + 1}/${batches.length} 推送失败 [HTTP ${status}]（${batch.length} URL）`));
        if (text) console.log(`        响应：${text}`);
      }
    } catch (err) {
      totalFail += batch.length;
      console.log(c.err(`批次 ${i + 1}/${batches.length} 网络异常：${err.message || err}`));
    }
  }

  // 5. 汇总
  console.log(c.head('汇总'));
  console.log(`  总 URL: ${urls.length}`);
  console.log(`  成功:   ${totalOk}`);
  console.log(`  失败:   ${totalFail}`);
  console.log(`  端点:   ${API_ENDPOINT}`);
  console.log(`  Host:   ${host}`);

  if (totalFail > 0) process.exit(1);
  console.log(c.ok('全部推送成功，Bing/Yandex 等几分钟内会来抓'));
}

main().catch((err) => {
  console.error(c.err(`脚本异常：${err.message || err}`));
  if (err.stack) console.error(err.stack);
  process.exit(1);
});