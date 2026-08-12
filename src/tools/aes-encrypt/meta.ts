import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'aes-encrypt',
  name: 'AES 加解密',
  tagline: '密码保护的对称加密',
  description:
    '免费在线 AES 加密解密工具，输入文本与密码即可完成 AES-256-GCM 对称加解密。采用 PBKDF2-SHA256 十万次迭代派生密钥，每次随机生成盐值与初始向量，密文自带完整性校验，全程浏览器本地运算不上传。',
  keywords: ['AES加密', '在线解密', '对称加密', 'AES-GCM', '密码加密'],
  category: 'security',
  tags: ['aes', '加密', '对称', '安全'],
  icon: 'lock',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '密文格式是什么？',
      a: '输出为三段 Base64 用冒号连接：iv:salt:ciphertext。iv 为 12 字节随机初始向量，salt 为 16 字节随机盐值，ciphertext 为 AES-GCM 密文（含 16 字节认证标签）。解密时三段缺一不可，请完整复制保存。',
    },
    {
      q: '为什么同样的内容每次加密结果都不同？',
      a: '这是正确且必要的行为。每次加密都会重新生成随机盐值与初始向量，因此相同明文加相同密码也会产出不同密文，可以防止攻击者通过比对密文推测内容。用原密码解密仍能还原。',
    },
    {
      q: '提示解密失败怎么办？',
      a: '常见原因有三：密码不正确、密文在复制过程中缺失或多了空格换行、密文并非本工具生成。AES-GCM 带完整性校验，任何一个字节被改动都会解密失败，这是安全特性而非故障。',
    },
  ],
  related: ['rsa-keygen', 'base64'],
});
