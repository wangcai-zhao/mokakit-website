import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'function-calling-generator',
  name: '函数调用 Schema 生成器',
  tagline: '可视化生成工具调用定义',
  description:
    '免费在线函数调用 Schema 生成器：按行添加参数（名称、类型、描述、是否必填），一键生成 OpenAI / Anthropic 兼容的 function calling / tool use JSON，并实时校验类型与必填项，复制即可接入大模型智能体，本地生成不上传。',
  keywords: ["函数调用","Function Calling","Tool Use","JSON Schema","智能体工具"],
  category: 'ai',
  tags: ["ai","函数调用","json-schema","智能体","大模型"],
  icon: 'function-square',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 8,
  faq: [
    {
      q: '支持哪些类型？',
      a: '覆盖 string / number / integer / boolean / array / object 等 JSON Schema 基础类型，足够描述绝大多数工具入参。',
    },
    {
      q: '两种格式差别大吗？',
      a: '语义一致，仅字段命名略有不同（如 parameters 的位置），本工具已为你分别生成。',
    },
    {
      q: '会校验必填吗？',
      a: '会。勾选必填的参数会自动进入 required 数组。',
    },
  ],
});
