import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'roman-numeral',
  name: '罗马数字转换',
  tagline: '阿拉伯数字与罗马数字互转',
  description:
    '免费在线罗马数字转换器，支持阿拉伯数字（1–3999）与罗马数字（I、V、X、L、C、D、M）双向转换，并逐位拆解每位数字对应的罗马符号。适合阅读古典钟表、纪念碑年份、书籍章节编号、电影/游戏版本号（如 Super Bowl LV）与奥运会届数，本地即时换算。',
  keywords: ['罗马数字转换', '阿拉伯数字转罗马', '罗马数字对照', '年份转罗马数字', 'roman numeral'],
  category: 'calc',
  tags: ['罗马数字', '进制', '数学'],
  icon: 'hash',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '为什么罗马数字没有 0？',
      a: '罗马数字起源于计数需求而非位值制，没有表示「空位」的符号，因此没有 0。现代钟表、序号里的 0 通常会用「NUL」或直接留空表示。',
    },
    {
      q: '罗马数字最大能表示到多少？',
      a: '标准规则下最大为 3999（MMMCMXCIX）。更大的数需要加横线表示千倍，本工具支持 1–3999 的常规范围。',
    },
    {
      q: '为什么有时用减法表示，比如 4 写成 IV？',
      a: '罗马数字中，小数字放在大数字左边表示减去它（IV=5−1=4，IX=10−1=9）。同一数字最多连续出现三次，第四次要改用减法形式。',
    },
  ],
  related: ['base-converter', 'gcd-lcm', 'scientific-notation'],
});
