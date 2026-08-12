import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'json-to-csv',
  name: 'JSON 转 CSV',
  tagline: '数组对象转表格 CSV',
  description:
    '免费在线 JSON 转 CSV 工具，把对象数组格式的 JSON 一键转换成 Excel 可直接打开的 CSV 表格，自动取所有字段的并集作为表头，并按标准规则转义逗号、双引号与换行，支持结果一键复制或下载为 .csv 文件。全部转换在浏览器本地完成，数据不会上传服务器，立即试试。',
  keywords: ['JSON转CSV', '在线JSON转表格', 'JSON转Excel', 'CSV导出', 'JSON工具'],
  category: 'dev',
  tags: ['json', 'csv', '转换'],
  icon: 'table',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '各条数据的字段不一致怎么办？',
      a: '工具会先扫描全部记录，按首次出现顺序收集所有 key 组成表头并集。某条记录缺失的字段会输出为空值，不会错位，因此字段参差不齐的数据也能安全转换。',
    },
    {
      q: '内容里含逗号或引号会不会把表格弄乱？',
      a: '不会。凡是包含逗号、双引号、换行符的单元格都会用双引号包裹，内部的双引号按 CSV 标准写成两个连续双引号，Excel、WPS、Numbers 都能正确还原。',
    },
    {
      q: '嵌套的对象或数组怎么处理？',
      a: '嵌套值会被序列化成 JSON 字符串填入单元格，保证信息不丢失。如需展开成多列，建议先在 JSON 格式化工具中把数据拍平后再转换。',
    },
  ],
  related: ['json-formatter', 'text-counter'],
});
