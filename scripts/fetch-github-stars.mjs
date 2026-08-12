/**
 * GitHub 高星项目采集器（好站导航 · 开源线数据源）
 *
 * 用法：
 *   node scripts/fetch-github-stars.mjs            # 全量采集
 *   node scripts/fetch-github-stars.mjs ai-llm     # 只跑指定维度
 *
 * 说明：
 * - 走 GitHub Search API，未认证限额 10 次/分钟，脚本内置 7s 节流。
 * - 设了 GITHUB_TOKEN 环境变量会自动带上，限额提升到 30 次/分钟。
 * - 结果按 star 降序，跨维度去重（同一仓库只保留首次出现的维度，并记录全部命中维度）。
 * - 输出：workbench/github-stars.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_FILE = resolve(ROOT, 'workbench/github-stars.json');

/** 采集维度：id / 展示名 / 搜索表达式 / 取多少条 */
const DIMENSIONS = [
  { id: 'all-time', name: '全站殿堂级', q: 'stars:>80000', per: 60 },
  { id: 'ai-llm', name: 'AI 大模型 · LLM', q: 'topic:llm stars:>2000', per: 60 },
  { id: 'ai-agent', name: 'AI 智能体 · Agent', q: 'topic:ai-agent stars:>1000', per: 50 },
  { id: 'ai-chatgpt', name: 'ChatGPT 生态', q: 'topic:chatgpt stars:>3000', per: 50 },
  { id: 'ai-rag', name: 'RAG · 知识库', q: 'topic:rag stars:>800', per: 40 },
  { id: 'ai-image', name: 'AI 绘画 · 图像', q: 'topic:stable-diffusion stars:>2000', per: 40 },
  { id: 'ai-voice', name: 'AI 语音 · TTS', q: 'topic:text-to-speech stars:>1500', per: 30 },
  { id: 'ai-ml', name: '机器学习框架', q: 'topic:machine-learning stars:>8000', per: 40 },
  { id: 'dev-tools', name: '开发者工具', q: 'topic:developer-tools stars:>3000', per: 50 },
  { id: 'self-hosted', name: '自托管 · 私有部署', q: 'topic:self-hosted stars:>3000', per: 50 },
  { id: 'awesome', name: 'Awesome 资源集', q: 'topic:awesome stars:>15000', per: 50 },
  { id: 'productivity', name: '效率与生产力', q: 'topic:productivity stars:>4000', per: 40 },
  { id: 'chinese', name: '中文优质项目', q: 'topic:chinese stars:>3000', per: 40 },
  { id: 'web-frontend', name: '前端与 Web', q: 'topic:frontend stars:>5000', per: 40 },
  { id: 'cli', name: '命令行神器', q: 'topic:cli stars:>8000', per: 40 },
];

const TOKEN = process.env.GITHUB_TOKEN || '';
const THROTTLE_MS = TOKEN ? 2500 : 7000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(q, per) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
    q
  )}&sort=stars&order=desc&per_page=${Math.min(per, 100)}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'mokakit-site-collector',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res.json();
    if (res.status === 403 || res.status === 429) {
      const wait = 20000 * attempt;
      console.warn(`  ! 限流 ${res.status}，等待 ${wait / 1000}s 后重试（${attempt}/3）`);
      await sleep(wait);
      continue;
    }
    throw new Error(`HTTP ${res.status} ${await res.text()}`);
  }
  throw new Error('重试 3 次仍失败');
}

/** 把 API 返回裁剪成我们需要的精简字段 */
function slim(repo) {
  return {
    fullName: repo.full_name,
    name: repo.name,
    url: repo.html_url,
    homepage: repo.homepage || '',
    desc: (repo.description || '').trim(),
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language || '',
    topics: (repo.topics || []).slice(0, 8),
    license: repo.license?.spdx_id || '',
    archived: repo.archived,
    pushedAt: repo.pushed_at?.slice(0, 10) || '',
    createdAt: repo.created_at?.slice(0, 10) || '',
  };
}

async function main() {
  const only = process.argv[2];
  const dims = only ? DIMENSIONS.filter((d) => d.id === only) : DIMENSIONS;
  if (!dims.length) {
    console.error(`未知维度：${only}\n可选：${DIMENSIONS.map((d) => d.id).join(', ')}`);
    process.exit(1);
  }

  const byRepo = new Map();
  const groups = [];

  for (let i = 0; i < dims.length; i++) {
    const d = dims[i];
    process.stdout.write(`[${i + 1}/${dims.length}] ${d.name} … `);
    let items = [];
    try {
      const data = await search(d.q, d.per);
      items = (data.items || []).map(slim);
      console.log(`${items.length} 条（命中 ${data.total_count}）`);
    } catch (err) {
      console.log(`失败：${err.message}`);
    }

    const ids = [];
    for (const it of items) {
      if (it.archived) continue; // 归档项目不推荐
      ids.push(it.fullName);
      const exist = byRepo.get(it.fullName);
      if (exist) {
        if (!exist.dims.includes(d.id)) exist.dims.push(d.id);
      } else {
        byRepo.set(it.fullName, { ...it, dims: [d.id], primaryDim: d.id });
      }
    }
    groups.push({ id: d.id, name: d.name, query: d.q, repoIds: ids });

    if (i < dims.length - 1) await sleep(THROTTLE_MS);
  }

  const repos = [...byRepo.values()].sort((a, b) => b.stars - a.stars);
  const payload = {
    generatedAt: new Date().toISOString(),
    totalRepos: repos.length,
    dimensions: groups.map(({ id, name, query, repoIds }) => ({
      id,
      name,
      query,
      count: repoIds.length,
    })),
    repos,
  };

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`\n✓ 去重后 ${repos.length} 个仓库 → ${OUT_FILE}`);
  console.log(`  Top5：${repos.slice(0, 5).map((r) => `${r.name}(${(r.stars / 1000).toFixed(0)}k)`).join(' / ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
