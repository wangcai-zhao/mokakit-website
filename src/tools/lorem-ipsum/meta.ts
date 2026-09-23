import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'lorem-ipsum',
  name: '占位文本生成',
  tagline: '中文与经典占位文',
  description:
    '免费在线占位文本生成工具，可生成中文或经典 Lorem ipsum 占位段落，段落数与段落长度可调，支持包裹成 p 或 li 标签。用随机种子保证同一份文案每次生成结果一致，方便设计稿固定排版。本地生成不联网。',
  keywords: ['占位文本', 'lorem ipsum', '假文生成', '排版测试文字', '中文占位'],
  category: 'text',
  tags: ['文本', '占位', '排版'],
  icon: 'file-text',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 5,
  faq: [
    {
      q: '为什么要有随机种子？',
      a: '设计稿里如果每次刷新都换一批占位文字，反复截图对版会很痛苦。固定种子能让文案稳定下来，想换一批再点「换一批」。',
    },
    {
      q: '中文占位和英文占位有什么区别？',
      a: '中文占位用的是通顺的中文句子，排版效果更接近真实中文内容；英文占位是传统的 Lorem ipsum，做国际化版式预览时用。',
    },
    {
      q: '生成的文字有含义吗？',
      a: '中文占位句是通顺但没有实际意义的套话，只用来占据版面。不要把它当成真实文案发布出去。',
    },
  ],
  related: ['placeholder-image', 'text-counter'],
});
