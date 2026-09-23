import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'text-split-join',
  name: '文本分割合并',
  tagline: '分隔符互转、加引号',
  description:
    '免费在线文本分割与合并工具，按换行、逗号、空格、Tab、分号、竖线或自定义分隔符（支持正则）把一长串文本拆成多项，再用任意连接符拼回去。可边拆边去重、去空白、加单引号，写 SQL IN 条件特别顺手。本地处理不上传。',
  keywords: ['文本分割', '字符串合并', '分隔符转换', 'split join', 'SQL IN 生成'],
  category: 'text',
  tags: ['文本', '分割', '合并'],
  icon: 'align-left',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: '自定义分隔符支持正则吗？',
      a: '支持。比如填 \\s+ 表示按任意连续空白切分，填 [,，] 表示中英文逗号都算分隔符。',
    },
    {
      q: '「加单引号」是干嘛用的？',
      a: '写 SQL 的 IN 条件时用：一组 ID 或姓名拆开后加上单引号再逗號连起来，直接粘进 WHERE name IN (...) 就能跑。',
    },
    {
      q: '拆分和合并模式有什么区别？',
      a: '底层是同一套逻辑，只是侧重点不同：拆分模式关注「按什么切开」，合并模式关注「用什么连起来」。两个模式共用同一份输入和输出连接符设置。',
    },
  ],
  related: ['text-dedup', 'csv-to-markdown'],
});
