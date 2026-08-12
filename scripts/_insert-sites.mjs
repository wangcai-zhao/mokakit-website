// 一次性汇编：把 coolexplore-insert.ts 的 5 个新分组插入 sites.ts，
// 同时修复 education 分组的数组空洞 bug（L783-784 的空行+孤逗号）。
// 先备份，回写后立即可跑 _verify-sites.mjs 断言。
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';

const SRC = 'src/data/sites.ts';
const BLOCK = 'workbench/coolexplore-insert.ts';
const BAK = 'src/data/sites.ts.bak';

const sites = readFileSync(SRC, 'utf8');
const block = readFileSync(BLOCK, 'utf8');

// 0) 备份
copyFileSync(SRC, BAK);
console.error('已备份到', BAK);

// 1) 修复 education 空洞：删掉「四六级」与「学堂在线」之间的空行+孤逗号
const HOLE = /\n\s*,\n(\s*\{ name: '学堂在线')/;
if (HOLE.test(sites)) {
  const fixed = sites.replace(HOLE, '\n$1');
  console.error('已修复 education 数组空洞');
  // 用 fixed 继续
  var working = fixed;
} else {
  console.error('[warn] 未检测到 education 空洞，按原样继续');
  var working = sites;
}

// 2) 在文件末尾的 `  }\n];` 处插入新分组
//    education 收尾补逗号，block 以 `  },\n` 收尾，整体接 `];`
const TAIL = /\n\];\s*$/;
if (!TAIL.test(working)) {
  console.error('[error] 未找到文件末尾的 `];`，中止以免破坏文件');
  process.exit(1);
}
const inserted = working.replace(TAIL, ',\n' + block.trimEnd() + '\n];\n');

// 3) 自检：新分组数与条目数
const newGroups = (inserted.match(/id: '(fun-web|web-game|explore-map|culture|curio-tool)'/g) || []).length;
const newEntries = (block.match(/\{ name: '/g) || []).length;
console.error(`插入分组数(应为5): ${newGroups}，插入条目数(应为131): ${newEntries}`);

writeFileSync(SRC, inserted);
console.error('已写回', SRC, `(原 ${sites.length} 字节 -> 新 ${inserted.length} 字节)`);
