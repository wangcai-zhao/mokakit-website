import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'prompt-injection-detector',
  name: '提示词注入检测',
  tagline: '识别藏在日常文本里的注入指令',
  description:
    '免费在线提示词注入检测器：把用户可能喂给 AI 的一段文本贴进来，工具扫描「忽略上文」「你是 DAN」「扮演无限制助手」等常见越狱与指令劫持特征，按风险等级列出命中项并给出建议，帮助你在上线智能体前拦一道，纯本地检测不上传。',
  keywords: ["提示词注入","Prompt Injection","越狱检测","AI安全","指令劫持"],
  category: 'ai',
  tags: ["ai","安全","提示词注入","越狱","智能体"],
  icon: 'shield',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 8,
  faq: [
    {
      q: '能防住所有注入吗？',
      a: '不能。规则匹配只能拦已知套路，面对改写或组合攻击仍需人工评审与多层防御（输入隔离、权限最小化）。',
    },
    {
      q: '会误报吗？',
      a: '会。正常文本里出现「忽略」「系统」等词也可能命中，结果仅作参考，最终由你判断。',
    },
    {
      q: '内容会上传吗？',
      a: '不会。检测在浏览器本地完成。',
    },
  ],
});
