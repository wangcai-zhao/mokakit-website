import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'api-key-gen',
  name: '随机密钥/Token 生成器',
  tagline: '生成高强度随机密钥、API Key、Token',
  description:
    '免费在线随机密钥生成器，基于浏览器 Crypto 安全随机数，生成 API Key、Token、密钥串。支持十六进制、URL-safe Base64、UUID 风格与自定义长度/字符集，可一次生成多条。全部本地生成，不联网。',
  keywords: ['随机密钥', 'api key 生成', 'token 生成', '密钥生成器'],
  category: 'dev',
  tags: ['密钥', '随机', '安全'],
  icon: 'key-round',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['uuid-generator', 'password-generator', 'hmac-gen'],
  faq: [
    {
      q: '生成的密钥安全吗？',
      a: '使用浏览器 Web Crypto 的 getRandomValues（CSPRNG，密码学安全随机数），质量等同后端随机数生成器，可用于 API Key / Token / 密钥。生成过程完全在本地，不上传。',
    },
    {
      q: '该用多长？',
      a: 'API Key / Token 建议至少 32 字节（64 位十六进制或 43 位 Base64）。会话 Token 可更长。长度与字符集越随机，暴力破解成本越高。',
    },
    {
      q: 'Hex、Base64、UUID 风格怎么选？',
      a: 'Hex 最通用（仅 0-9a-f）；URL-safe Base64 更紧凑且可放 URL；UUID 风格带连字符、便于人类分段核对。按你的存储/传输场景选。',
    },
    {
      q: '能指定字符集吗？',
      a: '可以。自定义模式允许你限定允许的字符（如仅大写字母数字），并设长度。注意字符集越小、长度越短，熵越低，别用于高安全场景。',
    },
  ],
});
