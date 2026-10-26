/**
 * hash.ts 纯函数回归：与 Node crypto 标准向量逐位对比。
 * 跑法：node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/test-hash.mjs
 */
import { createHash } from 'node:crypto';
import { hashText, hashBytes, Hasher, HASH_ALGOS, HEX_LEN } from '../src/lib/hash.ts';

let pass = 0;
let fail = 0;
function ok(cond, label, extra = '') {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error(`✗ ${label}${extra ? '\n  ' + extra : ''}`);
  }
}

const ALGOS = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
const NODE_MAP = { MD5: 'md5', 'SHA-1': 'sha1', 'SHA-256': 'sha256', 'SHA-384': 'sha384', 'SHA-512': 'sha512' };

const inputs = [
  '',
  'hello',
  '中文混合 emoji😀 测试',
  'a'.repeat(55), // 单块边界（SHA-512: 128 字节块，55 跨 padding）
  'a'.repeat(56),
  'a'.repeat(63),
  'a'.repeat(64),
  'a'.repeat(65),
  'a'.repeat(111), // 112 = 128-16，padding 边界
  'a'.repeat(112),
  'a'.repeat(113),
  'a'.repeat(127),
  'a'.repeat(128),
  'a'.repeat(129),
  'a'.repeat(1000),
  'MokaKit 工具箱，每天进步一点点。'.repeat(37), // 多块 + 中文
];

// ① 全算法 × 全输入 vs Node crypto
for (const algo of ALGOS) {
  const node = NODE_MAP[algo];
  for (const s of inputs) {
    const expected = createHash(node).update(s, 'utf8').digest('hex');
    const actual = hashText(algo, s);
    ok(actual === expected, `${algo}("${s.slice(0, 12)}${s.length > 12 ? '…' : ''}")`, `期望 ${expected}\n  实际 ${actual}`);
  }
}

// ② 字节数组输入（含全字节值 0-255）
const allBytes = new Uint8Array(256);
for (let i = 0; i < 256; i++) allBytes[i] = i;
for (const algo of ALGOS) {
  const expected = createHash(NODE_MAP[algo]).update(allBytes).digest('hex');
  ok(hashBytes(algo, allBytes) === expected, `${algo}(全字节 0-255)`);
}

// ③ 增量 update：随机分片 vs 一次性，结果必须一致
{
  const rnd = (seed) => {
    let x = seed;
    return () => {
      x = (x * 1103515245 + 12345) & 0x7fffffff;
      return x;
    };
  };
  const rand = rnd(42);
  const big = new Uint8Array(5000);
  for (let i = 0; i < big.length; i++) big[i] = rand() & 0xff;
  for (const algo of ALGOS) {
    const oneShot = hashBytes(algo, big);
    for (const chunk of [1, 7, 64, 127, 128, 129, 1000, 4096]) {
      const h = new Hasher(algo);
      for (let i = 0; i < big.length; i += chunk) h.update(big.subarray(i, i + chunk));
      ok(h.digest() === oneShot, `${algo} 增量分片 ${chunk} 字节`);
    }
  }
  const expected = createHash('sha512').update(big).digest('hex');
  ok(hashBytes('SHA-512', big) === expected, 'SHA-512(5000B) vs crypto');
}

// ④ 大写输出
ok(hashText('MD5', 'hello', true) === hashText('MD5', 'hello').toUpperCase(), 'MD5 大写切换');
ok(hashText('SHA-512', 'hello', true) === hashText('SHA-512', 'hello').toUpperCase(), 'SHA-512 大写切换');

// ⑤ 摘要长度表
for (const algo of ALGOS) {
  ok(hashText(algo, 'x').length === HEX_LEN[algo], `${algo} 摘要长度 ${HEX_LEN[algo]}`);
}

// ⑥ 计划验收样例（标准向量）
ok(hashText('SHA-256', 'hello') === '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824', 'sha256("hello") 标准向量');
// sha512("hello") = 9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043
// （计划里写的结尾 31ae 是笔误，以此 crypto 实际值为准）
ok(hashText('SHA-512', 'hello') === createHash('sha512').update('hello').digest('hex'), 'sha512("hello") 与 crypto 一致');
ok(hashText('MD5', 'hello') === '5d41402abc4b2a76b9719d911017c592', 'md5("hello") 标准向量');
ok(hashText('SHA-1', 'hello') === createHash('sha1').update('hello').digest('hex'), 'sha1("hello") 与 crypto 一致');

// ⑦ 错误处理
let threw = false;
try {
  const h = new Hasher('SHA-256');
  h.digest();
  h.update(new Uint8Array(1));
} catch {
  threw = true;
}
ok(threw, 'digest 后 update 抛错');
threw = false;
try {
  new Hasher('SHA-3');
} catch {
  threw = true;
}
ok(threw, '未知算法抛错');
ok(HASH_ALGOS.length === 5, 'HASH_ALGOS 共 5 种');

console.log(`\ntest-hash: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
