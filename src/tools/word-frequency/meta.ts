import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'word-frequency',
  name: '词频统计器',
  seoTitle: '词频统计器 - 在线统计文本词频与占比',
  tagline: '统计词语出现次数与占比',
  description:
    '免费在线词频统计工具，粘贴一段中英文文本即可统计每个词出现的次数与占比，支持忽略停用词、最小词长过滤与 TopN 排序，结果可一键复制，全部在浏览器本地完成，不上传任何内容。',
  keywords: ['词频统计', '文本分析', '词频分析', '词语计数', '在线词频'],
  category: 'text',
  tags: ['文本', '统计', '词频'],
  icon: 'hash',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 7,
  faq: [
    {
      q: '词是怎么切分的？',
      a: '英文按字母与数字连续段切词并统一小写，中文按汉字逐个统计，标点与空白会被忽略。中英文混排也能正确统计。',
    },
    {
      q: '停用词是什么，要不要忽略？',
      a: '停用词是 the、and、你、我 这类高频但信息量低的词。默认忽略它们能更快看到有实质含义的词；如需完整统计可关闭该开关。',
    },
    {
      q: '占比是怎么算的？',
      a: '单个词的占比等于它的出现次数除以总词数（已过滤空项后），以百分比展示，方便看分布。',
    },
  ],
  related: ['text-counter', 'text-dedup', 'chinese-number'],
});
