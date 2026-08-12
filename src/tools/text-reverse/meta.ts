import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'text-reverse',
  name: '文本反转',
  tagline: '字符/单词/行反转',
  description:
    '免费在线文本反转工具，提供字符反转、单词顺序反转、行序反转三种模式：整串倒序、按空格颠倒词序、把多行内容首尾对调。正确处理中文与 emoji 等多字节字符，常用于文字游戏、密码学练习、数据整理与排版调试，结果一键复制，全程本地运算不上传。',
  keywords: ['文本反转', '字符串倒序', '文字倒过来', '单词顺序反转', '行序反转'],
  category: 'text',
  tags: ['反转', '文本'],
  icon: 'flip-horizontal',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 5,
  faq: [
    {
      q: 'emoji 和中文反转后会变成乱码吗？',
      a: '不会。工具按 Unicode 码点而不是字节切分字符，emoji、中文等多字节字符会被当作完整一个字符处理，反转后不会拆散成乱码。',
    },
    {
      q: '三种模式分别适合什么场景？',
      a: '字符反转把整段文字倒着写，适合文字游戏；单词反转按空格颠倒词序，常用于英文句式练习；行序反转把多行内容首尾对调，适合把日志、榜单换个方向查看。',
    },
    {
      q: '多行文本用字符反转会怎样？',
      a: '字符反转以整段文本为单位倒序，换行位置也会随之改变。若只想颠倒行的先后顺序而保持每行内容不变，请切换到行序反转模式。',
    },
  ],
  related: ['case-converter', 'text-counter'],
});
