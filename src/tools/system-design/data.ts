import type { ResourceItem, ResourceCat } from '@/tools/_shared/ResourceList';

const PRIMER = 'https://github.com/donnemartin/system-design-primer';

export const CATS: ResourceCat[] = [
  { id: 'case', name: '经典案例' },
  { id: 'comp', name: '基础组件' },
  { id: 'scale', name: '高并发' },
  { id: 'reli', name: '可靠性' },
];

export const ITEMS: ResourceItem[] = [
  // 经典案例
  { name: 'URL 短链服务', desc: '短码生成、冲突、跳转与统计，面试常客。', cat: 'case', url: PRIMER, tag: '入门' },
  { name: '限流系统', desc: '令牌桶/漏桶、滑动窗口，保护后端不被打爆。', cat: 'case', url: PRIMER, tag: '高频' },
  { name: '即时聊天系统', desc: '长连接、消息时序、已读回执，理解实时通信。', cat: 'case', url: PRIMER },
  { name: '微博 / 新闻推送', desc: '拉 vs 推、扇出、冷热分治，feed 流设计。', cat: 'case', url: PRIMER },
  { name: '搜索引擎', desc: '爬虫、倒排索引、排序，巨型系统缩影。', cat: 'case', url: PRIMER },
  { name: '支付系统', desc: '幂等、对账、最终一致，钱不能出错。', cat: 'case', url: PRIMER, tag: '严谨' },
  { name: '秒杀 / 抢购', desc: '库存预热、排队、防超卖，高并发典型。', cat: 'case', url: PRIMER },
  { name: '网盘 / 对象存储', desc: '分块上传、去重、元数据与数据分离。', cat: 'case', url: PRIMER },

  // 基础组件
  { name: '负载均衡器', desc: '轮询/最少连接/一致性哈希，流量入口。', cat: 'comp', url: PRIMER },
  { name: '缓存层', desc: 'Cache-Aside、穿透/击穿/雪崩，Redis 实战。', cat: 'comp', url: PRIMER, tag: '必会' },
  { name: '消息队列', desc: '解耦、异步、削峰，Kafka 设计要点。', cat: 'comp', url: PRIMER },
  { name: '分布式 ID', desc: '雪花算法、号段，全局唯一且有序。', cat: 'comp', url: PRIMER },
  { name: '布隆过滤器', desc: '用极小空间判「可能存在」，防缓存穿透。', cat: 'comp', url: PRIMER },
  { name: '一致性哈希', desc: '节点扩缩容时最小化数据迁移。', cat: 'comp', url: PRIMER },

  // 高并发
  { name: '读写分离', desc: '主从复制、延迟与一致性取舍。', cat: 'scale', url: PRIMER },
  { name: '分库分表', desc: '水平/垂直拆分、分片键选择。', cat: 'scale', url: PRIMER },
  { name: 'CDN', desc: '边缘缓存静态资源，离用户更近。', cat: 'scale', url: PRIMER },
  { name: '连接池', desc: '复用连接、控制并发，避免资源耗尽。', cat: 'scale', url: PRIMER },
  { name: '异步化', desc: '把非关键路径丢到后台，提升响应。', cat: 'scale', url: PRIMER },

  // 可靠性
  { name: '幂等设计', desc: '重试安全，同一请求多次执行结果一致。', cat: 'reli', url: PRIMER, tag: '必会' },
  { name: '熔断与降级', desc: '故障隔离、兜底返回，防止雪崩。', cat: 'reli', url: PRIMER },
  { name: '限流与配额', desc: '多租户公平性与资源保护。', cat: 'reli', url: PRIMER },
  { name: '最终一致性', desc: 'CAP 权衡，接受短暂不一致换可用性。', cat: 'reli', url: PRIMER },
  { name: '对账与补偿', desc: '分布式事务的务实解法：先干再核再补。', cat: 'reli', url: PRIMER },
];
