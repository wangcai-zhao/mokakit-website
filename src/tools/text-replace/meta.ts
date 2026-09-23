import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'text-replace',
  name: '批量替换',
  tagline: '多条规则一次替换',
  description:
    '免费在线批量替换工具，可以同时配置多条查找替换规则按顺序依次执行，每条规则独立开关正则与大小写敏感，实时显示替换了多少处。支持正则捕获组引用，全部本地处理不上传。',
  keywords: ['批量替换', '文本替换', '在线替换', '批量查找替换', '正则替换'],
  category: 'text',
  tags: ['文本', '替换', '批处理'],
  icon: 'wand',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: '多条规则的执行顺序是什么？',
      a: '自上而下依次执行，前一条的输出是后一条的输入。所以规则顺序会影响最终结果，需要留意。',
    },
    {
      q: '正则模式能用捕获组吗？',
      a: '可以。在「替换为」里用 $1、$2 引用对应的捕获组，用 $& 引用整个匹配内容。',
    },
    {
      q: '想把某些词删掉怎么办？',
      a: '把「替换为」留空即可，等于把所有匹配到的内容删除。',
    },
  ],
  related: ['text-extract', 'text-whitespace'],
});
