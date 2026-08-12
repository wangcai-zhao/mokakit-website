import { defineTool } from '../types';

export default defineTool({
  id: 'text-counter',
  name: '字数统计',
  tagline: '字符 / 字数 / 字节统计',
  description:
    '免费在线字数统计工具，实时统计字符数、不含空格字符数、中文字数、英文词数、行数与 UTF-8 字节数，适合写作字数核对、推文长度限制检查、接口字段长度校验等场景。',
  keywords: ['字数统计', '字符统计', '在线字数', '中文字数', '字节数统计'],
  category: 'text',
  tags: ['字数', '字符', '统计', '文本'],
  icon: 'align-left',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: '中文字数和字符数有什么不同？',
      a: '「字符数」把所有字符（含中文、英文、标点、空格）都算 1 个；「中文字数」只统计汉字个数，更适合衡量中文写作篇幅。本工具两个指标分别列出，方便对照。',
    },
    {
      q: '字节数有什么用？',
      a: '很多系统（如数据库字段、短信、推文）限制的是「字节」而非字符。一个中文 UTF-8 占 3 字节、emoji 可能占 4 字节。超出字节上限会截断，因此发布前核对字节数很实用。',
    },
  ],
});
