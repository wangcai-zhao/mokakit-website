import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'viscosity',
  name: '粘度换算',
  tagline: 'Pa·s、mPa·s、cP 等动力粘度单位在线互转',
  description:
    '免费在线动力粘度（绝对粘度）单位换算工具，覆盖帕斯卡秒（Pa·s）、毫帕秒（mPa·s）、厘泊（cP）、泊（P）、千克每米秒（kg/(m·s)）等常用单位。适合润滑油选型、涂料调配、食品工业（蜂蜜/糖浆）、化工流体工程与液压油粘度等级对照，全部本地计算。',
  keywords: ['粘度换算', 'cP mPa·s', '帕斯卡秒', '动力粘度', '厘泊'],
  category: 'convert',
  tags: ['粘度', '流体', '换算'],
  icon: 'droplets',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['unit-convert'],
  faq: [
    {
      q: '粘度单位之间怎么换算？',
      a: '以 mPa·s（等于 cP）为基准：1 Pa·s = 1000 mPa·s = 1000 cP；1 kg/(m·s) = 1 Pa·s。也就是说 1 cP = 1 mPa·s。',
    },
    {
      q: 'cP 和 mPa·s 一样吗？',
      a: '完全一样，1 cP（厘泊）= 1 mPa·s。工程上习惯用 cP（水 20℃ 约 1 cP，便于读数），学术上用 mPa·s/Pa·s。',
    },
    {
      q: '常见液体粘度多少？',
      a: '20℃ 水约 1 cP，牛奶约 2–3 cP，食用油约 50–100 cP，蜂蜜约 2000–10000 cP，甘油约 1400 cP，机油约 100–200 cP。',
    },
    {
      q: '温度对粘度影响大吗？',
      a: '很大。液体升温粘度骤降（机油冬天变稠、夏天变稀），气体相反。所以标粘度一定要看温度，如机油标 5W-30。',
    },
  ],
});
