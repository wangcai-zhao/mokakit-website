import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'markdown-table-gen',
  name: 'Markdown 表格生成',
  tagline: 'CSV 与 JSON 转表格',
  description:
    '免费在线 Markdown 表格生成工具，把 CSV、逗号分隔文本或 JSON 数组一键转成带对齐的 Markdown 表格，可设表头、对齐方式与是否补空格对齐，同时给出 HTML 版本并实时预览渲染效果。本地转换不上传。',
  keywords: ['Markdown 表格', 'CSV 转表格', 'JSON 转表格', 'md 表格生成', '表格生成器'],
  category: 'dev',
  tags: ['Markdown', '表格', '文档'],
  icon: 'table',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 6,
  faq: [
    {
      q: '单元格里有竖线怎么办？',
      a: '工具会自动转义成 \\|，否则会撑破表格结构。这点手工写表格时最容易漏。',
    },
    {
      q: 'JSON 输入的键顺序怎么定？',
      a: '取所有对象里出现过的键的并集，按首次出现的顺序排列，缺失的字段留空。',
    },
    {
      q: 'Markdown 表格能做合并单元格吗？',
      a: '不能。Markdown 表格语法不支持合并单元格、换行和列宽控制，遇到复杂表格直接用工具给出的 HTML 版本。',
    },
  ],
  related: ['csv-to-markdown', 'json-to-csv'],
});
