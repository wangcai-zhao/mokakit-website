import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'env-parser',
  name: '.env 配置解析',
  tagline: '解析 dotenv 配置，校验键值与重复',
  description:
    '免费在线 .env 解析工具，把 dotenv 格式（KEY=VALUE，支持引号、注释、多行）解析成键值对，校验重复键、缺失值、格式错误，并可导出为 JSON。排查配置、写 deployment 前先核对，全部本地解析。',
  keywords: ['.env 解析', 'dotenv', '环境变量解析', 'env 解析'],
  category: 'dev',
  tags: ['env', '配置', '开发'],
  icon: 'file-cog',
  status: 'stable',
  hydrate: 'load',
  createdAt: '2026-09-03',
  updatedAt: '2026-09-03',
  priority: 7,
  related: ['yaml-json', 'json-formatter'],
  faq: [
    {
      q: '支持哪些写法？',
      a: '支持 KEY=VALUE、# 注释、空行、双引号/单引号包裹（引号内可含空格与=）、以及 export 前缀。值里的 # 不在引号内会被当注释截断，这是 dotenv 规范。',
    },
    {
      q: '重复键怎么处理？',
      a: '默认标记为「重复键」，并保留最后一次出现的值（与大多数加载器行为一致）。列表会列出所有重复，方便你清理。',
    },
    {
      q: '能导出成别的格式吗？',
      a: '可一键导出为 JSON 对象，便于在脚本里引用；也可仅查看去重后的干净键值表。',
    },
    {
      q: '敏感值会泄露吗？',
      a: '不。解析全程在浏览器本地，不上传、不保存你粘贴的任何配置，含密钥的 .env 也安全。',
    },
  ],
});
