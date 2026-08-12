import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'random-number',
  name: '随机数生成器',
  tagline: '区间内批量随机整数',
  description:
    '免费在线随机数生成器，自定义最小值、最大值与生成数量，一次批量产出随机整数，支持不重复模式，适合抽奖、摇号、随机点名、测试数据。基于浏览器加密级随机源生成，结果可一键复制，无需注册。',
  keywords: ['随机数生成器', '在线随机数', '随机整数', '批量随机数', '不重复随机数'],
  category: 'life',
  tags: ['随机', '生成'],
  icon: 'dice',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '这里的随机数够随机吗？',
      a: '工具使用浏览器内置的 Web Crypto 接口 crypto.getRandomValues 生成，属于加密级随机源，质量远高于 Math.random()。同时采用拒绝采样消除取模偏差，保证区间内每个整数出现的概率完全相同。',
    },
    {
      q: '"不允许重复"最多能生成多少个？',
      a: '不重复模式下，生成数量不能超过区间内整数的总个数。例如 1 到 10 最多只能生成 10 个不重复的数，超出时工具会提示并自动限制上限。',
    },
    {
      q: '生成的随机数会被记录吗？',
      a: '不会。所有计算都在你的浏览器本地完成，不向任何服务器发送请求，也不写入日志。你可以断网后继续使用本页面来验证这一点。',
    },
  ],
  related: ['lottery-draw', 'password-generator'],
});
