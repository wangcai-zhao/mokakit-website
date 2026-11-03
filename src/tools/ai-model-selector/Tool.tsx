import { useMemo, useState } from 'preact/hooks';
import {
  CONSTRAINTS,
  DIMS,
  MODELS,
  SNAPSHOT,
  TASKS,
  TASK_BY_ID,
  TASK_GROUPS,
  type DimId,
  type Model,
} from './data';
import {
  REF_RATE,
  constraintList,
  costScore,
  defaultConstraints,
  estimateCost,
  filterReason,
  fmtScore,
  fullScores,
  parseNeed,
  recommend,
  taskFocus,
  verdictText,
  type Ranked,
} from './logic';

export interface AiModelSelectorProps {
  /** 子页预填：打开即选中该场景 */
  initialTask?: string;
  /** 子页预填：额外勾选一个约束 */
  initialConstraint?: string;
}

const CN = (n: number) => `¥${Math.round(n).toLocaleString('zh-CN')}`;
const USD = (n: number) => `$${n < 1 ? n.toFixed(3) : n.toFixed(1)}`;

/** 用量档位：三种典型规模，一键填入 */
const USAGE_PRESETS = [
  { id: 'light', label: '个人轻量', desc: '50 次/日', calls: 50, inTok: 2000, outTok: 800 },
  { id: 'team', label: '小团队', desc: '500 次/日', calls: 500, inTok: 4000, outTok: 1500 },
  { id: 'product', label: '线上产品', desc: '5000 次/日', calls: 5000, inTok: 8000, outTok: 2000 },
];

/** 快速开始：一句话点出典型组合，省得在 18 个场景里找 */
const PRESETS = [
  { label: '写代码 / 改 bug', task: 'code', constraints: [] as string[] },
  { label: '中文客服机器人', task: 'customer', constraints: ['budget', 'lowLatency'] },
  { label: '几十万字合同审阅', task: 'legal', constraints: ['ultraLong'] },
  { label: '公司内网私有化知识库', task: 'rag', constraints: ['privacy', 'cnDirect'] },
];

/** 每个约束会排除多少个模型，让用户点之前先知道代价 */
const EXCLUDE_COUNT = new Map(
  CONSTRAINTS.map((c) => [c.id, MODELS.filter((m) => filterReason(m, c)).length]),
);

export default function AiModelSelector({ initialTask, initialConstraint }: AiModelSelectorProps) {
  const [step, setStep] = useState(initialTask ? 2 : 0);
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(Boolean(initialTask));
  const [taskId, setTaskId] = useState(initialTask && TASK_BY_ID.has(initialTask) ? initialTask : '');
  const [constraints, setConstraints] = useState<string[]>(
    initialTask ? [...new Set([...defaultConstraints(initialTask), ...(initialConstraint ? [initialConstraint] : [])])] : [],
  );
  const [usageOn, setUsageOn] = useState(true);
  const [calls, setCalls] = useState(500);
  const [inTok, setInTok] = useState(4000);
  const [outTok, setOutTok] = useState(1500);
  const [compare, setCompare] = useState<string[]>([]);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseNeed(text), [text]);

  // 没手动选过场景时，让文字解析结果实时生效——用户打字就能看到下方自动预选
  const effectiveTask = touched ? taskId : (parsed.taskId ?? taskId);
  const effectiveConstraints = useMemo(() => {
    if (touched) return constraints;
    const t = parsed.taskId ?? taskId;
    return [...new Set([...parsed.constraints, ...(t ? defaultConstraints(t) : [])])];
  }, [touched, constraints, parsed, taskId]);

  const task = effectiveTask ? TASK_BY_ID.get(effectiveTask) : undefined;
  const res = useMemo(
    () => (effectiveTask ? recommend(effectiveTask, effectiveConstraints) : null),
    [effectiveTask, effectiveConstraints.join('|')],
  );

  // 默认对比对象：首选 + 备选 + 省钱替代；约束太紧导致不足两个时，
  // 用榜单上紧随其后的模型补齐，保证对比区始终有东西可看。
  const compareNames = useMemo(() => {
    if (compare.length) return compare;
    if (!res) return [];
    const base = [res.top, res.runnerUp, res.budgetPick].filter((r): r is Ranked => Boolean(r)).map((r) => r.model.name);
    for (const r of res.included) {
      if (base.length >= 3) break;
      if (!base.includes(r.model.name)) base.push(r.model.name);
    }
    return base;
  }, [compare.join('|'), res]);
  const compareModels = useMemo(
    () => compareNames.map((n) => MODELS.find((m) => m.name === n)).filter((m): m is Model => Boolean(m)),
    [compareNames.join('|')],
  );

  function pickTask(id: string) {
    setTouched(true);
    setTaskId(id);
    setConstraints([...new Set([...parsed.constraints, ...defaultConstraints(id)])]);
  }

  function pickPreset(p: (typeof PRESETS)[number]) {
    setTouched(true);
    setTaskId(p.task);
    setConstraints([...new Set([...p.constraints, ...defaultConstraints(p.task)])]);
    setStep(2);
  }

  function toggleConstraint(id: string) {
    const base = touched ? constraints : effectiveConstraints;
    setTouched(true);
    setConstraints(base.includes(id) ? base.filter((x) => x !== id) : [...base, id]);
  }

  function toggleCompare(name: string) {
    const base = compare.length ? compare : compareNames;
    setCompare(base.includes(name) ? base.filter((x) => x !== name) : base.length >= 3 ? [...base.slice(1), name] : [...base, name]);
  }

  async function copyVerdict() {
    if (!res?.top || !task) return;
    const txt = verdictText(res, task, usageOn ? { calls, inTok, outTok } : undefined);
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const excludedByConstraints = res?.excluded.length ?? 0;

  return (
    <div class="space-y-5">
      <div class="alert alert-info text-xs leading-relaxed">
        <span>
          18 个主流模型 × 11 项能力 × {TASKS.length} 类场景，全部在你的浏览器里算，不联网、不上传。
          价格与能力为 <b>{SNAPSHOT}</b> 人工快照，正式采购以厂商官网为准。
        </span>
      </div>

      {/* 步骤条 */}
      <div class="flex items-center gap-1 text-xs">
        {[
          { i: 0, label: '说需求' },
          { i: 1, label: '加约束' },
          { i: 2, label: '看推荐' },
        ].map((s, idx) => (
          <div class="flex items-center gap-1 flex-1 last:flex-none">
            <button
              class={`btn btn-xs gap-1.5 ${step === s.i ? 'btn-primary' : step > s.i ? 'btn-ghost' : 'btn-ghost opacity-50'}`}
              onClick={() => setStep(s.i)}
              disabled={s.i === 2 && !effectiveTask}
            >
              <span
                class={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  step >= s.i ? 'bg-primary text-primary-content' : 'bg-base-300'
                }`}
              >
                {step > s.i ? '✓' : s.i + 1}
              </span>
              {s.label}
            </button>
            {idx < 2 && <div class={`h-px flex-1 ${step > s.i ? 'bg-primary' : 'bg-base-300'}`} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="text-sm font-medium">用一句话说说你要做什么</div>
            <textarea
              class="textarea textarea-bordered w-full h-20 text-sm"
              placeholder="例：给公司做个中文客服机器人，每天大概 2 万次对话，预算有限，要能接企业微信"
              value={text}
              onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            />
            <div class="text-[11px] opacity-60">
              不用写得很规范，能提到「做什么 + 给谁用 + 有什么限制」就够；识别在本地做，不会上传。
            </div>
          </div>

          {text.trim().length > 0 && (
            <div class={`rounded-box border p-3 space-y-2 ${parsed.hits.length ? 'border-primary/40 bg-primary/5' : 'border-base-300'}`}>
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="font-medium">我理解到：</span>
                {task ? (
                  <span class="badge badge-sm badge-primary">{task.label}</span>
                ) : (
                  <span class="opacity-60">还没认出场景，建议补充「做什么」</span>
                )}
                {effectiveConstraints.map((id) => {
                  const c = CONSTRAINTS.find((x) => x.id === id);
                  return c ? (
                    <span class="badge badge-sm badge-outline">{c.label}</span>
                  ) : null;
                })}
                <span class="ml-auto opacity-50">置信度 {Math.round(parsed.confidence * 100)}%</span>
              </div>
              {parsed.hits.length > 0 && (
                <div class="flex flex-wrap gap-1 text-[11px] opacity-60">
                  命中词：
                  {parsed.hits.slice(0, 8).map((h) => (
                    <span class="badge badge-ghost badge-xs">{h}</span>
                  ))}
                </div>
              )}
              {touched && parsed.taskId && parsed.taskId !== taskId && (
                <button class="btn btn-xs btn-outline" onClick={() => pickTask(parsed.taskId!)}>
                  改用识别结果「{TASK_BY_ID.get(parsed.taskId)?.label}」
                </button>
              )}
            </div>
          )}

          <div class="space-y-2">
            <div class="text-sm font-medium">或者直接选场景</div>
            <div class="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button class="btn btn-xs btn-outline" onClick={() => pickPreset(p)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div class="space-y-3">
            {TASK_GROUPS.map((g) => (
              <div class="space-y-1.5">
                <div class="flex items-baseline gap-2">
                  <span class="text-xs font-medium">{g.label}</span>
                  <span class="text-[11px] opacity-50">{g.hint}</span>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  {TASKS.filter((t) => t.group === g.id).map((t) => (
                    <button
                      class={`btn btn-xs ${effectiveTask === t.id ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
                      onClick={() => pickTask(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {task && (
            <div class="card bg-base-200 p-3 space-y-1">
              <div class="text-xs font-medium">这个场景难在哪</div>
              <div class="text-xs opacity-70 leading-relaxed">{task.pain}</div>
              <div class="text-[11px] opacity-60">选型要点：{task.advice}</div>
            </div>
          )}

          <div class="flex justify-end">
            <button class="btn btn-sm btn-primary" disabled={!effectiveTask} onClick={() => setStep(1)}>
              下一步：加约束（可选）
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div class="space-y-4">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium">有什么硬性要求？</span>
            <span class="text-[11px] opacity-60">不选也能直接看推荐；带「排除」的会硬过滤</span>
            {effectiveConstraints.length > 0 && (
              <button class="btn btn-xs btn-ghost ml-auto" onClick={() => (setTouched(true), setConstraints([]))}>
                全部清空
              </button>
            )}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {constraintList().map((c) => {
              const on = effectiveConstraints.includes(c.id);
              const n = EXCLUDE_COUNT.get(c.id) ?? 0;
              return (
                <button
                  class={`text-left rounded-box border p-2.5 transition-colors ${
                    on ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/40'
                  }`}
                  onClick={() => toggleConstraint(c.id)}
                >
                  <div class="flex items-center gap-2">
                    <span class={`inline-block h-3 w-3 rounded-sm border ${on ? 'bg-primary border-primary' : 'border-base-content/30'}`} />
                    <span class="text-xs font-medium">{c.label}</span>
                    {n > 0 && <span class="ml-auto text-[10px] opacity-50">排除 {n} 个</span>}
                    {n === 0 && <span class="ml-auto text-[10px] opacity-50">全部通过</span>}
                  </div>
                  <div class="text-[11px] opacity-60 mt-1 leading-relaxed">{c.hint}</div>
                </button>
              );
            })}
          </div>

          <div class="card bg-base-200 p-3 space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                class="checkbox checkbox-xs"
                checked={usageOn}
                onChange={(e) => setUsageOn((e.target as HTMLInputElement).checked)}
              />
              <span class="text-xs font-medium">按我的用量估算月成本</span>
            </label>
            {usageOn && (
              <>
                <div class="flex flex-wrap gap-1.5">
                  {USAGE_PRESETS.map((u) => (
                    <button
                      class={`btn btn-xs ${calls === u.calls ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
                      onClick={() => {
                        setCalls(u.calls);
                        setInTok(u.inTok);
                        setOutTok(u.outTok);
                      }}
                    >
                      {u.label} · {u.desc}
                    </button>
                  ))}
                </div>
                <div class="flex flex-wrap gap-2 items-end">
                  <label class="text-[11px] opacity-70">
                    <div>每日调用次数</div>
                    <input
                      type="number"
                      min="0"
                      class="input input-xs input-bordered w-24 mt-0.5"
                      value={calls}
                      onInput={(e) => setCalls(Math.max(0, Number((e.target as HTMLInputElement).value) || 0))}
                    />
                  </label>
                  <label class="text-[11px] opacity-70">
                    <div>平均输入 token</div>
                    <input
                      type="number"
                      min="0"
                      class="input input-xs input-bordered w-28 mt-0.5"
                      value={inTok}
                      onInput={(e) => setInTok(Math.max(0, Number((e.target as HTMLInputElement).value) || 0))}
                    />
                  </label>
                  <label class="text-[11px] opacity-70">
                    <div>平均输出 token</div>
                    <input
                      type="number"
                      min="0"
                      class="input input-xs input-bordered w-28 mt-0.5"
                      value={outTok}
                      onInput={(e) => setOutTok(Math.max(0, Number((e.target as HTMLInputElement).value) || 0))}
                    />
                  </label>
                  <span class="text-[11px] opacity-50 pb-1">按 30 天、1 USD ≈ ¥{REF_RATE} 估算</span>
                </div>
              </>
            )}
          </div>

          <div class="flex justify-between">
            <button class="btn btn-sm btn-ghost" onClick={() => setStep(0)}>
              返回改场景
            </button>
            <button class="btn btn-sm btn-primary" onClick={() => setStep(2)}>
              看推荐{excludedByConstraints > 0 ? `（已排除 ${excludedByConstraints} 个）` : ''}
            </button>
          </div>
        </div>
      )}

      {step === 2 && res && task && (
        <div class="space-y-4">
          {/* 条件摘要 */}
          <div class="flex flex-wrap items-center gap-1.5 text-xs">
            <span class="badge badge-primary badge-sm">{task.label}</span>
            {taskFocus(task.id).map((f) => (
              <span class="badge badge-ghost badge-sm">
                {f.label} {f.pct}%
              </span>
            ))}
            {effectiveConstraints.map((id) => {
              const c = CONSTRAINTS.find((x) => x.id === id);
              return c ? <span class="badge badge-outline badge-sm">{c.label}</span> : null;
            })}
            <button class="btn btn-xs btn-ghost ml-auto" onClick={() => setStep(0)}>
              改条件
            </button>
          </div>

          {res.top ? (
            <TopCard
              top={res.top}
              task={task}
              cost={usageOn ? estimateCost(res.top.model, calls, inTok, outTok) : null}
            />
          ) : (
            <div class="alert alert-warning text-sm">当前约束把所有模型都排除了，试着放宽一条硬性要求。</div>
          )}

          {res.top && (res.runnerUp || res.budgetPick) && (
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {res.runnerUp && <SideCard title="换一家供应商的备选" ranked={res.runnerUp} why="避免单一依赖，接口/合规兜底" />}
              {res.budgetPick && <SideCard title="省钱替代" ranked={res.budgetPick} why="匹配度接近但单价更低" />}
            </div>
          )}

          {/* 完整榜单 */}
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium">
                匹配榜 · 前 {Math.min(10, res.included.length)} / 共 {res.included.length} 个
              </div>
              <div class="text-[11px] opacity-50">点开看评分拆解，勾选做对比（最多 3 个）</div>
            </div>
            <div class="space-y-1.5">
              {res.included.slice(0, 10).map((r, i) => (
                <RankRow
                  key={r.model.name}
                  rank={i + 1}
                  r={r}
                  cost={usageOn ? estimateCost(r.model, calls, inTok, outTok) : null}
                  checked={compareNames.includes(r.model.name)}
                  open={openRow === r.model.name}
                  onToggleOpen={() => setOpenRow(openRow === r.model.name ? null : r.model.name)}
                  onToggleCompare={() => toggleCompare(r.model.name)}
                />
              ))}
            </div>
          </div>

          {/* 对比 */}
          {compareModels.length >= 2 && <ComparePanel models={compareModels} onRemove={toggleCompare} />}

          {/* 排除项 */}
          {res.excluded.length > 0 && (
            <details class="collapse collapse-arrow bg-base-200">
              <summary class="collapse-title text-xs font-medium py-2 min-h-0">
                {res.excluded.length} 个模型被硬性条件排除，点开看原因
              </summary>
              <div class="collapse-content space-y-1 text-[11px]">
                {res.excluded.map((r) => (
                  <div class="flex items-start gap-2 py-0.5">
                    <span class="whitespace-nowrap opacity-70">
                      {r.model.provider} {r.model.name}
                    </span>
                    <span class="opacity-50">·</span>
                    <span class="opacity-60">{r.excludeReason}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          <div class="flex flex-wrap items-center gap-2">
            <button class="btn btn-sm btn-primary" onClick={copyVerdict}>
              {copied ? '已复制 ✓' : '复制推荐结论'}
            </button>
            <button class="btn btn-sm btn-ghost" onClick={() => setStep(1)}>
              调整约束
            </button>
            <span class="text-[11px] opacity-50">结论含首选/备选/理由/月成本，可直接贴进选型文档</span>
          </div>

          <p class="text-[11px] opacity-55 leading-relaxed">
            评分为人工维护的能力口径（0-10）经场景权重加权得出，只用于同类比较，不代表跑分或真实业务效果；
            价格为 {SNAPSHOT} 快照，与「AI 价格比价」同源。最终务必用你自己的 50-100 条真实样本做压测再定。
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ 子组件 */

function FitRing({ fit, size = 68 }: { fit: number; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <div class="relative shrink-0" style={{ width: `${size}px`, height: `${size}px` }}>
      <svg viewBox={`0 0 ${size} ${size}`} class="w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" stroke-width="5" class="opacity-15" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          stroke-width="5"
          stroke-linecap="round"
          stroke-dasharray={`${(fit / 100) * c} ${c}`}
          class="text-primary"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span class="text-base font-semibold">{fit}</span>
        <span class="text-[9px] opacity-50 mt-0.5">匹配度</span>
      </div>
    </div>
  );
}

function TopCard({ top, task, cost }: { top: Ranked; task: { label: string; advice: string }; cost: ReturnType<typeof estimateCost> }) {
  const m = top.model;
  return (
    <div class="card border-2 border-primary/40 bg-base-100 p-4 space-y-3 shadow-sm">
      <div class="flex items-start gap-3">
        <FitRing fit={top.fit} />
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="badge badge-primary badge-sm">首选</span>
            <span class="text-base font-semibold">{m.name}</span>
            <span class="text-xs opacity-50">{m.provider}</span>
            {m.tags.slice(0, 3).map((t) => (
              <span class="badge badge-ghost badge-xs">{t}</span>
            ))}
          </div>
          <div class="text-xs opacity-70 mt-0.5">{m.positioning}</div>
          <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] opacity-60 mt-1">
            <span>上下文 {m.price?.ctx ?? '—'}</span>
            {m.price && <span>输入 ${m.price.in}/M · 输出 {m.price.out == null ? '未公开' : `$${m.price.out}/M`}</span>}
            <span>{m.region === 'cn' ? '国内直连' : '境外服务'}</span>
            <span>{m.openWeights ? '开放权重可自建' : '闭源 API'}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div class="rounded-box bg-success/10 p-2.5 space-y-1">
          <div class="text-[11px] font-medium text-success">为什么是它</div>
          <ul class="text-[11px] space-y-0.5 opacity-80">
            {top.reasons.map((r) => (
              <li class="flex gap-1">
                <span class="text-success">✓</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div class={`rounded-box p-2.5 space-y-1 ${top.tradeoffs.length ? 'bg-warning/10' : 'bg-base-200'}`}>
          <div class="text-[11px] font-medium">{top.tradeoffs.length ? '要接受的代价' : '没有明显短板'}</div>
          <ul class="text-[11px] space-y-0.5 opacity-80">
            {top.tradeoffs.length ? (
              top.tradeoffs.map((r) => (
                <li class="flex gap-1">
                  <span class="opacity-60">!</span>
                  <span>{r}</span>
                </li>
              ))
            ) : (
              <li>在你选的维度上都在 6 分以上</li>
            )}
          </ul>
        </div>
      </div>

      {top.warnings.length > 0 && (
        <div class="text-[11px] text-warning-content bg-warning/15 rounded-box px-2.5 py-1.5 space-y-0.5">
          {top.warnings.map((w) => (
            <div>⚠ {w}</div>
          ))}
        </div>
      )}

      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span class="opacity-70">选型要点：{task.advice}</span>
        {cost && (
          <span class="badge badge-sm badge-outline">
            月成本 ≈ {USD(cost.usd)} / {CN(cost.cny)}
          </span>
        )}
      </div>
    </div>
  );
}

function SideCard({ title, ranked, why }: { title: string; ranked: Ranked; why: string }) {
  return (
    <div class="card bg-base-200 p-3 space-y-1">
      <div class="flex items-center gap-2">
        <span class="text-[11px] opacity-60">{title}</span>
        <span class="ml-auto text-[11px] opacity-60">{ranked.fit} 分</span>
      </div>
      <div class="text-sm font-medium">
        {ranked.model.name} <span class="text-[11px] opacity-50">{ranked.model.provider}</span>
      </div>
      <div class="text-[11px] opacity-60">{why}</div>
      <div class="text-[11px] opacity-70 leading-relaxed">{ranked.reasons[0]}</div>
    </div>
  );
}

function RankRow({
  rank,
  r,
  cost,
  checked,
  open,
  onToggleOpen,
  onToggleCompare,
}: {
  rank: number;
  r: Ranked;
  cost: ReturnType<typeof estimateCost>;
  checked: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onToggleCompare: () => void;
}) {
  const m = r.model;
  return (
    <div class={`rounded-box border ${checked ? 'border-primary/50' : 'border-base-300'} ${rank === 1 ? 'bg-primary/5' : 'bg-base-100'}`}>
      <div class="flex items-center gap-2 p-2">
        <span class="text-[11px] opacity-40 w-4 text-right">{rank}</span>
        <label class="flex items-center" title="加入对比">
          <input type="checkbox" class="checkbox checkbox-xs" checked={checked} onChange={onToggleCompare} />
        </label>
        <button class="flex-1 text-left min-w-0" onClick={onToggleOpen}>
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-medium truncate">{m.name}</span>
            <span class="text-[10px] opacity-40 shrink-0">{m.provider}</span>
          </div>
          <div class="flex items-center gap-1.5 mt-0.5">
            <div class="h-1 flex-1 rounded-full bg-base-300 overflow-hidden">
              <div class="h-full bg-primary" style={{ width: `${r.fit}%` }} />
            </div>
            <span class="text-[10px] opacity-60 shrink-0 w-8">{r.fit}</span>
          </div>
        </button>
        <div class="text-right shrink-0 hidden sm:block">
          {m.price ? (
            <>
              <div class="text-[10px] opacity-60">${m.price.in} / ${m.price.out ?? '—'}</div>
              <div class="text-[10px] opacity-40">每百万 token</div>
            </>
          ) : (
            <div class="text-[10px] opacity-40">价格未收录</div>
          )}
        </div>
        {cost && <div class="text-[10px] opacity-60 shrink-0 w-16 text-right">{CN(cost.cny)}/月</div>}
        <button class="btn btn-xs btn-ghost px-1" onClick={onToggleOpen}>
          {open ? '收起' : '拆解'}
        </button>
      </div>

      {open && (
        <div class="px-3 pb-2.5 space-y-2 border-t border-base-300 pt-2">
          <div class="text-[11px] opacity-60">{m.positioning}</div>
          <div class="space-y-1">
            {r.contributions.slice(0, 6).map((c) => (
              <div class="flex items-center gap-2">
                <span class="text-[10px] w-12 shrink-0 opacity-60 truncate" title={c.label}>
                  {c.short}
                </span>
                <div class="h-1.5 flex-1 rounded-full bg-base-300 overflow-hidden min-w-8">
                  <div class={`h-full ${c.score >= 8 ? 'bg-success' : c.score >= 6 ? 'bg-primary' : 'bg-warning'}`} style={{ width: `${c.score * 10}%` }} />
                </div>
                <span class="text-[10px] w-9 shrink-0 text-right">{fmtScore(c.score)}/10</span>
                <span class="text-[10px] w-28 shrink-0 whitespace-nowrap opacity-50">
                  权重 {Math.round(c.weight * 100)}% · 贡献 {Math.round(c.share * 100)}%
                </span>
              </div>
            ))}
          </div>
          {r.tradeoffs.length > 0 && <div class="text-[11px] opacity-60">代价：{r.tradeoffs.join('；')}</div>}
          <div class="flex flex-wrap gap-1">
            {m.strengths.map((s) => (
              <span class="badge badge-ghost badge-xs">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const RADAR_AXES: { id: DimId; label: string }[] = [
  { id: 'coding', label: '代码' },
  { id: 'reasoning', label: '推理' },
  { id: 'chinese', label: '中文' },
  { id: 'longCtx', label: '长文' },
  { id: 'vision', label: '视觉' },
  { id: 'cost', label: '性价比' },
];

const COLORS = ['#2563eb', '#db2777', '#059669'];

function ComparePanel({ models, onRemove }: { models: Model[]; onRemove: (name: string) => void }) {
  return (
    <div class="card bg-base-200 p-3 space-y-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">横向对比</span>
        <span class="text-[11px] opacity-50">最多 3 个，勾选榜单上的复选框切换</span>
      </div>

      <div class="flex flex-wrap gap-1.5">
        {models.map((m, i) => (
          <span class="badge badge-sm gap-1" style={{ borderColor: COLORS[i], color: COLORS[i] }}>
            <span class="inline-block h-1.5 w-1.5 rounded-full" style={{ background: COLORS[i] }} />
            {m.name}
            <button class="opacity-60 hover:opacity-100" onClick={() => onRemove(m.name)}>
              ×
            </button>
          </span>
        ))}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-3 items-start">
        <Radar models={models} />
        <div class="overflow-x-auto">
          <table class="table table-xs w-full">
            <thead>
              <tr>
                <th class="whitespace-nowrap">维度</th>
                {models.map((m, i) => (
                  <th class="whitespace-nowrap" style={{ color: COLORS[i] }}>
                    {m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIMS.map((d) => {
                const vals = models.map((m) => fullScores(m)[d.id]);
                const max = Math.max(...vals);
                return (
                  <tr>
                    <td class="whitespace-nowrap opacity-70">{d.label}</td>
                    {models.map((_, i) => (
                      <td class={vals[i] === max ? 'font-semibold' : 'opacity-70'}>
                        {fmtScore(vals[i])}
                        {vals[i] === max && max > 0 && <span class="text-[9px] opacity-50 ml-0.5">最高</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr>
                <td class="whitespace-nowrap opacity-70">上下文</td>
                {models.map((m) => (
                  <td class="opacity-70">{m.price?.ctx ?? '—'}</td>
                ))}
              </tr>
              <tr>
                <td class="whitespace-nowrap opacity-70">单价（输入/输出）</td>
                {models.map((m) => (
                  <td class="opacity-70 whitespace-nowrap">
                    {m.price ? `$${m.price.in} / ${m.price.out ?? '—'}` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td class="whitespace-nowrap opacity-70">部署</td>
                {models.map((m) => (
                  <td class="opacity-70 whitespace-nowrap">
                    {m.openWeights ? '开放权重' : '仅 API'} · {m.region === 'cn' ? '国内' : '境外'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {models.map((m, i) => (
          <div class="rounded-box bg-base-100 p-2 space-y-1">
            <div class="text-[11px] font-medium" style={{ color: COLORS[i] }}>
              {m.name}
            </div>            <div class="text-[11px] opacity-70">适合：{m.strengths[0]}</div>
            <div class="text-[11px] opacity-60">注意：{m.cautions[0]}</div>
            <div class="text-[10px] opacity-40">成本友好度 {fmtScore(costScore(m))}/10</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Radar({ models }: { models: Model[] }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 72;
  const n = RADAR_AXES.length;
  const point = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const rr = (v / 10) * r;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)] as const;
  };
  const ring = (k: number) =>
    RADAR_AXES.map((_, i) => point(i, 10 * k).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} class="w-full max-w-[220px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon points={ring(k)} fill="none" stroke="currentColor" stroke-width="0.5" class="opacity-15" />
      ))}
      {RADAR_AXES.map((a, i) => {
        const [x, y] = point(i, 10);
        const [lx, ly] = point(i, 11.9);
        return (
          <g key={a.id}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" stroke-width="0.5" class="opacity-15" />
            <text
              x={lx}
              y={ly}
              text-anchor={lx > cx + 4 ? 'start' : lx < cx - 4 ? 'end' : 'middle'}
              dominant-baseline="middle"
              font-size="8"
              class="fill-current opacity-60"
            >
              {a.label}
            </text>
          </g>
        );
      })}
      {models.map((m, mi) => {
        const s = fullScores(m);
        const pts = RADAR_AXES.map((a, i) => point(i, s[a.id]).join(',')).join(' ');
        return (
          <g key={m.name}>
            <polygon points={pts} fill={COLORS[mi]} fill-opacity="0.12" stroke={COLORS[mi]} stroke-width="1.5" />
            {RADAR_AXES.map((a, i) => {
              const [x, y] = point(i, s[a.id]);
              return <circle cx={x} cy={y} r="1.8" fill={COLORS[mi]} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}
