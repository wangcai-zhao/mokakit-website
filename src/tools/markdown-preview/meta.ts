import { defineTool } from '../types';

export default defineTool({
  id: 'markdown-preview',
  name: 'Markdown 预览',
  seoTitle: 'Markdown预览 - 在线Markdown编辑器实时渲染，支持表格代码块',
  tagline: '实时渲染 Markdown 为富文本',
  description:
    '免费在线 Markdown 预览工具，左侧输入 GFM 语法，右侧实时渲染为格式化文本，支持标题、列表、任务列表、表格、代码块、引用、链接、图片与删除线，可一键复制渲染后的 HTML。适合写作、笔记、README 预览与公众号排版，本地处理不上传。',
  keywords: ['Markdown预览', 'Markdown编辑器', '在线Markdown', 'MD实时渲染', 'Markdown转HTML'],
  category: 'text',
  tags: ['markdown', '文档', '预览', '写作'],
  icon: 'file-text',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-08-04',
  updatedAt: '2026-11-01',
  priority: 4,
  related: ['markdown-table-gen', 'html-to-markdown', 'markdown-toc'],
  faq: [
    {
      q: '支持哪些 Markdown 语法？',
      a: '支持 GFM 常用语法：标题（# ~ ######）、加粗/斜体/删除线、有序与无序列表、任务列表（- [ ]）、表格、引用、行内与块级代码、链接、图片、分隔线等，覆盖日常写作与 README 预览所需。',
    },
    {
      q: '可以把渲染结果复制到公众号编辑器吗？',
      a: '可以。点工具栏右侧的「复制 HTML」，复制的是右侧渲染后的 HTML 代码，粘贴进支持富文本的编辑器（如公众号后台、笔记软件）即可保留排版，粘贴时选择「保留源格式」效果最佳。',
    },
    {
      q: '我的内容会被保存或上传吗？',
      a: '不会。Markdown 解析与渲染完全在浏览器本地进行，文本不上传，刷新页面即恢复为默认示例，适合临时草稿预览。',
    },
  ],
});
