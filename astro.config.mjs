// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

import { SITE } from './src/config/site.ts';

// gpt-tokenizer 的 package.json exports 用 "./*" 映射到 "./esm/*.js"，但通配符 *
// 不匹配 "/"，导致 "gpt-tokenizer/encoding/cl100k_base" 这类子路径在 ESM bundler
// 下无法解析（Node 的 require 能回退到物理目录，但 Rolldown 严格按 exports）。
// 这里用精确 alias 绕过，直接指向真实的 ESM 物理文件。
const gptEnc = (n) =>
  fileURLToPath(new URL(`./node_modules/gpt-tokenizer/esm/encoding/${n}.js`, import.meta.url));

// https://astro.build/config
export default defineConfig({
  // 上线前把 SITE.url 换成正式域名，sitemap / canonical 全靠它
  site: SITE.url,
  trailingSlash: 'always',
  build: {
    // 输出 /tools/xxx/index.html，配合 trailingSlash: always
    format: 'directory',
  },
  integrations: [
    preact(),
    mdx(),
    // 注意：sitemap 不再由 @astrojs/sitemap 插件生成（沙箱环境下偶发失败）。
    // 改用 scripts/gen-sitemap.mjs 在 build 后扫描 dist 生成，已挂进 npm run build。
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        'gpt-tokenizer/encoding/cl100k_base': gptEnc('cl100k_base'),
        'gpt-tokenizer/encoding/o200k_base': gptEnc('o200k_base'),
        'gpt-tokenizer/encoding/p50k_base': gptEnc('p50k_base'),
        'gpt-tokenizer/encoding/r50k_base': gptEnc('r50k_base'),
      },
    },
  },
});
