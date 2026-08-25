import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'provident-fund-calc',
  name: '公积金计算器',
  tagline: '算清每月公积金缴存额',
  description:
    '免费在线公积金计算器，输入缴存基数与个人、单位缴存比例，一键算出个人月缴存、单位月缴存、每月合计与全年合计。覆盖 5%–12% 常见比例区间，帮你核对工资单、规划购房与租房提取。全部本地计算，数据不上传。',
  keywords: ['公积金计算器', '公积金月缴存', '公积金比例', '五险一金', '公积金提取'],
  category: 'calc',
  tags: ['公积金', '理财', '计算'],
  icon: 'wallet',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '公积金个人和单位缴存比例一般是多少？',
      a: '全国常见区间为 5%–12%，具体由各地公积金中心和单位确定，单位和个人比例通常一致。本工具默认 12%，可按实际修改。',
    },
    {
      q: '缴存基数怎么确定？',
      a: '缴存基数为职工本人上一年度月平均工资，但有上下限：不得低于当地最低工资一定比例，不得高于当地社平工资的 3 倍。为简化，本工具直接让你填入基数。',
    },
    {
      q: '算出来的“合计”是什么意思？',
      a: '合计 = 个人月缴存 + 单位月缴存，即每月实际进入你公积金账户的总额，全部归你所有，可用于购房、租房、退休提取等。',
    },
  ],
  related: ['social-security-cn', 'after-tax-salary', 'income-tax-cn'],
});
