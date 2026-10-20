import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'rot13-cipher',
  name: 'ROT13 凯撒密码',
  seoTitle: 'ROT13 凯撒密码 - 在线字母移位加解密',
  tagline: '字母移位加密与解密',
  description:
    '免费在线 ROT13 与凯撒密码工具，把英文字母按指定位数循环移位，ROT13 加解密互为同一操作，适合趣味加密、谜题与教学演示，全部在浏览器本地完成。',
  keywords: ['ROT13', '凯撒密码', '字母移位', '加密解密', '趣味密码'],
  category: 'security',
  tags: ['安全', '加密', '趣味'],
  icon: 'key',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: '为什么 ROT13 加密和解密是一样的？',
      a: '因为字母表共 26 个，移位 13 后再移 13 就回到原处，所以同一操作既是加密也是解密。',
    },
    {
      q: '可以自定义移位位数吗？',
      a: '可以。默认 13，你也可以改成任意 0-25 的偏移量，得到标准的凯撒密码。',
    },
  ],
  related: ['aes-encrypt', 'base32-encoder', 'base64'],
});
