import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'min-age-birth',
  name: '最低年龄出生日期计算器',
  tagline: '反推达标最晚生日',
  description:
    '免费在线最低年龄出生日期计算器，输入核验日期与要求的最低年龄（如 18、21、16 岁），反向推算受检者须在哪一天或之前出生才算达标。适用于证件核验、入职合规、考试资格审核、未成年人保护场景与法规年龄门槛核对，全部本地计算。',
  keywords: ['最低年龄', '出生日期推算', '年龄核验', '达标生日', '资格审核'],
  category: 'calc',
  tags: ['年龄', '日期', '计算'],
  icon: 'cake',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 6,
  faq: [
    {
      q: '结果是「最晚」还是「最早」出生日？',
      a: '是最晚出生日。即受检者出生日期只要不晚于该日（含当日），在核验日就已满相应年龄、资格达标。',
    },
    {
      q: '闰年 2 月 29 日怎么处理？',
      a: '若减龄后落点晚于核验日（如闰年边界），工具会自动回退一天，保证「出生日不晚于结果」即达标。',
    },
    {
      q: '这和年龄计算器有什么不同？',
      a: '年龄计算器是「出生日 → 现在几岁」；本工具是反向的「核验日 + 要求年龄 → 最晚出生日」，用于资格门槛判断。',
    },
  ],
  related: ['age-calculator', 'date-calculator', 'days-between', '90-day'],
});
