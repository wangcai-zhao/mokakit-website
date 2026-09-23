import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'image-convert',
  name: '图片格式转换',
  tagline: 'PNG / JPEG / WebP 互转',
  description:
    '免费在线图片格式转换工具，支持 PNG、JPEG、WebP 三种格式互转，可调节导出质量，转 JPEG 时还能指定透明区域的填充色避免变黑。全部在浏览器本地完成，不上传服务器，转换前后体积实时对比。',
  keywords: ['图片格式转换', 'PNG 转 JPG', 'JPG 转 WebP', '在线转图片格式', 'WebP 转换'],
  category: 'image',
  tags: ['图片', '格式', '转换'],
  icon: 'arrowLeftRight',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 8,
  faq: [
    {
      q: '转 JPEG 后透明的地方怎么变黑了？',
      a: 'JPEG 格式不支持透明通道，透明像素转成 JPEG 时默认会被填成黑色。这个工具提供了填充色选项，勾上白色就能得到白底图。',
    },
    {
      q: 'WebP 和 JPEG 该选哪个？',
      a: '同等画质下 WebP 通常比 JPEG 小 25%-35%，而且支持透明和动画。除非要兼容很老的浏览器，否则 WebP 是更优解。',
    },
    {
      q: '转换会损失画质吗？',
      a: 'PNG 是无损格式，转 PNG 不损失画质。转 JPEG 是必然有损的，转 WebP 在质量 90% 以上时肉眼几乎无差。',
    },
  ],
  related: ['image-compress', 'image-base64'],
});
