import { defineTool } from '../types';

export default defineTool({
  id: 'prompt-template',
  name: 'Prompt 变量模板',
  tagline: '用变量填充模板，一键生成最终提示词',
  description:
    '免费在线 Prompt 变量模板工具，内置角色扮演、系统提示词、Few-shot、翻译、代码审查、SEO 等常用预设，并支持把模板保存到本地「我的模板」反复调用；用 {{变量}} 占位符编写模板，填入变量值一键渲染出最终提示词，未替换变量会高亮提醒。',
  keywords: ['Prompt模板', '提示词变量', '变量替换', '模板生成', '提示词工程', '预设模板', '我的模板'],
  category: 'ai',
  tags: ['prompt', '模板', 'ai', '提示词', '变量'],
  icon: 'braces',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: '变量名可以写中文吗？',
      a: '可以。变量名支持中英文与数字，例如 {{角色}}、{{topic} 都能识别。建议在变量表里用同样的名字对应取值。',
    },
    {
      q: '没填值的占位符会怎样？',
      a: '未提供对应取值的占位符会原样保留（如 {{变量名}}），并在结果下方提示你哪些变量还没替换，方便检查遗漏。',
    },
  ],
});
