import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'hash-identify',
  name: '哈希类型识别',
  tagline: '根据长度与特征识别 md5/sha/bcrypt 等',
  description:
    '免费在线哈希类型识别工具，粘贴一段哈希字符串，根据长度、字符集与特征前缀（如 $2a$/$2b$/$argon2）猜测它是 MD5、SHA-1、SHA-256、SHA-512 还是 Bcrypt/Argon2 等。排查数据表、看口令存储强度、做安全审计时用，全部本地识别。',
  keywords: ['哈希识别', 'hash 类型', '识别哈希', '哈希类型判断'],
  category: 'dev',
  tags: ['哈希', '识别', '安全'],
  icon: 'fingerprint',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['hash-calculator', 'hmac-gen'],
  faq: [
    {
      q: '识别依据是什么？',
      a: '主要看长度与字符集：MD5 为 32 位十六进制、SHA-1 为 40 位、SHA-256 为 64 位、SHA-512 为 128 位；Bcrypt 以 $2a$/$2b$/$2y$ 开头并含成本因子；Argon2 以 $argon2 开头。这是启发式判断，非 100% 确定。',
    },
    {
      q: '能反推原文吗？',
      a: '不能，也不应该。哈希是单向的，本工具只判断「它大概是什么算法」，不尝试破解。识别用途是确认存储强度与类型。',
    },
    {
      q: '为什么看到明文像哈希却识别不出？',
      a: '可能是自定义加盐格式、非标准编码（如 base64 的 scrypt），或长度恰好与某算法重合。本工具覆盖常见算法，冷门格式会提示「无法明确识别」。',
    },
    {
      q: '$2y$ 和 $2b$ 有区别吗？',
      a: '都是 Bcrypt 的变体前缀，算法本质相同，仅实现来源标记不同（PHP 用 $2y$，OpenBSD 用 $2a$/$2b$）。识别为 Bcrypt 即可。',
    },
  ],
});
