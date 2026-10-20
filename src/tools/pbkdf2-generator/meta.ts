import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'pbkdf2-generator',
  name: 'PBKDF2 密钥派生',
  seoTitle: 'PBKDF2 密钥派生 - 在线用 Web Crypto 生成密钥',
  tagline: '用口令派生强密钥',
  description:
    '免费在线 PBKDF2 密钥派生工具，基于浏览器原生 Web Crypto，用口令、盐、迭代次数与哈希算法派生强密钥，用于密码哈希与密钥扩展，全程在你的设备本地完成，不上传任何数据。',
  keywords: ['PBKDF2', '密钥派生', '口令哈希', 'Web Crypto', '密码学'],
  category: 'security',
  tags: ['安全', '加密', '哈希'],
  icon: 'shield',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: 'PBKDF2 是做什么的？',
      a: '它是一种基于口令的密钥派生函数，通过大量迭代把弱口令拉伸成强密钥，并抵抗暴力破解，广泛用于密码存储与密钥扩展。',
    },
    {
      q: '迭代次数越高越好吗？',
      a: '迭代越多抗暴力破解越强，但耗时也越长。一般十万次以上较安全，本工具默认二十万次，可在设备上实时完成。',
    },
  ],
  related: ['hash-calculator', 'aes-encrypt', 'hmac-gen'],
});
