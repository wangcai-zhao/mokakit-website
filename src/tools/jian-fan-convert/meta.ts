import { defineTool } from '../types';

export default defineTool({
  id: 'jian-fan-convert',
  name: '简繁转换',
  tagline: '简体中文与繁体中文互转',
  description:
    '免费在线简繁转换工具，支持简体中文转繁体中文、繁体转简体，一键切换方向，适用于文档、网页、字幕的简繁互换。所有转换都在本地浏览器完成，不上传任何文本。',
  keywords: ['简繁转换', '简体转繁体', '繁体转简体', '中文转换', '简繁互换工具'],
  category: 'text',
  tags: ['简繁', '中文', '文本', '转换'],
  icon: 'languages',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 6,
  faq: [
    {
      q: '这个简繁转换准确吗？',
      a: '本工具内置常用简繁差异字对照表，可正确转换绝大多数日常用字。少数一简对多繁的特殊字（如「干」对应「乾/幹」）会按最常见用法处理，对重要内容建议人工复核。',
    },
    {
      q: '转换后的文字会上传到服务器吗？',
      a: '不会。所有简繁转换都在你的浏览器本地完成，文本不会离开你的设备，适合处理敏感或私密内容。',
    },
  ],
});
