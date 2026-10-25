import { defineTool } from '@/tools/types';
import { findLLM, findVis, SNAPSHOT_DATE } from './data';

/** 子页成本算例用的参考汇率（交互区汇率可调，此处为构建期静态折算） */
const REF_RATE = 7.2;

/** 单模型明细子页：输入/输出价 + 经典成本算例 */
function modelSub(slug: string, model: string, seoTitle: string, description: string) {
  const m = findLLM(model)!;
  const perCall = ((1e6 / 1e6) * m.in + (0.5e6 / 1e6) * (m.out ?? 0)).toFixed(2);
  return {
    slug,
    title: `${m.model} API 价格`,
    seoTitle,
    description,
    data: { aiModel: m.model },
    faq: [
      {
        q: `${m.model} 的 API 价格是多少？`,
        a: `以 ${SNAPSHOT_DATE} 快照计，${m.model} 输入约 $${m.in}/百万 token，输出${m.out == null ? '价未公开' : `约 $${m.out}/百万 token`}，上下文窗口 ${m.ctx}。人民币参考价可按 1 USD ≈ ${REF_RATE} CNY 折算。`,
      },
      {
        q: `${m.model} 跑 100 万输入 + 50 万输出 token 要多少钱？`,
        a: `约 $${perCall}（≈ ¥${(Number(perCall) * REF_RATE).toFixed(1)}）。这是单次调用的价格，批量场景可用上方工具的「每日调用次数」估算月成本。`,
      },
    ],
  };
}

export default defineTool({
  id: 'ai-price-compare',
  name: 'AI 价格比价',
  tagline: '主流大模型与视觉生成价格对比',
  description:
    '免费在线 AI 价格比价工具，汇总 OpenAI、Anthropic、Google、DeepSeek、通义千问、智谱、Kimi 等主流大模型的 API 单价（每百万 token 输入/输出价），以及即梦、可灵、Runway、Sora、Veo 等视觉生成工具的价格，支持按场景估算调用成本与月成本，汇率可调，数据本地对比、不上传，仅供参考。',
  keywords: ['AI价格', '大模型比价', 'API价格', '即梦价格', 'token价格', 'GPU成本'],
  category: 'ai',
  tags: ['ai', '价格', '比价', '大模型', '即梦'],
  icon: 'coins',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-08-04',
  updatedAt: '2026-10-24',
  priority: 8,
  seoTitle: 'AI 价格比价 - 大模型 API 每百万 token 价格对比',
  related: ['token-counter', 'ai-model-selector', 'context-window-calculator', 'prompt-template'],
  faq: [
    {
      q: '价格是实时获取的吗？',
      a: `不是。价格为人工维护的参考快照（数据更新于 ${SNAPSHOT_DATE}，字段结构参考 LiteLLM 开源价格库），大模型与视觉生成平台调价频繁，正式采购请以各厂商官网公示价为准。`,
    },
    {
      q: '货币怎么看？',
      a: '国际大模型官方以美元（USD）计费，本工具默认按 1 USD ≈ 7.2 CNY 折算出人民币参考价；汇率可在页面顶部自行调整，会记忆在本机浏览器，仅作直观对比，实际以账单为准。',
    },
    {
      q: '月成本是怎么算出来的？',
      a: '月成本 = 单次调用成本 × 30 天 × 每日调用次数。在「场景成本估算」区填入输入/输出 token 数和每日调用次数，即可横向对比各模型的月度开支，方便做预算。',
    },
    {
      q: '为什么没有豆包/文心等的输出价？',
      a: '部分国产模型仅公开输入价或采用积分/会员制，输出价随档位浮动，为避免误导此处留空或标注「会员制」，建议以官方报价页核对。',
    },
  ],
  subpages: () => {
    const pages = [
      modelSub(
        'gpt4o-price',
        'GPT-4o',
        'GPT-4o API 价格 - 每百万 token 输入输出单价（2026-10 快照）',
        'GPT-4o API 价格查询：输入 $2.5/百万 token、输出 $10/百万 token，上下文 128K，附人民币折算与 100 万输入 + 50 万输出的成本算例，快照更新于 2026-10-24。',
      ),
      {
        slug: 'claude-api-price',
        title: 'Claude API 价格',
        seoTitle: 'Claude API 价格 - Sonnet/Opus/Haiku 每百万 token 单价对比',
        description:
          'Claude API 价格对比：Sonnet 4.6 $3/$15、Opus 4.8 $5/$25、Haiku 4.5 $1/$5（每百万 token 输入/输出），附上下文窗口与成本算例，快照更新于 2026-10-24。',
        data: { aiProvider: 'Anthropic' },
        faq: [
          {
            q: 'Claude 哪个型号最便宜？',
            a: '按快照价，Haiku 4.5 最便宜（输入 $1/输出 $5 每百万 token），适合批量轻任务；Sonnet 4.6 是性价比均衡档；Opus 4.8 最贵但能力最强。',
          },
          {
            q: 'Claude API 怎么计费？',
            a: '按 token 计费，输入与输出分开计价，单位是每百万 token。Prompt caching 命中时输入部分有折扣（约为标准价的 10%），批量接口另有约半价的 Batch 档。',
          },
        ],
      },
      {
        slug: 'deepseek-api-price',
        title: 'DeepSeek API 价格',
        seoTitle: 'DeepSeek API 价格 - V4 系列每百万 token 单价（2026-10 快照）',
        description:
          'DeepSeek API 价格：V4-Flash 输入 $0.14/输出 $0.28、V4-Pro 输入 $0.435/输出 $0.87（每百万 token），上下文最高 1M，附人民币折算与成本算例，快照更新于 2026-10-24。',
        data: { aiProvider: 'DeepSeek' },
        faq: [
          {
            q: 'DeepSeek API 多少钱？',
            a: `以 ${SNAPSHOT_DATE} 快照计，V4-Flash 输入 $0.14、输出 $0.28 每百万 token；V4-Pro 输入 $0.435、输出 $0.87。是主流模型里最便宜的一档。`,
          },
          {
            q: 'DeepSeek 有上下文优惠吗？',
            a: 'V4-Flash 上下文窗口达 1M token，长文档场景优势明显；夜间时段部分渠道还有额外折扣，以官方公告为准。',
          },
        ],
      },
      {
        slug: 'gemini-api-price',
        title: 'Gemini API 价格',
        seoTitle: 'Gemini API 价格 - 3.5 Flash/3.1 Pro 每百万 token 单价对比',
        description:
          'Gemini API 价格对比：3.5 Flash $1.5/$9、3.1 Pro $2/$12、3.1 Flash-Lite $0.25/$1.5（每百万 token 输入/输出），上下文最高 1M，附成本算例，快照更新于 2026-10-24。',
        data: { aiProvider: 'Google' },
        faq: [
          {
            q: 'Gemini API 价格表？',
            a: `以 ${SNAPSHOT_DATE} 快照计：Gemini 3.5 Flash 输入 $1.5/输出 $9；Gemini 3.1 Pro 输入 $2/输出 $12；Gemini 3.1 Flash-Lite 输入 $0.25/输出 $1.5（均为每百万 token）。`,
          },
          {
            q: 'Gemini 有免费额度吗？',
            a: 'Google AI Studio 提供带速率限制的免费档，适合开发测试；生产环境走 Gemini API / Vertex AI 按上表计费。',
          },
        ],
      },
      {
        slug: 'qwen-api-price',
        title: '通义千问 API 价格',
        seoTitle: '通义千问 Qwen API 价格 - Qwen-Max/Plus 每百万 token 单价',
        description:
          '通义千问 API 价格：Qwen-Max 输入 $2.4/输出 $12、Qwen-Plus 输入 $0.26/输出 $0.78（每百万 token，官方国际站），附人民币折算与成本算例，快照更新于 2026-10-24。',
        data: { aiProvider: '阿里通义' },
        faq: [
          {
            q: '通义千问 API 怎么收费？',
            a: `按 token 计费，输入输出分开。以 ${SNAPSHOT_DATE} 快照计（官方国际站）：Qwen-Max 输入 $2.4/输出 $12，Qwen-Plus 输入 $0.26/输出 $0.78，均为每百万 token。`,
          },
          {
            q: '国内站和国际站价格一样吗？',
            a: '不一样。国内站按人民币计价且有新用户免费额度（如 100 万 token），国际站按美元计价，本页数据为国际站快照，选型时请注意区分。',
          },
        ],
      },
      {
        slug: 'jimeng-price',
        title: '即梦 AI 价格',
        seoTitle: '即梦 AI 价格 - 图片/视频生成会员与积分收费（2026-10）',
        description:
          '即梦 AI 价格一览：图片约 ¥0.28/张、视频约 ¥0.65–1.38/秒（Seedance 2.0），会员基础 ¥79/月、标准 ¥239/月、高级 ¥649/月，免费每日赠积分，快照更新于 2026-10-24。',
        data: { aiVisual: '即梦 AI' },
        faq: [
          {
            q: '即梦 AI 怎么收费？',
            a: '图片按张计费（约 ¥0.28/张），视频按秒计费（约 ¥0.65–1.38/秒，Seedance 2.0）；也可买会员（基础 ¥79/月、标准 ¥239/月、高级 ¥649/月），会员档位越高单价越便宜，免费用户每日赠积分。',
          },
          {
            q: '即梦视频为什么不同场景价格差很多？',
            a: '视频按时长 × 单价计费，不同模型（如 Seedance 2.0 vs 即梦 3.0）、分辨率与会员档位都会影响单价，生成前页面会显示所需积分。',
          },
        ],
      },
      {
        slug: 'keling-price',
        title: '可灵 AI 价格',
        seoTitle: '可灵 AI 价格 - 视频生成积分与会员收费（2026-10）',
        description:
          '可灵 AI 价格一览：会员制按积分消耗，视频约 ¥0.5–1/秒（参考），2026 年推出会员优惠，具体以官网为准，快照更新于 2026-10-24。',
        data: { aiVisual: '可灵 AI' },
        faq: [
          {
            q: '可灵 AI 怎么收费？',
            a: '采用会员制 + 积分消耗：黄金/铂金/钻石会员按月付费，生成视频按时长与模型扣积分，折算约 ¥0.5–1/秒（参考价），正式价格以官网为准。',
          },
          {
            q: '可灵和即梦哪个划算？',
            a: '参考价两者接近（均可按秒估算），即梦图片生态更强、可灵视频可控项（运镜/首尾帧）更细。建议按你要做的内容类型分别试用免费额度后再决定。',
          },
        ],
      },
    ];
    // 兜底校验：子页引用的数据必须能在 data.ts 找到，防止改名后静默 404 内容
    for (const p of pages) {
      const d = p.data as { aiModel?: string; aiVisual?: string };
      if (d.aiModel && !findLLM(d.aiModel)) throw new Error(`ai-price-compare 子页引用了不存在的模型：${d.aiModel}`);
      if (d.aiVisual && !findVis(d.aiVisual)) throw new Error(`ai-price-compare 子页引用了不存在的视觉产品：${d.aiVisual}`);
    }
    return pages;
  },
});
