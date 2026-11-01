import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'udi-decoder',
  name: 'UDI 码解码',
  tagline: '解析 GS1 应用标识符，还原 UDI 各字段',
  description:
    '免费在线 UDI 解码工具：解析 GS1 括号字符串、GS1 Digital Link URI、行式 AI 键值三种格式，自动识别应用标识符（AI），还原 DI、批号、序列号、生产 / 失效日期等字段，并校验 GTIN 校验位、识别发码机构，全部本地完成。',
  keywords: ['UDI解码', 'GS1解析', '应用标识符', 'AI解析', '医疗器械追溯', 'GS1 Digital Link'],
  category: 'barcode',
  tags: ['udi', 'gs1', '解码', '解析', '追溯'],
  icon: 'scan',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-08-04',
  updatedAt: '2026-10-26',
  priority: 7,
  faq: [
    {
      q: '支持哪些输入格式？',
      a: '三种：① GS1 括号格式，如 (01)06901234567892(17)221231(10)LOT123；② GS1 Digital Link URI，如 https://acme.com/01/06901234567892/17/221231；③ 行式键值，如每行“01 06901234567892”。',
    },
    {
      q: '日期字段怎么解读？',
      a: 'YYMMDD 型字段（生产日期 11、失效日期 17、保质期 15 等）会按 GS1 固定阈值还原为 YYYY-MM-DD：年份 YY 00-49 视为 20xx，50-99 视为 19xx。',
    },
    {
      q: '会校验 GTIN 的校验位吗？',
      a: '会。识别到 (01) 开头的 GTIN 时，工具会按 GS1 模 10 算法重算校验位：一致显示「✅ 通过」，不一致会提示正确的校验位应为几，并标注发码机构前缀对应的国家或地区。',
    },
    {
      q: '解析过程联网吗？',
      a: '不联网。纯前端正则与字典解析，数据不出本机。',
    },
  ],
  related: ['udi-generator', 'qrcode-generator', 'isbn-validator'],
  subpages: () => [
    {
      slug: 'gs1-ai-list',
      title: 'GS1 应用标识符（AI）大全',
      seoTitle: 'GS1应用标识符AI大全 - 常用AI含义与格式速查表',
      description:
        '收录 60 余个常用 GS1 应用标识符（AI）：AI 编号、含义与数据格式速查，覆盖 GTIN、批号、序列号、生产 / 失效日期、GLN 等 UDI 与条码常用字段，附日期世纪判定与 GTIN 校验位算法说明。',
      data: { aiTable: true },
    },
  ],
});
