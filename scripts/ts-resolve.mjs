/**
 * 让 Node 原生 ESM 能解析 TS 风格的无扩展名相对导入（'../types' -> '../types.ts'），
 * 以及 tsconfig 里的 `@/*` → `src/*` 别名。
 *
 * 配合 `node --experimental-strip-types --import ./scripts/ts-resolve.mjs` 使用，
 * 目的是在不启动 Astro 构建（约 40 秒）的前提下，直接把 src/ 下的纯 TS 数据模块
 * 拉进 Node 里做断言校验（约 1 秒）。仅服务于本地校验脚本，不参与生产构建。
 *
 * 2026-11-03 补 `@/` 别名：此前所有 `import ... from '@/tools/types'` 的 meta.ts
 * 都无法在 Node 里加载，导致 mcp:build 只能走正则兜底、拿不到 `subpages()` 函数，
 * 于是「网站搜得到长尾子页、MCP 搜不到」口径分裂。
 */
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const CANDIDATES = [
  '.ts',
  '.tsx',
  '.mts',
  '.js',
  '.mjs',
  '/index.ts',
  '/index.tsx',
  '/index.js',
];

registerHooks({
  resolve(specifier, context, nextResolve) {
    // ① tsconfig 的 `@/*` → `src/*`
    if (specifier.startsWith('@/')) {
      const base = join(ROOT, 'src', specifier.slice(2));
      const direct = [base, ...CANDIDATES.map((s) => base + s)];
      for (const p of direct) {
        if (existsSync(p)) return nextResolve(pathToFileURL(p).href, context);
      }
      return nextResolve(specifier, context);
    }

    // ② 无扩展名的相对导入
    const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
    const hasExt = /\.[cm]?[jt]sx?$/i.test(specifier);
    if (isRelative && !hasExt && context.parentURL) {
      for (const suffix of CANDIDATES) {
        const candidate = new URL(specifier + suffix, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) {
          return nextResolve(specifier + suffix, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
