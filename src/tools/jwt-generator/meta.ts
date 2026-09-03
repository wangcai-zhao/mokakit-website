import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'jwt-generator',
  name: 'JWT 生成器',
  tagline: '自定义 Header/Payload 生成并 HS256 签名 JWT',
  description:
    '免费在线 JWT 生成器，编辑 Header 与 Payload（JSON），填入密钥，用 HS256 生成并签名 JWT（也支持 alg=none 仅做结构演示）。同时可解码查看三段内容，用于接口联调、教学演示。基于 Web Crypto，密钥不出本地。',
  keywords: ['jwt 生成', 'jwt 签名', 'jwt generator', 'token 生成'],
  category: 'dev',
  tags: ['JWT', '签名', '安全'],
  icon: 'badge-check',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['jwt-decoder', 'hmac-gen', 'api-key-gen'],
  faq: [
    {
      q: 'JWT 的三段是什么？',
      a: 'Header（算法与类型）、Payload（声明数据）、Signature（对前两段的签名）。用点连接：xxxxx.yyyyy.zzzzz。本工具生成时实时显示三段。',
    },
    {
      q: 'HS256 和 RS256 有什么不同？',
      a: 'HS256 用对称密钥（同一密钥签名与验证），简单适合服务内；RS256 用非对称密钥对（私钥签、公钥验），适合多方。本工具当前支持 HS256（以及一个仅演示的 none）。',
    },
    {
      q: 'alg=none 有什么用？',
      a: 'none 表示不签名，仅用于查看 JWT 结构或教学，生产环境绝对禁止（可被随意伪造）。本工具提供它是为了演示，请勿在真实系统使用 none。',
    },
    {
      q: '密钥安全吗？',
      a: '签名用的密钥只在你浏览器本地用于 Web Crypto 计算，不会上传或保存。但仍建议别用生产真实密钥在公网工具上操作，演示请用测试密钥。',
    },
  ],
});
