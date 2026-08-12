import { defineTool } from '../types';

export default defineTool({
  id: 'uuid-generator',
  name: 'UUID 生成器',
  tagline: '批量生成 UUID v4',
  description:
    '免费在线 UUID 生成器，一键批量生成符合 RFC 4122 标准的 UUID v4 随机标识符，可用于数据库主键、分布式 ID、测试数据、临时令牌等场景，全部在浏览器本地生成。',
  keywords: ['UUID生成', 'UUID v4', '在线UUID', '随机ID生成', 'guid生成器'],
  category: 'dev',
  tags: ['UUID', '随机', '生成', '开发'],
  icon: 'fingerprint',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: 'UUID v4 会重复吗？',
      a: '理论上 2^122 种组合，随机碰撞的概率极低，低到可以认为「永不重复」。它不需要中心服务器就能生成全局唯一 ID，因此广泛用于分布式系统。',
    },
    {
      q: '生成的 UUID 安全吗？',
      a: '本工具使用浏览器 crypto.getRandomValues 生成，属于密码学安全随机源，不会上传到任何服务器。注意 UUID 是可被猜测的随机值，不要把它当作「不可预测的秘密」用于鉴权令牌。',
    },
  ],
});
