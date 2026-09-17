import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'text-similarity',
  name: '文本相似度',
  tagline: '查重与洗稿检测',
  description:
    '免费在线文本相似度对比工具，同时给出编辑距离相似度、余弦相似度与 Jaccard 重合度三个指标，可忽略大小写与空白。中文按字切分、英文按词切分，适合查重、洗稿判定与错别字比对。本地计算不上传。',
  keywords: ['文本相似度', '查重', '余弦相似度', '编辑距离', '重复内容检测'],
  category: 'text',
  tags: ['文本', '相似度', '查重'],
  icon: 'git-compare',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 6,
  faq: [
    {
      q: '三个指标该看哪个？',
      a: '查错别字和细微改动看编辑距离相似度；判断两段话是不是同一个主题看余弦相似度；只关心用词重不重合看 Jaccard。三个一起看最稳。',
    },
    {
      q: '多少算高相似？',
      a: '没有绝对阈值。经验上余弦相似度超过 0.85 基本可以判定高度相似，0.6-0.85 之间需要人工看内容再定。',
    },
    {
      q: '中文是怎么切词的？',
      a: '按单个汉字切分。这比依赖分词库更稳，不会因为分词器版本不同得出不一样的结果。',
    },
  ],
  related: ['text-diff', 'text-dedup'],
});
