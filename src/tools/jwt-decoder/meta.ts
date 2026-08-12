import { defineTool } from '../types';

export default defineTool({
  id: 'jwt-decoder',
  name: 'JWT 解析器',
  tagline: '在线解析 JWT，查看 Header / Payload',
  description:
    '免费在线 JWT 解析工具，将 JSON Web Token 的三段 base64url 解码为可读的 Header 与 Payload，并显示签名段是否存在、算法等信息。全程在浏览器本地完成，令牌不会上传服务器，适合调试接口鉴权时快速查看 claims。',
  keywords: ['JWT解析', 'JWT解码', 'Token解析', 'JSON Web Token'],
  category: 'dev',
  tags: ['jwt', 'token', 'dev', '解析', '鉴权'],
  icon: 'key',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: 'JWT 的签名会被验证吗？',
      a: '本工具只做解析与展示，不对签名做密码学验证（验证需要服务端密钥）。它用于查看令牌内容，判断 claims 是否正确、是否过期，不能代替完整性校验。',
    },
    {
      q: '我的令牌会上传到服务器吗？',
      a: '不会。所有解码都在浏览器本地用 base64url 完成，刷新页面或关闭标签后输入即消失，适合粘贴含敏感信息的开发用 token 临时查看。',
    },
  ],
});
