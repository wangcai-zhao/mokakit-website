/**
 * 场景选模型助手 · 数据层
 *
 * 三层数据：
 *   1. DIMS        —— 能力维度（评分口径统一为 0-10，仅用于场景内相对排序，不是跑分）
 *   2. MODELS      —— 模型画像（能力 + 定位 + 强项 + 注意事项）
 *   3. TASKS       —— 场景（每类任务真正看重哪些维度，权重和为 1）
 *   4. CONSTRAINTS —— 约束（硬过滤 + 权重加成）
 *
 * 价格不算两份：模型单价从 ../ai-price-compare/data 的同一份快照读，
 * 保证「场景选模型」与「AI 价格比价」两个页面的数字永远一致。
 *
 * 本文件不引入任何 DOM / 框架依赖，可被 Node 直接 import 做回归测试。
 */

import { LLMS, SNAPSHOT_DATE } from '../ai-price-compare/data';

/** 价格与能力快照日期（页面、FAQ、content 三处日期戳都以它为准） */
export const SNAPSHOT = SNAPSHOT_DATE;

export type DimId =
  | 'coding'
  | 'reasoning'
  | 'writing'
  | 'chinese'
  | 'longCtx'
  | 'vision'
  | 'toolUse'
  | 'structured'
  | 'speed'
  | 'cost'
  | 'private';

export interface DimDef {
  id: DimId;
  /** 完整名称，用于理由说明 */
  label: string;
  /** 短标签，用于图表轴与徽章 */
  short: string;
  /** 该维度弱会带来什么后果（生成「风险提示」用） */
  weak: string;
}

export const DIMS: DimDef[] = [
  { id: 'coding', label: '代码实现', short: '代码', weak: '复杂工程容易出错，需要更多人工 review' },
  { id: 'reasoning', label: '复杂推理', short: '推理', weak: '多步推理与严谨结论会打折' },
  { id: 'writing', label: '文字写作', short: '写作', weak: '文风偏平，基本要多轮润色' },
  { id: 'chinese', label: '中文理解', short: '中文', weak: '中文语感与本土表达略逊' },
  { id: 'longCtx', label: '长文档处理', short: '长文', weak: '超长材料需要先切片再喂' },
  { id: 'vision', label: '图像理解', short: '视觉', weak: '不能直接读图，要先过 OCR' },
  { id: 'toolUse', label: '工具调用 / Agent', short: '工具', weak: 'Agent 编排时工具调用不够稳' },
  { id: 'structured', label: '结构化输出', short: '结构化', weak: 'JSON 输出要加重试与校验' },
  { id: 'speed', label: '响应速度', short: '速度', weak: '首字延迟偏高，不适合实时交互' },
  { id: 'cost', label: '成本友好', short: '性价比', weak: '单价偏高，高频调用成本压力大' },
  { id: 'private', label: '可私有化', short: '私有化', weak: '闭源 API，无法私有化部署' },
];

export const DIM_BY_ID = new Map<DimId, DimDef>(DIMS.map((d) => [d.id, d]));

/** 模型在哪个网络环境下可直连（用于「国内直连 / 合规」约束） */
export type Region = 'cn' | 'overseas';

export interface ModelProfile {
  name: string;
  provider: string;
  /** 一句话定位，直接用于卡片副标题 */
  positioning: string;
  /** 上下文窗口（token），展示用的 ctx 标签取自价格快照，避免两处写法不一致 */
  ctxTokens: number;
  region: Region;
  /** 是否开放权重（可私有化 / 本地部署） */
  openWeights: boolean;
  /** 能力评分 0-10 */
  scores: Record<Exclude<DimId, 'cost' | 'private'>, number>;
  /** 私有化可行度 0-10（闭源旗舰通常 1-2） */
  privateScore: number;
  strengths: string[];
  cautions: string[];
  tags: string[];
}

type RawModel = ModelProfile;

const RAW_MODELS: RawModel[] = [
  {
    name: 'GPT-5.4',
    provider: 'OpenAI',
    positioning: '通用旗舰，代码、工具调用、长文都稳，几乎没有明显短板',
    ctxTokens: 1_000_000,
    region: 'overseas',
    openWeights: false,
    scores: { coding: 9, reasoning: 9, writing: 8, chinese: 7, longCtx: 9, vision: 8, toolUse: 9, structured: 9, speed: 6 },
    privateScore: 1,
    strengths: ['代码与工具调用双强，适合 Agent 主脑', '1M 上下文，长材料不用切', '结构化输出稳定，接 API 省心'],
    cautions: ['单价偏高，海量调用成本压力大', '境外服务，需评估网络与合规'],
    tags: ['旗舰', '全能', 'Agent'],
  },
  {
    name: 'o3',
    provider: 'OpenAI',
    positioning: '推理专精的老一代选手，硬核逻辑题仍能打，但综合与速度已落后',
    ctxTokens: 200_000,
    region: 'overseas',
    openWeights: false,
    scores: { coding: 9, reasoning: 10, writing: 6, chinese: 6, longCtx: 6, vision: 5, toolUse: 8, structured: 8, speed: 4 },
    privateScore: 1,
    strengths: ['单点推理上限最高，难题肯花时间想', '算法题、竞赛题表现突出', '代码推理链路完整'],
    cautions: ['慢且贵，不适合聊天与高并发', '文风干硬，写作场景要换人', '上下文只有 200K，广度不如新旗舰'],
    tags: ['推理', '慢', '贵'],
  },
  {
    name: 'o3-mini',
    provider: 'OpenAI',
    positioning: '推理能力下放的轻量版，做逻辑校验够用且便宜',
    ctxTokens: 200_000,
    region: 'overseas',
    openWeights: false,
    scores: { coding: 7, reasoning: 9, writing: 5, chinese: 5, longCtx: 5, vision: 3, toolUse: 6, structured: 8, speed: 6 },
    privateScore: 1,
    strengths: ['便宜版推理模型，校验/审题性价比高', '结构化输出稳定', '比 o3 快很多'],
    cautions: ['中文与写作明显偏弱', '不支持读图', '上下文 200K'],
    tags: ['推理', '性价比'],
  },
  {
    name: 'GPT-4o',
    provider: 'OpenAI',
    positioning: '上一代多模态主力，能力均衡但已不是最优解',
    ctxTokens: 128_000,
    region: 'overseas',
    openWeights: false,
    scores: { coding: 7, reasoning: 6, writing: 8, chinese: 6, longCtx: 6, vision: 8, toolUse: 7, structured: 9, speed: 8 },
    privateScore: 1,
    strengths: ['多模态成熟，图片理解稳', '结构化输出老牌可靠', '响应速度不错'],
    cautions: ['上下文只有 128K', '同价位已被新模型全面超越'],
    tags: ['多模态', '上一代'],
  },
  {
    name: 'GPT-4o mini',
    provider: 'OpenAI',
    positioning: '低价多模态入口，分类、抽取、简单问答的首选底座',
    ctxTokens: 128_000,
    region: 'overseas',
    openWeights: false,
    scores: { coding: 6, reasoning: 5, writing: 7, chinese: 6, longCtx: 6, vision: 7, toolUse: 6, structured: 8, speed: 9 },
    privateScore: 1,
    strengths: ['便宜且快，批量任务友好', '支持读图，轻量多模态够用', '接口生态成熟'],
    cautions: ['复杂推理与长文能力有限', '中文表达偏翻译腔'],
    tags: ['便宜', '快', '多模态'],
  },
  {
    name: 'Claude Opus 4.8',
    provider: 'Anthropic',
    positioning: '长文与写作天花板，1M 上下文读整本手册不费劲',
    ctxTokens: 1_000_000,
    region: 'overseas',
    openWeights: false,
    scores: { coding: 9, reasoning: 9, writing: 9, chinese: 8, longCtx: 9, vision: 8, toolUse: 9, structured: 9, speed: 5 },
    privateScore: 2,
    strengths: ['长文档理解与文风最稳', '代码重构、审阅细致', '1M 上下文 + 工具调用'],
    cautions: ['最贵的一档，预算敏感慎选', '响应慢，不适合实时对话'],
    tags: ['旗舰', '长文', '写作'],
  },
  {
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    positioning: '旗舰能力的均衡版，写作、代码、Agent 都不掉队',
    ctxTokens: 200_000,
    region: 'overseas',
    openWeights: false,
    scores: { coding: 8, reasoning: 8, writing: 9, chinese: 8, longCtx: 7, vision: 8, toolUse: 9, structured: 9, speed: 8 },
    privateScore: 2,
    strengths: ['性价比最好的「全能型」之一', '工具调用规范，Agent 跑得稳', '文风自然，中文可读性好'],
    cautions: ['上下文 200K，超长材料要切', '中文本土梗理解一般'],
    tags: ['均衡', 'Agent', '写作'],
  },
  {
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    positioning: '轻快档，客服、分类、路由这类高频小任务的主力',
    ctxTokens: 200_000,
    region: 'overseas',
    openWeights: false,
    scores: { coding: 7, reasoning: 6, writing: 8, chinese: 7, longCtx: 6, vision: 7, toolUse: 8, structured: 8, speed: 10 },
    privateScore: 2,
    strengths: ['响应最快的一档', '短文本写作与润色自然', '价格在海外系里偏低'],
    cautions: ['深度推理不足', '长文档与复杂 Agent 吃力'],
    tags: ['快', '客服', '轻量'],
  },
  {
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    positioning: '多模态与超长上下文双强，整份 PDF / 视频都能直接读',
    ctxTokens: 1_000_000,
    region: 'overseas',
    openWeights: false,
    scores: { coding: 8, reasoning: 8, writing: 8, chinese: 7, longCtx: 9, vision: 9, toolUse: 8, structured: 9, speed: 7 },
    privateScore: 2,
    strengths: ['图像 / 视频 / PDF 原生理解最强档', '1M 上下文，整库材料一次喂', '结构化输出可靠'],
    cautions: ['中文语感略逊于国产模型', '境外服务，需评估网络'],
    tags: ['多模态', '长文'],
  },
  {
    name: 'Gemini 3.5 Flash',
    provider: 'Google',
    positioning: '长上下文 + 便宜 + 快，批量读文档的性价比之王',
    ctxTokens: 1_000_000,
    region: 'overseas',
    openWeights: false,
    scores: { coding: 7, reasoning: 7, writing: 7, chinese: 7, longCtx: 9, vision: 8, toolUse: 8, structured: 8, speed: 9 },
    privateScore: 2,
    strengths: ['1M 上下文却只要中低价位', '速度快，适合流水线批处理', '读图能力够用'],
    cautions: ['深度推理不如 Pro / o3', '写作细腻度一般'],
    tags: ['长文', '便宜', '快'],
  },
  {
    name: 'Gemini 3.1 Flash-Lite',
    provider: 'Google',
    positioning: '极低价档，百万级调用量的分类 / 抽取底座',
    ctxTokens: 1_000_000,
    region: 'overseas',
    openWeights: false,
    scores: { coding: 6, reasoning: 5, writing: 6, chinese: 6, longCtx: 8, vision: 7, toolUse: 6, structured: 7, speed: 10 },
    privateScore: 2,
    strengths: ['最便宜的一档之一', '1M 上下文 + 高吞吐', '简单抽取、打标够用'],
    cautions: ['复杂任务准确率明显下滑', '中文表达较弱'],
    tags: ['极低价', '批处理'],
  },
  {
    name: 'DeepSeek V4-Flash',
    provider: 'DeepSeek',
    positioning: '国产性价比标杆，中文强、价格低、还能开放权重自建',
    ctxTokens: 1_000_000,
    region: 'cn',
    openWeights: true,
    scores: { coding: 8, reasoning: 8, writing: 7, chinese: 9, longCtx: 9, vision: 4, toolUse: 7, structured: 8, speed: 9 },
    privateScore: 8,
    strengths: ['中文与代码双强，价格极低', '开放权重，可私有化部署', '1M 上下文'],
    cautions: ['不支持读图', '创意写作文风偏平'],
    tags: ['国产', '便宜', '开源'],
  },
  {
    name: 'DeepSeek V4-Pro',
    provider: 'DeepSeek',
    positioning: '国产旗舰，推理与代码接近一线，仍可自建',
    ctxTokens: 128_000,
    region: 'cn',
    openWeights: true,
    scores: { coding: 9, reasoning: 9, writing: 7, chinese: 9, longCtx: 7, vision: 4, toolUse: 8, structured: 8, speed: 6 },
    privateScore: 8,
    strengths: ['国产里推理上限最高的一档', '代码能力强，适合工程落地', '开放权重，数据可留在内网'],
    cautions: ['上下文 128K，长文档要切', '不支持读图'],
    tags: ['国产', '旗舰', '开源'],
  },
  {
    name: 'Qwen-Max',
    provider: '阿里通义',
    positioning: '中文全能旗舰，电商、政务、企业知识场景适配好',
    ctxTokens: 1_000_000,
    region: 'cn',
    openWeights: false,
    scores: { coding: 8, reasoning: 8, writing: 8, chinese: 9, longCtx: 9, vision: 7, toolUse: 7, structured: 9, speed: 6 },
    privateScore: 4,
    strengths: ['中文写作与商务表达成熟', '1M 上下文 + 结构化输出', '国内直连、开票合规'],
    cautions: ['旗舰档价格不算低', '旗舰闭源，私有化需另选开源线'],
    tags: ['国产', '中文', '企业'],
  },
  {
    name: 'Qwen-Plus',
    provider: '阿里通义',
    positioning: '旗舰能力的平价版，中文场景日常够用',
    ctxTokens: 1_000_000,
    region: 'cn',
    openWeights: false,
    scores: { coding: 7, reasoning: 7, writing: 7, chinese: 9, longCtx: 9, vision: 6, toolUse: 7, structured: 8, speed: 8 },
    privateScore: 4,
    strengths: ['中文强且价格低', '1M 上下文，长文友好', '国内直连、接入简单'],
    cautions: ['复杂推理不如旗舰档', '视觉能力一般'],
    tags: ['国产', '便宜', '中文'],
  },
  {
    name: 'GLM-4.6',
    provider: '智谱',
    positioning: '中文办公与代码均衡，开放权重可自建',
    ctxTokens: 1_000_000,
    region: 'cn',
    openWeights: true,
    scores: { coding: 7, reasoning: 7, writing: 7, chinese: 9, longCtx: 9, vision: 6, toolUse: 7, structured: 8, speed: 8 },
    privateScore: 6,
    strengths: ['中文办公文档处理顺手', '价格低、1M 上下文', '开放权重，可内网部署'],
    cautions: ['代码上限不如一线旗舰', '视觉能力一般'],
    tags: ['国产', '开源', '办公'],
  },
  {
    name: 'Kimi K2',
    provider: '月之暗面',
    positioning: '长文阅读起家，中文写作与资料消化能力突出',
    ctxTokens: 256_000,
    region: 'cn',
    openWeights: true,
    scores: { coding: 7, reasoning: 8, writing: 8, chinese: 9, longCtx: 8, vision: 4, toolUse: 7, structured: 8, speed: 6 },
    privateScore: 7,
    strengths: ['中文长文阅读与总结强', '写作语感自然', '开放权重可自建'],
    cautions: ['不支持读图', '上下文 256K，超长要切'],
    tags: ['国产', '长文', '开源'],
  },
  {
    name: 'Doubao 旗舰',
    provider: '字节豆包',
    positioning: '中文口语化最强，坐席、陪伴、短视频脚本适配度高',
    ctxTokens: 256_000,
    region: 'cn',
    openWeights: false,
    scores: { coding: 6, reasoning: 6, writing: 8, chinese: 10, longCtx: 8, vision: 7, toolUse: 6, structured: 7, speed: 8 },
    privateScore: 3,
    strengths: ['中文口语、网络语感最自然', '价格低、国内直连', '多模态够用'],
    cautions: ['代码与深度推理偏弱', '结构化输出不如一线稳'],
    tags: ['国产', '中文', '便宜'],
  },
];

const PRICE_BY_NAME = new Map(LLMS.map((m) => [m.model, m]));

export interface PriceInfo {
  in: number;
  out: number | null;
  ctx: string;
}

export interface Model extends ModelProfile {
  /** 单价快照，找不到价格为 null（页面显示「未收录」） */
  price: PriceInfo | null;
}

export const MODELS: Model[] = RAW_MODELS.map((r) => {
  const p = PRICE_BY_NAME.get(r.name);
  return {
    ...r,
    price: p ? { in: p.in, out: p.out, ctx: p.ctx } : null,
  };
});

// ---------------------------------------------------------------- 场景

export type TaskGroup = 'dev' | 'content' | 'analysis' | 'dialog' | 'ops';

export const TASK_GROUPS: { id: TaskGroup; label: string; hint: string }[] = [
  { id: 'dev', label: '开发与工程', hint: '代码、Agent、数据管道' },
  { id: 'content', label: '内容与营销', hint: '写作、翻译、短视频' },
  { id: 'analysis', label: '分析与专业', hint: '研究、合同、教学、识图' },
  { id: 'dialog', label: '对话与知识', hint: '客服、陪聊、知识库' },
  { id: 'ops', label: '批量与运营', hint: '海量调用的低成本任务' },
];

export interface TaskDef {
  id: string;
  label: string;
  group: TaskGroup;
  /** 这个场景真正难在哪，显示在选中后的说明里 */
  pain: string;
  /** 选型要点，结果页展示 */
  advice: string;
  /** 权重，和必须为 1（脚本会校验） */
  weights: Partial<Record<Exclude<DimId, 'private'>, number>>;
  /** 默认勾选的约束 */
  defaults?: string[];
  /** 自然语言识别关键词 */
  keywords: string[];
}

export const TASKS: TaskDef[] = [
  {
    id: 'code',
    label: '写代码 / 调试',
    group: 'dev',
    pain: '难在长链路改代码：要读懂现有仓库、按约束改对、还得能跑通测试。',
    advice: '先看代码与工具调用两项，再看上下文够不够装下整个模块；纯刷题可以只追推理。',
    weights: { coding: 0.32, reasoning: 0.18, toolUse: 0.14, longCtx: 0.12, structured: 0.08, speed: 0.06, cost: 0.06, writing: 0.04 },
    keywords: ['写代码', '编程', '代码', 'debug', '调试', '开发', '程序', '脚本', 'bug', '单元测试', '接口', '重构', 'python', 'java', '前端', '后端'],
  },
  {
    id: 'agent',
    label: '智能体 / 工作流',
    group: 'dev',
    pain: '难在稳定：模型要按格式调工具、按步骤推进，一步错整条流程就崩。',
    advice: '工具调用与结构化输出是硬门槛，宁可选贵一点也别选调不稳的；上下文要能装下工具清单和历史。',
    weights: { toolUse: 0.28, structured: 0.2, reasoning: 0.2, longCtx: 0.12, coding: 0.1, speed: 0.06, cost: 0.04 },
    keywords: ['agent', '智能体', '工作流', '自动化', 'n8n', 'dify', 'langgraph', '流程编排', '函数调用', 'mcp', '机器人跑'],
  },
  {
    id: 'codeReview',
    label: '代码审查 / 重构',
    group: 'dev',
    pain: '难在要一次吞下整个 diff 或模块，还得指出为什么错而不是只挑格式。',
    advice: '上下文和推理比纯编码分更重要，能读全量代码才有审查价值。',
    weights: { coding: 0.28, longCtx: 0.24, reasoning: 0.24, structured: 0.08, cost: 0.08, chinese: 0.04, writing: 0.04 },
    keywords: ['代码审查', 'code review', 'review', '重构', '技术债', '遗留代码'],
  },
  {
    id: 'data',
    label: '数据分析 / SQL',
    group: 'dev',
    pain: '难在口径：要把模糊的业务问题翻成准确的查询，并稳定输出可用的表格。',
    advice: '结构化输出与推理优先；数据量大时成本也要算进去。',
    weights: { reasoning: 0.24, structured: 0.2, coding: 0.18, longCtx: 0.14, cost: 0.12, speed: 0.06, chinese: 0.06 },
    keywords: ['数据分析', '报表', 'sql', '数据库', '清洗', '统计', 'excel', 'bi', '指标', '看板'],
  },
  {
    id: 'writing',
    label: '文案 / 文章写作',
    group: 'content',
    pain: '难在语感：要像人写的，还得对得上品牌调性和平台风格。',
    advice: '写作与中文两项决定下限，成本决定你能不能一天改十稿。',
    weights: { writing: 0.46, chinese: 0.22, reasoning: 0.08, cost: 0.08, speed: 0.06, structured: 0.04, longCtx: 0.06 },
    keywords: ['文案', '写作', '公众号', '软文', '标题', '文章', '小红书', '知乎', '推文', '润色'],
  },
  {
    id: 'script',
    label: '短视频脚本 / 口播',
    group: 'content',
    pain: '难在节奏：前三秒要抓人，口语要顺，还得能配合分镜落地。',
    advice: '要口语化的中文表达，写作分高但不接地气的模型会写得很「作文」。',
    weights: { writing: 0.32, chinese: 0.28, cost: 0.1, speed: 0.1, reasoning: 0.08, longCtx: 0.06, vision: 0.02, structured: 0.04 },
    keywords: ['短视频', '口播', '脚本', '直播', '分镜', '抖音', '带货', '视频号'],
  },
  {
    id: 'marketing',
    label: '营销 / SEO / 投放',
    group: 'content',
    pain: '难在既要创意又要转化：标题、落地页、关键词得能带来点击。',
    advice: '写作 + 推理组合最合适，纯便宜模型容易写出正确的废话。',
    weights: { writing: 0.26, chinese: 0.22, reasoning: 0.16, cost: 0.14, longCtx: 0.1, structured: 0.06, speed: 0.06 },
    keywords: ['营销', '投放', '广告', 'seo', '转化', '落地页', '私域', '推广', '种草'],
  },
  {
    id: 'translate',
    label: '翻译 / 本地化',
    group: 'content',
    pain: '难在信达雅：术语要一致、语气要像母语者，长文档还得前后统一。',
    advice: '中文与写作是基本盘，长上下文能避免后文术语漂移；大批量时单价决定可行性。',
    weights: { chinese: 0.3, writing: 0.26, longCtx: 0.12, cost: 0.14, speed: 0.1, structured: 0.04, reasoning: 0.04 },
    keywords: ['翻译', '本地化', '多语言', '英文', '日语', '出海', '字幕', '术语'],
  },
  {
    id: 'research',
    label: '深度研究 / 行业报告',
    group: 'analysis',
    pain: '难在资料多、结论要站得住：既要读完，又要能推。',
    advice: '推理与长文优先，写作用于成稿，便宜模型容易给出「正确的废话」。',
    weights: { reasoning: 0.34, longCtx: 0.26, writing: 0.16, chinese: 0.08, cost: 0.08, structured: 0.04, speed: 0.04 },
    keywords: ['研究', '报告', '调研', '行业分析', '论文', '综述', '竞品', '白皮书', '尽调'],
  },
  {
    id: 'summary',
    label: '长文摘要 / 会议纪要',
    group: 'analysis',
    pain: '难在不能漏：几十页材料要压成几段，还得保住数字和结论。',
    advice: '上下文长度是第一门槛，其次才是总结质量；流水线场景优先选便宜的 1M 档。',
    weights: { longCtx: 0.34, chinese: 0.2, reasoning: 0.14, speed: 0.12, cost: 0.12, structured: 0.08 },
    keywords: ['摘要', '总结', '会议纪要', '长文', '读书笔记', '提炼', '纪要', '录音整理'],
  },
  {
    id: 'legal',
    label: '合同 / 法律文书',
    group: 'analysis',
    pain: '难在严谨：条款之间会互相引用，漏一条风险就是真金白银。',
    advice: '推理 + 长文 + 中文三项都要够，别用轻量模型省这点钱；结论仍需律师复核。',
    weights: { reasoning: 0.36, longCtx: 0.24, chinese: 0.16, structured: 0.14, writing: 0.06, cost: 0.04 },
    keywords: ['合同', '法律', '条款', '合规', '协议', '诉讼', '审阅', '风控'],
  },
  {
    id: 'math',
    label: '数学 / 科研计算',
    group: 'analysis',
    pain: '难在一步错步步错，而且必须给出可检验的推导过程。',
    advice: '推理权重最高，可以接受慢和贵；需要写代码验证时再看编码分。',
    weights: { reasoning: 0.56, structured: 0.12, coding: 0.12, longCtx: 0.06, cost: 0.08, speed: 0.06 },
    keywords: ['数学', '公式', '证明', '竞赛', '物理', '计算题', '高数', '统计建模', '科研'],
  },
  {
    id: 'edu',
    label: '教学答疑 / 学习辅导',
    group: 'analysis',
    pain: '难在讲明白：同一道题要按学生水平换三种说法。',
    advice: '推理保证讲对，中文保证讲顺；成本决定能不能做成免费答疑。',
    weights: { reasoning: 0.26, chinese: 0.24, writing: 0.16, cost: 0.14, speed: 0.12, longCtx: 0.08 },
    keywords: ['教学', '老师', '辅导', '答疑', '学习', '习题', '讲课', '课程', '备课', '讲解'],
  },
  {
    id: 'ocr',
    label: '图片 / 截图 / OCR',
    group: 'analysis',
    pain: '难在视觉理解：表格、图纸、截图里的结构要还原成可用数据。',
    advice: '视觉分是硬门槛，其次看结构化输出能不能稳定还原表格；纯文字模型再强也读不了图。',
    weights: { vision: 0.36, longCtx: 0.16, structured: 0.14, chinese: 0.12, speed: 0.12, cost: 0.1 },
    keywords: ['图片', '图像', '截图', 'ocr', '识别', '看图', '图纸', '扫描件', '发票识别', '表格识别', '视频理解'],
  },
  {
    id: 'customer',
    label: '客服 / 问答机器人',
    group: 'dialog',
    pain: '难在又要快又要便宜还要不出错，一天几万轮对话成本是硬约束。',
    advice: '速度 + 成本 + 中文三项决定能不能上线；复杂售后可以「小模型分流 + 大模型兜底」。',
    weights: { chinese: 0.24, speed: 0.2, cost: 0.2, structured: 0.14, toolUse: 0.12, reasoning: 0.1 },
    defaults: ['budget', 'lowLatency'],
    keywords: ['客服', '问答', '售后', '工单', '售前', '坐席', '机器人', '对话'],
  },
  {
    id: 'roleplay',
    label: '角色扮演 / 陪伴',
    group: 'dialog',
    pain: '难在人设不崩：长对话里要记住设定、语气还得一致。',
    advice: '写作和中文决定像不像人，速度决定聊不聊得下去，成本决定你能不能免费开放。',
    weights: { writing: 0.34, chinese: 0.24, speed: 0.14, cost: 0.12, longCtx: 0.1, reasoning: 0.06 },
    keywords: ['角色扮演', '陪聊', '人设', '剧情', '小说', '游戏npc', '人格', '语c'],
  },
  {
    id: 'rag',
    label: '知识库 / RAG 问答',
    group: 'dialog',
    pain: '难在答得准：要在一堆切片里找对那几段，还得按固定格式带引用。',
    advice: '长文 + 结构化 + 中文三项兼顾，成本和速度决定检索一次跑几路召回。',
    weights: { longCtx: 0.26, chinese: 0.18, structured: 0.16, toolUse: 0.14, cost: 0.14, speed: 0.12 },
    keywords: ['知识库', 'rag', '检索增强', '文档问答', '企业资料', '内部文档', '向量库', '引用'],
  },
  {
    id: 'batch',
    label: '批量清洗 / 打标',
    group: 'ops',
    pain: '难在规模：单条便宜一厘钱，一百万条就是一笔预算；格式还得一次对。',
    advice: '成本与结构化输出优先，速度决定吞吐；准确率要求高的字段留给大模型二次校验。',
    weights: { cost: 0.3, structured: 0.24, speed: 0.18, longCtx: 0.14, chinese: 0.12, coding: 0.02 },
    defaults: ['budget', 'highVolume'],
    keywords: ['批量', '海量', '高并发', '打标', '抽取', '清洗数据', '百万条', '离线任务'],
  },
];

export const TASK_BY_ID = new Map(TASKS.map((t) => [t.id, t]));

// ---------------------------------------------------------------- 约束

export interface ConstraintDef {
  id: string;
  label: string;
  /** 一句话解释这个约束在做什么，显示在选中项下方 */
  hint: string;
  /** 权重加成（可为负，合成时钳制到 0 以上） */
  weightAdd?: Partial<Record<Exclude<DimId, 'private'>, number>>;
  /** 硬过滤：不满足直接排除并给出原因 */
  filter?: { dim?: Exclude<DimId, 'private'>; min?: number; ctxMin?: number; cnOnly?: boolean; openOnly?: boolean };
  /** 软提醒：分数低于阈值时在结果里提示风险 */
  warn?: { dim: Exclude<DimId, 'private'>; min: number };
}

export const CONSTRAINTS: ConstraintDef[] = [
  {
    id: 'budget',
    label: '预算敏感',
    hint: '把成本权重拉高，优先便宜档；结果里会标出「成本偏高」的选项',
    weightAdd: { cost: 0.18 },
    warn: { dim: 'cost', min: 5 },
  },
  {
    id: 'accuracy',
    label: '准确率优先',
    hint: '不计成本，把推理权重拉高、成本权重压低',
    weightAdd: { reasoning: 0.14, cost: -0.08 },
  },
  {
    id: 'lowLatency',
    label: '要快（实时交互）',
    hint: '提高速度权重，首字延迟高的模型会被提示',
    weightAdd: { speed: 0.15 },
    warn: { dim: 'speed', min: 7 },
  },
  {
    id: 'highVolume',
    label: '海量调用',
    hint: '按每天万级以上的调用量考虑，成本与吞吐优先',
    weightAdd: { cost: 0.12, speed: 0.08 },
  },
  {
    id: 'visionNeed',
    label: '必须能读图',
    hint: '硬条件：视觉能力低于 7 分的模型直接排除',
    filter: { dim: 'vision', min: 7 },
  },
  {
    id: 'jsonStable',
    label: '必须稳定出 JSON',
    hint: '硬条件：结构化输出低于 7 分的排除，并加权',
    filter: { dim: 'structured', min: 7 },
    weightAdd: { structured: 0.1 },
  },
  {
    id: 'ultraLong',
    label: '单次超长材料',
    hint: '硬条件：上下文不足 300K token 的排除，并加权长文',
    filter: { ctxMin: 300_000 },
    weightAdd: { longCtx: 0.15 },
  },
  {
    id: 'privacy',
    label: '要私有化 / 数据不出内网',
    hint: '硬条件：只保留开放权重、可本地部署的模型',
    filter: { openOnly: true },
  },
  {
    id: 'cnDirect',
    label: '国内直连 / 开票合规',
    hint: '硬条件：只保留国内可直接调用、可开票的模型',
    filter: { cnOnly: true },
  },
];

export const CONSTRAINT_BY_ID = new Map(CONSTRAINTS.map((c) => [c.id, c]));

// ---------------------------------------------------------------- 自然语言词典

export interface LexEntry {
  re: RegExp;
  /** 命中后建议的场景（可多个，按命中次数取胜） */
  tasks?: string[];
  constraints?: string[];
  /** 展示给用户的识别结果文案 */
  label: string;
}

/**
 * 词典顺序有意义：越靠前的越具体，先匹配「代码审查」再匹配「代码」。
 * 只做关键词/正则匹配，不上传、不调用模型，所以离线可用、结果可解释。
 */
export const LEXICON: LexEntry[] = [
  { re: /(代码审查|code\s*review|代码评审|重构|技术债)/i, tasks: ['codeReview'], label: '代码审查/重构' },
  { re: /(agent|智能体|工作流|n8n|dify|langgraph|流程编排|自动化流程)/i, tasks: ['agent'], label: '智能体/工作流' },
  { re: /(客服|售后|坐席|工单|问答机器人|售前咨询|在线咨询)/, tasks: ['customer'], label: '客服/问答机器人' },
  { re: /(知识库|rag|检索增强|文档问答|企业内部资料|向量库)/i, tasks: ['rag'], label: '知识库/RAG' },
  { re: /(短视频|口播|分镜|带货|抖音|视频号|直播话术)/, tasks: ['script'], label: '短视频脚本' },
  { re: /(翻译|本地化|多语言|字幕|出海|术语表)/, tasks: ['translate'], label: '翻译/本地化' },
  { re: /(合同|法律|条款|合规审查|协议|诉讼|律师)/, tasks: ['legal'], label: '合同/法律' },
  { re: /(会议纪要|摘要|总结|长文|读书笔记|提炼|纪要|录音整理)/, tasks: ['summary'], label: '摘要/纪要' },
  { re: /(调研|研究报告|行业分析|白皮书|尽调|竞品分析|论文综述)/, tasks: ['research'], label: '研究/报告' },
  { re: /(数学|公式|证明|竞赛|物理|高数|计算题|科研)/, tasks: ['math'], label: '数学/科研' },
  { re: /(教学|老师|辅导|答疑|备课|讲课|习题讲解|课程)/, tasks: ['edu'], label: '教学/辅导' },
  { re: /(图片|图像|截图|ocr|看图|图纸|扫描件|发票识别|表格识别|视觉)/i, tasks: ['ocr'], label: '图片/OCR' },
  { re: /(角色扮演|陪聊|人设|剧情|小说|语c|npc)/i, tasks: ['roleplay'], label: '角色扮演' },
  { re: /(数据分析|报表|sql|数据库|excel|bi|指标|看板|统计)/i, tasks: ['data'], label: '数据分析/SQL' },
  { re: /(批量|海量|高并发|打标|抽取|清洗|百万条|离线任务)/, tasks: ['batch'], label: '批量处理' },
  { re: /(文案|写作|公众号|软文|标题|小红书|知乎|推文|润色|文章)/, tasks: ['writing'], label: '文案/写作' },
  { re: /(营销|投放|广告|seo|转化|落地页|私域|种草|推广)/i, tasks: ['marketing'], label: '营销/SEO' },
  { re: /(写代码|编程|代码|debug|调试|开发|程序|bug|单元测试|接口|python|java|前端|后端)/i, tasks: ['code'], label: '写代码/调试' },

  { re: /(预算|便宜|省钱|成本低|不贵|价格敏感|低成本|免费|控制成本)/, constraints: ['budget'], label: '预算敏感' },
  { re: /(准确|精度|不能错|不能出错|别出错|零错误|严谨|可靠|质量优先|不计成本|专业级)/, constraints: ['accuracy'], label: '准确率优先' },
  { re: /(实时|低延迟|响应快|秒回|即时|毫秒|要快)/, constraints: ['lowLatency'], label: '要求响应快' },
  { re: /(高并发|海量|每天\s*\d+\s*万|大规模调用|百万次|批量调用)/, constraints: ['highVolume'], label: '海量调用' },
  { re: /(看图|读图|识别图片|截图|ocr|图纸|视觉|识图|图片理解)/i, constraints: ['visionNeed'], label: '必须读图' },
  { re: /(json|结构化输出|函数调用|格式固定|字段|api\s*返回)/i, constraints: ['jsonStable'], label: '稳定 JSON 输出' },
  { re: /(长文档|几十万字|万字|整本书|年报|超长|300k|100万\s*token)/i, constraints: ['ultraLong'], label: '超长材料' },
  { re: /(私有化|本地部署|内网|数据不能出境|保密|开源权重|自建|信创)/, constraints: ['privacy'], label: '私有化部署' },
  { re: /(国内直连|境内|开票|备案|合规要求)/, constraints: ['cnDirect'], label: '国内直连/合规' },
];
