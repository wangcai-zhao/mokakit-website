import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'text-pad',
  name: '文本补齐对齐',
  tagline: '补零对齐到固定长度',
  description:
    '免费在线文本补齐工具，把文本补到指定长度，可选左侧补、右侧补或两侧补并指定分配方式，填充字符任意。典型用途是订单号补零、编号对齐、日志按列排版，支持逐行处理。本地处理不上传。',
  keywords: ['文本补齐', '补零', '字符串填充', '对齐文本', '定长编号'],
  category: 'text',
  tags: ['文本', '补齐', '对齐'],
  icon: 'type',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 6,
  faq: [
    {
      q: '超过目标长度的内容会被截断吗？',
      a: '不会。工具只做补齐不做截断，超过目标长度的原样保留，并会在顶部提示你有超长的行。',
    },
    {
      q: '中文能对整齐吗？',
      a: '按字符数补齐时，汉字占两个显示宽度，在等宽字体下会视觉错位。需要严格对齐时建议用空格填充，或者先转半角。',
    },
    {
      q: '填充字符能填多个字符吗？',
      a: '可以，最多四个字符。工具会循环重复填充串直到凑够长度，再截取到需要的位数。',
    },
  ],
  related: ['text-split-join', 'line-sort'],
});
