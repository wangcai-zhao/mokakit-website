import { defineTool } from '@/tools/types';

export default defineTool({
  id: 'system-prompt-generator',
  name: '系统提示词生成器',
  tagline: '把角色目标约束拼成系统提示词',
  description:
    '免费在线系统提示词生成器：填入角色、任务目标、约束条件、语气风格与输出格式，一键拼装出结构清晰、可直接粘贴给 ChatGPT / Claude / Kimi 的系统提示词（System Prompt），支持中英文与复制导出，全程本地生成不上传。',
  keywords: ["系统提示词","System Prompt","提示词生成","AI角色设定","Prompt"],
  category: 'ai',
  tags: ["ai","提示词","system-prompt","角色","大模型"],
  icon: 'bot',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-10-11',
  priority: 9,
  faq: [
    {
      q: '生成的提示词能直接用吗？',
      a: '可以。输出是标准 System Prompt 文本，复制后粘贴进 ChatGPT、Claude、Kimi 等客户端的「自定义指令 / 系统提示词」框即可生效。',
    },
    {
      q: '为什么还要手写约束？',
      a: '模板只保证结构完整，具体业务规则（如「只回答中文」「不编造数据」）仍需你补充，越具体模型越不容易跑偏。',
    },
    {
      q: '会保存我的内容吗？',
      a: '不会。全部在浏览器本地拼装，不上传任何服务器。',
    },
  ],
});
