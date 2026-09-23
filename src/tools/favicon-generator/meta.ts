import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'favicon-generator',
  name: 'Favicon 生成',
  tagline: '一次出全套图标尺寸',
  description:
    '免费在线 Favicon 生成工具，上传一张 logo 即可批量产出 16、32、48、64、128、180、192、512 共八种尺寸的 PNG 图标，可调节留白、圆形裁切与背景色，并附赠可直接复制的 HTML 引用代码。本地 canvas 生成，不上传。',
  keywords: ['favicon 生成', '网站图标制作', 'apple-touch-icon', 'PWA 图标', 'ico 生成'],
  category: 'image',
  tags: ['图片', 'favicon', '图标'],
  icon: 'star',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 6,
  faq: [
    {
      q: '为什么需要这么多尺寸？',
      a: '不同场景要不同尺寸：16 和 32 给浏览器标签页，180 是 iOS 添加到主屏的 apple-touch-icon，192 和 512 给 PWA 的 manifest。少给几个也能用，但会由浏览器缩放，边缘可能发虚。',
    },
    {
      q: '源图不是正方形怎么办？',
      a: '会被拉伸缩放填满画布，图标会变形。建议先裁剪成正方形，或者把留白调大一点让主体居中。',
    },
    {
      q: '能直接生成 .ico 文件吗？',
      a: '不能。ico 是把多个尺寸打包进一个容器，本站不生成这个格式。其实现代浏览器直接用 32×32 的 PNG 完全没问题，也可以把生成的 PNG 用其他工具打包成 ico。',
    },
  ],
  related: ['image-resize', 'image-crop'],
});
