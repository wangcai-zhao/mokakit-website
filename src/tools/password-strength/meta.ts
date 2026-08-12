import { defineTool } from '../types';

export default defineTool({
  id: 'password-strength',
  name: '密码强度分析',
  tagline: '实时评估密码强度与风险',
  description:
    '免费在线密码强度分析工具，本地检测长度、大小写、数字、符号、常见弱口令与重复/连续模式，给出强度评分与改进建议。所有计算在浏览器完成，不记录、不上传任何输入，可放心粘贴待测密码。',
  keywords: ['密码强度', '密码检测', '弱口令', '密码安全'],
  category: 'security',
  tags: ['密码', '安全', 'security', '强度', '检测'],
  icon: 'shield',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-08-04',
  updatedAt: '2026-08-04',
  priority: 5,
  faq: [
    {
      q: '分析过程会上传我的密码吗？',
      a: '不会。所有评分与规则检查都在浏览器本地进行，页面不发起任何网络请求，输入内容也不会被存储，关闭页面即清除。',
    },
    {
      q: '强度评分依据什么？',
      a: '综合密码长度、字符种类覆盖度、是否含常见弱口令或键盘连续序列（如 123456、qwerty）、重复字符比例等维度估算，结果仅作参考，不构成绝对安全保证。',
    },
  ],
});
