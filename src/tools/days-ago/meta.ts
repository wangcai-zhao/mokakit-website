import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'days-ago',
  name: '几天前日期计算器',
  tagline: '算 N 天前是几月几号',
  description:
    '免费在线几天前日期计算器，输入天数立即得出准确的过去日期、星期几与 ISO 标准格式。跨月、跨年、闰年都算得对，适用于复盘、追溯与历史节点核对，全部本地计算不上传数据。',
  keywords: ['几天前日期', 'N天前是几号', '过去日期计算', '日期往前推', '几号前'],
  category: 'calc',
  tags: ['日期', '天数', '计算'],
  icon: 'calendar',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-09',
  updatedAt: '2026-08-09',
  priority: 7,
  faq: [
    {
      q: '负数天数会怎样？',
      a: '本工具默认往前推算。若你填正数，则变成「N 天后」；负数则继续往前，例如 -90 即 90 天前。',
    },
    {
      q: '跨年或闰年准确吗？',
      a: '准确。计算基于真实公历，自动处理 2 月 29 日、跨月与跨年，不会按每月 30 天粗暴近似。',
    },
    {
      q: '结果能复制吗？',
      a: '可以。结果区右侧有复制按钮，一键复制 ISO 格式（YYYY-MM-DD）方便粘贴到别处。',
    },
  ],
  related: ['90-day', 'days-between', 'date-calculator', 'age-calculator'],
});
