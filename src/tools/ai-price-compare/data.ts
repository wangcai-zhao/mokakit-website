/**
 * AI 价格比价 · 数据与纯计算层
 *
 * 借鉴 BerriAI/litellm（MIT）的 model_prices_and_context_window.json：
 * - 字段命名对齐 LiteLLM：in/out 即 input_cost_per_token / output_cost_per_token
 *   （本表按「美元 / 百万 token」记，即 × 1e6 后的口径），ctx 对应 max_input_tokens；
 * - tiered pricing（batch / flex / priority 档）在本表以 note 形式备注；
 * - 社区单一数据源的更新纪律：每次升级时人工同步快照，运行时不外链、不直拷代码。
 *
 * 本文件被 Tool.tsx（运行期）与 meta.ts 的子页生成器（构建期）共同 import，
 * 遵守「算法只有一份」原则。
 */

/** 快照日期：人工核对价格的日子，页面 alert / meta.faq / content.mdx 三处日期戳以此为准 */
export const SNAPSHOT_DATE = '2026-10-24';

export interface LLM {
  provider: string;
  model: string;
  ctx: string;
  /** 输入价：美元 / 百万 token（LiteLLM input_cost_per_token × 1e6） */
  in: number;
  /** 输出价：美元 / 百万 token，null 表示未公开 */
  out: number | null;
  note?: string;
  /** LiteLLM 风格的模型键，仅供下次同步快照时对照，运行时不使用 */
  key?: string;
}

export interface Vis {
  name: string;
  vendor: string;
  type: string;
  /** 单价描述（已折算人民币 + 美元参考） */
  price: string;
  sub?: string;
  note?: string;
  ref?: boolean;
}

/** 主流大模型 API 单价（USD / 1M tokens），快照日期见 SNAPSHOT_DATE，仅供参考 */
export const LLMS: LLM[] = [
  { provider: 'OpenAI', model: 'GPT-4o', ctx: '128K', in: 2.5, out: 10, key: 'gpt-4o' },
  { provider: 'OpenAI', model: 'GPT-4o mini', ctx: '128K', in: 0.15, out: 0.6, key: 'gpt-4o-mini' },
  { provider: 'OpenAI', model: 'o3-mini', ctx: '200K', in: 1.1, out: 4.4, key: 'o3-mini' },
  { provider: 'OpenAI', model: 'o3', ctx: '200K', in: 10, out: 40, key: 'o3' },
  { provider: 'OpenAI', model: 'GPT-5.4', ctx: '~1M', in: 2.5, out: 15, note: '前沿推理', key: 'gpt-5.4' },
  { provider: 'Anthropic', model: 'Claude Sonnet 4.6', ctx: '200K+', in: 3, out: 15, key: 'claude-sonnet-4-6' },
  { provider: 'Anthropic', model: 'Claude Opus 4.8', ctx: '1M', in: 5, out: 25, key: 'claude-opus-4-8' },
  { provider: 'Anthropic', model: 'Claude Haiku 4.5', ctx: '200K', in: 1, out: 5, note: '批量档约半价', key: 'claude-haiku-4-5-20251001' },
  { provider: 'Google', model: 'Gemini 3.5 Flash', ctx: '1M', in: 1.5, out: 9, key: 'gemini-3.5-flash' },
  { provider: 'Google', model: 'Gemini 3.1 Pro', ctx: '1M', in: 2, out: 12, key: 'gemini-3.1-pro' },
  { provider: 'Google', model: 'Gemini 3.1 Flash-Lite', ctx: '1M', in: 0.25, out: 1.5, key: 'gemini-3.1-flash-lite' },
  { provider: 'DeepSeek', model: 'DeepSeek V4-Flash', ctx: '1M', in: 0.14, out: 0.28, note: '官方国际站', key: 'deepseek-v4-flash' },
  { provider: 'DeepSeek', model: 'DeepSeek V4-Pro', ctx: '128K', in: 0.435, out: 0.87, key: 'deepseek-v4-pro' },
  { provider: '阿里通义', model: 'Qwen-Max', ctx: '1M', in: 2.4, out: 12, note: '官方国际站', key: 'qwen-max' },
  { provider: '阿里通义', model: 'Qwen-Plus', ctx: '1M', in: 0.26, out: 0.78, key: 'qwen-plus' },
  { provider: '智谱', model: 'GLM-4.6', ctx: '1M', in: 0.6, out: 2.2, key: 'glm-4.6' },
  { provider: '月之暗面', model: 'Kimi K2', ctx: '256K+', in: 0.57, out: 2.3, key: 'kimi-k2' },
  { provider: '字节豆包', model: 'Doubao 旗舰', ctx: '256K', in: 0.44, out: null, note: '输出价随档位浮动', key: 'doubao-pro' },
];

/** 视觉生成工具价格（图片/视频），快照日期见 SNAPSHOT_DATE，参考价 */
export const VISUAL: Vis[] = [
  {
    name: '即梦 AI',
    vendor: '字节跳动',
    type: '图片 / 视频',
    price: '图片 ≈ ¥0.28/张（≈$0.04）',
    sub: '视频 ≈ ¥0.65–1.38/秒（Seedance 2.0，会员越高越便宜）',
    note: '会员：基础 ¥79/月、标准 ¥239/月、高级 ¥649/月；免费每日赠积分',
  },
  {
    name: '可灵 AI',
    vendor: '快手',
    type: '视频',
    price: '会员制，按积分消耗',
    sub: '视频约 ¥0.5–1/秒（参考）',
    note: '2026 年推出会员优惠，具体以官网为准',
    ref: true,
  },
  {
    name: 'Vidu',
    vendor: '生数科技',
    type: '视频',
    price: '会员制 / 按积分',
    sub: '参考价约 ¥0.5–1/秒',
    note: '国产视频生成，风格化强',
    ref: true,
  },
  {
    name: 'Runway',
    vendor: 'Runway',
    type: '视频',
    price: '约 $0.30–0.90/秒（参考）',
    sub: 'Gen 系列，按生成时长计费',
    note: '影视级质量，控制项极细',
    ref: true,
  },
  {
    name: 'Sora 2',
    vendor: 'OpenAI',
    type: '视频',
    price: '约 $0.50/秒（Pro $5/10s）',
    sub: '$20/月起，最高 1080p / 25s',
    note: 'Pro 档约即梦 20 倍单价',
    ref: true,
  },
  {
    name: 'Veo 3.1',
    vendor: 'Google',
    type: '视频',
    price: '约 $0.10–0.75/秒（参考）',
    sub: 'Gemini API / Vertex AI 调用',
    note: '原生音画同步',
    ref: true,
  },
  {
    name: '海螺视频',
    vendor: 'MiniMax',
    type: '视频',
    price: '会员制 / 按积分',
    sub: '参考价约 ¥0.4–0.9/秒',
    note: 'MiniMax 旗下，中文适配好',
    ref: true,
  },
];

/** 厂商列表（按 LLMS 出现顺序去重） */
export const PROVIDERS: string[] = [...new Set(LLMS.map((m) => m.provider))];

/** 单次调用成本（USD）。输出价未公开的模型返回 null */
export function costOf(m: LLM, inTok: number, outTok: number): number | null {
  if (m.out == null) return null;
  return (inTok / 1e6) * m.in + (outTok / 1e6) * m.out;
}

/** 月成本（USD）= 单次成本 × 30 天 × 每日调用次数 */
export function monthlyCost(m: LLM, inTok: number, outTok: number, dailyCalls: number): number | null {
  const perCall = costOf(m, inTok, outTok);
  return perCall == null ? null : perCall * 30 * dailyCalls;
}

/** 按模型名查找（子页预填用） */
export function findLLM(model: string): LLM | undefined {
  return LLMS.find((m) => m.model === model);
}

/** 按名称查找视觉产品（子页预填用） */
export function findVis(name: string): Vis | undefined {
  return VISUAL.find((v) => v.name === name);
}
