#!/usr/bin/env node
/**
 * 更新日志覆盖检查（npm run changelog:check）
 *
 * 双向比对 src/data/changelog.ts 与每个工具的 meta.ts：
 *  - 漏登记：工具已经在站上，但更新日志里没提 → 读者看不到"新增了什么"
 *  - 悬空 id：更新日志里写了，但工具目录不存在 → 页面会跳过渲染，容易悄悄漏内容
 *
 * 纯文本解析（不跑 TS），够用且零依赖。exit 1 表示有漏登记。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS_DIR = join(ROOT, 'src', 'tools');
const CHANGELOG_FILE = join(ROOT, 'src', 'data', 'changelog.ts');

/** 从 meta.ts 里抠 id / createdAt / noindex */
const localTools = [];
for (const dir of readdirSync(TOOLS_DIR)) {
  const metaPath = join(TOOLS_DIR, dir, 'meta.ts');
  try {
    statSync(metaPath);
  } catch {
    continue;
  }
  const src = readFileSync(metaPath, 'utf8');
  const id = src.match(/^\s*id:\s*'([^']+)'/m)?.[1];
  if (!id) continue;
  localTools.push({
    id,
    createdAt: src.match(/^\s*createdAt:\s*'([^']+)'/m)?.[1] ?? '0000-00-00',
    noindex: /^\s*noindex:\s*true/m.test(src),
  });
}

const changelogSrc = readFileSync(CHANGELOG_FILE, 'utf8');
/**
 * 抠出更新日志里登记的 id。
 * changelog.ts 里 `id:` 只会出现在工具条目上，所以直接扫前缀，
 * 三种写法（多行、单行 `{ id: 'x', ... }`、`{ id: 'x' }`）都能覆盖。
 */
const logged = new Set([...changelogSrc.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]));
const known = new Set(localTools.map((t) => t.id));

const missing = localTools
  .filter((t) => !logged.has(t.id) && !t.noindex)
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
const dangling = [...logged].filter((id) => !known.has(id));

console.log(`工具总数：${localTools.length}（noindex ${localTools.filter((t) => t.noindex).length} 个已排除）`);
console.log(`更新日志已登记：${logged.size} 个\n`);

if (missing.length === 0 && dangling.length === 0) {
  console.log('✅ 更新日志覆盖完整，无漏登记、无悬空 id。');
  process.exit(0);
}

if (missing.length > 0) {
  console.log(`⚠️  以下 ${missing.length} 个工具已在站上，但更新日志没登记：`);
  let cur = '';
  for (const t of missing) {
    if (t.createdAt !== cur) {
      cur = t.createdAt;
      console.log(`\n  ${cur}`);
    }
    console.log(`    ${t.id}`);
  }
  console.log('\n  补写方式：在 src/data/changelog.ts 对应批次里加 { id: \'xxx\', role: \'...\' }');
}

if (dangling.length > 0) {
  console.log(`\n❌ 更新日志里有 ${dangling.length} 个 id 在 src/tools/ 下不存在，页面会跳过渲染：`);
  for (const id of dangling) console.log(`    ${id}`);
}

process.exit(missing.length > 0 || dangling.length > 0 ? 1 : 0);
