import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'unicode-escape',
  name: 'Unicode 转义',
  tagline: '中文与转义互转',
  description:
    '免费在线 Unicode 转义工具，支持 \\uXXXX、U+XXXX、\\xXX、%XX（URL 编码）、&#xXXXX;（HTML 实体）五种格式的转义，并能自动识别这六种写法混排的字符串一次还原。自带各格式对照表。本地处理不上传。',
  keywords: ['Unicode 转义', '中文转 Unicode', '\\u 转中文', 'URL 编码', 'HTML 实体转换'],
  category: 'text',
  tags: ['文本', 'Unicode', '编码'],
  icon: 'braces',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: '五种格式该怎么选？',
      a: '写 JS 或 JSON 用 \\uXXXX；跟人沟通码点用 U+XXXX；按字节处理用 \\xXX；拼 URL 参数用 %XX；写在 HTML 里用 &#xXXXX;。',
    },
    {
      q: 'emoji 转出来为什么是两个 \\u？',
      a: 'emoji 的码点超出基本平面（BMP），在 UTF-16 里要用一对代理字符表示，所以会看到两个 \\u。这是 JavaScript 字符串的标准行为，不是 bug。',
    },
    {
      q: '反转义能识别混合写法吗？',
      a: '能。一段文本里同时有 \\u4E2D、&#x6587; 和 %XX，工具会依次识别并全部还原。',
    },
  ],
  related: ['url-encoder', 'html-escape'],
});
