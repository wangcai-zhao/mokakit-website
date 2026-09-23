import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'image-base64',
  name: '图片 Base64 转换',
  tagline: '图片与 Base64 互转',
  description:
    '免费在线图片转 Base64 工具，支持双向转换：上传图片得到 Base64 字符串（可带或不带 data URL 前缀），粘贴 Base64 也能解析回图片并下载。可指定 PNG / JPEG / WebP 编码，全程本地处理不上传。',
  keywords: ['图片转 Base64', 'Base64 转图片', '图片编码', 'data URL', '在线 Base64'],
  category: 'image',
  tags: ['图片', 'Base64', '编码'],
  icon: 'file-code',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: '带不带 data:image 前缀有什么区别？',
      a: '带前缀的字符串可以直接塞进 img 标签的 src 或 CSS 的 url()，浏览器认得出来；不带前缀的只是纯编码数据，需要自己拼前缀，通常用在后端存储或接口传输。',
    },
    {
      q: 'Base64 会让文件变大多少？',
      a: '大约增加三分之一。因为每 3 个字节的二进制数据要用 4 个可打印字符表示，所以 100 KB 的图片编码后约 133 KB 字符。',
    },
    {
      q: '多大的图片适合转 Base64？',
      a: '几十 KB 以内的小图标、小 logo 适合内联，能省一次 HTTP 请求。超过几十 KB 就不建议了，会拖慢首屏且无法走浏览器缓存。',
    },
  ],
  related: ['base64', 'image-convert'],
});
