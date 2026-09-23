import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'text-whitespace',
  name: '空白清理',
  tagline: '清全角空格与空行',
  description:
    '免费在线文本空白清理工具，一键处理全角转半角、Tab 转空格、合并连续空格、去掉行首尾空白、合并或删除空行、去掉所有换行等七类常见问题，实时对比清理前后的字符数。本地处理不上传。',
  keywords: ['空白清理', '去除空格', '全角转半角', '删除空行', '文本整理'],
  category: 'text',
  tags: ['文本', '清理', '格式'],
  icon: 'eraser',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: '从 PDF 复制的文字为什么对不齐？',
      a: 'PDF 里常混入全角空格、不规则缩进和软换行，粘进代码编辑器或表格就会错位。用本工具勾选全角转半角、合并连续空格、去掉行首尾空白，基本能收拾干净。',
    },
    {
      q: '「合并连续空行」和「删除所有空行」有什么区别？',
      a: '前者把三个以上的连续换行压成两个（保留段落分隔），后者把空行整行删掉（段落全部连在一起）。',
    },
    {
      q: '会改变文字内容吗？',
      a: '只动空白字符，不动可见文字。全角转半角除外，它会把全角英文字母和数字转成半角。',
    },
  ],
  related: ['text-dedup', 'line-sort'],
});
