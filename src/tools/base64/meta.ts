import { defineTool } from '../types';

export default defineTool({
  id: 'base64',
  name: 'Base64 编解码',
  tagline: '文本与 Base64 互转',
  description:
    '免费在线 Base64 编解码工具，支持中文与 emoji 的 UTF-8 正确处理，可将文本编码为 Base64 或将 Base64 还原为原文，常用于接口传输、图片内联、数据伪装等场景。',
  keywords: ['Base64编码', 'Base64解码', '在线base64', 'base64转文本', 'utf8 base64'],
  category: 'dev',
  tags: ['Base64', '编码', '解码', '开发'],
  icon: 'file-code',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 6,
  faq: [
    {
      q: '为什么直接用 btoa 处理中文会报错？',
      a: 'btoa 只能处理 Latin1（单字节）字符，中文是双字节 UTF-8，直接传入会抛 DOMException。正确做法是用 TextEncoder 把字符串转成 UTF-8 字节，再做 Base64。本工具已内置该处理，中文和 emoji 都能正常编解码。',
    },
    {
      q: 'Base64 是加密吗？',
      a: '不是。Base64 只是一种编码方式，没有任何密钥，任何人都能瞬间解码还原。它用于在不支持二进制的场景里「搬运」数据，不能用来保护信息。',
    },
  ],
});
