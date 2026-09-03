import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'csv-to-markdown',
  name: 'CSV 转 Markdown 表格',
  tagline: '把 CSV 数据一键转成 Markdown 表格',
  description:
    '免费在线 CSV 转 Markdown 工具，把 CSV 数据（支持引号包裹、逗号分隔）转成 GitHub 风格的 Markdown 表格，首行作表头并自动加对齐行。写 README、文档、周报时把表格数据贴进来即用，全部本地解析。',
  keywords: ['csv 转 markdown', 'csv 表格', 'csv to md', 'markdown 表格'],
  category: 'dev',
  tags: ['CSV', 'Markdown', '转换'],
  icon: 'table',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['json-to-csv', 'markdown-preview'],
  faq: [
    {
      q: '引号里的逗号会出错吗？',
      a: '不会。解析器识别双引号包裹的字段，引号内的逗号、换行都作为字段内容，符合 RFC 4180 标准。',
    },
    {
      q: '表头怎么定？',
      a: '默认把第一行当作表头；若你的数据没有表头，可关闭「首行作表头」，生成带占位表头的表格。',
    },
    {
      q: '分隔符只能是逗号吗？',
      a: '默认逗号；可切换为制表符（TSV）或分号（欧标 CSV 常用 ;）。切换后按对应分隔符解析。',
    },
    {
      q: '和 JSON 转 CSV 有关系吗？',
      a: '是互补工具：JSON 转 CSV 把对象数组变表格文本，本工具把 CSV 变 Markdown 表格源码。两者都用于数据↔文档的转换。',
    },
  ],
});
