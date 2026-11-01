import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'udi-generator',
  name: 'UDI 码生成',
  tagline: '生成医疗器械唯一标识的二维码与条形码',
  description:
    '免费在线 UDI 生成工具：按 GS1 标准填写 DI 与 PI（批号、序列号、生产日期、失效日期），GTIN 自动计算校验位，一键生成 QR Code、Data Matrix、GS1-128 等条码，可逐码下载 PNG，本地生成不上传。',
  keywords: ['UDI生成', '医疗器械唯一标识', 'GS1', 'UDI条码', 'GS1-128', 'Data Matrix', '二维码生成'],
  category: 'barcode',
  tags: ['udi', 'gs1', '医疗器械', '条码', '二维码', '标识'],
  icon: 'barcode',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-08-04',
  updatedAt: '2026-10-26',
  priority: 8,
  faq: [
    {
      q: 'UDI 是什么？',
      a: 'UDI（Unique Device Identification，医疗器械唯一标识）是中国及国际通行的医疗器械“电子身份证”，由设备标识 DI 与生产标识 PI 组成，按 GS1 等标准编码，用于全生命周期追溯。',
    },
    {
      q: 'GTIN 校验位会自动计算吗？',
      a: '会。DI 填 13 位数据位时，工具按 GS1 模 10 算法自动补上校验位（如 0690123456789 → 06901234567892）；填 14 位则实时校验，校验位不符会提示正确值并可一键修正。',
    },
    {
      q: '生成的是标准 GS1 码吗？',
      a: '选择“GS1”前缀的码种（GS1 QR Code / GS1 Data Matrix / GS1-128）会按 GS1 应用标识符（AI）规则编码，符合医疗器械标签规范；普通 QR / Data Matrix / Code 128 则把文本当一般数据编码，适合内部流转。',
    },
    {
      q: '数据会上传到服务器吗？',
      a: '不会。所有条码均在浏览器本地用 bwip-js 生成，文本不经过任何服务器，可放心处理真实产品信息。',
    },
  ],
  related: ['udi-decoder', 'qrcode-generator', 'isbn-validator'],
});
