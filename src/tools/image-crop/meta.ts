import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'image-crop',
  name: '图片裁剪',
  tagline: '按比例取图不变形',
  description:
    '免费在线图片裁剪工具，内置 1:1、4:3、3:2、16:9、9:16、3:4 六种常用比例，配合九宫格定位决定保留哪一部分，按目标比例在原图上取最大矩形，绝不拉伸变形。本地 canvas 处理，图片不上传。',
  keywords: ['图片裁剪', '在线裁图', '一寸照片裁剪', '图片按比例裁剪', '方图裁剪'],
  category: 'image',
  tags: ['图片', '裁剪', '比例'],
  icon: 'crop',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: '裁剪会拉伸图片吗？',
      a: '不会。工具按目标比例在原图上取一个尽可能大的矩形，只决定「留下哪一块」，不改变像素本身的形状。',
    },
    {
      q: '为什么裁剪后尺寸不是我想要的？',
      a: '输出尺寸由原图和目标比例共同决定。比如 4000×3000 的图裁 16:9，会得到 4000×2250。想要固定像素尺寸，裁剪后可以用图片尺寸调整工具再改一次。',
    },
    {
      q: '想保留人像的头部该选哪个位置？',
      a: '人像通常选「上中」或「正中」，这样构图会偏上，不容易把头顶切掉。',
    },
  ],
  related: ['image-resize', 'favicon-generator'],
});
