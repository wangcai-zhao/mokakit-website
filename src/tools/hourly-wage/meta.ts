import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'hourly-wage',
  name: '时薪换算器',
  tagline: '时薪与月薪互转',
  description:
    '免费在线时薪换算器，支持时薪↔月薪↔日薪↔年薪多向互转，并自动算出工作日总工时与年度收入。可自定义每天工时与每月工作天数（默认 21.75 法定计薪天数），适合打工人、兼职、自由职业者、远程工作者快速估算收入与谈薪参考，全部本地计算。',
  keywords: ['时薪换算', '月薪转时薪', '日薪计算', '年薪计算', '工资换算'],
  category: 'calc',
  tags: ['时薪', '工资', '计算'],
  icon: 'cash',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '为什么默认 21.75 天而不是 22/30 天？',
      a: '21.75 是劳动法规定的月计薪天数，已把法定假日计入带薪，用于折算日工资最规范；按实际出勤可改。',
    },
    {
      q: '兼职/小时工能用吗？',
      a: '非常适合。直接填时薪与每周/每天工时即可估算月度收入。',
    },
    {
      q: '换算结果和劳动合同不一致怎么办？',
      a: '可能因加班费、绩效、补贴等未计入，本工具仅做线性换算，具体以合同与工资条为准。',
    },
  ],
  related: ['after-tax-salary', 'provident-fund-calc', 'social-security-cn'],
});
