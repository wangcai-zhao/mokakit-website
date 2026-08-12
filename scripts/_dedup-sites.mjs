import fs from 'node:fs';
const f = 'src/data/sites.ts';
let s = fs.readFileSync(f, 'utf8');
const seen = new Set();
let removed = 0;
const re = /\{\s*name:\s*'([^']*)',\s*url:\s*'([^']*)',\s*desc:\s*'([^']*)'\s*\}/g;
s = s.replace(re, (m, _name, url) => {
  if (seen.has(url)) {
    removed++;
    return '';
  }
  seen.add(url);
  return m;
});
s = s.replace(/,\s*\n\s*,/g, ',\n');
s = s.replace(/\[\s*,\n/g, '[\n');
s = s.replace(/,\s*\n(\s*)\]/g, '\n$1]');
fs.writeFileSync(f, s);
console.log(`去重完成：移除重复链接 ${removed} 条，保留唯一链接 ${seen.size} 条`);
