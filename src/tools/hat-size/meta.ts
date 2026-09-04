import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'hat-size',
  name: '帽子尺码换算',
  tagline: '美码/英码/欧码/中码帽子尺寸在线互转',
  description:
    '免费在线帽子尺码换算工具，输入头围（cm）即可换算美码（US）、英码（UK）、欧码（EU）、中码（CN）与日码（JP）等常用标准。网购帽子、海淘礼帽、棒球帽时快速对照，避免买错尺寸；附头围测量方法示意图，全部本地计算。',
  keywords: ['帽子尺码', '帽围换算', '美码欧码', 'hat size', '头围'],
  category: 'convert',
  tags: ['帽子', '尺码', '换算'],
  icon: 'tag',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert', 'clothing-size', 'ring-size'],
  faq: [
    {
      q: '帽子尺码怎么换算？',
      a: '以头围（cm）为基准：欧码数字基本就是头围 cm，美码用分数（如 7、7⅛、7¼），中码按 cm。约 57 cm 头围 ≈ 美 7⅛ ≈ 欧 57。',
    },
    {
      q: '怎么量头围？',
      a: '用软尺绕眉毛上方、耳朵上方最宽一圈，松紧适中读数值。建议在发型常态下测量。',
    },
    {
      q: '美码和欧码差多少？',
      a: '欧码更接近头围 cm（57=57cm）；美码 7 ≈ 56cm、7⅛ ≈ 57cm、7¼ ≈ 58cm，每 1/8 号约差 0.3 cm。',
    },
    {
      q: '不同品牌帽子尺码准吗？',
      a: '棒球帽/运动帽多用可调节，尺码宽松；礼帽、毛毡帽按码数更严格。本工具给标准对照，实际以品牌尺码表为准。',
    },
  ],
});
