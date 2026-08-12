// 一次性补丁：把经 curl 二次复核确认的真死链（DNS NXDOMAIN）标记为 drop='dead'
// 数据源：workbench/coolexplore-raw.json
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'workbench/coolexplore-raw.json';
const DEAD = new Set([
  'https://www.bookmarkearth.com',
  'http://www.theunseenvideo.com',
  'http://gameofbombs.com/',
]);

// 影视类(cool-video)仅 2 条，并入奇趣网站 fun-web，避免改动现有 media 数据
const MEDIA_TO_FUN = new Set([
  'https://www.seedhub.cc',
  'https://tv.garden/',
]);

const raw = JSON.parse(readFileSync(OUT, 'utf8'));
let n = 0;
for (const it of raw.items) {
  if (it.url && DEAD.has(it.url)) {
    it.drop = 'dead';
    it.dropReason = 'curl复核: DNS NXDOMAIN, 域名不存在';
    n++;
    console.error('标记 dead:', it.name, it.url);
  }
  if (it.url && MEDIA_TO_FUN.has(it.url) && it.group === 'media') {
    it.group = 'fun-web';
    console.error('media→fun-web:', it.name, it.url);
  }
}
writeFileSync(OUT, JSON.stringify(raw, null, 2));
console.error('已标记', n, '条真死链为 drop=dead');
