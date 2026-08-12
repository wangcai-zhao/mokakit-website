import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'isbn-validator',
  name: 'ISBN 校验转换',
  tagline: '校验位与 10/13 互换',
  description:
    '免费在线 ISBN 校验与转换工具，输入 ISBN-10 或 ISBN-13（可含连字符）即可自动识别位数、验证校验位，并在 10 位与 13 位之间互转。校验失败会给出正确校验位，适合出版、图书馆编目、电商上架核对书号，全部计算本地完成。',
  keywords: ['ISBN校验', 'ISBN转换', '国际标准书号', '校验位计算', '图书条码'],
  category: 'barcode',
  tags: ['isbn', '校验', '图书', '条码'],
  icon: 'book',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 6,
  faq: [
    {
      q: 'ISBN 的校验位是怎么算出来的？',
      a: 'ISBN-10 把前 9 位分别乘以 10 到 2 的权重求和，用 11 减去和除以 11 的余数，结果为 10 时写作 X；ISBN-13 把前 12 位按 1、3 交替加权求和，用 10 减去和除以 10 的余数，结果为 10 时记为 0。',
    },
    {
      q: '为什么有的 ISBN-13 转不成 ISBN-10？',
      a: '只有以 978 开头的 ISBN-13 才对应旧的 10 位书号。2007 年后新增的 979 前缀没有 10 位形式，属于正常情况，无法转换。',
    },
    {
      q: '输入时需要去掉连字符吗？',
      a: '不需要。工具会自动忽略连字符、空格等分隔符，直接粘贴 978-7-115-54608-1 这类带格式的书号即可正常校验。',
    },
  ],
  related: ['qrcode-generator', 'udi-decoder'],
});
