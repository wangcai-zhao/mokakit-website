import { defineTool } from '../types';

export default defineTool({
  id: 'markdown-preview',
  name: 'Markdown 预览',
  tagline: '实时渲染 Markdown 为富文本',
  description:
    '免费在线 Markdown 预览工具，左侧输入 Markdown 语法（GFM 标准），右侧实时渲染为格式化文本，支持标题、列表、加粗、斜体、代码块、表格、流程图、数学公式与脚注等常用语法。适合写作、笔记、文档排版、README 预览与公众号排版，所见即所得。',
  keywords: ['Markdown预览', 'Markdown编辑器', '在线Markdown', 'MD实时渲染', 'Markdown转HTML'],
  category: 'text',
  tags: ['markdown', '文档', '预览', '写作'],
  icon: 'file-text',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 4,
  faq: [
    {
      q: '支持哪些 Markdown 语法？',
      a: '支持常见语法：标题（# ~ ######）、加粗/斜体、有序与无序列表、引用、行内与块级代码、链接、分隔线等，覆盖日常写作所需。',
    },
    {
      q: '我的内容会被保存或上传吗？',
      a: '不会。Markdown 解析完全在浏览器本地进行，文本不上传，刷新页面即清空，适合临时草稿预览。',
    },
  ],
});
