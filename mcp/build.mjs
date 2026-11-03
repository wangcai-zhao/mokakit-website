/**
 * build.mjs —— 把 MokaKit MCP Server 打成「生产自包含产物」
 * ----------------------------------------------------------------------------
 * 为什么需要这一步：
 *   生产服务器是 Node v18，没有 --experimental-strip-types，无法 import .ts；
 *   且服务器只部署静态 dist，没有 src/ 源码（meta-loader 运行时 readFileSync
 *   读 src/tools 下各 meta.ts 会失败）。
 *
 * 做法：
 *   1) 用 esbuild 把 mcp/server.mjs 与其依赖的 src/lib/*.ts 纯函数打包成
 *      单一 deploy/mcp/server.mjs（target=node18，format=esm），零外部依赖。
 *   2) 本地用 loadAllMeta() 跑一遍，把工具目录元数据抽成 deploy/mcp/catalog.json。
 *      server.mjs 启动「优先读 catalog.json」，从而彻底不依赖 src/ 与 TS 运行时。
 *
 * 战略原则保持：compute 入参即契约（打包进的是 src/lib 纯函数）；描述从 meta
 * 生成（catalog.json 来自同源 meta.ts）。只是物理载体从 .ts 源变成构建产物。
 *
 * 运行：node mcp/build.mjs   （npm run mcp:build）
 */
import { build } from 'esbuild';
import { loadAllMeta } from './meta-loader.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
// 与网页端同源：索引构建器 + 分类表都直接 import src/，不另写一份
import { buildSearchIndexData, subpageSources } from '../src/lib/search-build.ts';
import { CATEGORIES } from '../src/config/categories.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
// 产物直接进 deploy 包，随 server-setup.sh 上传到 /opt/mokakit-mcp
const outDir = join(__dirname, '..', 'deploy', 'mcp');
mkdirSync(outDir, { recursive: true });

// 1) bundle server.mjs（含 src/lib 纯函数 + meta-loader）为自包含 ESM，目标 node18
await build({
  entryPoints: [join(__dirname, 'server.mjs')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: join(outDir, 'server.mjs'),
  logLevel: 'info',
});

// 2) 抽取 catalog（运行时不再读 src/），写 catalog.json
const { tools, errors } = loadAllMeta();

// 顺带把检索索引算好（含拼音），server 启动直接 prepareIndex，
// 避免线上服务器装 pinyin-pro 或现场算拼音。
const catName = new Map(CATEGORIES.map((c) => [c.id, c.name]));
const indexable = tools.filter((t) => !t.noindex);
const indexSources = indexable.map((t) => ({
  id: t.id,
  name: t.name,
  tagline: t.tagline || '',
  keywords: t.keywords || [],
  tags: t.tags || [],
  category: catName.get(t.category) || t.category,
  priority: t.priority ?? 0,
  icon: t.icon || '',
  url: t.url,
}));
// 长尾子页与网页端同源展开（同一个 subpageSources），否则会出现
// 「网站搜得到、MCP 搜不到」的口径分裂。
//
// 为什么要在这里动态 import：loadAllMeta() 是静态求值（生产服务器不能跑 TS），
// 只能拿到字符串字段，`subpages()` 函数拿不到。这里跑在本地、有 ts-resolve
// 别名钩子，所以能直接把 meta.ts 拉起来。任何 meta 导入失败都跳过，不阻断构建。
const subpageOf = new Map();
for (const t of indexable) {
  try {
    const mod = await import(pathToFileURL(join(__dirname, '..', 'src', 'tools', t.id, 'meta.ts')).href);
    if (typeof mod.default?.subpages === 'function') subpageOf.set(t.id, mod.default.subpages);
  } catch {
    /* 依赖浏览器环境的 meta，跳过即可 */
  }
}
for (const t of indexable) {
  indexSources.push(
    ...subpageSources({ ...t, subpages: subpageOf.get(t.id) }, catName.get(t.category) || t.category),
  );
}
const search = buildSearchIndexData(indexSources, CATEGORIES.map((c) => c.name));

writeFileSync(join(outDir, 'catalog.json'), JSON.stringify({ tools, errors, search }, null, 2));

console.log(
  `[mcp:build] bundled server.mjs (target=node18) + catalog.json (${tools.length} tools, ${errors.length} errors, search-index ${search.n.length} docs) -> ${outDir}`,
);
