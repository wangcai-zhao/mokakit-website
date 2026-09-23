import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'image-watermark',
  name: '图片水印',
  tagline: '文字水印、平铺防截图',
  description:
    '免费在线图片加水印工具，可自定义水印文字、字号、颜色、透明度与九宫格位置，支持满屏斜向平铺防止截图外传。导出 PNG / JPEG / WebP，全部在浏览器本地用 canvas 绘制，原图不上传服务器。',
  keywords: ['图片加水印', '在线水印工具', '批量水印', '平铺水印', '图片防盗'],
  category: 'image',
  tags: ['图片', '水印', '版权'],
  icon: 'droplet',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 7,
  faq: [
    {
      q: '平铺水印有什么用？',
      a: '单个角标很容易被裁掉或抹掉，密集的斜向平铺水印覆盖整张图，裁剪会毁掉图片本身，抹除成本也高得多，适合发给第三方的证件、报价单截图。',
    },
    {
      q: '水印能防止被盗图吗？',
      a: '只能提高盗用成本，挡不住专业去水印工具。真正涉密的材料应该走权限管控和水印追踪，而不是指望可见水印。',
    },
    {
      q: '为什么选了白色水印看不清？',
      a: '白色水印在浅色背景上会糊掉。工具自带阴影描边增强对比，背景很亮时建议改成深色，或者把不透明度调高。',
    },
  ],
  related: ['image-filter', 'image-crop'],
});
