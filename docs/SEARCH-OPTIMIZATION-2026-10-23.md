# MokaKit 站内搜索优化方案与实施记录

> 日期：2026-10-23　范围：`/search/` 站内搜索 + MCP `mokakit_search`
> 结论：把三套各自为政的检索实现收敛成一份纯函数内核，补齐拼音/英文别名/词序/高亮/纠错，
> 索引体积降 24%、页面体积降 41%，单次检索 0.16ms，71 项回归断言全绿。

---

## 一、现状（优化前）

### 1.1 三套实现，规则互不相同

| 位置 | 代码 | 匹配规则 | 排序 | 问题 |
|---|---|---|---|---|
| 搜索页 SSR | `src/pages/search/index.astro` 顶部 | 全串 `includes` | 无（原序） | 只在构建期跑一次，`?q=` 在静态站上读不到 |
| 搜索页客户端 | 同文件 `<script is:inline>` | 全串 `includes` | 无 | 与 SSR 逻辑重复，改一处漏一处 |
| MCP | `mcp/server.mjs` `searchCatalog()` | 分词 + 三档加权 | 有 | 与网页端结果对不上，同一 query 两套答案 |

另有一个 `src/components/SearchIsland.tsx`（Preact 岛）**从未被任何页面引用**，
注释里写着「客户端用 Fuse.js 消费」，但 `package.json` 里没有 Fuse.js —— 死代码 + 过期注释。

### 1.2 数据结构（优化前）

`src/tools/registry.ts` 的 `buildSearchIndex()` 构建期把 280 个工具拍平成：

```ts
interface SearchEntry {
  id: string; name: string; tagline: string;
  keywords: string;      // keywords + tags 用空格拼成一串
  category: string; url: string; icon: string;
}
```

页面用 `<script define:vars={{ INDEX: JSON.stringify(index) }}>` 内联进 HTML，
客户端 `filter` + `innerHTML` 重绘。

实测（280 个工具，全部含中文名）：

| 指标 | 数值 |
|---|---|
| 索引 JSON | 52.6 KB |
| 内联进 HTML 后（转义膨胀） | 63.5 KB |
| 搜索页 HTML 总体积 | 216.4 KB（gzip 52.4 KB） |
| 其中 SSR 预渲染的全量卡片 | 281 张（约 130 KB） |
| 单条 haystack 长度（min/中位/max） | 40 / 66 / 124 字符 |
| keyword 词条总数 | 2595（纯 ASCII 仅 476） |

### 1.3 实测诊断：14 个高频查询里 8 个直接 0 结果

用真实 meta 数据跑优化前的 `includes` 实现：

| 查询 | 命中数 | 说明 |
|---|---|---|
| `密码` | 5 | ✅ |
| `password` | **0** | 名称/关键词全中文，英文搜不到 |
| `mima` | **0** | 无拼音能力 |
| `timestamp` | **0** | 同上，但 `时间戳` 能搜到 |
| `qrcode` | **0** | id 是 `qrcode-generator`，但 keywords 是中文 |
| `calc` | **0** | — |
| `录音` | **0** | 该工具 tagline 里没有这个词 |
| `厘米换算英寸` | **0** | 长尾词只存在子页里，不在工具索引里 |
| `base 64` | **0** | 中间多个空格，全串匹配失败 |
| `JSON` | 16 | 命中但排序随机，「函数调用 Schema 生成器」排第一 |
| `器` | 139 | 噪音爆炸，且完全无排序 |
| `算` | 147 | 同上 |
| `格式化 json` | 1 | 侥幸命中（tagline 里恰好是这个词序） |
| `json 格式化` | 1 | ✅ |

**搜索页 `description` 里写着「支持拼音与英文关键词」——优化前这句话是假的。**

---

## 二、需要改进的六个方面

| # | 方面 | 具体问题 | 根因 |
|---|---|---|---|
| 1 | 匹配准确性 | 关键词表（2595 条）做了大量人工标注，但 `includes` 只认字面连续子串，同义词、英文别名、拼音全部无效 | 只有一档「包含」，没有字段权重与档位 |
| 2 | 前缀 / 模糊 | 无前缀优先、无拼写容错、无词序无关；`base 64`、`格式化 json` 这类输入随机失败 | 单串 `includes`，未分词、未归一化 |
| 3 | 大小写与多语言 | 只有 `.toLowerCase()`；全角 `ＪＳＯＮ`、中文标点「json，格式化」全部失效；中文名与英文 id 之间没有桥 | 缺 NFKC 归一化与 id 别名通道 |
| 4 | 性能与响应 | 每次 `input` 事件全量 `filter` + `innerHTML` 重建 281 个节点；HTML 216 KB、gzip 52 KB；中文输入法上屏过程中反复重排 | 无防抖、无 IME 感知、索引与全量卡片重复塞进 HTML |
| 5 | 结果排序与高亮 | filter 后保持原序（= priority 序），`JSON` 搜出 16 条无相关性排序；零高亮 | 没有打分；渲染层直接拼 HTML 字符串 |
| 6 | 空结果与错误处理 | 0 结果只有一句「换个词试试」；索引解析异常直接白屏；无键盘导航、无 aria 播报 | 未设计降级路径 |

---

## 三、目标与约束

**目标**

1. 常见意图（中文名/部分名/英文别名/拼音全拼/拼音首字母/词序颠倒）都能命中，且首条正确。
2. 单次检索 P95 < 8ms（中端手机），输入到结果 ≤ 1 帧感知延迟。
3. 搜索页 HTML 体积与首屏主线程开销显著下降。
4. 结果可解释：分数单调、命中字段可追溯、命中词可高亮。

**约束（不可破坏）**

| 约束 | 落地方式 |
|---|---|
| API 兼容 | `buildSearchIndex(): SearchEntry[]` 保留且行为不变；`/search/?q=` 参数保留；MCP `mokakit_search` 的 name / 入参 / 返回字段一字不改 |
| 本地检索优先 | 零网络请求、零后端依赖；纯静态站可用，断网可用 |
| 数据规模 | 当前 280 工具；设计目标 3000 条以内仍走线性扫描（实测 280 条 0.16ms，按线性外推 3000 条约 1.7ms） |
| 零运行时依赖 | 客户端不引入 Fuse.js / MiniSearch / 拼音字典；拼音在构建期算好 |
| 单一真源 | 网页与 MCP 共用 `src/lib/search.ts`，禁止第二份打分逻辑（同「财金算法只有一份」原则） |

---

## 四、实现方案

### 4.1 分层

```
src/lib/search.ts        纯函数内核：归一化 / 打分 / 分层放宽 / 模糊纠错 / 高亮切片
src/lib/search-build.ts  构建期：ToolMeta[] + pinyin-pro → 列式索引（含拼音）
        ↑                        ↑                        ↑
src/tools/registry.ts   src/pages/search/index.astro   mcp/server.mjs
（Astro 构建）          （SearchIsland.tsx 岛）          （MCP 运行时）
```

`search.ts` 不 import 任何 Node/浏览器专有 API，也不依赖 `pinyin-pro`，
因此三端都能用；`search-build.ts` 只在构建期出现，客户端永远拿不到拼音字典。

### 4.2 索引格式 v2（列式 + 拼音）

```ts
interface SearchIndexData {
  v: 2;
  n: string[];   // name
  g: string[];   // tagline
  k: string[];   // keywords + tags
  y: string[];   // 名称拼音全拼：mimashengchengqi
  s: string[];   // 名称拼音首字母：mmscq
  c: number[];   // 分类下标（指向 cats）
  p: number[];   // priority
  u: string[];   // /tools/<id>/
  i: string[];   // icon
  cats: string[];
}
```

- 列式单字母 key：省掉 280 条重复字段名，索引 52.6 KB → **39.8 KB（-24%）**。
- 拼音只给 `name` 生成。keywords 的拼音收益低、体积高（2595 条词），不值得。
- 拼音串合计约 8 KB，换来「打不出汉字也能搜」。构建期一次性算完，客户端零成本。

### 4.3 归一化

```ts
normalize(s) = s.normalize('NFKC').toLowerCase()
  .replace(/[\u3000\s]+/g, ' ')
  .replace(/[·・,，。、;；:：!！?？'"“”‘’()（）[\]【】{}<>《》/\\|_\-–—+*#@&~^%$=`]+/g, ' ')
  .trim();
```

- NFKC：全角→半角、兼容字符统一（`ＪＳＯＮ` = `JSON`）。
- 标点折叠为空格：`json，格式化` = `json 格式化` = `json,格式化`。
- 中文是恒等变换 —— 不转拼音、不转简体，行为可预测。
- 查询长度截断 64 字符，防病态输入。

### 4.4 打分（单 token 取最高档，多 token 求和）

| 档位 | 分值 | 说明 |
|---|---|---|
| 名称完全相等 | 1000 | |
| 名称前缀 | 700 | |
| 名称包含 | 500 | |
| 关键词整词相等 | 430 | |
| 关键词词首前缀 | 370 | |
| id 前缀 / 包含 | 380 / 340 | id 去掉连字符后匹配 → `qrcode` 命中 `qr-code-generator` |
| 拼音全拼前缀 / 包含 | 300 / 240 | |
| 拼音首字母前缀 | 210 | `mmscq` → 密码生成器 |
| 副标题包含 | 140 | 最弱档 |
| 分类名匹配 | 90 | 搜「开发辅助」时整类上浮 |
| priority 加成 | +4 × priority | 只用于同档位微调（0–40 分） |

**单字查询单独处理**：只搜「工具名」，不进关键词/副标题/分类。
`器` → 名字含「器」的 122 个工具（计算器/生成器），按分数与 priority 排序；
优化前是 139 条完全无序的噪音。

**英文别名通道**是零成本大杀器：`id` 本身就是英文名，
`qr-code-generator` 去掉连字符变成 `qrcodegenerator`，
一句 `idN.includes('qrcode')` 就修好了 `qrcode`/`timestamp`/`base64`/`uuid`/`regex` 一整类漏检。

### 4.5 三段式放宽

```
L1 严格：每个 token 都要命中 → 排序 → 够 3 条就用它（宁缺毋滥）
L2 弱匹配：命中 token 占比 ≥ 60% 即进，分数按覆盖率打折（× covered/tokens × 0.75）
L3 模糊：0 结果时才跑编辑距离（len≤4 → max 1；len≥5 → max 2）+ 纠错建议
```

L3 只在「前面全空」时启动，常见路径不付这笔钱。
纠错建议在 280 个名称 + 2595 个关键词词上算编辑距离，实测 1–2ms，用户无感。

### 4.6 页面与交互

- 索引从 `astro-island` props 挪到 `<script type="application/json" id="mk-search-index">`：
  Astro 的 devalue 序列化会把数组膨胀一倍多，独立 JSON 只转义 `<`，体积几乎无损。
- SSR 只渲染 12 条热门（原来是 280 张全量卡片），**HTML 216 KB → 127 KB（-41%），gzip 52.4 → 43.7 KB**。
- 防抖 90ms + `compositionstart/end` 感知：中文输入法拼音上屏期间不触发检索。
- 键盘 ↑↓ 选中、Enter 打开、Esc 清空；`aria-live="polite"` 播报结果数。
- 高亮用「区间数组 → 文本片段」渲染，不拼 HTML 字符串，天然免疫注入。
- 空结果 → 纠错建议 + 6 条热门兜底 + 「浏览全部工具」出口。
- 索引解析失败 → 提示 + 兜底链接，绝不白屏。

---

## 五、关键代码变更

| 文件 | 变更 |
|---|---|
| `src/lib/search.ts` | **新增**（约 400 行）。纯函数内核：`normalize` / `prepareIndex` / `searchTools` / `hotTools` / `splitHighlight` / `editDistance` |
| `src/lib/search-build.ts` | **新增**。构建期索引生成器：`pinyinOf` / `buildSearchIndexData`，依赖 `pinyin-pro`（devDependency） |
| `src/tools/registry.ts` | 新增 `buildSearchData(): SearchIndexData`；`buildSearchIndex()` 保留为兼容层，内部复用新数据，两版永不漂移 |
| `src/components/SearchIsland.tsx` | **重写**（原是无人引用的死代码）。交互层，从 DOM 读索引、IME 感知、键盘导航、高亮、降级 |
| `src/pages/search/index.astro` | 去掉 SSR 全量卡片与内联 `filter` 脚本；改为 SSR 热门 12 条 + 内联 JSON 索引 + Preact 岛 |
| `mcp/server.mjs` | `searchCatalog()` 改为调用 `searchTools()`；返回字段保持不变 |
| `mcp/build.mjs` | `catalog.json` 增加 `search` 字段（构建期算好拼音），线上服务器不需要 pinyin-pro |
| `mcp/meta-loader.mjs` | 补 `priority` / `noindex` 两个字段（排序与去索引判定需要） |
| `package.json` | 新增 `check:search` 并挂进 `check:all`；`mcp:build` 加 `--experimental-strip-types`；新增 devDependency `pinyin-pro` |
| `scripts/test-search.mjs` | **新增**，71 项回归断言 |
| `scripts/_probe-search.mjs` 等 | 临时探针，验证后删除 |

### 5.1 核心片段：打分

```ts
function scoreToken(d: PreparedDoc, tok: string) {
  if (tok.length === 1) {                    // 单字：只搜工具名
    if (d.nameN === tok) return { score: W.nameExact, field: 'name' };
    if (d.nameN.startsWith(tok)) return { score: W.namePrefix, field: 'name' };
    if (d.nameN.includes(tok)) return { score: W.nameSub - 200, field: 'name' };
    return { score: 0, field: 'name' };
  }
  if (d.nameN === tok) return { score: W.nameExact, field: 'name' };
  if (d.nameN.startsWith(tok)) return { score: W.namePrefix, field: 'name' };
  if (d.nameN.includes(tok)) return { score: W.nameSub, field: 'name' };

  // 英文别名通道：qr-code-generator → qrcode
  if (d.idN.startsWith(tok)) return { score: W.idSub + 40, field: 'id' };
  if (d.idN.includes(tok)) return { score: W.idSub, field: 'id' };

  for (const w of d.kwWords) if (w === tok) return { score: W.kwExact, field: 'keywords' };
  if (d.kwN.startsWith(tok) || d.kwWords.some((w) => w.startsWith(tok))) {
    return { score: W.kwPrefix, field: 'keywords' };
  }
  if (d.kwN.includes(tok)) return { score: W.kwSub, field: 'keywords' };

  // 拼音只接受纯 ASCII 查询
  if (isAsciiWord(tok)) {
    if (d.py.startsWith(tok)) return { score: W.pyPrefix, field: 'pinyin' };
    if (d.pyi.startsWith(tok)) return { score: W.pyiPrefix, field: 'pinyin' };
    if (d.py.includes(tok)) return { score: W.pySub, field: 'pinyin' };
  }

  if (d.tagN.includes(tok)) return { score: W.tagSub, field: 'tagline' };
  if (d.catN.includes(tok)) return { score: W.catSub, field: 'category' };
  return { score: 0, field: 'name' };
}
```

### 5.2 核心片段：三段式

```ts
for (const d of pi.docs) {
  let covered = 0, sum = 0;
  for (const tok of tokens) {
    const r = scoreToken(d, tok);
    if (r.score > 0) { covered++; sum += r.score; }
  }
  if (covered === 0) continue;
  const score = sum + d.doc.priority * W.priority;
  if (covered === tokens.length) strict.push({ d, score });
  else if (covered / tokens.length >= 0.6) loose.push({ d, score: score * (covered / tokens.length) * 0.75 });
}
// strict 不足 3 条才合并 loose；仍为 0 才进模糊 + 纠错
```

---

## 六、验证

### 6.1 单元回归（`npm run check:search`，71 项）

数据取自真实 `src/tools/<id>/meta.ts`（不是手写 fixture），新加工具后关键词缺失会直接红。

| 分组 | 覆盖内容 |
|---|---|
| 数据完整性 | 条数、各列等长、拼音覆盖率 ≥98%、id 唯一、url 形态 |
| 名称匹配 | 中文全名 top1、前缀、带空格英文名、分类名可搜 |
| 拼音 | `mima` / `mmscq` / `sjczh` / `erweima` 全部命中目标 top 区 |
| 英文别名 | `qrcode` / `timestamp` / `base64` / `uuid` / `regex` |
| 归一化等价 | 词序、大小写、全角、多空格、标点，五组互相等价 + 幂等 |
| 单字 | 只命中名字含该字、结果有序、top5 全相关 |
| 脏输入 | 空 / 纯空格 / 纯标点 / 超长 / emoji，均不崩 |
| 结果质量 | 全相关、分数单调、无重复 |
| 高亮 | 切片拼回必须等于原文（防丢字/错位） |
| 纠错 | 中文错字有建议且指向正确词；无候选时不抛错 |
| 性能 | 200 次检索单次 < 8ms |

实测输出：

```
[search] 工具 280 条 · 索引 39.8KB · 单次检索 0.16ms
✓ 全部 71 项通过
```

### 6.2 浏览器端到端（Playwright，430×950 移动视口）

| 场景 | 结果 |
|---|---|
| 首屏 | 热门 12 条，无空白 |
| 输入 `mima` | 密码生成器 / 密码强度分析 / ROT13 凯撒密码；URL 同步 `?q=mima` |
| 输入 `mmscq` | 密码生成器 / 智能体命名生成器 |
| 输入 `密码` | 6 处高亮，`<mark>` 命中正确 |
| ↑↓ 键盘 | 选中态跟随，Enter 可跳转 |
| 输入 `时间戳装换` | 1 条结果 + 「已放宽匹配范围」提示 |
| 输入 `zzzzzz` | 「没有匹配…的工具」+ 热门兜底 |
| `?q=mima` 直接打开 | 输入框回填、结果 3 条（静态站关键路径） |
| 控制台 | 无 JS 报错 |

### 6.3 MCP 契约验证

`mokakit_search` 返回字段与优化前完全一致（`id/name/description/category/url/mcpTool`）：

| query | 返回 |
|---|---|
| `mima` | 密码生成器 / 密码强度分析 / ROT13 凯撒密码 |
| `mmscq` | 密码生成器 / 智能体命名生成器 |
| `qrcode` | 二维码生成 |
| `sjczh` | 时间戳转换 |
| `base 64` | Base64 编解码 / 图片 Base64 转换 / Base32 编解码 |

### 6.4 性能对照

| 指标 | 优化前 | 优化后 | 变化 |
|---|---|---|---|
| 索引 JSON | 52.6 KB | 39.8 KB | **-24%** |
| 搜索页 HTML | 216.4 KB | 127.6 KB | **-41%** |
| 搜索页 gzip | 52.4 KB | 43.7 KB | -17% |
| SSR 卡片数 | 281 | 12 | -96% |
| 单次检索（Node） | 未测（`includes` 全扫） | 0.16 ms | — |
| 客户端 JS（搜索模块） | inline script ≈ 1.3 KB + 每次重绘 281 节点 | 10.4 KB bundle，只渲染可视结果 | — |

> 10.4 KB 里包含 Preact 组件与全部检索逻辑；拼音字典（950 KB）**没有**进入客户端 bundle（已 grep 校验）。

---

## 七、上线与回滚

```bash
npm run check:all      # 含 check:search
npm run mcp:build      # catalog.json 带上 search 索引
npm run build
# deploy/deploy.sh 上传 dist + deploy/mcp
```

- 回滚：`git revert` 本轮提交即可。旧的 `buildSearchIndex()` / `?q=` 参数 / MCP 契约全部保留，
  不存在「新代码依赖旧产物」的反向耦合。
- 上线后自检：`grep -c "mk-search-index" dist/search/index.html` 应为 1；
  `grep -c astro-island dist/search/index.html` 应为 1。

---

## 八、明确没做的事（及原因）

| 项 | 原因 |
|---|---|
| 中文分词（jieba 类） | 280 条规模下子串匹配更稳；分词会把「个税」切碎放大噪音 |
| 倒排索引 / 前缀树 | 线性扫描 0.16ms，倒排的增量更新与内存成本不值当；3000 条以内都不必 |
| 拼音模糊（全拼输入错误容错） | 收益低、误伤高，先用编辑距离兜底 |
| `/sites/` 好站导航的筛选 | 那是独立的 `data-search` 属性筛选（51 条），本次未动；若要统一，可复用 `normalize()` |
| 搜索词上报 / 热词统计 | 涉及隐私与统计侧改造，需单独决策 |
| 同义词表（如「抠图」→「背景移除」） | 需要数据驱动（百度搜索词），拍脑袋写会引入噪音 |

---

## 九、后续可做的三件事

1. **让「厘米换算英寸」这类长尾词可搜**：把 `subpages` 的 title 收进索引（280 工具 → 可能 +500 条），
   搜索页仍是 noindex，纯体验收益。索引预计 +30 KB，需先评估体积。
2. **搜索词埋点（本地聚合、不上报个人）**：只统计「0 结果的 query」用于补 keywords，这是最高性价比的数据闭环。
3. **sites 页复用内核**：51 条数据量小，收益有限，但能统一「大小写/全角/空结果提示」的行为。
