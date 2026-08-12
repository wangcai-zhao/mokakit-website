/**
 * 让 Node 原生 ESM 能解析 TS 风格的无扩展名相对导入（'../types' -> '../types.ts'）。
 * 仅用于本地校验脚本，不参与 Astro 构建。
 */
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const EXTS = ['.ts', '.tsx', '.mts', '.js', '.mjs'];
const INDEXES = ['/index.ts', '/index.tsx', '/index.js'];

registerHooks({
  resolve(specifier, context, nextResolve) {
    const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
    const hasExt = /\.[cm]?[jt]sx?$/i.test(specifier);
    if (isRelative && !hasExt && context.parentURL) {
      for (const suffix of [...EXTS, ...INDEXES]) {
        const candidate = new URL(specifier + suffix, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) {
          return nextResolve(specifier + suffix, context);
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
