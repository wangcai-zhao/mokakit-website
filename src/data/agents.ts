/**
 * 「智能体专栏」板块的数据源。
 *
 * 设计原则：数据驱动、纯静态、不引入任何后端/CMS。
 * 新增一个智能体 / 平台，只需在这里 push 一条；页面与 sitemap 会自动更新。
 * 站点都是外链，详情页统一加 rel="nofollow"，避免权重外流。
 *
 * 与「好站导航」(sites) 的区别：本专栏聚焦「AI 智能体（Agent）」这一品类，
 * 按"能直接用的平台 / 开发框架 / WorkBuddy 生态 / 运行托管"分维度精选，
 * 不把外部智能体塞进工具 registry（避免污染搜索索引）。
 *
 * icon 用 src/components/Icon.astro 里已有的 Lucide 图标名。
 */
export interface AgentLink {
  /** 名称 */
  name: string;
  /** 完整 URL（含协议） */
  url: string;
  /** 一句话简介，≤20 字 */
  desc: string;
}

export interface AgentGroup {
  id: string;
  /** 分组名称 */
  name: string;
  /** 分组副标题 */
  desc: string;
  /** 分组图标（Icon.astro 中的 Lucide 名） */
  icon: string;
  links: AgentLink[];
}

export const AGENT_GROUPS: AgentGroup[] = [
  // ===================== 重点：能直接用的智能体平台 =====================
  {
    id: 'agent-platforms',
    name: '智能体平台',
    desc: '拖拽 / 低代码即可搭建并发布智能体',
    icon: 'bot',
    links: [
      { name: 'WorkBuddy', url: 'https://www.workbuddy.cn/', desc: '桌面 AI 助手与自动化' },
      { name: 'Coze 扣子', url: 'https://www.coze.cn/', desc: '字节智能体搭建' },
      { name: 'Dify', url: 'https://dify.ai/', desc: '开源 LLM 应用平台' },
      { name: 'n8n', url: 'https://n8n.io/', desc: '工作流自动化' },
      { name: 'Flowise', url: 'https://flowiseai.com/', desc: '低代码智能体' },
      { name: 'AgentGPT', url: 'https://agentgpt.reworkd.ai/', desc: '浏览器智能体' },
      { name: 'Character.AI', url: 'https://character.ai/', desc: '角色对话智能体' },
      { name: 'Monica', url: 'https://monica.im/', desc: 'AI 浏览器助手' },
      { name: 'Poe', url: 'https://poe.com/', desc: '多模型聚合平台' }
    ],
  },
  {
    id: 'agent-frameworks',
    name: '智能体开发框架',
    desc: '写代码自定义多智能体编排与 RAG',
    icon: 'code',
    links: [
      { name: 'LangChain', url: 'https://www.langchain.com/', desc: '智能体框架' },
      { name: 'LangGraph', url: 'https://www.langchain.com/langgraph', desc: '图编排' },
      { name: 'AutoGen', url: 'https://microsoft.github.io/autogen/', desc: '微软多智能体' },
      { name: 'CrewAI', url: 'https://www.crewai.com/', desc: '多智能体协作' },
      { name: 'MetaGPT', url: 'https://github.com/geekan/MetaGPT', desc: '多智能体' },
      { name: 'Semantic Kernel', url: 'https://learn.microsoft.com/semantic-kernel', desc: '微软框架' },
      { name: 'LlamaIndex', url: 'https://www.llamaindex.ai/', desc: '数据框架' },
      { name: 'Haystack', url: 'https://haystack.deepset.ai/', desc: 'RAG 框架' }
    ],
  },
  // ===================== 重点：WorkBuddy 生态 =====================
  {
    id: 'workbuddy-eco',
    name: 'WorkBuddy 生态',
    desc: '旺财先生的主力 AI 搭子，相关入口',
    icon: 'sparkles',
    links: [
      { name: 'WorkBuddy 官网', url: 'https://www.workbuddy.cn/', desc: '桌面 AI 助手' },
      { name: '资料库', url: 'https://www.workbuddy.cn/space', desc: '在线文档与多维表' },
      { name: 'MCP Server', url: 'https://www.workbuddy.cn/', desc: '工具与 Agent 接入' },
      { name: '企业微信助理', url: 'https://work.weixin.qq.com/', desc: '远程操控通道' },
      { name: 'MokaKit 工具箱', url: 'https://mokakit.com/', desc: 'AI 时代工具箱（本站）' }
    ],
  },
  {
    id: 'agent-runtime',
    name: '运行与托管',
    desc: '模型推理 API 与智能体部署底座',
    icon: 'server',
    links: [
      { name: 'OpenRouter', url: 'https://openrouter.ai/', desc: '统一 API' },
      { name: 'Groq', url: 'https://groq.com/', desc: '极速推理' },
      { name: 'Replicate', url: 'https://replicate.com/', desc: '模型托管' },
      { name: '硅基流动', url: 'https://siliconflow.cn/', desc: '模型 API' },
      { name: '火山方舟', url: 'https://www.volcengine.com/product/ark', desc: '火山大模型' },
      { name: '阿里云百炼', url: 'https://bailian.console.aliyun.com/', desc: '百炼平台' },
      { name: 'Hugging Face', url: 'https://huggingface.co/', desc: '模型社区' }
    ],
  },
];
