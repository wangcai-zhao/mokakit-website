import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'udi-decoder',
  name: 'UDI 码解码',
  tagline: '解析 GS1 应用标识符，还原 UDI 各字段',
  description:
    '免费在线 UDI 解码工具，支持解析多种格式的 UDI 文本：GS1 括号元素字符串（如 (01)…(17)…）、GS1 Digital Link URI、以及行式 AI 键值文本。自动识别应用标识符（AI），将 DI、批号、序列号、生产 / 失效日期等字段还原为可读中文说明，全部在浏览器本地完成。',
  keywords: ['UDI解码', 'GS1解析', '应用标识符', 'AI解析', '医疗器械追溯', 'GS1 Digital Link'],
  category: 'barcode',
  tags: ['udi', 'gs1', '解码', '解析', '追溯'],
  icon: 'scan',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 7,
  faq: [
    {
      q: '支持哪些输入格式？',
      a: '三种：① GS1 括号格式，如 (01)06901234567892(17)221231(10)LOT123；② GS1 Digital Link URI，如 https://acme.com/01/06901234567892/17/221231；③ 行式键值，如每行“01 06901234567892”。',
    },
    {
      q: '日期字段怎么解读？',
      a: 'YYMMDD 型字段（生产日期 11、失效日期 17、保质期 15 等）会按 GS1 世纪规则还原为 YYYY-MM-DD：年份 YY≥50 视为 19xx，否则为 20xx。',
    },
    {
      q: '解析过程联网吗？',
      a: '不联网。纯前端正则与字典解析，数据不出本机。',
    },
  ],
});
