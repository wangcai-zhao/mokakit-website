import { readFileSync } from 'node:fs';
const src = readFileSync('src/data/sites.ts', 'utf8');
const lines = src.split('\n');
// 找到每个条目的起止行（匹配 name: '...' 那行）
const re = /\{\s*name:\s*'([^']*)',\s*url:\s*'([^']*)',\s*desc:\s*'([^']*)'/g;
const items = [];
let m;
while ((m = re.exec(src))) {
  const idx = m.index;
  const lineNo = src.slice(0, idx).split('\n').length;
  items.push({ line: lineNo, name: m[1], url: m[2], desc: m[3] });
}
console.log('总条目:', items.length);

// 1) http:// 明文
const httpItems = items.filter((i) => i.url.startsWith('http://'));
console.log('\n=== 1. 明文 http:// (' + httpItems.length + ') ===');
httpItems.forEach((i) => console.log(`  L${i.line}  ${i.name}  ${i.url}`));

// 2) 重复 url
const byUrl = {};
for (const i of items) (byUrl[i.url] ||= []).push(i);
const dups = Object.entries(byUrl).filter(([, v]) => v.length > 1);
console.log('\n=== 2. 重复 URL (' + dups.length + ' 组) ===');
dups.forEach(([u, v]) => console.log(`  ${u}  x${v.length}  @ ${v.map((x) => 'L' + x.line).join(',')}`));

// 3) 截断描述
const trunc = items.filter((i) => {
  const d = i.desc;
  if (d.length < 15) return false;
  return /(是一个|是一|为一个|是一?个?)[^，。、]{0,6}$/.test(d) && !/[站网库台器图具盘单式区界城院馆盟社圈场店家链书典表戏客播谈记志谱帖]$/.test(d);
});
console.log('\n=== 3. 截断描述 (' + trunc.length + ') ===');
trunc.forEach((i) => console.log(`  L${i.line}  ${i.name}  | ${i.desc}`));

// 4) 名称长尾
const dash = items.filter((i) => i.name.includes(' - '));
console.log('\n=== 4. 名称含 " - " (' + dash.length + ') ===');
dash.forEach((i) => console.log(`  L${i.line}  ${i.name}`));
