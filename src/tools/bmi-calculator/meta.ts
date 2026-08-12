import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'bmi-calculator',
  name: 'BMI 计算器',
  tagline: '算 BMI 与体型分类',
  description:
    '免费在线 BMI 身体质量指数计算器，输入身高厘米与体重公斤，立即得出 BMI 数值与偏瘦、正常、偏胖、肥胖的中国标准体型分类，并给出对应的健康体重区间参考。全部在浏览器本地计算，不上传任何个人数据，打开即用。',
  keywords: ['BMI计算器', '身体质量指数', '标准体重', '体型分类', '在线算BMI'],
  category: 'calc',
  tags: ['健康', 'BMI', '体重'],
  icon: 'activity',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 8,
  faq: [
    {
      q: 'BMI 是怎么算出来的？',
      a: 'BMI = 体重(kg) ÷ 身高(m) 的平方。例如身高 170 厘米、体重 65 公斤，先把身高换算成 1.7 米，则 BMI = 65 ÷ (1.7 × 1.7) ≈ 22.5，属于正常范围。',
    },
    {
      q: '分类标准用的是哪一套？',
      a: '本工具采用中国成人标准：低于 18.5 偏瘦，18.5 至 24 正常，24 至 28 偏胖，28 及以上肥胖。世界卫生组织的国际标准分界点是 25 和 30，比中国标准更宽松，亚洲人群通常参考前者。',
    },
    {
      q: 'BMI 正常就代表身体健康吗？',
      a: '不一定。BMI 只看身高体重，不区分肌肉和脂肪，健身人群肌肉量大时 BMI 可能偏高但体脂并不高；老年人肌肉流失时 BMI 正常也可能存在隐性肥胖。结果仅供参考，健康评估请结合体脂率、腰围与医生建议。',
    },
  ],
  related: ['unit-convert', 'age-calculator'],
});
