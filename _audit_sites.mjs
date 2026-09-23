import { readFileSync } from 'node:fs';
const src = readFileSync('src/data/sites.ts', 'utf8');
const items = [...src.matchAll(/\{\s*name:\s*'([^']*)',\s*url:\s*'([^']*)',\s*desc:\s*'([^']*)'/g)];
console.log('好站条目:', items.length);

// 长度分布
const lens = {};
for (const m of items) lens[m[3].length] = (lens[m[3].length] || 0) + 1;
console.log('描述长度分布(top8):', Object.entries(lens).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}字:${v}`).join(' '));

// 真·截断：长度 18-24 且结尾是明显的半截词
const bad = items.filter((m) => {
  const d = m[3];
  if (d.length < 15) return false;
  return /(是一个|是一|为一个|是一?个?)[^，。、]{0,6}$/.test(d) && !/[站网库台器图具盘单式区界城院馆盟社圈场店家链书典表戏客播谈记志谱帖]$/.test(d);
});
console.log('\n疑似被截断的描述:', bad.length);
bad.slice(0, 15).forEach((m) => console.log('  -', m[1].slice(0, 22), '=>', m[3]));

// 名称里带破折号长尾（SEO 噪音）
const dash = items.filter((m) => m[1].includes(' - '));
console.log('\n名称含 " - " 长尾:', dash.length);
dash.slice(0, 10).forEach((m) => console.log('  -', m[1]));
