import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'hmac-gen',
  name: 'HMAC 生成器',
  tagline: 'HMAC-SHA256/384/512 带密钥签名',
  description:
    '免费在线 HMAC 生成器，用密钥对消息生成 HMAC 签名（支持 SHA-256/384/512），用于接口签名、Webhook 校验、消息完整性验证。基于浏览器 Web Crypto，密钥不出本地。',
  keywords: ['hmac', 'hmac 生成', 'hmac-sha256', '消息签名'],
  category: 'dev',
  tags: ['HMAC', '签名', '安全'],
  icon: 'shield-check',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['hash-calculator', 'jwt-generator', 'api-key-gen'],
  faq: [
    {
      q: 'HMAC 和单纯哈希有什么区别？',
      a: '哈希（如 SHA256）只算数据摘要；HMAC 在哈希基础上混入密钥，只有持有密钥的一方才能复现，因此能同时验证完整性和来源，常用于接口鉴权。',
    },
    {
      q: '密钥怎么填？',
      a: '填你的共享密钥（字符串或十六进制）。发送方和接收方用同一密钥计算 HMAC 并比对，一致才放行。密钥通过本工具本地参与计算，不会上传。',
    },
    {
      q: '支持哪些算法？',
      a: 'SHA-256、SHA-384、SHA-512 三种（Web Crypto 原生支持）。消息与密钥的编码可选 UTF-8 文本或十六进制。',
    },
    {
      q: 'Webhook 校验怎么用？',
      a: '很多平台（如 GitHub、Stripe）在请求头放 X-Hub-Signature-256: sha256=xxx。你用本工具以同一密钥对请求体算 HMAC，与安全头比对即可确认请求真实未被篡改。',
    },
  ],
});
