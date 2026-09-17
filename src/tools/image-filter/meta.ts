import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'image-filter',
  name: '图片滤镜',
  tagline: '亮度对比度模糊调色',
  description:
    '免费在线图片滤镜工具，提供黑白、反色、复古、鲜艳、冷调五种预设，另配亮度、对比度、饱和度、模糊四个滑块自由调节。走浏览器原生 canvas filter，实时预览所见即所得，图片不上传服务器。',
  keywords: ['图片滤镜', '在线调色', '图片黑白', '高斯模糊', '图片亮度调整'],
  category: 'image',
  tags: ['图片', '滤镜', '调色'],
  icon: 'sliders-horizontal',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 6,
  faq: [
    {
      q: '能做马赛克遮挡吗？',
      a: '可以近似实现：把模糊拉到 8-12px 以上，敏感区域就会糊掉。不过真正的马赛克是像素化处理，模糊只是视觉近似。',
    },
    {
      q: '预设和滑块能叠加吗？',
      a: '能。预设效果和四个滑块是叠加关系，先应用预设再叠加你的手动调整，全部复位会把两者一起清掉。',
    },
    {
      q: '导出 JPEG 透明部分会怎样？',
      a: '会变成不透明（通常是黑底或你设置的背景），因为 JPEG 不支持透明通道。需要保留透明就导出 PNG 或 WebP。',
    },
  ],
  related: ['image-watermark', 'image-info'],
});
