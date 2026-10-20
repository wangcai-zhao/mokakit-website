import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'base32-encoder',
  name: 'Base32 编解码',
  seoTitle: 'Base32 编解码 - 在线 RFC4648 双向转换',
  tagline: 'RFC4648 标准 Base32 互转',
  description:
    '免费在线 Base32 编解码工具，按 RFC4648 标准将文本与 Base32 双向转换，结果只用 A-Z 与 2-7 共 32 个字符，适合密钥、一次性密码与易读场景，全部在浏览器本地完成。',
  keywords: ['Base32', '编码解码', 'RFC4648', 'base32 转换', '在线编解码'],
  category: 'security',
  tags: ['安全', '编码', 'Base32'],
  icon: 'shuffle',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: 'Base32 和 Base64 有什么不同？',
      a: 'Base32 只用 32 个不含易混淆字符（去掉 0/O、1/I/L）的字母数字，更易人工读写，常用于密钥与一次性密码；Base64 更紧凑但含易混字符。',
    },
    {
      q: '输出末尾的等号是什么？',
      a: '等号是 Base32 的填充符，用于把长度补齐到 8 的倍数，解码时会被自动忽略，不影响内容。',
    },
  ],
  related: ['base64', 'crc32-checksum', 'totp-generator'],
});
