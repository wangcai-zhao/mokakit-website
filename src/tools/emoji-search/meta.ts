import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'emoji-search',
  name: 'Emoji 表情搜索',
  tagline: '搜表情一键复制',
  description:
    '免费在线 Emoji 表情搜索工具，输入“开心”“生气”“点赞”等中文关键词即可秒搜对应表情符号，点一下直接复制到剪贴板，可粘贴到微信、微博、文档与代码注释。内置上百个常用表情并按分类浏览，纯本地无需联网。',
  keywords: ['emoji 搜索', '表情符号', 'emoji 复制', '表情大全', '颜文字表情'],
  category: 'fun',
  tags: ['emoji', '表情', '复制'],
  icon: 'smile',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-05',
  updatedAt: '2026-08-05',
  priority: 7,
  faq: [
    {
      q: '复制的 Emoji 在别的平台显示不一样，是复制错了吗？',
      a: '没有错。Emoji 传输的是统一的 Unicode 码点，具体长什么样由对方设备的字体决定：同一个表情在 iOS、Android、Windows 与微信里的画风各不相同，个别老旧系统缺字体时还会显示成方框“豆腐块”。这属于正常现象，内容本身是一致的。',
    },
    {
      q: '为什么搜中文关键词也能搜到？',
      a: '每个表情都预先标注了多个中文含义词与英文单词，比如 😂 标了“笑哭 喜极而泣 lol”。搜索时会在这些关键词里做包含匹配，所以搜“哭”“笑”“开心”都能命中，不必记英文名。多敲几个字缩小范围会更准。',
    },
    {
      q: '点击复制没反应怎么办？',
      a: '现代浏览器要求剪贴板操作发生在安全上下文（HTTPS 或 localhost）中，本工具已内置降级方案：若剪贴板 API 不可用会自动改用兼容写法复制。若仍然失败，通常是浏览器权限被禁用，你也可以直接选中表情手动复制。',
    },
  ],
  related: ['name-generator', 'dice-roller'],
});
