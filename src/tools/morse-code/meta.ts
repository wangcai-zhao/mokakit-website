import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'morse-code',
  name: '摩斯电码转换',
  seoTitle: '摩斯电码转换 - 在线文本与摩斯互转',
  tagline: '文本与摩斯电码双向转换',
  description:
    '免费在线摩斯电码转换工具，支持英文、数字与常用标点与摩斯电码双向转换，点划清晰分隔，适合业余无线电、电报教学与解密游戏，全部在浏览器本地完成。',
  keywords: ['摩斯电码', '莫尔斯码', '电报', 'Morse', '电码转换'],
  category: 'text',
  tags: ['文本', '编码', '摩斯'],
  icon: 'megaphone',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: '支持中文吗？',
      a: '摩斯电码以拉丁字母与数字为基础，本工具对 A-Z、0-9 与常用标点做转换；中文会原样保留，不包含在标准摩斯表内。',
    },
    {
      q: '转换结果里的斜杠代表什么？',
      a: '字母之间用空格分隔，单词之间用斜杠 / 分隔，这是摩斯传输中区分词边界的常见写法。',
    },
  ],
  related: ['unicode-escape', 'base64', 'text-reverse'],
});
