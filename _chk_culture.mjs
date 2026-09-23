import { readFileSync } from 'node:fs';
const src = readFileSync('src/data/sites.ts', 'utf8');
const page = readFileSync('dist/sites/culture/index.html', 'utf8');
const lines = src.split('\n').slice(1055, 1078);
const urls = [];
for (const l of lines) {
  const m = l.match(/url:\s*'([^']+)'/);
  if (m) urls.push(m[1]);
}
console.log('urls:', urls.length);
for (const u of urls) {
  const e = encodeURIComponent(u);
  console.log(page.includes(e) ? 'OK  ' : 'MISS', u);
}
