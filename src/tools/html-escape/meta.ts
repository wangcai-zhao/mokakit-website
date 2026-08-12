import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'html-escape',
  name: 'HTML 实体编解码',
  tagline: '转义特殊字符',
  description:
    '免费在线 HTML 实体编解码工具，一键把 & < > " 等特殊字符转成 &amp;、&lt;、&gt;、&quot; 等实体，或将实体还原为原始文本。常用于在网页安全输出用户内容、防止 XSS 注入、在文章中展示代码片段等场景，纯本地转换、不上传内容，打开即用。',
  keywords: ['HTML转义', 'HTML实体编码', 'HTML解码', '特殊字符转义', 'html escape'],
  category: 'dev',
  tags: ['html', '转义', 'web'],
  icon: 'code',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 6,
  faq: [
    {
      q: '为什么要对 HTML 特殊字符做转义？',
      a: '未转义的用户内容一旦被当作 HTML 解析，尖括号里的脚本就会被执行，形成 XSS 漏洞。把 & < > " 等转成实体后浏览器只会原样显示文本，既安全又能正确展示代码片段。',
    },
    {
      q: '编码会处理哪些字符？',
      a: '默认处理五个基础字符：& 转 &amp;、< 转 &lt;、> 转 &gt;、双引号转 &quot;、单引号转 &#39;。这组转义足以覆盖 HTML 文本节点与属性值的常见注入风险。',
    },
    {
      q: '解码支持数字实体吗？',
      a: '支持。除了 &amp; &lt; &gt; &quot; &#39; &nbsp; 等命名实体，&#38; 这类十进制与 &#x27; 这类十六进制数字实体也能正确还原成原字符。',
    },
  ],
  related: ['url-encoder', 'base64'],
});
