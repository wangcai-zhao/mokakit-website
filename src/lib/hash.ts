/**
 * 哈希算法纯函数层（与财金 lib 同规范：无 DOM 依赖，可被 MCP 侧复用）。
 * 实现 MD5 / SHA-1 / SHA-256 / SHA-384 / SHA-512，支持增量 update（文件分片哈希）。
 *
 * 借鉴来源（均宽松 license，重写实现并以 Node crypto 标准向量自测）：
 * - SHA-384/512 的 64 位块运算结构：sha.js（browserify/sha.js，MIT AND BSD-3-Clause）
 * - MD5 算法流程：pvorb/node-md5（BSD-3-Clause）
 * - SHA-1 / SHA-256：本站原组件内实现迁移（结构同 FIPS 180-4）
 *
 * 不依赖 Web Crypto：crypto.subtle 只在安全上下文（HTTPS/localhost）可用，
 * 站点 http 阶段会拿不到，纯 JS 实现在任何环境都能跑。
 */

export type HashAlgo = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export const HASH_ALGOS: HashAlgo[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

/** 每种算法的十六进制摘要长度（字符数） */
export const HEX_LEN: Record<HashAlgo, number> = {
  MD5: 32,
  'SHA-1': 40,
  'SHA-256': 64,
  'SHA-384': 96,
  'SHA-512': 128,
};

/* ------------------------------------------------------------------ */
/* 公共小工具                                                          */
/* ------------------------------------------------------------------ */

const rotr32 = (n: number, s: number) => (n >>> s) | (n << (32 - s));
const rotl32 = (n: number, s: number) => (n << s) | (n >>> (32 - s));

function toHex(words: number[], upper: boolean): string {
  let s = '';
  for (const w of words) s += (w >>> 0).toString(16).padStart(8, '0');
  return upper ? s.toUpperCase() : s;
}

/* ------------------------------------------------------------------ */
/* MD5（RFC 1321）                                                     */
/* ------------------------------------------------------------------ */

/** K[i] = floor(|sin(i+1)| * 2^32)，Math.sin 对整数参数的精度足够 32 位，运行时生成免抄表 */
const MD5_K = new Uint32Array(64);
for (let i = 0; i < 64; i++) MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

function md5Compress(state: number[], M: Uint8Array, off: number): void {
  const m = new Array<number>(16);
  for (let i = 0; i < 16; i++) {
    const p = off + i * 4;
    m[i] = (M[p]! | (M[p + 1]! << 8) | (M[p + 2]! << 16) | (M[p + 3]! << 24)) | 0;
  }
  let a = state[0]!;
  let b = state[1]!;
  let c = state[2]!;
  let d = state[3]!;
  for (let i = 0; i < 64; i++) {
    let f: number;
    let g: number;
    if (i < 16) {
      f = (b & c) | (~b & d);
      g = i;
    } else if (i < 32) {
      // G(b,c,d) = (b & d) | (c & ~d)（表达式与 node-md5 _gg 一致）
      f = (b & d) | (c & ~d);
      g = (5 * i + 1) % 16;
    } else if (i < 48) {
      f = b ^ c ^ d;
      g = (3 * i + 5) % 16;
    } else {
      f = c ^ (b | ~d);
      g = (7 * i) % 16;
    }
    const sum = (a + f + MD5_K[i]! + m[g]!) | 0;
    const rotated = (sum << MD5_S[i]!) | (sum >>> (32 - MD5_S[i]!));
    const tmp = d;
    d = c;
    c = b;
    b = (b + rotated) | 0;
    a = tmp;
  }
  state[0] = (state[0]! + a) | 0;
  state[1] = (state[1]! + b) | 0;
  state[2] = (state[2]! + c) | 0;
  state[3] = (state[3]! + d) | 0;
}

/* ------------------------------------------------------------------ */
/* SHA-1（FIPS 180-4）                                                 */
/* ------------------------------------------------------------------ */

function sha1Compress(state: number[], M: Uint8Array, off: number): void {
  const w = new Uint32Array(80);
  for (let t = 0; t < 16; t++) {
    const p = off + t * 4;
    w[t] = (M[p]! << 24) | (M[p + 1]! << 16) | (M[p + 2]! << 8) | M[p + 3]!;
  }
  for (let t = 16; t < 80; t++) w[t] = rotl32(w[t - 3]! ^ w[t - 8]! ^ w[t - 14]! ^ w[t - 16]!, 1);
  let a = state[0]!;
  let b = state[1]!;
  let c = state[2]!;
  let d = state[3]!;
  let e = state[4]!;
  for (let t = 0; t < 80; t++) {
    let f: number;
    let k: number;
    if (t < 20) {
      f = (b & c) | (~b & d);
      k = 0x5a827999;
    } else if (t < 40) {
      f = b ^ c ^ d;
      k = 0x6ed9eba1;
    } else if (t < 60) {
      f = (b & c) | (b & d) | (c & d);
      k = 0x8f1bbcdc;
    } else {
      f = b ^ c ^ d;
      k = 0xca62c1d6;
    }
    const tmp = (rotl32(a, 5) + f + e + k + w[t]!) >>> 0;
    e = d;
    d = c;
    c = rotl32(b, 30);
    b = a;
    a = tmp;
  }
  state[0] = (state[0]! + a) >>> 0;
  state[1] = (state[1]! + b) >>> 0;
  state[2] = (state[2]! + c) >>> 0;
  state[3] = (state[3]! + d) >>> 0;
  state[4] = (state[4]! + e) >>> 0;
}

/* ------------------------------------------------------------------ */
/* SHA-256（FIPS 180-4）                                               */
/* ------------------------------------------------------------------ */

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha256Compress(state: number[], M: Uint8Array, off: number): void {
  const w = new Uint32Array(64);
  for (let t = 0; t < 16; t++) {
    const p = off + t * 4;
    w[t] = (M[p]! << 24) | (M[p + 1]! << 16) | (M[p + 2]! << 8) | M[p + 3]!;
  }
  for (let t = 16; t < 64; t++) {
    const s0 = rotr32(w[t - 15]!, 7) ^ rotr32(w[t - 15]!, 18) ^ (w[t - 15]! >>> 3);
    const s1 = rotr32(w[t - 2]!, 17) ^ rotr32(w[t - 2]!, 19) ^ (w[t - 2]! >>> 10);
    w[t] = (w[t - 16]! + s0 + w[t - 7]! + s1) >>> 0;
  }
  let a = state[0]!;
  let b = state[1]!;
  let c = state[2]!;
  let d = state[3]!;
  let e = state[4]!;
  let f = state[5]!;
  let g = state[6]!;
  let h = state[7]!;
  for (let t = 0; t < 64; t++) {
    const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
    const ch = (e & f) ^ (~e & g);
    const t1 = (h + S1 + ch + SHA256_K[t]! + w[t]!) >>> 0;
    const S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
    const mj = (a & b) ^ (a & c) ^ (b & c);
    const t2 = (S0 + mj) >>> 0;
    h = g;
    g = f;
    f = e;
    e = (d + t1) >>> 0;
    d = c;
    c = b;
    b = a;
    a = (t1 + t2) >>> 0;
  }
  state[0] = (state[0]! + a) >>> 0;
  state[1] = (state[1]! + b) >>> 0;
  state[2] = (state[2]! + c) >>> 0;
  state[3] = (state[3]! + d) >>> 0;
  state[4] = (state[4]! + e) >>> 0;
  state[5] = (state[5]! + f) >>> 0;
  state[6] = (state[6]! + g) >>> 0;
  state[7] = (state[7]! + h) >>> 0;
}

/* ------------------------------------------------------------------ */
/* SHA-384 / SHA-512（FIPS 180-4，64 位字以 [hi, lo] 32 位对运算）      */
/* 运算结构参考 sha.js（MIT AND BSD-3-Clause）                         */
/* ------------------------------------------------------------------ */

/** K 常量表：80 个 64 位常量，平铺为 [hi, lo] 160 项（取自 sha.js sha512.js） */
const SHA512_K = new Uint32Array([
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd, 0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019, 0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe, 0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1, 0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3, 0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483, 0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210, 0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725, 0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926, 0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8, 0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001, 0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910, 0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53, 0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb, 0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60, 0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9, 0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207, 0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6, 0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493, 0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a, 0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817,
]);

/** 64 位 rotate / shift 辅助（hi/lo 拆分公式沿用 sha.js） */
const Ch = (x: number, y: number, z: number) => z ^ (x & (y ^ z));
const maj = (x: number, y: number, z: number) => (x & y) | (z & (x | y));
const sigma0 = (x: number, xl: number) =>
  ((x >>> 28) | (xl << 4)) ^ ((xl >>> 2) | (x << 30)) ^ ((xl >>> 7) | (x << 25));
const sigma1 = (x: number, xl: number) =>
  ((x >>> 14) | (xl << 18)) ^ ((x >>> 18) | (xl << 14)) ^ ((xl >>> 9) | (x << 23));
const Gamma0 = (x: number, xl: number) =>
  ((x >>> 1) | (xl << 31)) ^ ((x >>> 8) | (xl << 24)) ^ (x >>> 7);
const Gamma0l = (x: number, xl: number) =>
  ((x >>> 1) | (xl << 31)) ^ ((x >>> 8) | (xl << 24)) ^ ((x >>> 7) | (xl << 25));
const Gamma1 = (x: number, xl: number) =>
  ((x >>> 19) | (xl << 13)) ^ ((xl >>> 29) | (x << 3)) ^ (x >>> 6);
const Gamma1l = (x: number, xl: number) =>
  ((x >>> 19) | (xl << 13)) ^ ((xl >>> 29) | (x << 3)) ^ ((x >>> 6) | (xl << 26));
const getCarry = (a: number, b: number) => ((a >>> 0) < (b >>> 0) ? 1 : 0);

function sha512Compress(state: number[], M: Uint8Array, off: number): void {
  const w = new Array<number>(160);
  for (let i = 0; i < 32; i += 2) {
    const p = off + i * 4;
    w[i] = (M[p]! << 24) | (M[p + 1]! << 16) | (M[p + 2]! << 8) | M[p + 3]!;
    w[i + 1] = (M[p + 4]! << 24) | (M[p + 5]! << 16) | (M[p + 6]! << 8) | M[p + 7]!;
  }
  for (let i = 32; i < 160; i += 2) {
    const xh = w[i - 30]!;
    const xl = w[i - 29]!;
    const gamma0 = Gamma0(xh, xl);
    const gamma0l = Gamma0l(xl, xh);

    const yh = w[i - 4]!;
    const yl = w[i - 3]!;
    const gamma1 = Gamma1(yh, yl);
    const gamma1l = Gamma1l(yl, yh);

    const Wi7h = w[i - 14]!;
    const Wi7l = w[i - 13]!;
    const Wi16h = w[i - 32]!;
    const Wi16l = w[i - 31]!;

    let Wil = (gamma0l + Wi7l) | 0;
    let Wih = (gamma0 + Wi7h + getCarry(Wil, gamma0l)) | 0;
    Wil = (Wil + gamma1l) | 0;
    Wih = (Wih + gamma1 + getCarry(Wil, gamma1l)) | 0;
    Wil = (Wil + Wi16l) | 0;
    Wih = (Wih + Wi16h + getCarry(Wil, Wi16l)) | 0;

    w[i] = Wih;
    w[i + 1] = Wil;
  }

  let ah = state[0]!;
  let al = state[1]!;
  let bh = state[2]!;
  let bl = state[3]!;
  let ch = state[4]!;
  let cl = state[5]!;
  let dh = state[6]!;
  let dl = state[7]!;
  let eh = state[8]!;
  let el = state[9]!;
  let fh = state[10]!;
  let fl = state[11]!;
  let gh = state[12]!;
  let gl = state[13]!;
  let hh = state[14]!;
  let hl = state[15]!;

  for (let j = 0; j < 160; j += 2) {
    const Wih = w[j]!;
    const Wil = w[j + 1]!;

    const majh = maj(ah, bh, ch);
    const majl = maj(al, bl, cl);
    const sigma0h = sigma0(ah, al);
    const sigma0l = sigma0(al, ah);
    const sigma1h = sigma1(eh, el);
    const sigma1l = sigma1(el, eh);

    const Kih = SHA512_K[j]!;
    const Kil = SHA512_K[j + 1]!;
    const chh = Ch(eh, fh, gh);
    const chl = Ch(el, fl, gl);

    let t1l = (hl + sigma1l) | 0;
    let t1h = (hh + sigma1h + getCarry(t1l, hl)) | 0;
    t1l = (t1l + chl) | 0;
    t1h = (t1h + chh + getCarry(t1l, chl)) | 0;
    t1l = (t1l + Kil) | 0;
    t1h = (t1h + Kih + getCarry(t1l, Kil)) | 0;
    t1l = (t1l + Wil) | 0;
    t1h = (t1h + Wih + getCarry(t1l, Wil)) | 0;

    const t2l = (sigma0l + majl) | 0;
    const t2h = (sigma0h + majh + getCarry(t2l, sigma0l)) | 0;

    hh = gh;
    hl = gl;
    gh = fh;
    gl = fl;
    fh = eh;
    fl = el;
    el = (dl + t1l) | 0;
    eh = (dh + t1h + getCarry(el, dl)) | 0;
    dh = ch;
    dl = cl;
    ch = bh;
    cl = bl;
    bh = ah;
    bl = al;
    al = (t1l + t2l) | 0;
    ah = (t1h + t2h + getCarry(al, t1l)) | 0;
  }

  state[1] = (state[1]! + al) | 0;
  state[3] = (state[3]! + bl) | 0;
  state[5] = (state[5]! + cl) | 0;
  state[7] = (state[7]! + dl) | 0;
  state[9] = (state[9]! + el) | 0;
  state[11] = (state[11]! + fl) | 0;
  state[13] = (state[13]! + gl) | 0;
  state[15] = (state[15]! + hl) | 0;
  state[0] = (state[0]! + ah + getCarry(state[1]!, al)) | 0;
  state[2] = (state[2]! + bh + getCarry(state[3]!, bl)) | 0;
  state[4] = (state[4]! + ch + getCarry(state[5]!, cl)) | 0;
  state[6] = (state[6]! + dh + getCarry(state[7]!, dl)) | 0;
  state[8] = (state[8]! + eh + getCarry(state[9]!, el)) | 0;
  state[10] = (state[10]! + fh + getCarry(state[11]!, fl)) | 0;
  state[12] = (state[12]! + gh + getCarry(state[13]!, gl)) | 0;
  state[14] = (state[14]! + hh + getCarry(state[15]!, hl)) | 0;
}

/* ------------------------------------------------------------------ */
/* 算法注册表                                                          */
/* ------------------------------------------------------------------ */

interface Core {
  blockSize: number;
  /** 长度字段是否小端（仅 MD5） */
  littleEndian: boolean;
  init(): number[];
  compress(state: number[], block: Uint8Array, off: number): void;
  out(state: number[], upper: boolean): string;
}

const CORES: Record<HashAlgo, Core> = {
  MD5: {
    blockSize: 64,
    littleEndian: true,
    init: () => [0x67452301 | 0, 0xefcdab89 | 0, 0x98badcfe | 0, 0x10325476 | 0],
    compress: md5Compress,
    // MD5 摘要按小端输出每个字（RFC 1321：从 A 的低位字节到 D 的高位字节），与 SHA 家族相反
    out: (s, upper) =>
      toHex(
        s.map((w) => (((w & 0xff) << 24) | ((w & 0xff00) << 8) | ((w >>> 8) & 0xff00) | (w >>> 24)) >>> 0),
        upper,
      ),
  },
  'SHA-1': {
    blockSize: 64,
    littleEndian: false,
    init: () => [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0],
    compress: sha1Compress,
    out: (s, upper) => toHex(s, upper),
  },
  'SHA-256': {
    blockSize: 64,
    littleEndian: false,
    init: () => [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ],
    compress: sha256Compress,
    out: (s, upper) => toHex(s, upper),
  },
  'SHA-384': {
    blockSize: 128,
    littleEndian: false,
    init: () => [
      0xcbbb9d5d, 0xc1059ed8, 0x629a292a, 0x367cd507, 0x9159015a, 0x3070dd17, 0x152fecd8, 0xf70e5939,
      0x67332667, 0xffc00b31, 0x8eb44a87, 0x68581511, 0xdb0c2e0d, 0x64f98fa7, 0x47b5481d, 0xbefa4fa4,
    ],
    compress: sha512Compress,
    out: (s, upper) => toHex(s.slice(0, 12), upper),
  },
  'SHA-512': {
    blockSize: 128,
    littleEndian: false,
    init: () => [
      0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1,
      0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179,
    ],
    compress: sha512Compress,
    out: (s, upper) => toHex(s, upper),
  },
};

/* ------------------------------------------------------------------ */
/* 对外 API                                                            */
/* ------------------------------------------------------------------ */

/**
 * 增量哈希器：update 可多次喂入字节（文件分片场景常量内存），digest 出十六进制摘要。
 * digest 后不可再 update。
 */
export class Hasher {
  readonly algo: HashAlgo;
  private readonly core: Core;
  private readonly state: number[];
  private readonly buf: Uint8Array;
  private bufLen = 0;
  private total = 0n;
  private done = false;

  constructor(algo: HashAlgo) {
    if (!CORES[algo]) throw new Error(`不支持的哈希算法: ${algo}`);
    this.algo = algo;
    this.core = CORES[algo];
    this.state = this.core.init();
    this.buf = new Uint8Array(this.core.blockSize);
  }

  update(bytes: Uint8Array): this {
    if (this.done) throw new Error('digest 之后不能再 update');
    this.total += BigInt(bytes.length);
    const bs = this.core.blockSize;
    let offset = 0;
    if (this.bufLen > 0) {
      const need = Math.min(bs - this.bufLen, bytes.length);
      this.buf.set(bytes.subarray(0, need), this.bufLen);
      this.bufLen += need;
      offset = need;
      if (this.bufLen === bs) {
        this.core.compress(this.state, this.buf, 0);
        this.bufLen = 0;
      } else {
        return this;
      }
    }
    while (bytes.length - offset >= bs) {
      this.core.compress(this.state, bytes, offset);
      offset += bs;
    }
    if (offset < bytes.length) {
      this.buf.set(bytes.subarray(offset), 0);
      this.bufLen = bytes.length - offset;
    }
    return this;
  }

  /** 输出十六进制摘要；upper=true 时全大写。digest 后哈希器作废。 */
  digest(upper = false): string {
    if (this.done) throw new Error('重复 digest');
    this.done = true;
    const bs = this.core.blockSize;
    const lenField = bs === 128 ? 16 : 8;
    const bits = this.total * 8n;
    const zeros = (bs - ((this.bufLen + 1 + lenField) % bs)) % bs;
    const final = new Uint8Array(this.bufLen + 1 + zeros + lenField);
    final.set(this.buf.subarray(0, this.bufLen));
    final[this.bufLen] = 0x80;
    const dv = new DataView(final.buffer);
    if (this.core.littleEndian) {
      // MD5：64 位小端长度字段
      dv.setUint32(final.length - 8, Number(bits & 0xffffffffn), true);
      dv.setUint32(final.length - 4, Number((bits >> 32n) & 0xffffffffn), true);
    } else if (lenField === 16) {
      dv.setBigUint64(final.length - 16, bits >> 64n, false);
      dv.setBigUint64(final.length - 8, bits & 0xffffffffffffffffn, false);
    } else {
      dv.setUint32(final.length - 8, Number((bits >> 32n) & 0xffffffffn), false);
      dv.setUint32(final.length - 4, Number(bits & 0xffffffffn), false);
    }
    for (let i = 0; i < final.length; i += bs) this.core.compress(this.state, final, i);
    return this.core.out(this.state, upper);
  }
}

/** 一次性计算字节数组的摘要 */
export function hashBytes(algo: HashAlgo, bytes: Uint8Array, upper = false): string {
  return new Hasher(algo).update(bytes).digest(upper);
}

/** 一次性计算文本（UTF-8）的摘要 */
export function hashText(algo: HashAlgo, text: string, upper = false): string {
  return hashBytes(algo, new TextEncoder().encode(text), upper);
}
