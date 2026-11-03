/**
 * 场景选模型助手 · 算法层
 *
 * 纯函数，不碰 DOM、不依赖框架，可被 Node 直接 import 做回归测试
 * （scripts/test-ai-model-select.mjs）。
 *
 * 打分思路（可解释优先，而不是追求玄学精度）：
 *   1) 场景给每个能力维度一个权重（和 = 1），回答「这类任务到底看重什么」；
 *   2) 约束要么硬过滤（不满足直接出局并写明原因），要么给权重加成；
 *   3) 匹配度 = Σ(权重 × 能力分) / Σ权重，换算成 0-100；
 *   4) 同时产出「加分项」「风险项」「排除原因」，让用户看得懂为什么。
 */

import {
  CONSTRAINTS,
  CONSTRAINT_BY_ID,
  DIM_BY_ID,
  DIMS,
  LEXICON,
  MODELS,
  TASK_BY_ID,
  TASKS,
  type ConstraintDef,
  type DimId,
  type Model,
  type TaskDef,
} from './data';

/** 参考汇率：只用于展示人民币估算，可在页面上调整 */
export const REF_RATE = 7.2;

export type DimScores = Record<DimId, number>;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * 成本友好度：由单价对数映射到 0-10，越便宜分越高。
 * 用混合价（输入占 7.5 成）而不是单看输入，避免「输入便宜输出贵」的模型被高估。
 */
export function costScore(m: Model): number {
  if (!m.price) return 5;
  const out = m.price.out ?? m.price.in * 2.5;
  const blended = m.price.in * 0.75 + out * 0.25;
  const s = 10 - 2.6 * Math.log10(blended / 0.05);
  return round1(clamp(s, 1, 10));
}

/** 补上两个派生维度（cost / private），得到完整的 11 维评分 */
export function fullScores(m: Model): DimScores {
  return { ...m.scores, cost: costScore(m), private: m.privateScore };
}

export interface DimContribution {
  id: DimId;
  label: string;
  short: string;
  score: number;
  /** 归一化后的权重（0-1） */
  weight: number;
  /** 对总分的贡献占比（0-1） */
  share: number;
}

export interface Ranked {
  model: Model;
  /** 0-100 匹配度 */
  fit: number;
  /** 0-10 原始加权分 */
  raw: number;
  contributions: DimContribution[];
  /** 为什么推荐：按贡献排序的前三条 */
  reasons: string[];
  /** 风险提示：权重大但得分低的维度 */
  tradeoffs: string[];
  /** 约束带来的额外提醒（如成本偏高） */
  warnings: string[];
  excluded: boolean;
  excludeReason?: string;
}

export interface RecommendResult {
  ranked: Ranked[];
  included: Ranked[];
  excluded: Ranked[];
  top?: Ranked;
  /** 与首选不同厂商的最高分备选（避免单一依赖） */
  runnerUp?: Ranked;
  /** 分数相近但更便宜的替代 */
  budgetPick?: Ranked;
  weights: DimScores;
}

/** 合成权重：场景基础权重 + 约束加成，负加成钳到 0 后归一化 */
export function buildWeights(taskId: string, constraintIds: string[]): DimScores {
  const task = TASK_BY_ID.get(taskId) ?? TASKS[0];
  const w: DimScores = {
    coding: 0,
    reasoning: 0,
    writing: 0,
    chinese: 0,
    longCtx: 0,
    vision: 0,
    toolUse: 0,
    structured: 0,
    speed: 0,
    cost: 0,
    private: 0,
  };
  for (const [dim, v] of Object.entries(task.weights)) {
    w[dim as DimId] = v ?? 0;
  }
  for (const id of constraintIds) {
    const c = CONSTRAINT_BY_ID.get(id);
    if (!c?.weightAdd) continue;
    for (const [dim, v] of Object.entries(c.weightAdd)) {
      w[dim as DimId] = Math.max(0, w[dim as DimId] + (v ?? 0));
    }
  }
  const sum = DIMS.reduce((s, d) => s + w[d.id], 0);
  if (sum <= 0) return w;
  for (const d of DIMS) w[d.id] = w[d.id] / sum;
  return w;
}

/** 单条约束的硬过滤判定：通过返回 null，不通过返回人话原因 */
export function filterReason(m: Model, c: ConstraintDef): string | null {
  const f = c.filter;
  if (!f) return null;
  const scores = fullScores(m);
  if (f.dim && f.min != null && scores[f.dim] < f.min) {
    const d = DIM_BY_ID.get(f.dim)!;
    return `${d.label} ${fmtScore(scores[f.dim])}/10，低于「${c.label}」门槛 ${f.min}`;
  }
  if (f.ctxMin != null && m.ctxTokens < f.ctxMin) {
    return `上下文 ${ctxLabel(m.ctxTokens)}，装不下「${c.label}」要求的 ${Math.round(f.ctxMin / 1000)}K`;
  }
  if (f.cnOnly && m.region !== 'cn') {
    return '境外服务，国内网络与开票合规需另外评估';
  }
  if (f.openOnly && !m.openWeights) {
    return '非开放权重，无法私有化部署到内网';
  }
  return null;
}

export function ctxLabel(tokens: number): string {
  if (tokens >= 1_000_000) return `${round1(tokens / 1_000_000)}M`;
  return `${Math.round(tokens / 1000)}K`;
}

export function fmtScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** 对单个模型按权重打分 */
export function scoreModel(m: Model, weights: DimScores, constraints: ConstraintDef[] = []): Ranked {
  const scores = fullScores(m);
  let num = 0;
  let den = 0;
  for (const d of DIMS) {
    const w = weights[d.id];
    if (!w || w <= 0) continue;
    num += w * scores[d.id];
    den += w;
  }
  const raw = den > 0 ? num / den : 0;

  const contributions: DimContribution[] = DIMS.filter((d) => (weights[d.id] ?? 0) > 0)
    .map((d) => ({
      id: d.id,
      label: d.label,
      short: d.short,
      score: scores[d.id],
      weight: weights[d.id],
      share: 0,
    }))
    .sort((a, b) => b.weight * b.score - a.weight * a.score);

  const totalContrib = contributions.reduce((s, c) => s + c.weight * c.score, 0);
  for (const c of contributions) c.share = totalContrib > 0 ? (c.weight * c.score) / totalContrib : 0;

  // 加分项：贡献最大的三条；权重太小的维度不吹（避免「中文 5 分也算亮点」）
  const reasons = contributions
    .filter((c) => c.weight >= 0.05)
    .slice(0, 3)
    .map((c) => `${c.label} ${fmtScore(c.score)}/10（本场景权重 ${Math.round(c.weight * 100)}%）`);

  // 风险项：权重够大但确实弱
  const tradeoffs = contributions
    .filter((c) => c.score < 6 && c.weight >= 0.08)
    .slice(0, 2)
    .map((c) => `${c.label}仅 ${fmtScore(c.score)}/10 —— ${DIM_BY_ID.get(c.id)?.weak ?? ''}`);

  const warnings: string[] = [];
  for (const c of constraints) {
    if (!c.warn) continue;
    if (scores[c.warn.dim] < c.warn.min) {
      warnings.push(`「${c.label}」相关：${DIM_BY_ID.get(c.warn.dim)?.label} ${fmtScore(scores[c.warn.dim])}/10，低于预期 ${c.warn.min}`);
    }
  }

  let excludeReason: string | undefined;
  for (const c of constraints) {
    const r = filterReason(m, c);
    if (r) {
      excludeReason = r;
      break;
    }
  }

  return {
    model: m,
    fit: Math.round(clamp(raw * 10, 0, 100) * 10) / 10,
    raw: round1(raw),
    contributions,
    reasons,
    tradeoffs,
    warnings,
    excluded: Boolean(excludeReason),
    excludeReason,
  };
}

/** 完整推荐：过滤 → 排序 → 选首选/备选/省钱替代 */
export function recommend(taskId: string, constraintIds: string[] = []): RecommendResult {
  const weights = buildWeights(taskId, constraintIds);
  const constraints = constraintIds.map((id) => CONSTRAINT_BY_ID.get(id)).filter((c): c is ConstraintDef => Boolean(c));

  const ranked = MODELS.map((m) => scoreModel(m, weights, constraints)).sort(
    (a, b) => Number(a.excluded) - Number(b.excluded) || b.fit - a.fit || costRank(a.model) - costRank(b.model),
  );
  const included = ranked.filter((r) => !r.excluded);
  const excluded = ranked.filter((r) => r.excluded);
  const top = included[0];

  // 备选：换一家厂商。约束很紧、可选模型很少时放宽分差门槛，
  // 否则「只剩 2 个模型且差 9 分」会一个备选都给不出来。
  const gap = included.length <= 4 ? 99 : 8;
  const runnerUp = top
    ? included.find((r) => r !== top && r.model.provider !== top.model.provider && r.fit >= top.fit - gap)
    : undefined;

  // 省钱替代：分数不低于首选 8 分，但成本分明显更高
  const budgetPick = top
    ? included
        .filter((r) => r !== top && r.fit >= top.fit - 8 && costScore(r.model) >= costScore(top.model) + 1.2)
        .sort((a, b) => costScore(b.model) - costScore(a.model) || b.fit - a.fit)[0]
    : undefined;

  return { ranked, included, excluded, top, runnerUp, budgetPick, weights };
}

function costRank(m: Model): number {
  return m.price ? m.price.in * 0.75 + (m.price.out ?? m.price.in * 2.5) * 0.25 : 999;
}

export interface CostEstimate {
  /** 单次调用成本（美元） */
  perCall: number;
  /** 月成本（美元） */
  usd: number;
  /** 月成本（人民币） */
  cny: number;
}

/** 用量估算：日调用次数 × (输入 token × 输入价 + 输出 token × 输出价) */
export function estimateCost(
  m: Model,
  callsPerDay: number,
  inTok: number,
  outTok: number,
  rate = REF_RATE,
): CostEstimate | null {
  if (!m.price || m.price.out == null) return null;
  const perCall = (inTok / 1e6) * m.price.in + (outTok / 1e6) * m.price.out;
  const usd = perCall * 30 * callsPerDay;
  return { perCall, usd, cny: usd * rate };
}

// ---------------------------------------------------------------- 自然语言需求识别

export interface ParsedNeed {
  taskId?: string;
  constraints: string[];
  /** 命中的原始词，用于「我理解到」提示 */
  hits: string[];
  /** 0-1 置信度，仅用于 UI 提示强弱，不参与排序 */
  confidence: number;
}

/**
 * 从一段自由描述里识别场景与约束。
 * 纯关键词/正则，不联网、不调用模型，所以结果可复现、可解释、可单元测试。
 */
export function parseNeed(text: string): ParsedNeed {
  const raw = (text ?? '').trim();
  if (!raw) return { constraints: [], hits: [], confidence: 0 };
  const t = raw.toLowerCase();

  const taskHits = new Map<string, number>();
  const constraints = new Set<string>();
  const hits: string[] = [];

  for (const e of LEXICON) {
    if (!e.re.test(t)) continue;
    hits.push(e.label);
    if (e.tasks) for (const id of e.tasks) taskHits.set(id, (taskHits.get(id) ?? 0) + 1);
    if (e.constraints) for (const id of e.constraints) constraints.add(id);
  }

  // 数字线索：调用量、材料体量（允许「每天大概 2 万次」这类口语间隔）
  const perDay = t.match(/每天[^，。；,;]{0,8}?(\d+(?:\.\d+)?)\s*(万)?\s*(次|条|个)/);
  if (perDay) {
    const n = Number(perDay[1]) * (perDay[2] ? 10_000 : 1);
    if (n >= 5_000) {
      constraints.add('highVolume');
      hits.push(`每天约 ${n.toLocaleString('zh-CN')} 次调用`);
    }
  }
  const wanZi = t.match(/(\d+(?:\.\d+)?)\s*万字/);
  if (wanZi && Number(wanZi[1]) >= 15) {
    constraints.add('ultraLong');
    hits.push(`${wanZi[1]} 字长材料`);
  }
  const kTokens = t.match(/(\d+(?:\.\d+)?)\s*[kK]\s*(?:token|上下文)/);
  if (kTokens && Number(kTokens[1]) >= 300) {
    constraints.add('ultraLong');
    hits.push(`${kTokens[1]}K 上下文`);
  }

  let taskId: string | undefined;
  let best = 0;
  for (const [id, n] of taskHits) {
    if (n > best) {
      best = n;
      taskId = id;
    }
  }

  // 描述里出现「必须能读图」这类硬条件时，场景本身也该跟着走
  if (!taskId && constraints.has('visionNeed')) taskId = 'ocr';

  const signal = hits.length + (taskId ? 1 : 0);
  return {
    taskId,
    constraints: [...constraints],
    hits,
    confidence: signal === 0 ? 0 : Math.min(1, 0.4 + 0.15 * signal),
  };
}

/** 场景的权重画像，用于结果页「这类任务看重什么」 */
export function taskFocus(taskId: string): { label: string; pct: number }[] {
  const task = TASK_BY_ID.get(taskId);
  if (!task) return [];
  return Object.entries(task.weights)
    .map(([dim, v]) => ({ label: DIM_BY_ID.get(dim as DimId)?.short ?? dim, pct: Math.round((v ?? 0) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);
}

/** 生成一段可复制的推荐结论（纯文本，便于贴到群里或文档里） */
export function verdictText(res: RecommendResult, task: TaskDef, usage?: { calls: number; inTok: number; outTok: number }): string {
  const lines: string[] = [];
  lines.push(`【场景选模型】任务：${task.label}`);
  const focus = taskFocus(task.id)
    .map((f) => `${f.label} ${f.pct}%`)
    .join(' / ');
  lines.push(`权重：${focus}`);
  if (res.top) {
    lines.push(`首选：${res.top.model.provider} ${res.top.model.name}（匹配度 ${res.top.fit}）`);
    lines.push(`理由：${res.top.reasons.join('；')}`);
    if (res.top.tradeoffs.length) lines.push(`注意：${res.top.tradeoffs.join('；')}`);
    if (usage) {
      const c = estimateCost(res.top.model, usage.calls, usage.inTok, usage.outTok);
      if (c) lines.push(`月成本估算：≈ $${c.usd.toFixed(1)} / ¥${c.cny.toFixed(0)}（${usage.calls} 次/日）`);
    }
  }
  if (res.runnerUp) {
    lines.push(`备选（换供应商）：${res.runnerUp.model.provider} ${res.runnerUp.model.name}（匹配度 ${res.runnerUp.fit}）`);
  }
  if (res.budgetPick) {
    lines.push(`省钱替代：${res.budgetPick.model.provider} ${res.budgetPick.model.name}（匹配度 ${res.budgetPick.fit}）`);
  }
  lines.push('说明：按公开能力与场景权重做规则匹配，属选型起点，最终以自身数据压测为准。');
  return lines.join('\n');
}

/** 默认展示的三个对比对象：首选 + 备选 + 省钱替代 */
export function defaultCompare(res: RecommendResult): string[] {
  return [res.top, res.runnerUp, res.budgetPick]
    .filter((r): r is Ranked => Boolean(r))
    .map((r) => r.model.name)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 3);
}

/** 默认约束（场景自带的），用于首次进入时预勾选 */
export function defaultConstraints(taskId: string): string[] {
  return TASK_BY_ID.get(taskId)?.defaults ?? [];
}

/** 约束 id → 定义（UI 用） */
export function constraintList(): ConstraintDef[] {
  return CONSTRAINTS;
}
