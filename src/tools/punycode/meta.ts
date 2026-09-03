import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'punycode',
  name: 'Punycode 编解码',
  tagline: '中文域名与 xn-- 编码互转',
  description:
    '免费在线 Punycode 工具，把中文/国际域名（IDN）与 Punycode（xn-- 开头）互相转换。排查中文域名解析、配置 DNS、识别钓鱼域名时常用，全部本地按 RFC 3492 算法计算。',
  keywords: ['punycode', '中文域名', 'idn 编码', 'xn-- 转换'],
  category: 'dev',
  tags: ['域名', '编码', '开发'],
  icon: 'globe',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['url-parser', 'slug-generator'],
  faq: [
    {
      q: '什么是 Punycode / xn-- ？',
      a: 'DNS 只认 ASCII，非英文字符的域名要用 Punycode 编码成 xn-- 开头的 ASCII 串（如 例子.com → xn--fsqu00a.com）。浏览器地址栏显示中文，底层实际用它。',
    },
    {
      q: '怎么用本工具？',
      a: '编码：输入中文标签（如 例子），得到 xn--fsqu00a；解码：输入 xn--... 还原中文。可整域名也可只转标签部分。',
    },
    {
      q: '钓鱼域名怎么识别？',
      a: '攻击者用外观相近的 Unicode 字符注册域名（同形异义字攻击）。解码 Punycode 能看清真实 ASCII 形态，发现 xn-- 里藏着的陌生字母，提高警惕。',
    },
    {
      q: 'RFC 3492 是什么？',
      a: '它是 Punycode 的官方标准算法，用分离插入法把 Unicode 压缩成 ASCII 且可逆。本工具严格按该算法实现，结果与各语言标准库一致。',
    },
  ],
});
