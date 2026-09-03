import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'html-to-markdown',
  name: 'HTML 转 Markdown',
  tagline: '把 HTML 片段转成 Markdown 文本',
  description:
    '免费在线 HTML 转 Markdown 工具，把网页片段、富文本导出的 HTML 转成干净的 Markdown：标题、段落、链接、图片、列表、代码块、强调都能对应。写文档、迁站、做笔记时批量转换，全部本地解析。',
  keywords: ['html 转 markdown', 'html to md', 'html 转换', 'markdown 转换'],
  category: 'dev',
  tags: ['HTML', 'Markdown', '转换'],
  icon: 'file-code-2',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['markdown-preview', 'html-escape'],
  faq: [
    {
      q: '支持哪些标签？',
      a: '常见块级与行内标签：h1–h6、p、a、img、ul/ol/li、blockquote、pre/code、strong/b、em/i、br、hr。表格会尽量转为 Markdown 表格，复杂嵌套可能需手工微调。',
    },
    {
      q: '样式和 class 会保留吗？',
      a: '不会。Markdown 不表达样式，转换时只取语义结构，class、style、id 等会被忽略，输出为纯 Markdown 文本。',
    },
    {
      q: '和 Markdown 转 HTML 有什么区别？',
      a: '方向相反：本工具是 HTML→MD（网页/富文本变源码），Markdown 预览是 MD→HTML（渲染成网页）。两者互补。',
    },
    {
      q: '内联 HTML 会怎么处理？',
      a: '无法对应到 Markdown 的标签（如 span、div）会降级处理：div 当段落分隔，span 保留其内部文本，保证内容不丢。',
    },
  ],
});
