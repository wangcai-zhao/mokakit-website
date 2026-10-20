import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'crc32-checksum',
  name: 'CRC32 校验',
  seoTitle: 'CRC32 校验 - 在线计算文本 CRC32 校验值',
  tagline: '计算文本 CRC32 校验值',
  description:
    '免费在线 CRC32 校验工具，输入文本即可计算标准的 CRC32 校验值（八位大写十六进制），用于数据完整性校验、通信与文件比对，全部在浏览器本地计算。',
  keywords: ['CRC32', '校验和', 'checksum', '数据校验', 'CRC 计算'],
  category: 'security',
  tags: ['安全', '校验', '哈希'],
  icon: 'binary',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: 'CRC32 有什么用？',
      a: '它是广泛使用的差错检测码，能在传输或存储后发现意外的数据改动，常见于网络协议、压缩包与文件校验，但不具备密码学安全性。',
    },
    {
      q: '结果是大写还是小写？',
      a: '本工具统一输出八位大写十六进制，例如 ABCD1234，便于与各类系统比对。',
    },
  ],
  related: ['hash-calculator', 'base32-encoder', 'uuid-generator'],
});
