import { defineTool } from '../types';

export default defineTool({
  id: 'hash-calculator',
  name: '哈希计算',
  tagline: 'SHA-1 / SHA-256 本地计算',
  description:
    '免费在线哈希计算工具，支持 SHA-1 与 SHA-256 摘要计算，纯本地运行，输入内容不会离开你的设备。可用于文件校验、接口签名、数据完整性验证。',
  keywords: ['哈希计算', 'sha256在线', 'sha1计算', '哈希工具', '在线哈希'],
  category: 'security',
  tags: ['哈希', 'sha256', '加密', '校验'],
  icon: 'fingerprint',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 4,
  faq: [
    {
      q: '哈希和加密是一回事吗？',
      a: '不是。加密是可逆的（有密钥就能还原原文），哈希是单向的（无法从摘要反推原文），主要用于校验完整性。本工具做的是哈希，不能逆向解密。',
    },
    {
      q: '为什么只支持 SHA-1 和 SHA-256，不支持 MD5？',
      a: 'MD5 已被证明存在严重碰撞漏洞，不再适合安全用途；SHA-1 也仅建议用于历史兼容性校验。本工具优先提供仍安全的 SHA-256。所有计算均在浏览器本地完成，不经过服务器。',
    },
    {
      q: '计算出来的哈希可以用来校验文件吗？',
      a: '可以。把文本内容输入进来，得到的摘要与对方提供的摘要比对即可判断内容是否被篡改。注意本工具针对文本输入，大文件建议用本地软件的哈希功能。',
    },
  ],
});
