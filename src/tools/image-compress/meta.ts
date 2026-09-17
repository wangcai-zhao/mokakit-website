import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'image-compress',
  name: '图片压缩',
  tagline: '压体积不降清晰度',
  description:
    '免费在线图片压缩工具，拖动质量滑块即可实时看到压缩后的体积与节省比例，支持输出 JPEG、WebP、PNG 三种格式并限制最大宽度。全部在浏览器本地用 canvas 完成，图片不上传服务器，适合压缩公众号配图、电商主图与证件照。',
  keywords: ['图片压缩', '在线压缩图片', '照片压缩', '图片体积减小', 'WebP 压缩'],
  category: 'image',
  tags: ['图片', '压缩', '体积'],
  icon: 'minimize',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 8,
  faq: [
    {
      q: '压缩后的图片清晰吗？',
      a: '质量调到 70%-85% 时，人眼通常看不出差别，但体积能减掉一半以上。这个工具会实时算出压缩后的大小，你可以左右拖动滑块找一个肉眼无差、体积最小的点。',
    },
    {
      q: '图片会上传到服务器吗？',
      a: '不会。整个压缩过程在你自己的浏览器里用 canvas 完成，图片数据一步都没有离开设备，处理身份证、合同截图这类敏感图片也可以放心。',
    },
    {
      q: '为什么压完反而变大了？',
      a: 'PNG 是无损格式，把已经很小的 JPEG 转成 PNG 通常会变大。遇到这种情况换成 WebP 或 JPEG，并把质量调到 85% 以下。',
    },
  ],
  related: ['image-resize', 'image-convert'],
});
