import { defineTool } from '../types';

export default defineTool({
  id: 'qrcode-generator',
  name: '二维码生成',
  tagline: '文本/网址一键生成二维码',
  description:
    '免费在线二维码生成工具，输入网址、文本、名片或任意内容即可一键生成二维码，支持调整尺寸、容错等级与前景背景色，方便手机扫码跳转。名片、WiFi 分享、群邀请、付款码皆适用，所有生成都在本地完成、内容不上传。',
  keywords: ['二维码生成', '生成二维码', '在线二维码', '网址转二维码', 'QR码'],
  category: 'dev',
  tags: ['二维码', 'QR', '开发', '生成'],
  icon: 'qr',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 4,
  faq: [
    {
      q: '生成的二维码安全吗？会记录我的内容吗？',
      a: '安全。二维码在你的浏览器本地生成，输入的内容不会上传到任何服务器，可放心生成包含私密链接或文本的二维码。',
    },
    {
      q: '支持什么内容？',
      a: '支持任意文本，包括网址（http/https）、WIFI 信息、纯文本、电话号码等。生成后可直接右键保存图片。',
    },
  ],
});
