// 构建前秒级断言：校验 src/data/sites.ts 数据完整性。
// 用法：node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/_verify-sites.mjs
// 不依赖 Astro，直接 import 源 TS（ts-resolve 补扩展名），比整站 build 快 40 倍。

import { SITE_GROUPS } from '../src/data/sites.ts';
import { ICONS } from '../src/components/icons.ts';

const errors = [];
const warnings = [];

// 1) 分组 id 唯一 + 合法 slug
const seenIds = new Set();
for (const g of SITE_GROUPS) {
  if (!/^[a-z0-9-]+$/.test(g.id)) errors.push(`分组 id 非法: ${g.id}`);
  if (seenIds.has(g.id)) errors.push(`分组 id 重复: ${g.id}`);
  seenIds.add(g.id);
  // 2) icon 存在
  if (!(g.icon in ICONS)) warnings.push(`分组 icon 不存在（会 fallback grid）: ${g.id} -> ${g.icon}`);
}

// 3) 数组无空洞（include 检测 elision）
// 4) 条目字段校验 + URL 全局唯一 + desc≤20
const seenUrls = new Set();
let totalLinks = 0;
for (const g of SITE_GROUPS) {
  for (let i = 0; i < g.links.length; i++) {
    if (!(i in g.links)) {
      errors.push(`分组 ${g.id} 的 links 数组第 ${i} 位为空洞（elision）`);
      continue;
    }
    totalLinks++;
    const l = g.links[i];
    if (!l || typeof l !== 'object') {
      errors.push(`分组 ${g.id} 第 ${i} 条不是对象`);
      continue;
    }
    if (!l.name || !l.url || !l.desc) errors.push(`分组 ${g.id} 第 ${i} 条字段缺失: ${JSON.stringify(l)}`);
    if (typeof l.desc !== 'string' || l.desc.length > 20)
      errors.push(`分组 ${g.id} 第 ${i} 条 desc 超 20 字 (${(l.desc || '').length}): ${l.name}`);
    if (!/^https?:\/\//.test(l.url || '')) errors.push(`分组 ${g.id} 第 ${i} 条 URL 非法: ${l.url}`);
    const k = l.url.trim().toLowerCase().replace(/^https?:\/\//, '');
    if (seenUrls.has(k)) warnings.push(`URL 重复: ${k} (分组 ${g.id})`);
    seenUrls.add(k);
  }
}

console.log(`分组数: ${SITE_GROUPS.length}`);
console.log(`站点总数: ${totalLinks}`);
console.log(`唯一 URL: ${seenUrls.size}`);

if (warnings.length) {
  console.log(`\n⚠️ 警告 (${warnings.length}):`);
  for (const w of warnings) console.log('  - ' + w);
}
if (errors.length) {
  console.error(`\n❌ 错误 (${errors.length}):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('\n✅ 全部断言通过');
