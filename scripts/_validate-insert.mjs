import { readFileSync } from 'node:fs';
const src = readFileSync('./workbench/coolexplore-insert.ts', 'utf8');

// 按分组切分
const groupBlocks = src.split(/^\s*\{\s*$/m).slice(1);
let total = 0;
let overLen = 0;
let asciiQuote = 0;
const groupNames = [];
for (const b of groupBlocks) {
  const idM = b.match(/id:\s*'([^']+)'/);
  const nameM = b.match(/name:\s*'([^']+)'/);
  const entries = [...b.matchAll(/\{ name:\s*'([^']*)',\s*url:\s*'([^']*)',\s*desc:\s*'([^']*)'\s*\}/g)];
  groupNames.push(nameM ? nameM[1] : (idM ? idM[1] : '?'));
  total += entries.length;
  for (const e of entries) {
    const desc = e[3];
    const len = [...desc].length; // 按字符数（含中文）
    if (len > 20) {
      overLen++;
      console.error('  [超长]', nameM ? nameM[1] : '', '->', desc, '(', len, '字)');
    }
    // 检查 desc 内是否含 ASCII 单引号（会破坏字符串）—— 理论上 escapeField 已替换
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(desc)) {
      asciiQuote++;
      console.error('  [控制字符]', desc);
    }
  }
}
console.log('分组数:', groupNames.length, '->', groupNames.join(', '));
console.log('总条目:', total);
console.log('超 20 字:', overLen);
console.log('含控制字符:', asciiQuote);

// 检查 name 字段里是否出现未转义的 ASCII 单引号
const nameMatches = [...src.matchAll(/name:\s*'([^']*)'/g)];
let badName = 0;
for (const m of nameMatches) {
  if (/[\x00-\x1F]/.test(m[1])) badName++;
}
console.log('name 含控制字符:', badName);
