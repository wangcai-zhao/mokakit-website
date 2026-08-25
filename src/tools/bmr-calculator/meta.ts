import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'bmr-calculator',
  name: '基础代谢率计算器',
  tagline: '算每日最低热量消耗',
  description:
    '免费在线基础代谢率（BMR）计算器，输入性别、年龄、身高、体重，采用 Mifflin-St Jeor 公式一键算出每日静息热量消耗（kcal）。帮你估算减肥/增肌的热量底线，辅助制定饮食计划。全部本地计算。',
  keywords: ['基础代谢率', 'BMR计算器', '热量消耗', 'Mifflin-St Jeor', '减脂增肌'],
  category: 'life',
  tags: ['BMR', '健康', '计算'],
  icon: 'heart',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '结果和我健身 App 不一样？',
      a: '不同公式（如 Harris-Benedict）结果略有差异，且 App 可能已计入活动系数，本工具只给 BMR。',
    },
    {
      q: 'BMR 能直接当减肥热量目标吗？',
      a: '不建议。BMR 是下限，长期低于它会影响健康；减脂应参考 TDEE 并预留安全空间。',
    },
    {
      q: '孕期/疾病状态能用吗？',
      a: '本工具为通用估算，特殊生理或病理状态请咨询专业医生或营养师。',
    },
  ],
  related: ['bmi-calculator', 'menstrual-cycle', 'after-tax-salary'],
});
