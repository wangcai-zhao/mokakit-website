import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'base58',
  name: 'Base58 编解码',
  tagline: 'Base58 编码解码，比特币风格去易混字符',
  description:
    '免费在线 Base58 编解码工具，使用比特币（Bitcoin）字母表，去除了 0/O、I/l 等易混字符，常用于钱包地址、IPFS 哈希。支持文本与十六进制输入，全部本地计算。',
  keywords: ['base58', 'base58编码', 'base58解码', '比特币base58'],
  category: 'dev',
  tags: ['编码', 'Base58', '区块链'],
  icon: 'binary',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['base64', 'url-encoder'],
  faq: [
    {
      q: 'Base58 和 Base64 有什么区别？',
      a: 'Base58 去掉了 0、O、I、l 这四个视觉易混字符，字母表只有 58 个；Base64 有 64 个且含 +/=。因此 Base58 更适合人工抄写和地址展示，代价是体积略大。',
    },
    {
      q: '比特币地址为什么用 Base58Check？',
      a: '比特币地址在 Base58 基础上加了版本前缀和校验和（Base58Check），能防抄错一位就汇错地址。本工具做标准 Base58 编解码，不带地址校验和逻辑。',
    },
    {
      q: '能编码二进制/十六进制吗？',
      a: '可以。文本模式按 UTF-8 字节编码；也可切到十六进制模式直接对字节流编码。解码结果可复制为文本或十六进制。',
    },
    {
      q: 'IPFS 的 CID 也是 Base58 吗？',
      a: '是的，CIDv0 以 Qm 开头，就是 Base58 编码的多哈希。复制 CID 到本工具解码可看到原始字节的十六进制。',
    },
  ],
});
