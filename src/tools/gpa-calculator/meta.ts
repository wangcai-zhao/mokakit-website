import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'gpa-calculator',
  name: 'GPA 计算器',
  tagline: '学分加权算绩点',
  description:
    '免费在线 GPA 计算器，添加多门课程（学分 + 百分制成绩或等级），自动按 4.0 制、5.0 制、4.3 制（WES）或中国学校标准换算绩点并加权求和，一键得出平均学分绩点。适合大学生、留学申请、奖学金评定、转专业绩点自查，多学期可分开计算再合并，全部本地计算。',
  keywords: ['GPA计算器', '平均学分绩点', '绩点换算', '4.0制', '5.0制'],
  category: 'calc',
  tags: ['GPA', '成绩', '计算'],
  icon: 'school',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-25',
  updatedAt: '2026-08-25',
  priority: 7,
  faq: [
    {
      q: '我的学校算法和这里不一样怎么办？',
      a: '可直接手动把绩点填进成绩列（把百分制列当作绩点列使用），只要选对制式，加权公式一致即可。',
    },
    {
      q: '4.0 制和 5.0 制怎么选？',
      a: '国内多数高校用 4.0 制，部分用 5.0 制，按学校规定选择；结果仅换算标准不同。',
    },
    {
      q: '重修/补考成绩怎么算？',
      a: '本工具不区分，请按学校既定规则（取最高或最新）录入对应成绩即可。',
    },
  ],
  related: ['average-calculator', 'percentage-calculator', 'after-tax-salary'],
});
