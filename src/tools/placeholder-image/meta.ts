import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'placeholder-image',
  name: '占位图生成',
  tagline: '自定义尺寸的占位图片',
  description:
    '免费在线占位图生成工具，输入宽高即可生成带渐变背景与对角叉的占位图，可自定义两种渐变色、图上文字与标注内容，支持 PNG / JPEG / WebP 导出。纯本地 canvas 绘制，不需要联网找素材，适合骨架屏与设计稿排版。',
  keywords: ['占位图生成', 'placeholder 图片', '占位图片在线生成', '骨架屏图片', '测试图片'],
  category: 'image',
  tags: ['图片', '占位图', '设计'],
  icon: 'grid',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 5,
  faq: [
    {
      q: '占位图和示例图有什么区别？',
      a: '占位图只用于占据版面、验证布局，本身没有内容意义；示例图是真实内容的示范。这个工具生成的是前者，画面对角带叉，一眼能看出是占位。',
    },
    {
      q: '文字颜色能自己改吗？',
      a: '工具会按背景色的明暗自动切换深色或浅色文字，保证对比度够看。想要自定义请先关掉「图上标注尺寸」再用自定义文字。',
    },
    {
      q: '可以生成很大的图吗？',
      a: '最大支持 8000×8000。不过占位图一般不需要太大，1600×900 足够覆盖大多数横版场景。',
    },
  ],
  related: ['lorem-ipsum', 'image-info'],
});
