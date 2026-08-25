import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'shoe-size',
  name: '鞋码换算',
  tagline: '中/欧/美/英码互转',
  description:
    '免费在线鞋码换算工具，支持中国码（脚长 mm）、欧洲码 EU、美码（女/男）、英码 UK 互相转换，以脚长为中枢一键对照。海淘、代购、跨境买鞋时快速查码，避免买错号。全部本地计算。',
  keywords: ['鞋码换算', '中国码', '欧洲码', '美码', '英码', '海淘尺码'],
  category: 'life',
  tags: ['鞋码', '换码', '生活'],
  icon: 'footprints',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '中国码 245 是什么意思？',
      a: '表示适合脚长 245 毫米（24.5 厘米）的脚，并非鞋内长精确值。',
    },
    {
      q: '男鞋和女鞋的美码一样吗？',
      a: '不一样。同脚长下，男鞋美码比女鞋美码约小 1.5–2 码，工具已分别处理。',
    },
    {
      q: '童鞋能用吗？',
      a: '童鞋尺码体系更复杂（常按年龄/内长分段），本工具面向成人通用标准，童鞋请参考对应品牌表。',
    },
  ],
  related: ['unit-convert', 'temperature-convert', 'pressure-convert'],
});
