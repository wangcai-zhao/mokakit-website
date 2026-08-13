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
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
writeFileSync(join(outDir, 'catalog.json'), JSON.stringify({ tools, errors }, null, 2));

console.log(
  `[mcp:build] bundled server.mjs (target=node18) + catalog.json (${tools.length} tools, ${errors.length} errors) -> ${outDir}`
);
