import { defineTool } from '../types';

export default defineTool({
  id: 'base-converter',
  name: '进制转换',
  tagline: '2/8/10/16 等进制互转',
  description:
    '免费在线进制转换工具，支持二进制、八进制、十进制、十六进制及 2 到 36 任意进制互转，基于 BigInt 任意精度，超长数字也不丢精度。程序员、学生做进制换算的好帮手。',
  keywords: ['进制转换', '二进制转换', '十六进制转换', '在线进制计算器', '2进制转16进制'],
  category: 'convert',
  tags: ['进制', '转换', '计算', '数字'],
  icon: 'binary',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 6,
  faq: [
    {
      q: '为什么用 BigInt 而不是普通数字？',
      a: 'JavaScript 的普通数字（Number）是双精度浮点，超过 2^53 就会丢精度，很长的十六进制或二进制串会算错。本工具使用 BigInt 做任意精度整数运算，无论多长都能精确转换。',
    },
    {
      q: '十六进制里的字母大小写有区别吗？',
      a: '没有。A 和 a 都表示十进制的 10，B 和 b 都表示 11，以此类推。本工具统一用小写字母输出，输入时大小写均可。',
    },
    {
      q: '支持的进制范围是多少？',
      a: '支持 2 到 36 进制。超过 36 需要更多字符来表示数值，常规场景用不到，因此本工具未提供支持。',
    },
  ],
});
