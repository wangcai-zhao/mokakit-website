import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync('./workbench/coolexplore-raw.json', 'utf8'));
const kept = d.items.filter((i) => !i.drop && i.url);
const byGroup = {};
kept.forEach((i) => {
  byGroup[i.group] = (byGroup[i.group] || 0) + 1;
});
console.log('保留条目按 group 分布:');
console.log(byGroup);
console.log('\n落入 media（需并入现有 media 分组）的条目:');
kept.filter((i) => i.group === 'media').forEach((i) => {
  console.log('  - ' + i.name + ' | ' + i.url + ' | cats: ' + i.cats.join(','));
});
console.log('\n无分类归属(默认fun-web)条目数:', kept.filter((i) => i.group === 'fun-web' && i.cats.length === 0).length);
console.log('各 coolexplore 分类覆盖条目数:');
const byCat = {};
kept.forEach((i) => i.cats.forEach((c) => { byCat[c] = (byCat[c] || 0) + 1; }));
console.log(byCat);
