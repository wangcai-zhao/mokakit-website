import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'discount-calculator',
  name: '打折计算器',
  tagline: '折扣价与到手价',
  description:
    '免费在线打折计算器，输入原价与折扣（支持「打几折」「立减百分比」「满减券」三种口径），一键算出到手价、节省金额与实际折扣率；还能对比两件不同折扣哪个更划算。适合购物比价、促销核算、清仓测算、满减凑单与员工内购，本地即时计算。',
  keywords: ['打折计算器', '折扣计算', '到手价', '原价折扣', '省了多少钱'],
  category: 'calc',
  tags: ['折扣', '购物', '计算'],
  icon: 'tag',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '「打 8 折」和「减 20%」一样吗？',
      a: '一样。打 8 折 = 按原价的 80% 收款 = 减价 20%。到手价 = 原价 × 折扣率，节省 = 原价 × (1 − 折扣率)。',
    },
    {
      q: '满减和打折哪个更划算？',
      a: '要看金额。固定满减（如满 200 减 30）在低客单价时折扣率低、高客单价时折扣率高；百分比折扣则始终按比例优惠。用本工具对比两件商品的到手价最直观。',
    },
    {
      q: '先打折再满减怎么算？',
      a: '先按折扣算出折后价，再用折后价判断是否满足满减门槛。注意商家规则可能相反（先满减再打折），以实际活动说明为准。',
    },
  ],
  related: ['percentage-calculator', 'ratio-calculator', 'compound-interest'],
});
