import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync('workbench/coolexplore-raw.json', 'utf8'));
const byDrop = {};
d.items.forEach((i) => {
  const k = i.drop || 'keep';
  byDrop[k] = (byDrop[k] || 0) + 1;
});
console.log('=== drop 标记分布 ===');
console.log(byDrop);
const byStatus = {};
d.items.forEach((i) => {
  const s = (i.probe && i.probe.status) || 'none';
  byStatus[s] = (byStatus[s] || 0) + 1;
});
console.log('\n=== probe.status 分布 ===');
console.log(byStatus);
console.log('\n=== err 明细（按错误类型粗分）===');
d.items
  .filter((i) => i.probe && i.probe.status === 'err')
  .forEach((i) => {
    const err = (i.probe.error || '').toLowerCase();
    let kind = '其他';
    if (err.includes('dns') || err.includes('enotfound')) kind = 'DNS失败(真死)';
    else if (err.includes('econnrefused') || err.includes('connection refused')) kind = '连接被拒(真死)';
    else if (err.includes('abort') || err.includes('timeout')) kind = '超时(保留)';
    else if (err.includes('certificate') || err.includes('tls') || err.includes('ssl')) kind = 'TLS错误(访问问题)';
    else if (err.includes('econnreset')) kind = '连接重置(抖动)';
    console.log(`[${kind}]`.padEnd(16), (i.probe.error || '').slice(0, 60).padEnd(40), '|', i.name, '|', i.url);
  });
