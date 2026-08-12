import { defineTool } from '../types';

export default defineTool({
  id: 'rsa-keygen',
  name: 'RSA 密钥对生成',
  tagline: '浏览器内生成 RSA 公钥 / 私钥',
  description:
    '免费在线 RSA 密钥对生成工具，基于浏览器原生 Web Crypto API，在本地生成 RSA 密钥对（2048 / 4096 位），并导出为 PEM 格式的公钥（SPKI）与私钥（PKCS#8）。私钥全程不离开本机，无需任何服务器参与，适合本地快速生成测试用密钥。',
  keywords: ['RSA生成', '密钥对', '公钥私钥', 'PEM', 'Web Crypto'],
  category: 'security',
  tags: ['rsa', '密钥', '安全', 'crypto', 'pem'],
  icon: 'fingerprint',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: '生成的私钥会传到服务器吗？',
      a: '不会。密钥完全在浏览器本地用 Web Crypto API 生成和导���，本工具不发任何请求，私钥不会离开你的设备。但请勿把测试私钥用于真实生产环境。',
    },
    {
      q: '生成的格式能被 OpenSSL 使用吗？',
      a: '可以。导出的公钥为 SPKI PEM（BEGIN PUBLIC KEY），私钥为 PKCS#8 PEM（BEGIN PRIVATE KEY），均为标准格式，可直接用于 OpenSSH / OpenSSL / 各类编程语言。',
    },
  ],
});
