import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'text-extract',
  name: '文本提取',
  tagline: '批量提取手机号邮箱',
  description:
    '免费在线文本提取工具，从一段文字里批量揪出手机号、邮箱、网址、IP、身份证号、银行卡号、日期、金额、数字、中文与英文片段，也支持自己写正则。结果按类型分组并自动去重，一键复制。本地处理不上传。',
  keywords: ['文本提取', '提取手机号', '提取邮箱', '正则提取', '批量提取号码'],
  category: 'text',
  tags: ['文本', '提取', '正则'],
  icon: 'text-search',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-09-18',
  updatedAt: '2026-09-18',
  priority: 8,
  faq: [
    {
      q: '识别准确吗？',
      a: '手机号、邮箱、网址这类格式固定的识别率很高；身份证和银行卡用的是格式规则，没有做校验位验算（身份证会在脱敏工具里校验），重要场景请人工复核。',
    },
    {
      q: '能一次提取多种类型吗？',
      a: '可以，勾选的类型会全部提取并按类型分组展示，右上角显示总命中数。',
    },
    {
      q: '自定义正则怎么写？',
      a: '填一个正则主体，比如 \\d{4}-\\d{2}-\\d{2} 匹配日期。修饰符默认 g（全局），需要忽略大小写就写成 gi。',
    },
  ],
  related: ['regex-tester', 'doc-desensitize'],
});
