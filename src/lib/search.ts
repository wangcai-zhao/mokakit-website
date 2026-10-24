/**
 * 站内检索引擎 —— 全站唯一真源
 * ============================================================================
 * 为什么要有这一份：
 *   优化前站内搜索有三套互不相干的实现（SSR 过滤 / 浏览器 inline script /
 *   MCP searchCatalog），各自的匹配规则、大小写处理、排序都不同，
 *   典型症状是「同一句 query 在网页和 MCP 里结果不一样」。
 *   这里把它收敛成纯函数层，网页、MCP、回归测试全部共用。
 *
 * 设计取舍（刻意为之，改之前先看这里）：
 *   1. **不做倒排索引**。280 条 × 约 120 字符 ≈ 3.4 万字符，线性扫描一次
 *      不到 1ms。倒排带来的构建复杂度、内存占用、增量更新成本都不值当。
 *      经验阈值：3000 条以内线性扫描都够用（约 10ms 量级）。
 *   2. **中文不做分词**。中文分词器会把「个税」切成「个/税」，反而放大噪音；
 *      中文场景用子串匹配 + 首字前缀匹配，效果更稳、体积更小。
 *   3. **拼音在构建期算好**，运行期只做字符串比较。运行期塞一份拼音字典
 *      要多背 300KB+ 的包，换来的只是省几百毫秒构建时间，不划算。
 *   4. **分层放宽**：严格命中 → 弱命中 → 模糊纠错，逐级降级而不是一次全开。
 *      一次全开会把「单字查询」变成 139 条垃圾结果（优化前实测）。
 *
 * 索引格式用列式单字母 key（n/g/k/y/s/c/p/u/i + cats），
 * 280 条可省掉约 11KB 的重复 key 名，gzip 后差距小但白赚。
 */

/** 单条文档（与 SearchEntry 同构，另加排序用字段） */
export interface SearchDoc {
  id: string;
  name: string;
  tagline: string;
  keywords: string;
  url: string;
  icon: string;
  category: string;
  priority: number;
}

/**
 * 列式索引。字段含义：
 *   n name / g tagline / k keywords+tags / y 拼音全拼 / s 拼音首字母
 *   c 分类下标（指向 cats） / p priority / u url / i icon
 */
export interface SearchIndexData {
  v: 2;
  n: string[];
  g: string[];
  k: string[];
  y: string[];
  s: string[];
  c: number[];
  p: number[];
  u: string[];
  i: string[];
  cats: string[];
}

export interface SearchHit extends SearchDoc {
  score: number;
  /** 命中的最高档位字段，调试与「为什么这条排在前面」用 */
  matched: 'name' | 'keywords' | 'id' | 'pinyin' | 'tagline' | 'category';
  /** 高亮区间，[start, end)，针对 name / tagline 原文 */
  nameRanges: Array<[number, number]>;
  tagRanges: Array<[number, number]>;
}

export interface SearchResult {
  hits: SearchHit[];
  /** 0 结果时的「你是不是想找」候选词 */
  suggestions: string[];
  /** 是否走了降级匹配（弱命中 / 模糊），UI 可据此提示「已放宽匹配」 */
  relaxed: boolean;
  /** 严格命中总数（用于「共 N 个结果」的诚实计数） */
  total: number;
}

/** 打分权重表。同一 token 取最高档，多 token 求和。 */
const W = {
  nameExact: 1000,
  namePrefix: 700,
  nameSub: 500,
  kwExact: 430,
  kwPrefix: 370,
  kwSub: 300,
  idSub: 340,
  pyPrefix: 300,
  pySub: 240,
  pyiPrefix: 210,
  tagSub: 140,
  catSub: 90,
  /** priority 换算系数：priority 0-10，最多贡献 40 分，只用于同档位微调 */
  priority: 4,
  /** 分类也命中的额外加成 */
  catBonus: 25,
} as const;

/**
 * 归一化：NFKC（全角→半角）+ 小写 + 标点折叠成空格。
 *
 * NFKC 保证「ＡＢＣ」「abc」「ABC」等价；
 * 标点折叠保证「json,格式化」和「json 格式化」等价。
 * 注意本函数对中文是恒等变换（不转拼音、不转简体），保持可预测。
 */
export function normalize(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u3000\s]+/g, ' ')
    .replace(/[·・,，。、;；:：!！?？'"“”‘’()（）[\]【】{}<>《》/\\|_\-–—+*#@&~^%$=`]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 把词串切成数组（归一化后按空格切） */
function toWords(s: string): string[] {
  const n = normalize(s);
  return n ? n.split(' ') : [];
}

/** 压缩成「只留字母数字」的连续串，用于跨连字符匹配（qr-code → qrcode） */
function compact(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
}

interface PreparedDoc {
  doc: SearchDoc;
  nameN: string;
  tagN: string;
  kwN: string;
  kwWords: string[];
  idN: string;
  py: string;
  pyi: string;
  catN: string;
}

export interface PreparedIndex {
  docs: PreparedDoc[];
  cats: string[];
}

/** 列式索引 → 运行期结构。每次页面加载只做一次，约 2-3ms。 */
export function prepareIndex(data: SearchIndexData): PreparedIndex {
  const docs: PreparedDoc[] = data.n.map((name, k) => {
    const url = data.u[k] ?? '';
    const id = url.replace(/^\/tools\//, '').replace(/\/$/, '') || name;
    const kw = data.k[k] ?? '';
    const catName = data.cats[data.c[k]] ?? '';
    return {
      doc: {
        id,
        name,
        tagline: data.g[k] ?? '',
        keywords: kw,
        url,
        icon: data.i[k] ?? '',
        category: catName,
        priority: data.p[k] ?? 0,
      },
      nameN: normalize(name),
      tagN: normalize(data.g[k] ?? ''),
      kwN: normalize(kw),
      kwWords: toWords(kw),
      idN: compact(id),
      py: (data.y[k] ?? '').toLowerCase(),
      pyi: (data.s[k] ?? '').toLowerCase(),
      catN: normalize(catName),
    };
  });
  return { docs, cats: data.cats };
}

const isAsciiWord = (s: string) => /^[a-z0-9]+$/.test(s);

/**
 * 单 token 打分。返回 {score, field}，score 为 0 表示未命中。
 *
 * 单字查询只搜「工具名」，不搜关键词/副标题/分类：
 * 用户敲一个字几乎必然是在找名字里带这个字的工具（"器"→ 计算器/生成器），
 * 而关键词和简介里带同一个字的工具太多（"算"能匹配到 147 条），
 * 全放进来只会把真正想要的挤下去。这是「宁窄勿滥」。
 */
function scoreToken(d: PreparedDoc, tok: string): { score: number; field: SearchHit['matched'] } {
  if (tok.length === 1) {
    if (d.nameN === tok) return { score: W.nameExact, field: 'name' };
    if (d.nameN.startsWith(tok)) return { score: W.namePrefix, field: 'name' };
    if (d.nameN.includes(tok)) return { score: W.nameSub - 200, field: 'name' };
    return { score: 0, field: 'name' };
  }

  // ── 名称 ──
  if (d.nameN === tok) return { score: W.nameExact, field: 'name' };
  if (d.nameN.startsWith(tok)) return { score: W.namePrefix, field: 'name' };
  if (d.nameN.includes(tok)) return { score: W.nameSub, field: 'name' };

  // ── id（英文别名的主要来源，qr-code-generator → qrcode） ──
  if (d.idN.startsWith(tok)) return { score: W.idSub + 40, field: 'id' };
  if (d.idN.includes(tok)) return { score: W.idSub, field: 'id' };

  // ── 关键词：整词相等 > 词首前缀 > 包含 ──
  for (const w of d.kwWords) {
    if (w === tok) return { score: W.kwExact, field: 'keywords' };
  }
  if (d.kwN.startsWith(tok)) return { score: W.kwPrefix, field: 'keywords' };
  if (d.kwWords.some((w) => w.startsWith(tok))) return { score: W.kwPrefix, field: 'keywords' };
  if (d.kwN.includes(tok)) return { score: W.kwSub, field: 'keywords' };

  // ── 拼音（仅纯 ASCII 查询参与，中文查询比无意义） ──
  if (isAsciiWord(tok)) {
    if (d.py && d.py.startsWith(tok)) return { score: W.pyPrefix, field: 'pinyin' };
    if (d.pyi && d.pyi.startsWith(tok)) return { score: W.pyiPrefix, field: 'pinyin' };
    if (d.py && d.py.includes(tok)) return { score: W.pySub, field: 'pinyin' };
    if (d.pyi && d.pyi.includes(tok)) return { score: W.pyiPrefix - 20, field: 'pinyin' };
  }

  // ── 副标题（最弱，只在前面的字段都没命中时才看） ──
  if (d.tagN.includes(tok)) return { score: W.tagSub, field: 'tagline' };

  // ── 分类名（搜「开发」时把 dev 分类整体抬一档，但不作为强匹配） ──
  if (d.catN && (d.catN === tok || d.catN.includes(tok))) return { score: W.catSub, field: 'category' };

  return { score: 0, field: 'name' };
}

/** 编辑距离（带早停：超过 max 直接返回 max+1） */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = new Array<number>(b.length + 1);
  let cur = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    const t = prev;
    prev = cur;
    cur = t;
  }
  return prev[b.length];
}

/** 在原文上定位 token 的所有出现位置（用于渲染 <mark>） */
function findRanges(text: string, tokens: string[]): Array<[number, number]> {
  if (!text || tokens.length === 0) return [];
  const lower = text.toLowerCase();
  const out: Array<[number, number]> = [];
  for (const tok of tokens) {
    if (!tok || tok.length < 1) continue;
    let from = 0;
    // 单个 token 最多标 3 处，防止长文本刷满高亮
    for (let n = 0; n < 3; n++) {
      const at = lower.indexOf(tok, from);
      if (at < 0) break;
      out.push([at, at + tok.length]);
      from = at + tok.length;
    }
  }
  if (out.length <= 1) return out;
  out.sort((x, y) => x[0] - y[0]);
  const merged: Array<[number, number]> = [out[0]];
  for (let i = 1; i < out.length; i++) {
    const last = merged[merged.length - 1];
    if (out[i][0] <= last[1]) last[1] = Math.max(last[1], out[i][1]);
    else merged.push(out[i]);
  }
  return merged;
}

/** 0 结果时的纠错建议 */
function suggest(pi: PreparedIndex, tokens: string[], limit = 2): string[] {
  const scored: Array<{ word: string; dist: number; pr: number }> = [];
  for (const tok of tokens) {
    if (tok.length < 3) continue;
    const max = tok.length <= 4 ? 1 : 2;
    for (const d of pi.docs) {
      const candidates = [d.nameN, ...d.kwWords];
      for (const c of candidates) {
        if (!c || c.length < 2) continue;
        if (Math.abs(c.length - tok.length) > max) continue;
        const dist = editDistance(tok, c, max);
        if (dist > 0 && dist <= max) scored.push({ word: c, dist, pr: d.doc.priority });
      }
    }
  }
  scored.sort((a, b) => a.dist - b.dist || b.pr - a.pr || a.word.length - b.word.length);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of scored) {
    if (seen.has(s.word)) continue;
    seen.add(s.word);
    out.push(s.word);
    if (out.length >= limit) break;
  }
  return out;
}

export interface SearchOptions {
  limit?: number;
  /** 关闭模糊/纠错（MCP 精确检索或测试用） */
  noFuzzy?: boolean;
}

/**
 * 主检索入口。
 *
 * 三段式：
 *   1) 严格：每个 token 都必须命中，按总分排序
 *   2) 弱匹配：命中 token 占比 ≥ 60% 即进（用于「在线 密码生成器」这类带噪音词的长 query）
 *   3) 模糊：编辑距离 ≤1/2 + 纠错建议（只在 0 结果时跑，避免拖慢常见路径）
 */
export function searchTools(pi: PreparedIndex, rawQuery: string, opts: SearchOptions = {}): SearchResult {
  const limit = opts.limit ?? 40;
  const q = normalize(rawQuery).slice(0, 64);
  if (!q) return { hits: [], suggestions: [], relaxed: false, total: 0 };

  const tokens = q.split(' ').filter(Boolean);
  if (tokens.length === 0) return { hits: [], suggestions: [], relaxed: false, total: 0 };

  type Scored = { d: PreparedDoc; score: number; field: SearchHit['matched']; covered: number };

  const strict: Scored[] = [];
  const loose: Scored[] = [];

  for (const d of pi.docs) {
    let sum = 0;
    let covered = 0;
    let bestField: SearchHit['matched'] = 'tagline';
    let bestScore = 0;
    let catHit = false;

    for (const tok of tokens) {
      const r = scoreToken(d, tok);
      if (r.score > 0) {
        covered++;
        sum += r.score;
        if (r.score > bestScore) {
          bestScore = r.score;
          bestField = r.field;
        }
        if (r.field === 'category') catHit = true;
      }
    }
    if (covered === 0) continue;

    let score = sum + d.doc.priority * W.priority + (catHit ? W.catBonus : 0);
    const field = bestField;

    if (covered === tokens.length) {
      strict.push({ d, score, field, covered });
    } else if (covered / tokens.length >= 0.6) {
      // 覆盖率打折：漏掉的 token 越多，扣得越狠
      loose.push({ d, score: score * (covered / tokens.length) * 0.75, field, covered });
    }
  }

  const cmp = (a: Scored, b: Scored) => b.score - a.score || b.d.doc.priority - a.d.doc.priority;
  strict.sort(cmp);
  loose.sort(cmp);

  let list = strict;
  let relaxed = false;

  // 严格命中太少时才放宽；否则一律以严格结果为准（宁缺毋滥）
  if (strict.length < 3 && loose.length > 0) {
    const strictIds = new Set(strict.map((s) => s.d.doc.id));
    list = [...strict, ...loose.filter((s) => !strictIds.has(s.d.doc.id))];
    relaxed = true;
  }

  if (list.length === 0 && !opts.noFuzzy) {
    // 最后一道：模糊 + 纠错建议
    const fuzzy: Scored[] = [];
    for (const d of pi.docs) {
      let hit = false;
      for (const tok of tokens) {
        if (tok.length < 3) continue;
        const max = tok.length <= 4 ? 1 : 2;
        const pools = [d.nameN, d.idN, ...d.kwWords];
        for (const p of pools) {
          if (!p || Math.abs(p.length - tok.length) > max) continue;
          if (editDistance(tok, p, max) <= max) {
            hit = true;
            break;
          }
        }
        if (hit) break;
      }
      if (hit) fuzzy.push({ d, score: 100 + d.doc.priority, field: 'name', covered: 1 });
    }
    fuzzy.sort(cmp);
    list = fuzzy;
    return {
      hits: toHits(list, tokens, limit),
      suggestions: suggest(pi, tokens),
      relaxed: true,
      total: fuzzy.length,
    };
  }

  return {
    hits: toHits(list, tokens, limit),
    suggestions: [],
    relaxed,
    total: list.length,
  };
}

function toHits(list: Array<{ d: PreparedDoc; score: number; field: SearchHit['matched'] }>, tokens: string[], limit: number): SearchHit[] {
  return list.slice(0, limit).map(({ d, score, field }) => ({
    ...d.doc,
    score,
    matched: field,
    nameRanges: findRanges(d.doc.name, tokens),
    tagRanges: findRanges(d.doc.tagline, tokens),
  }));
}

/** 空查询时的默认推荐（按 priority 取前 N），避免首屏一片空白 */
export function hotTools(pi: PreparedIndex, limit = 8): SearchHit[] {
  return [...pi.docs]
    .sort((a, b) => b.doc.priority - a.doc.priority || a.doc.name.localeCompare(b.doc.name))
    .slice(0, limit)
    .map((d) => ({ ...d.doc, score: 0, matched: 'name' as const, nameRanges: [], tagRanges: [] }));
}

/** 把命中的区间切成 [{t, hit}] 片段，交给 UI 渲染，调用方不用碰 HTML 字符串 */
export function splitHighlight(text: string, ranges: Array<[number, number]>): Array<{ t: string; hit: boolean }> {
  if (!ranges.length) return [{ t: text, hit: false }];
  const out: Array<{ t: string; hit: boolean }> = [];
  let cursor = 0;
  for (const [s, e] of ranges) {
    if (s > cursor) out.push({ t: text.slice(cursor, s), hit: false });
    out.push({ t: text.slice(s, e), hit: true });
    cursor = e;
  }
  if (cursor < text.length) out.push({ t: text.slice(cursor), hit: false });
  return out;
}
