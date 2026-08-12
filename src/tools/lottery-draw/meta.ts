import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'lottery-draw',
  name: '抽签抽奖',
  tagline: '从选项里随机抽取',
  description:
    '免费在线抽签抽奖工具，每行输入一个选项即可随机抽取一个或多个结果，抽取结果不重复并高亮显示。适合年会抽奖、随机点名、决定今天吃什么、分组分配等场景，纯浏览器本地随机，公平透明，结果可一键复制。',
  keywords: ['在线抽签', '随机抽奖', '随机点名', '抽签工具', '随机选择器'],
  category: 'life',
  tags: ['抽签', '随机'],
  icon: 'ticket',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '抽签结果公平吗？会不会有内定？',
      a: '完全公平。工具使用浏览器的 Web Crypto 加密级随机源配合 Fisher-Yates 洗牌算法，每个选项被抽中的概率完全相同。所有逻辑运行在你自己的浏览器里，没有任何服务器参与，不存在内定的可能。',
    },
    {
      q: '同一个选项会被重复抽中吗？',
      a: '不会。一次抽取多个结果时会自动去重，同一个选项只会出现一次。如果你需要"有放回"的重复抽取，可以多点几次抽签按钮，每次单独抽一个。',
    },
    {
      q: '选项数量有限制吗？',
      a: '没有硬性上限，几百上千行都能正常处理。工具会自动忽略空行并去除首尾空格，你可以直接从表格或文档里粘贴名单进来。',
    },
  ],
  related: ['random-number', 'countdown-timer'],
});
