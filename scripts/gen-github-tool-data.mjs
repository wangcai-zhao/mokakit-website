/**
 * 把采集到的 workbench/github-stars.json 压缩成工具页可直接 import 的
 * src/tools/github-stars/data.ts。
 *
 * 压缩手段：
 * - 短键名（n/f/d/s/k/l/t/p/h/g）
 * - url 不存，由 fullName 推导 https://github.com/{f}
 * - 描述截断到 150 字符、topics 最多 4 个、pushedAt 只留 YYYY-MM
 * - dims 存维度下标数字而非字符串
 *
 * 用法：node scripts/gen-github-tool-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(readFileSync(resolve(ROOT, 'workbench/github-stars.json'), 'utf8'));

/** 维度中文名 + 一句话定位（用于长尾子页文案） */
const DIM_INFO = {
  'all-time': { name: '殿堂级', intro: 'GitHub 全站 star 数最高的项目，程序员的公共知识底座' },
  'ai-llm': { name: 'AI 大模型', intro: '大语言模型的推理引擎、微调框架与应用脚手架' },
  'ai-agent': { name: 'AI 智能体', intro: '能自主规划、调用工具、完成多步任务的 Agent 框架' },
  'ai-chatgpt': { name: 'ChatGPT 生态', intro: '围绕 ChatGPT 的客户端、提示词与二次开发项目' },
  'ai-rag': { name: 'RAG 知识库', intro: '检索增强生成，把私有文档接进大模型的核心方案' },
  'ai-image': { name: 'AI 绘画', intro: 'Stable Diffusion 生态的出图界面、模型与工作流工具' },
  'ai-voice': { name: 'AI 语音合成', intro: '文本转语音、声音克隆与语音识别的开源实现' },
  'ai-ml': { name: '机器学习框架', intro: '深度学习训练框架与经典机器学习教程仓库' },
  'dev-tools': { name: '开发者工具', intro: '写代码、调接口、测性能，日常离不开的效率利器' },
  'self-hosted': { name: '自托管服务', intro: '能部署在自己服务器上的替代品，数据完全自己掌控' },
  awesome: { name: 'Awesome 清单', intro: '按主题精选的资源合集，入门任何领域的最快地图' },
  productivity: { name: '效率与生产力', intro: '终端增强、笔记、白板等提升个人产出的工具' },
  chinese: { name: '中文项目', intro: '中文文档友好、由中文社区主导的优质开源项目' },
  'web-frontend': { name: '前端与 Web', intro: '前端框架、构建工具与 Web 开发基础设施' },
  cli: { name: '命令行神器', intro: '终端里跑的高频工具，一条命令顶一堆点击' },
};

const dims = src.dimensions.map((d) => ({
  id: d.id,
  name: DIM_INFO[d.id]?.name || d.name,
  intro: DIM_INFO[d.id]?.intro || '',
}));
const dimIndex = new Map(dims.map((d, i) => [d.id, i]));

const clip = (s, n) => {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
};

/**
 * 旺财 2026-08-05 拍板「放弃」的陌生高星仓：不收录进站点（规避刷星/改名仓风险）。
 * 仅从站点数据剔除，原始采集 JSON 保留，后续可随时恢复。
 */
const EXCLUDE = new Set([
  'openclaw/openclaw',
  'affaan-m/ECC',
  'NousResearch/hermes-agent',
  'Graphify-Labs/graphify',
  'DietrichGebert/ponytail',
]);

const repos = src.repos
  .filter((r) => !EXCLUDE.has(r.fullName)) // 旺财拍板放弃的陌生高星仓，不收录
  .filter((r) => r.desc || r.topics.length) // 完全没描述又没 topic 的信息量太低
  .map((r) => {
    const o = {
      n: r.name,
      f: r.fullName,
      d: clip(r.desc, 150),
      s: r.stars,
      k: r.forks,
      l: r.language || '',
      t: r.topics.slice(0, 4),
      p: r.pushedAt.slice(0, 7),
      g: r.dims.map((x) => dimIndex.get(x)).filter((x) => x !== undefined),
    };
    // 只在 homepage 是有效外链时才存
    if (r.homepage && /^https?:\/\//.test(r.homepage) && !r.homepage.includes('github.com')) {
      o.h = r.homepage;
    }
    return o;
  })
  .sort((a, b) => b.s - a.s);

const body = `/**
 * GitHub 高星项目数据（构建时静态内联，页面零请求）。
 *
 * ⚠️ 本文件由 scripts/gen-github-tool-data.mjs 自动生成，不要手改。
 * 更新流程：
 *   1. node scripts/fetch-github-stars.mjs      # 重新采集
 *   2. node scripts/gen-github-tool-data.mjs    # 重新生成本文件
 *
 * 数据源：GitHub Search API（sort=stars），采集于 ${src.generatedAt.slice(0, 10)}。
 */

/** 采集维度 */
export interface Dim {
  id: string;
  name: string;
  intro: string;
}

/** 单个仓库（短键名以压缩体积） */
export interface Repo {
  /** 仓库名 */
  n: string;
  /** owner/name */
  f: string;
  /** 英文描述 */
  d: string;
  /** star 数 */
  s: number;
  /** fork 数 */
  k: number;
  /** 主语言 */
  l: string;
  /** topics */
  t: string[];
  /** 最后推送 YYYY-MM */
  p: string;
  /** 所属维度下标 */
  g: number[];
  /** 官网（可选） */
  h?: string;
}

/** 数据采集日期 YYYY-MM-DD */
export const CAPTURED_AT = '${src.generatedAt.slice(0, 10)}';

export const DIMS: Dim[] = ${JSON.stringify(dims, null, 2)};

export const REPOS: Repo[] = ${JSON.stringify(repos)};

/** 仓库地址 */
export const repoUrl = (r: Repo) => \`https://github.com/\${r.f}\`;

/** star 数缩写：12345 → 12k */
export const kfmt = (n: number) =>
  n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n);

/** 取某个维度下的仓库，按 star 降序 */
export function reposOfDim(dimId: string, limit?: number): Repo[] {
  const i = DIMS.findIndex((d) => d.id === dimId);
  if (i < 0) return [];
  const list = REPOS.filter((r) => r.g.includes(i));
  return limit ? list.slice(0, limit) : list;
}
`;

const outDir = resolve(ROOT, 'src/tools/github-stars');
mkdirSync(outDir, { recursive: true });
const out = resolve(outDir, 'data.ts');
writeFileSync(out, body, 'utf8');

console.log(`✓ ${repos.length} 个仓库 / ${dims.length} 个维度 → src/tools/github-stars/data.ts`);
console.log(`  文件大小 ${(body.length / 1024).toFixed(0)} KB`);
