import { useState } from 'preact/hooks';

/** 1 USD ≈ 多少 CNY（仅作直观折算，实际以账单为准） */
const RATE = 7.2;

const usd = (n: number) => `$${n.toFixed(2)}`;
const cny = (n: number) => `¥${(n * RATE).toFixed(1)}`;

interface LLM {
  provider: string;
  model: string;
  ctx: string;
  /** 输入价：美元 / 百万 token */
  in: number;
  /** 输出价：美元 / 百万 token，null 表示未公开 */
  out: number | null;
  note?: string;
}

/** 主流大模型 API 单价（USD / 1M tokens），数据更新 2026-08，仅供参考 */
const LLMS: LLM[] = [
  { provider: 'OpenAI', model: 'GPT-4o', ctx: '128K', in: 2.5, out: 10 },
  { provider: 'OpenAI', model: 'GPT-4o mini', ctx: '128K', in: 0.15, out: 0.6 },
  { provider: 'OpenAI', model: 'o3-mini', ctx: '200K', in: 1.1, out: 4.4 },
  { provider: 'OpenAI', model: 'o3', ctx: '200K', in: 10, out: 40 },
  { provider: 'OpenAI', model: 'GPT-5.4', ctx: '~1M', in: 2.5, out: 15, note: '前沿推理' },
  { provider: 'Anthropic', model: 'Claude Sonnet 4.6', ctx: '200K+', in: 3, out: 15 },
  { provider: 'Anthropic', model: 'Claude Opus 4.8', ctx: '1M', in: 5, out: 25 },
  { provider: 'Anthropic', model: 'Claude Haiku 4.5', ctx: '200K', in: 1, out: 5 },
  { provider: 'Google', model: 'Gemini 3.5 Flash', ctx: '1M', in: 1.5, out: 9 },
  { provider: 'Google', model: 'Gemini 3.1 Pro', ctx: '1M', in: 2, out: 12 },
  { provider: 'Google', model: 'Gemini 3.1 Flash-Lite', ctx: '1M', in: 0.25, out: 1.5 },
  { provider: 'DeepSeek', model: 'DeepSeek V4-Flash', ctx: '1M', in: 0.14, out: 0.28, note: '官方国际站' },
  { provider: 'DeepSeek', model: 'DeepSeek V4-Pro', ctx: '128K', in: 0.435, out: 0.87 },
  { provider: '阿里通义', model: 'Qwen-Max', ctx: '1M', in: 2.4, out: 12, note: '官方国际站' },
  { provider: '阿里通义', model: 'Qwen-Plus', ctx: '1M', in: 0.26, out: 0.78 },
  { provider: '智谱', model: 'GLM-4.6', ctx: '1M', in: 0.6, out: 2.2 },
  { provider: '月之暗面', model: 'Kimi K2', ctx: '256K+', in: 0.57, out: 2.3 },
  { provider: '字节豆包', model: 'Doubao 旗舰', ctx: '256K', in: 0.44, out: null, note: '输出价随档位浮动' },
];

interface Vis {
  name: string;
  vendor: string;
  type: string;
  /** 单价描述（已折算人民币 + 美元参考） */
  price: string;
  sub?: string;
  note?: string;
  ref?: boolean;
}

/** 视觉生成工具价格（图片/视频），数据更新 2026-08，参考价 */
const VISUAL: Vis[] = [
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

type SortKey = 'in' | 'out' | 'name';
const PROVIDERS = [...new Set(LLMS.map((m) => m.provider))];

export default function AiPriceCompare() {
  const [tab, setTab] = useState<'llm' | 'visual'>('llm');
  const [active, setActive] = useState<string[]>(PROVIDERS.slice());
  const [sort, setSort] = useState<SortKey>('in');
  const [inTok, setInTok] = useState(1000);
  const [outTok, setOutTok] = useState(500);

  const toggleProvider = (p: string) =>
    setActive((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const rows = LLMS.filter((m) => active.includes(m.provider)).sort((a, b) => {
    if (sort === 'name') return (a.provider + a.model).localeCompare(b.provider + b.model);
    const av = sort === 'in' ? a.in : a.out ?? Infinity;
    const bv = sort === 'in' ? b.in : b.out ?? Infinity;
    return av - bv;
  });

  const calc = LLMS.filter((m) => active.includes(m.provider) && m.out != null)
    .map((m) => {
      const cost = (inTok / 1e6) * m.in + (outTok / 1e6) * (m.out as number);
      return { ...m, cost };
    })
    .sort((a, b) => a.cost - b.cost);

  return (
    <div class="space-y-5">
      <div class="alert alert-info text-xs">
        价格更新于 <b>2026-08</b>，为人工维护的参考快照；大模型与视觉平台调价频繁，正式采购请以各厂商官网公示价为准。人民币按 1 USD ≈ ¥{RATE} 折算。
      </div>

      <div class="join">
        <button class={`btn btn-sm join-item ${tab === 'llm' ? 'btn-primary' : ''}`} onClick={() => setTab('llm')}>
          大模型 Token 价格
        </button>
        <button class={`btn btn-sm join-item ${tab === 'visual' ? 'btn-primary' : ''}`} onClick={() => setTab('visual')}>
          视觉生成价格
        </button>
      </div>

      {tab === 'llm' && (
        <div class="space-y-5">
          <div class="flex flex-wrap gap-2 items-center">
            <span class="text-sm opacity-70">厂商：</span>
            {PROVIDERS.map((p) => (
              <button
                key={p}
                class={`btn btn-xs ${active.includes(p) ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => toggleProvider(p)}
              >
                {p}
              </button>
            ))}
            <select
              class="select select-xs select-bordered ml-auto"
              value={sort}
              onChange={(e) => setSort((e.target as HTMLSelectElement).value as SortKey)}
            >
              <option value="in">按输入价排序</option>
              <option value="out">按输出价排序</option>
              <option value="name">按名称排序</option>
            </select>
          </div>

          <div class="overflow-x-auto">
            <table class="table table-sm table-zebra w-full">
              <thead>
                <tr>
                  <th>厂商</th>
                  <th>模型</th>
                  <th>上下文</th>
                  <th>输入 / 1M</th>
                  <th>输出 / 1M</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr>
                    <td class="whitespace-nowrap">{m.provider}</td>
                    <td class="whitespace-nowrap font-medium">{m.model}</td>
                    <td class="whitespace-nowrap opacity-70">{m.ctx}</td>
                    <td class="whitespace-nowrap">
                      <div>{usd(m.in)}</div>
                      <div class="text-xs opacity-60">{cny(m.in)}</div>
                    </td>
                    <td class="whitespace-nowrap">
                      {m.out == null ? (
                        <span class="opacity-50">—</span>
                      ) : (
                        <>
                          <div>{usd(m.out)}</div>
                          <div class="text-xs opacity-60">{cny(m.out)}</div>
                        </>
                      )}
                    </td>
                    <td class="text-xs opacity-60">{m.note ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div class="card bg-base-200 p-4 space-y-3">
            <div class="font-medium">💡 场景成本估算</div>
            <div class="flex flex-wrap gap-3 items-end">
              <label class="form-control w-32">
                <span class="label-text text-xs">输入 token 数</span>
                <input
                  type="number"
                  class="input input-sm input-bordered"
                  value={inTok}
                  onInput={(e) => setInTok(Math.max(0, +(e.target as HTMLInputElement).value || 0))}
                />
              </label>
              <label class="form-control w-32">
                <span class="label-text text-xs">输出 token 数</span>
                <input
                  type="number"
                  class="input input-sm input-bordered"
                  value={outTok}
                  onInput={(e) => setOutTok(Math.max(0, +(e.target as HTMLInputElement).value || 0))}
                />
              </label>
              <span class="text-xs opacity-60">按当前筛选厂商，从便宜到贵排序（仅含已公开输出价的模型）</span>
            </div>
            <div class="overflow-x-auto max-h-72">
              <table class="table table-sm w-full">
                <thead>
                  <tr>
                    <th>模型</th>
                    <th>本次成本 (USD)</th>
                    <th>约 (CNY)</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.map((m) => (
                    <tr>
                      <td class="whitespace-nowrap">
                        <span class="opacity-60">{m.provider} </span>
                        <span class="font-medium">{m.model}</span>
                      </td>
                      <td class="whitespace-nowrap">{usd(m.cost)}</td>
                      <td class="whitespace-nowrap opacity-70">{cny(m.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'visual' && (
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VISUAL.map((v) => (
            <div class="card bg-base-200 p-4 space-y-1">
              <div class="flex items-center justify-between">
                <div class="font-medium">
                  {v.name} <span class="text-xs opacity-60">· {v.vendor}</span>
                </div>
                {v.ref && <span class="badge badge-ghost badge-xs">参考价</span>}
              </div>
              <div class="text-sm">{v.type}</div>
              <div class="text-sm font-medium">{v.price}</div>
              {v.sub && <div class="text-xs opacity-70">{v.sub}</div>}
              {v.note && <div class="text-xs opacity-60">{v.note}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
