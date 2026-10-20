import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'csv-to-json',
  name: 'CSV ↔ JSON 转换',
  seoTitle: 'CSV 与 JSON 互转 - 在线批量转换表格与 JSON',
  tagline: 'CSV 与 JSON 双向转换',
  description:
    '免费在线 CSV 与 JSON 转换工具，支持自定义分隔符与表头开关，把 CSV 文本转成 JSON 数组，也能把 JSON 数组转回 CSV，适合接口调试与表格处理，全部在浏览器本地完成。',
  keywords: ['CSV 转 JSON', 'JSON 转 CSV', '表格转换', '数据转换', '在线互转'],
  category: 'dev',
  tags: ['开发', '数据', '转换'],
  icon: 'table',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: 'CSV 里的双引号怎么处理？',
      a: '本工具支持标准 CSV 引号包裹与双引号转义（两个引号表示一个引号），含逗号或换行的字段用引号包裹即可正确解析。',
    },
    {
      q: '没有表头能转换吗？',
      a: '可以。关闭表头开关后，CSV 会转为二维数组，每行是一个字符串数组，适合纯数值矩阵。',
    },
  ],
  related: ['json-formatter', 'json-to-csv', 'yaml-json'],
});
