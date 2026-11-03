import { defineTool } from '@/tools/types';
import { SNAPSHOT, TASKS } from './data';
import { TASK_PAGES } from './seo';

export default defineTool({
  id: 'ai-model-selector',
  name: '场景选模型助手',
  seoTitle: 'AI 模型怎么选？按场景推荐大模型（18 个模型对比）',
  tagline: '说一句需求，算出该用哪个模型',
  description:
    '免费在线 AI 模型选型助手：用一句话描述需求，或直接选 18 类场景（写代码、客服、长文摘要、合同审阅、识图、批量打标），再叠加预算、私有化、长上下文、稳定 JSON 等 9 项约束，从 18 个主流大模型里算出匹配度排名，并给出推荐理由、代价提示、月成本估算与横向对比。全程本地计算，不上传内容。',
  keywords: ['AI模型推荐', '大模型选型', 'LLM 对比', '模型选择', 'AI 模型怎么选'],
  category: 'ai',
  tags: ['ai', '模型', '选型', '大模型', '对比', '场景'],
  icon: 'git-compare',
  status: 'stable',
  hydrate: 'idle',
  createdAt: '2026-10-11',
  updatedAt: '2026-11-03',
  priority: 7,
  related: ['ai-price-compare', 'token-counter', 'context-window-calculator', 'prompt-template', 'rag-prompt-builder'],
  /**
   * 18 个场景各一条长尾子页：/tools/ai-model-selector/<slug>/
   *
   * 母页抢的是「AI 模型怎么选」这种大词，很难排上去；子页抢的是
   * 「写代码用哪个 AI 模型」「客服机器人用哪个模型」这类具体问句，
   * 竞争小、意图明确。文案按 TASKS 顺序输出，缺一条会在
   * scripts/test-ai-model-select.mjs 里报错。
   */
  subpages: () =>
    TASKS.map((t) => {
      const page = TASK_PAGES[t.id];
      return {
        slug: page.slug,
        title: page.title,
        seoTitle: page.seoTitle,
        description: page.description,
        data: { taskId: t.id },
        faq: page.faq,
      };
    }),
  faq: [
    {
      q: '推荐依据是什么？准吗？',
      a: '把场景拆成权重（如「中文客服」里中文 24%、速度 20%、成本 20%），再用人工维护的能力评分加权算出匹配度。它是选型的起点和排除法，不是跑分；最终请用你自己的 50-100 条真实样本压测。',
    },
    {
      q: '为什么第一名常常是便宜模型？',
      a: '因为便宜模型在中文、长上下文、成本三项上确实能打。若你更看重写作质感或严谨推理，勾选「准确率优先」或换到「合同审阅」这类场景，权重会自然把旗舰模型顶上来。',
    },
    {
      q: '数据和价格从哪来？多久更新？',
      a: `能力评分为人工维护的口径，价格与「AI 价格比价」共用同一份快照（当前 ${SNAPSHOT}）。大模型调价与发版频繁，正式采购请以厂商官网公示价为准。`,
    },
    {
      q: '想私有化部署，还能用这个工具吗？',
      a: '勾选「要私有化 / 数据不出内网」，只会保留开放权重、可本地部署的模型，并列出被排除的闭源模型及原因。',
    },
    {
      q: '支持多模型对比吗？',
      a: '支持。在榜单上勾选最多 3 个模型，会生成 11 项能力对照表、雷达图和部署方式差异；默认已带上首选、备选与省钱替代。',
    },
  ],
});
