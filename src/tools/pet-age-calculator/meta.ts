import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'pet-age-calculator',
  name: '宠物年龄换算',
  seoTitle: '宠物年龄换算 - 狗猫岁数折算人岁数与生命阶段',
  tagline: '狗/猫年龄折算人类年龄',
  description:
    '免费在线宠物年龄换算工具，把狗或猫的实际年龄折算为等效人类岁数并给出生命阶段（幼龄、成年、老年），帮主人更直观地理解爱宠状态，全部在浏览器本地计算。',
  keywords: ['宠物年龄', '狗龄换算', '猫龄换算', '宠物岁数', '人宠年龄'],
  category: 'life',
  tags: ['生活', '宠物', '年龄'],
  icon: 'paw-print',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-20',
  updatedAt: '2026-10-20',
  priority: 6,
  faq: [
    {
      q: '狗的一岁等于人的几岁？',
      a: '犬类第一年约相当于人 15 岁，第二年约到 24 岁，之后每年约加 5 岁。不同体型略有差异，本工具采用常用通用折算。',
    },
    {
      q: '猫和狗的折算一样吗？',
      a: '前两年类似，但猫在成年后的增速更慢（每年约加 4 岁），本工具对两种宠物分别处理。',
    },
  ],
  related: ['due-date', 'weeks-pregnant', 'body-fat'],
});
