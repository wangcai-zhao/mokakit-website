/**
 * 让 Node 原生 ESM 能解析 TS 风格的无扩展名相对导入（'../types' -> '../types.ts'）。
 *
 * 配合 `node --experimental-strip-types --import ./scripts/ts-resolve.mjs` 使用，
 * 目的是在不启动 Astro 构建（约 40 秒）的前提下，直接把 src/ 下的纯 TS 数据模块
 * 拉进 Node 里做断言校验（约 1 秒）。仅服务于本地校验脚本，不参与生产构建。
 */
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
