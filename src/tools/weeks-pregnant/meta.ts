import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'weeks-pregnant',
  name: '怀孕周数计算器',
  tagline: 'LMP 算今天孕周+天',
  description:
    '免费在线怀孕周数计算器，输入末次月经（LMP）日期或同房日期，立即按医学标准算出今天怀孕几周几天，并估算预产期（LMP+280 天）。适用于产检进度对照、孕期记录与孕检项目时间安排，结果附胎儿发育阶段提示，全部本地计算。',
  keywords: ['怀孕周数', '孕周计算', '末次月经', '预产期', '孕期计算'],
  category: 'calc',
  tags: ['孕期', '日期', '计算'],
  icon: 'calendar',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 6,
  faq: [
    {
      q: '为什么用末次月经而不是受孕日？',
      a: '医学上统一以末次月经（LMP）起算孕周，因为 LMP 比实际受孕日更容易确定。整个孕期约 40 周（280 天）。',
    },
    {
      q: '预产期准吗？',
      a: '预产期按 LMP+280 天估算，仅约 5% 的孕妇在预产期当天分娩，前后两周内都属正常。本结果仅供参考，请以产检为准。',
    },
    {
      q: '末次月经填错了会怎样？',
      a: '孕周与预产期都依赖 LMP，填错会整体偏移。工具会校验日期合法性，若 LMP 晚于今天会提示核对。',
    },
  ],
  related: ['age-calculator', 'days-between', '90-day', 'days-ago'],
});
