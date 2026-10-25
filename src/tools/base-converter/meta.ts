import { defineTool } from '../types';

interface RadixSub {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  from?: number;
  to?: number;
  /** 子页附带哪种构建期对照表 */
  tableKind?: 'powers' | 'hexdigits' | 'ieee754';
}

const RADIX_SUBS: RadixSub[] = [
  {
    slug: 'binary-to-decimal',
    title: '二进制转十进制',
    seoTitle: '二进制转十进制 - 在线二进制换算十进制工具（附2的幂对照表）',
    description:
      '二进制转十进制在线工具：输入二进制串（支持 0b 前缀与下划线分组）即时得到十进制值，BigInt 任意精度不丢位，附 2 的 0-16 次幂对照表与按位权展开原理说明。',
    from: 2,
    to: 10,
    tableKind: 'powers',
  },
  {
    slug: 'decimal-to-binary',
    title: '十进制转二进制',
    seoTitle: '十进制转二进制 - 在线十进制换算二进制工具（附转换步骤）',
    description:
      '十进制转二进制在线工具：输入十进制整数即时得到二进制表示，支持分组显示与 0b 前缀开关，BigInt 处理超大整数，附除 2 取余法步骤说明与常用数值对照。',
    from: 10,
    to: 2,
  },
  {
    slug: 'hex-to-binary',
    title: '十六进制转二进制',
    seoTitle: '十六进制转二进制 - 在线十六进制换算二进制工具（附0-F对照表）',
    description:
      '十六进制转二进制在线工具：每位十六进制对应 4 位二进制，输入即转，支持分组与前缀开关，附 0-F 与 4 位二进制完整对照表，适合颜色码、字节序分析场景。',
    from: 16,
    to: 2,
    tableKind: 'hexdigits',
  },
  {
    slug: 'binary-to-hex',
    title: '二进制转十六进制',
    seoTitle: '二进制转十六进制 - 在线二进制换算十六进制工具（四位一组法）',
    description:
      '二进制转十六进制在线工具：从右往左每 4 位一组对应 1 位十六进制，输入二进制串即时转换，支持分组与 0x 前缀，附 0-F 对照表与四位一组法说明。',
    from: 2,
    to: 16,
    tableKind: 'hexdigits',
  },
  {
    slug: 'decimal-to-hex',
    title: '十进制转十六进制',
    seoTitle: '十进制转十六进制 - 在线十进制换算十六进制工具（附对照表）',
    description:
      '十进制转十六进制在线工具：输入十进制整数得到 0x 开头的十六进制表示，支持大写与分组开关，附常用数值（255/1024/65535 等）对照表，程序员查色值、掩码必备。',
    from: 10,
    to: 16,
  },
  {
    slug: 'octal-to-decimal',
    title: '八进制转十进制',
    seoTitle: '八进制转十进制 - 在线八进制换算十进制工具（附按权展开说明）',
    description:
      '八进制转十进制在线工具：输入八进制数（0-7 组成）按位权展开得到十进制值，支持 Unix 文件权限（755/644）等常见场景，附原理说明与常用权限值对照。',
    from: 8,
    to: 10,
  },
  {
    slug: 'ieee754-hex',
    title: 'IEEE 754 双精度十六进制表示',
    seoTitle: 'IEEE 754 浮点转十六进制 - 双精度浮点数二进制表示查询',
    description:
      'IEEE 754 双精度浮点转十六进制查询：输入十进制小数（如 3.14、0.1）得到 64 位十六进制表示，拆解符号位、指数、尾数三段，附 0.5/1/3.14/π/e 等常见值对照表与精度误差说明。',
    tableKind: 'ieee754',
  },
];

export default defineTool({
  id: 'base-converter',
  name: '进制转换',
  tagline: '2/8/10/16 等进制互转',
  description:
    '免费在线进制转换工具，支持二进制、八进制、十进制、十六进制及 2 到 36 任意进制互转，基于 BigInt 任意精度，超长数字（>64 位）也不丢精度，附全进制一览、分组与 0x/0b 前缀开关、IEEE 754 浮点进制说明。程序员、学生做进制换算、颜色码解析、网络地址换算的好帮手。',
  keywords: ['进制转换', '二进制转换', '十六进制转换', '在线进制计算器', '2进制转16进制'],
  category: 'convert',
  tags: ['进制', '转换', '计算', '数字'],
  icon: 'binary',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-08-04',
  updatedAt: '2026-10-24',
  priority: 6,
  seoTitle: '进制转换 - 二进制八进制十进制十六进制互转 支持2-36任意进制',
  related: ['unit-convert', 'color-converter', 'timestamp-converter', 'cidr-calculator'],
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
    {
      q: 'IEEE 754 折叠区是做什么的？',
      a: '输入十进制小数（如 3.14、0.1），即可得到它的双精度浮点（float64）十六进制表示，并拆解符号位、指数、尾数三段，能直观看到 0.1 为什么存不下、0.1+0.2 为什么不等于 0.3。',
    },
  ],
  subpages: () =>
    RADIX_SUBS.map((s) => ({
      slug: s.slug,
      title: s.title,
      seoTitle: s.seoTitle,
      description: s.description,
      data: {
        radixFrom: String(s.from ?? ''),
        radixTo: String(s.to ?? ''),
        tableKind: s.tableKind ?? '',
        radixTitle: s.title,
      },
      faq: [
        {
          q: `${s.title}的结果怎么看？`,
          a:
            s.tableKind === 'ieee754'
              ? '在输入框填十进制小数，下方会给出 64 位十六进制表示与符号位/指数/尾数拆解；整数部分与小数部分分别按 IEEE 754 双精度规则处理。'
              : `上方工具已预填 ${s.from} → ${s.to}，直接输入数值即可得到转换结果；页面下方附常用数值对照表，可先查表再验证。`,
        },
        {
          q: '转换会丢精度吗？',
          a: '整数不会：本工具用 BigInt 做任意精度运算，再长的数字串也精确。小数按 IEEE 754 双精度表示，存在固有误差（如 0.1），折叠区有专门说明。',
        },
      ],
    })),
});
