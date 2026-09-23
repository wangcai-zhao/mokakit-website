import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'image-info',
  name: '图片信息查看',
  tagline: '尺寸体积与主色提取',
  description:
    '免费在线图片信息查看工具，读取文件格式、大小、像素尺寸、精确宽高比、像素总量与修改时间，并能抽样统计画面主色。所有信息从浏览器本地读取，图片不上传服务器，是设计对稿与排查图片问题的常用手段。',
  keywords: ['图片信息', '查看图片尺寸', '图片属性', '图片主色', 'EXIF 查看'],
  category: 'image',
  tags: ['图片', '信息', '主色'],
  icon: 'scan',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 6,
  faq: [
    {
      q: '能看拍摄参数和 GPS 位置吗？',
      a: '不能。这些属于 EXIF 元数据，需要解析文件二进制结构，本工具只读浏览器解码后能拿到的基础信息，不涉及隐私数据读取。',
    },
    {
      q: '主色准确吗？',
      a: '是抽样统计：把画面缩到 40×40 后按颜色量化分组取前几名，适合快速找配色方案，不适合做精确的色彩分析。',
    },
    {
      q: '为什么宽高比显示两个值？',
      a: '一个是最简整数比（如 16:9），方便对齐设计稿；一个是精确小数（如 1.778），方便算布局尺寸。',
    },
  ],
  related: ['image-filter', 'image-compress'],
});
