import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'totp-generator',
  name: 'TOTP 验证码',
  tagline: '两步验证动态码',
  description:
    '免费在线 TOTP 动态验证码生成工具，输入 Base32 密钥即可算出 6 位两步验证码（2FA）并显示 30 秒倒计时。完整实现 RFC 6238 标准，与 Google Authenticator 一致，全程本地运算，密钥不上传。',
  keywords: ['TOTP生成', '两步验证', '动态验证码', '2FA', '身份验证器'],
  category: 'security',
  tags: ['totp', '2fa', '验证码', '安全'],
  icon: 'smartphone',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '算出的验证码和 Google Authenticator 一样吗？',
      a: '一样。本工具严格按 RFC 6238 实现：以 30 秒为周期取时间计数器，用 HMAC-SHA1 签名后做动态截断取 6 位数字。只要密钥相同、设备时间准确，结果就与各类身份验证器 App 完全一致。',
    },
    {
      q: '密钥会被上传或保存吗？',
      a: '不会。密钥仅存在于当前页面的内存中，全部计算由浏览器原生 Web Crypto API 在本地完成，本工具不发送任何网络请求，刷新页面即清空。',
    },
    {
      q: '为什么提示密钥无效？',
      a: 'TOTP 密钥必须是 Base32 编码，只允许 A-Z 与 2-7 这 32 个字符（可含空格与等号填充，会自动忽略）。若你拿到的是二维码，请先扫码取出 secret 参数再粘贴进来。',
    },
  ],
  related: ['password-generator', 'hash-calculator'],
});
