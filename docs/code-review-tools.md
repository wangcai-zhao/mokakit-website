# MokaKit 代码审查报告 —— 工具实现层 / 构建脚本层

> 审查日期：2026-09-23　|　审查范围：`src/lib/`（5 个财金计算库）、`scripts/`（构建与运维脚本）、`mcp/`（MCP Server）、`src/tools/_shared/`、`src/tools/**/meta.ts` 全量静态校验、`src/data/`（sites / changelog / agents / timeDate）
> 审查方式：**只读分析 + 脚本实测**，未修改任何源码。
> 仓库：`D:\WorkBuddy\website`　|　线上：https://www.mokakit.com

---

## 一、结论摘要

| 项 | 数量 |
|---|---|
| **问题总数** | **55** |
| P0（构建失败 / 运行崩溃 / 金额算错 / 线上明显错误） | **3** |
| P1（功能或 SEO 受损但不崩） | **22** |
| P2（风格、冗余、注释与实现不符） | **30** |

### 最严重的 3 个问题

1. **契税面积分档用了已废止的 90㎡ 口径**（`src/lib/china-calc-extra.ts:201`）。2024-12-01 起施行的契税新政分界线是 **140㎡**，代码仍是 90㎡。实测：200 万成交额、120㎡ 首套房，代码算出 3 万元（1.5%），正确应为 2 万元（1%）——**每套多算 1 万元**，且 MCP `deed_tax_cn` 同步输出错误结果。
2. **`src/lib/mortgage.ts` 全库零输入校验**（`mortgage.ts:49-60 / 63-68 / 104-105`）。`periods=0` 时 `equalPaymentMonthly` 返回 `Infinity`（不抛错）；`principal` 为负时输出荒谬金额（实测 100 万负本金 → 总利息 +1,467,124.8 元）；`method` 传入未知值时**静默降级为等额本金**并原样回传 `method:'foo'`——三种情况都是"算出钱但不报错"。
3. **46 个工具的 `icon` 在 `src/components/icons.ts` 中不存在**（占全部 229 个工具的 20%）。`Icon.astro:16` 有兜底 `safeName = name in ICONS ? name : 'grid'`，所以不报错，但这 46 个工具页 / 首页卡片 / 分类页上**图标统一退化成同一个 grid 九宫格**，线上肉眼可见。

### 各模块健康度

| 模块 | 评价 | 主要问题 |
|---|---|---|
| `china-tax.ts` | **良**（税率表、速算扣除数、级距边界全部实测正确） | 年终奖盲区判定区间写窄 |
| `china-social-security.ts` | **优**（费率、基数夹取、合计均正确） | 合计用未舍入值，与分项可能有 0.01 差 |
| `china-vat.ts` | **优**（一般/简易计税公式与留抵逻辑正确） | `excludeTax(-100)` 除零 |
| `china-calc-extra.ts` | **差**（契税分档过期、养老金 NaN、存款利息 NaN） | 3 处金额缺陷 |
| `mortgage.ts` | **差**（公式本身正确，但完全无防御） | 无输入校验 |
| `scripts/` | **中**（能跑通，但正则是主要脆弱点） | 环境变量名写错、host 解析错、无异常兜底 |
| `mcp/` | **中**（JSON-RPC 主体合规） | 启动崩溃路径、异步 handler 未捕获 |
| `_shared/` | **中** | 时长负号丢失、`addMonths` 月末溢出 |
| `src/data/` | **优**（changelog 时间线与 id 100% 正确） | sites.ts 8 条重复外链、注释条数过期 |

---

## 二、问题清单

### P0 —— 必须立即修复（3 条）

| # | 严重度 | 文件:行号 | 问题 | 影响 |
|---|---|---|---|---|
| 1 | **P0** | `src/lib/china-calc-extra.ts:201`（配套 203-205） | 契税优惠面积分档用 `area <= 90`。财政部/税务总局/住建部 2024 年第 16 号公告自 **2024-12-01** 起将唯一住房/第二套改善性住房的优惠面积界限由 90㎡ 提高到 **140㎡** | 91–140㎡ 首套多征 0.5%、二套多征 1%。实测 200 万 / 120㎡ 首套：代码 30,000 元，正确 20,000 元，**每笔错 1 万元**。MCP `deed_tax_cn` 同步错误 |
| 2 | **P0** | `src/lib/mortgage.ts:49-60`、`63-68`、`104-105`、`288` | 全库零输入校验：`equalPaymentMonthly(P, r, 0)` → `Infinity`；`buildSchedule(-1e6, …)` → 总利息 +1,467,124.8；`method` 传未知值 → 落入 `else` 分支静默按等额本金计算，并把 `method:'foo'` 原样返回 | 三种输入下都"算出了数字却不报错"，页面与 MCP `mortgage_schedule_cn` / `mortgage_early_repayment_cn` 直接输出错误金额 |
| 3 | **P0** | `src/tools/*/meta.ts`（46 个）+ `src/components/icons.ts:7-131` | 46 个工具 meta 的 `icon` 值在 `ICONS` 中不存在（38 个不同图标名） | `Icon.astro:16` 兜底成 `grid`，46 个工具页/首页卡片/分类页图标全部退化为同一个九宫格，线上肉眼可见的品牌损伤 |

### P1 —— 功能或 SEO 受损（22 条）

| # | 严重度 | 文件:行号 | 问题 | 影响 |
|---|---|---|---|---|
| 4 | P1 | `src/lib/china-tax.ts:194` | 盲区判定写成 `bonus > t && bonus <= t + 1`，只覆盖临界点后 **1 元**。真实盲区是 `(36000, 38566.67]` 等一整段 | 实测 `bonus=38566`（到手 34,919.4 < 36,000 档的 34,920，确属盲区）→ `blindSpot=false`，**该提示时不提示** |
| 5 | P1 | `src/lib/china-calc-extra.ts:270`（配套 254-256） | `PENSION_MONTHS[retireAge]` 未做存在性校验，`retireAge` 非 `'50'/'55'/'60'/'65'` 时 `months` 为 `undefined` → `b/undefined = NaN`，且 `NaN` 一路传到 `monthlyPension` / `annualPension` / `replacementRate` | 实测 `retireAge='63'` → 输出 `{"personalPension":null,"monthlyPension":null,…}`（JSON 把 NaN 序列化为 null）。延迟退休后 61/62/63/58 岁是真实人群，计发月数表本身也缺档 |
| 6 | P1 | `src/lib/china-calc-extra.ts:155-180` | `calcDepositInterest` 只校验 `< 0`，未校验 `Number.isFinite`。`principal` 为 `undefined` 时 `p < 0` 为 false，直接进入运算 | 实测 `{principal: undefined, rate: 2, years: 1}` → `{interest: null, total: null}`（实为 NaN），页面显示"NaN 元"，MCP 返回 null |
| 7 | P1 | `src/lib/china-calc-extra.ts:32-47`、`214-231` | `calcRetirementAge` / `calcOvertimePay` 同样只做区间校验，不做 `Number.isFinite`；`birthMonth` 也未校验整数 | 非数字输入穿过校验产出 NaN |
| 8 | P1 | `src/tools/gcd-lcm/meta.ts:32` | `related: ['fraction-calculator', 'prime-factorization', 'roman-numeral']` —— `prime-factorization` 不存在（真实目录/ id 是 **`prime-factor`**） | 站内相关工具内链指向 404，SEO 与用户体验双损 |
| 9 | P1 | `scripts/indexnow.mjs:42` | `process.env.DEFAULT_KEY \|\| DEFAULT_KEY` —— 环境变量名写错。文件头第 16 行文档写的是 `INDEXNOW_KEY=xxx npm run indexnow` | 文档承诺的 key 覆盖方式**完全失效**，想临时换 key 只能改源码 |
| 10 | P1 | `scripts/indexnow.mjs:46` + `80` | `--host=https://staging…` 只 `replace(/\/+$/,'')` 去掉尾部斜杠，不剥离协议。第 80 行 `keyLocation = \`https://${host}/${key}.txt\`` | 得到 `keyLocation = https://https://staging…/{key}.txt`，且 `body.host` 含协议 → IndexNow 直接 4xx 拒收 |
| 11 | P1 | `scripts/indexnow.mjs:125-126` | 兜底分支 `urls = extractUrls(SITEMAP_INDEX_PATH)`。`sitemap-index.xml` 里唯一的 `<loc>` 是 `…/sitemap-0.xml` 本身 | 会把 **sitemap 文件自身的 URL 当作页面 URL 推给 IndexNow**，属于无效提交，可能触发引擎限流 |
| 12 | P1 | `scripts/gen-github-tool-data.mjs:75`（配套 65 / 76 / 94 / 129） | `r.pushedAt.slice(0,7)`、`r.topics.length`、`r.dims.map`、`src.generatedAt.slice` 全部无空值防护 | GitHub Search API 任一字段为 `null` 即 `TypeError` 崩溃，且崩溃前已 `mkdirSync`，留下半截产物 |
| 13 | P1 | `scripts/build-workbench.mjs:190-201` | `JSON.parse(readFileSync(STATUS_FILE))` 无 try/catch，且未校验 `status.project/deploy/milestones/todos/batches` 字段存在 | `workbench/status.json` 缺失或字段改名 → 直接崩；字段缺失则在前端渲染时才炸（`frontend()` 第 284 行 `d.deploy.serverIp`） |
| 14 | P1 | `mcp/server.mjs:54-62` | `getCatalog()` 中 `return loadAllMeta()` 在 `try` **之外**。生产包 `deploy/mcp/server.mjs` 里 `TOOLS_DIR` 解析为不存在的 `deploy/src/tools` | catalog.json 丢失/JSON 损坏时 `readdirSync` 抛错 → **MCP Server 启动即崩**，systemd 反复重启失败 |
| 15 | P1 | `mcp/server.mjs:268`、`289-298` | 直接把 `num(a.periods)`、`a.method`、`a.mode` 透传给 `buildSchedule` / `calcEarlyRepayment`，未做最小值与枚举校验 | 与 P0-2 同源：`periods=0` → `Infinity`，`method` 乱传 → 静默按等额本金算 |
| 16 | P1 | `mcp/server.mjs:612`（配套 `async (req,res)` 全程无 try/catch） | `http.createServer(async (req,res) => {...})` 的 async 回调抛错会变成未捕获 Promise rejection，Node 默认策略是**终止进程** | 任意一次意外抛错 = MCP Server 进程退出，AI 客户端全部掉线 |
| 17 | P1 | `mcp/server.mjs:614-619` | 鉴权守卫 `req.url === '/mcp'` 精确匹配；token 用 `!==` 明文字符串比较 | ① 请求 `/mcp?foo=1` 或 `/mcp/` 既不鉴权也进不了 handler（行为不一致）；② 无 `crypto.timingSafeEqual`，存在时序侧信道；③ `Bearer` 大小写、`bearer` 均被拒 |
| 18 | P1 | `mcp/meta-loader.mjs:67-82` | `evalMeta` 失败被 `catch {}` 静默吞掉，**既不写 `errors` 也不告警**，直接降级到正则抽取 | 实测 `unit-convert`、`github-stars` 两个 meta 因含 TS 注解走了兜底。今天侥幸抽对，但只要源码格式一变（如 `name:` 出现在子页模板串里），MCP 工具描述就会静默变错 |
| 19 | P1 | `deploy/counter/server.mjs:122` | `new URL(req.url, \`http://${req.headers.host \|\| 'localhost'}\`)` 在 async handler 里，Host 头畸形时 `new URL` 抛错 | 未捕获 rejection → **线上计数服务进程退出**，全站访问量归零直到 systemd 拉起 |
| 20 | P1 | `src/tools/_shared/time.ts:29-37`（配套 `39-43`） | `secondsToHms` 用 `h * sign` 造负数小时，产生 `-0`；`fmtHms` 第 41 行 `const sign = h < 0 ? '-' : ''` 中 `-0 < 0` 在 JS 里是 **false** | `-1 小时 ~ 0` 区间的负时长丢负号。实测 `fmtHms(-59)` → `"00:00:59"`（应为 `"-00:00:59"`），`hms-add` / `time-duration` 等工具结果符号错误 |
| 21 | P1 | `src/tools/_shared/dates.ts:41-45` | `addMonths` 直接 `setMonth`，未做月末钳制 | `addMonths(2026-01-31, 1)` → 2026-03-03（应为 2026-02-28）。孕期周数、月份推算类工具跨月末即错 |
| 22 | P1 | `src/tools/_shared/image-utils.ts:64`、`67` | `Math.round((h * width) / w)` / `(w * height) / h`，`w` 或 `h` 为 0 时除零 | 破损 / 0 尺寸图片 → `Infinity` → canvas 尺寸非法崩溃 |
| 23 | P1 | `mcp/server.mjs:461` | `handler` 里 `searchCatalog(...)` 被连续调用两次（一次算 `count`，一次取 `results`） | 每次检索遍历全量 229 条 catalog 两遍，纯浪费；两次结果理论上一致但浪费一倍 CPU |
| 24 | P1 | `mcp/server.mjs:475`、`518` | `const sessions = new Map()` 只增不删，无 TTL / 无上限；只有客户端主动 `DELETE` 才回收 | 长时间运行内存泄漏；未发 DELETE 的客户端每次 `initialize` 都留下一条 |
| 25 | P1 | `scripts/gen-sitemap.mjs:33`（配套 `23-31`） | `walk(DIST)` 无存在性判断 | `dist/` 不存在时 `readdirSync` 抛未捕获异常，`npm run build` 在 sitemap 阶段失败且错误信息不友好 |

### P2 —— 风格、冗余、注释与实现不符（30 条）

| # | 严重度 | 文件:行号 | 问题 | 影响 |
|---|---|---|---|---|
| 26 | P2 | `src/lib/china-calc-extra.ts:74-82` vs `src/lib/china-tax.ts:33-41` | **同一张综合所得年度税率表被硬编码两份**（`china-calc-extra` 用 `upper` 语义、`china-tax` 用 `threshold` 语义），速算扣除数各写一套 | 政策调整时必须改两处，改一处就会两套算法结果不一致（一个页面一个答案） |
| 27 | P2 | `src/lib/china-tax.ts:174` | `bonus / 12` 先 `toDecimalPlaces(2)` 再定档。官方口径是按商数定档，不强制两位小数 | 极端临界值（如 36000.004）可能错档 |
| 28 | P2 | `src/lib/china-tax.ts:146` | `effectiveRate = tax / annualGross`，`annualGross` 为 0 时靠三元判 0，但为负时输出负税率 | 边界值展示异常 |
| 29 | P2 | `src/lib/china-social-security.ts:147`、`148-149` | `combined` 与 `personalRatePct` 用的是**未舍入**的 `personalTotal.plus(employerTotal)` / `personalTotal`，而 `personalTotal`/`employerTotal` 字段是 `round2` 后的值 | 分项相加与合计可能出现 0.01 元不一致 |
| 30 | P2 | `src/lib/china-vat.ts:81-85` | `excludeTax(inclusive, -100)` → `r.plus(1)` 为 0 → 除零 | 入参非法时输出 Infinity 而非报错 |
| 31 | P2 | `src/lib/china-calc-extra.ts:112-122` | `reverseGross` 二分 80 轮后直接返回，不校验 `|net - targetNet|` 是否收敛 | 极端参数下可能返回未收敛值 |
| 32 | P2 | `src/lib/china-calc-extra.ts:275` | `monthly / (w * idx \|\| 1)` —— 用 `\|\| 1` 兜底除零，掩盖真实入参错误 | 静默掩盖问题 |
| 33 | P2 | `src/lib/china-tax.ts:58-66`、`241-245`、`69`；`china-social-security.ts:49-56`；`mortgage.ts:49` | `SPECIAL_ADDITION_REF`、`CHINA_TAX_META`、`BONUS_BLIND_THRESHOLDS`、`SS_LABELS`、`MONTHLY_BONUS_BRACKETS`、`equalPaymentMonthly` 均**只在定义文件内部被引用**，对外无消费方 | 死导出，占体积、易误导维护者以为有复用 |
| 34 | P2 | `scripts/ts-resolve.mjs` vs 根目录 `ts-resolve.mjs`；`scripts/check-units.mjs` vs 根目录 `check-units.mjs` | 根目录留有两份**过期副本**（977B vs 1223B；4453B vs 7087B，根目录版本缺第 4 段"长尾子页产出"校验） | 误跑根目录旧版会得到"通过"的假阳性 |
| 35 | P2 | `scripts/build-workbench.mjs:25` | `const ROOT = path.resolve('.')` 依赖 CWD，与同目录其它脚本用 `fileURLToPath(import.meta.url)` 的写法不一致 | 从其它目录执行时路径全错 |
| 36 | P2 | `scripts/build-workbench.mjs:154` | 分类解析用 `/id:\s*'(\w+)'[\s\S]*?slug:\s*'([\w-]+)'[\s\S]*?name:\s*'([^']+)'/g`，跨对象非贪婪匹配 | 任一分类对象缺 `slug` 或调整字段顺序，正则会**跨到下一个分类**取字段，静默产出错误分类名（当前实测侥幸抽出 11 个全对） |
| 37 | P2 | `scripts/build-workbench.mjs:183` | `earliestCreate` 初值 `'9999'`，一旦某工具 `createdAt` 为空字符串，`'' < '9999'` 成立 → 结果变成 `''` | 统计"最早创建"显示空白 |
| 38 | P2 | `scripts/changelog-check.mjs:29`、`33` | meta 解析正则 `/^\s*id:\s*'([^']+)'/m` 只认**单引号** | 任何 meta.ts 改成双引号/反引号 → 该工具被**静默跳过**，漏登记检查失效 |
| 39 | P2 | `scripts/changelog-check.mjs:44` | `logged` 用 `/id:\s*'([^']+)'/g` 全文件扫，注释第 41 行自称"changelog.ts 里 `id:` 只会出现在工具条目上" | 一旦 changelog.ts 增加带 `id` 的其它结构（如版本锚点），立刻报一堆假"悬空 id" |
| 40 | P2 | `scripts/gen-sitemap.mjs:19` | `siteSrc.match(/url:\s*'([^']+)'/)` 无锚定，取全文件第一个 `url:'…'` | 在 `SITE.url` 之前新增任何 `xxxUrl:`（大小写碰巧为 `url:`）字段都会静默改 BASE，sitemap 全部域名错 |
| 41 | P2 | `scripts/gen-sitemap.mjs:45` | `lastmod: new Date().toISOString().slice(0,10)` 用 UTC 日期 | 东八区每天 00:00–08:00 构建时，lastmod 写的是**前一天** |
| 42 | P2 | `scripts/gen-sitemap.mjs:41-44` | `priority` 只按 URL 深度机械赋值（1.0/0.9/0.8/0.7） | 全是"建议值"，对搜索引擎无实际作用，属无效字段 |
| 43 | P2 | `scripts/check-units.mjs:89` | `bad('断言失败 1' + from + '->' + to + …)` —— `1` 是笔误，本应是空格 | 报错文案变成"断言失败 1inch->cm"，排查时被误导 |
| 44 | P2 | `scripts/new-tip.mjs:57-62` | 工具 id 校验用**目录名**集合，而非 `meta.ts` 里的 `id` | 若某个 meta.ts 的 `id` 与目录名不一致（历史上出现过），校验通过但内链 404 |
| 45 | P2 | `scripts/new-tip.mjs:96` | `q()` 只转义 `\` 和 `"`，未转义换行 | 标题含换行时生成非法 YAML，astro build 崩 |
| 46 | P2 | `scripts/new-tip.mjs:110` | `difficulty: ${difficulty}` 不加引号 | `--difficulty=A:B` 时 YAML 解析失败 |
| 47 | P2 | `mcp/server.mjs:604-608` | `if (messages.length === 1 && onlyNotification)` 才回 202 | **批量**通知（JSON-RPC batch 全是 notification）走到第 609 行，返回 `200 + []`，不符合 MCP 规范（应为 202 空响应） |
| 48 | P2 | `mcp/server.mjs:640-655` | `GET /` 未鉴权，返回 `tokenRequired: !!REQUIRED_TOKEN` | 向任意能访问端口者泄露"是否启用鉴权" |
| 49 | P2 | `mcp/server.mjs:591` | `const messages = Array.isArray(body) ? body : [body]` —— 空 body 时 `body` 为 `null` → `[null]` | 回 `-32700 Parse error` 但 HTTP 状态是 200（规范建议 4xx） |
| 50 | P2 | `mcp/meta-loader.mjs:25` | `.replace(/\);\s*$/, ');')` 是恒等替换，注释第 25 行自己都写了"基本 identity" | 死代码 |
| 51 | P2 | `mcp/meta-loader.mjs:27` | `new Function(stripped + '\nreturn __m;')` 直接求值 meta.ts 源码 | 本地构建脚本，风险可控，但等价于任意代码执行；建议改走 `--experimental-strip-types` 真实 import |
| 52 | P2 | `mcp/meta-loader.mjs:85-95` | `tools.push({ id, … })` 里的 `id` 用的是**目录名**，丢弃了 `meta.id` | 目录名与 `id` 一旦不一致，`META_BY_ID` 与 `CONCRETE_BY_ID` 的映射（`server.mjs:67-80`）对不上，工具描述回退到英文兜底 |
| 53 | P2 | `mcp/server.mjs:253-255` / `72` | `mortgage_schedule_cn` 的描述取自 `desc('fund-loan-calc', …)`，而 `CONCRETE_BY_ID` 也把 `fund-loan-calc` 映射到 `mortgage_schedule_cn` | "公积金贷款计算器"的页面描述被拿去当"房贷还款计划"的 MCP 描述，语义错位 |
| 54 | P2 | `src/tools/_shared/dev-io.tsx:1` | `import { useState, useRef, type ComponentChildren } from 'preact/hooks'` —— `ComponentChildren` 由 **`preact`** 导出，`preact/hooks` 不导出它 | 运行时因 `type` 修饰符被擦除而侥幸不崩，但 `npm run check`（astro check）会报 TS2305；且是错误示范，易被复制到其它文件 |
| 55 | P2 | `src/tools/_shared/linear-convert.tsx:74`、`_shared/copy.ts:27`、`_shared/wake-lock.ts:60` | ① `<option>` 缺 `key`；② `document.execCommand('copy')` 返回值被忽略，失败也当成功；③ hook 主体外第 60 行直接读 `navigator`，Astro SSR 预渲染时执行 | ① Preact 列表 diff 告警；② 复制失败无提示；③ SSR 环境 `navigator` 未定义时崩溃（Node 22 恰好有全局 navigator 才没炸） |

---

## 三、meta.ts 全量静态校验结果（独立章节）

**校验方式**：脚本遍历 `src/tools/*/meta.ts`（229 个目录，排除 `_shared`），用 `new Function` 求值 `defineTool({...})` 字面量（与 `mcp/meta-loader.mjs` 同源手法），再对 11 个维度做断言。不修改任何文件。

### 3.1 总览统计

| 指标 | 结果 |
|---|---|
| 工具目录总数 | **229** |
| 成功解析 meta.ts | **227**（`unit-convert`、`github-stars` 因含 TS 类型注解走正则兜底） |
| **id 与目录名不一致** | **0** ✅ |
| **category 未定义**（不在 `src/config/categories.ts` 的 11 个 id 内） | **0** ✅ |
| **icon 不存在于 `icons.ts`（共 106 个图标）** | **46**（涉及 38 个不同图标名）⚠️ |
| **related 幽灵 id** | **1**（`gcd-lcm → prime-factorization`）⚠️ |
| **related 自引用 / 重复** | **0** ✅ |
| **日期格式非法 / 晚于 2026-09-23 / updatedAt < createdAt** | **0 / 0 / 0** ✅ |
| **keywords 数量异常**（<3 或 >12） | **0** ✅ |
| **缺失必填字段** | **0** ✅ |
| **status 非法** | **0** ✅ |
| **description 长度越界**（80–160 字） | **5**（全部超长，无一过短）⚠️ |
| **无 `related` 的工具** | **51**（占 22%）⚠️ |

### 3.2 icon 缺失明细（46 个工具 / 38 个图标名）

`src/components/icons.ts` 现有 **106** 个图标。以下 38 个名字被 meta.ts 引用但不存在，触发 `Icon.astro:16` 的 `'grid'` 兜底：

```
baby  badge-check  battery-charging  calendar-heart  cash  cloud-sun  contrast
divide  droplets  factor  file-code-2  file-cog  file-json  footprints  fuel
function  function-square  gem  key-round  lightbulb  link-2  list-ordered
magnet  memory-stick  network  printer  rocket  rotate-cw  school  shirt
shuffle  sigma  tag  target  trending-down  trending-up  wallet  waves
```

按出现次数：**`trending-up` ×3、`tag` ×3、`sigma` ×3、`function` ×3**，其余各 ×1。
涉及工具（46 个）：`acceleration`、`angular-velocity`、`annualized-return`、`api-key-gen`、`average-calculator`、`bra-size`、`calorie-burn`、`capacitance`、`clothing-size`、`compound-interest`、`data-binary`、`discount-calculator`、`due-date`、`env-parser`、`factorial`、`fraction-calculator`、`fuel-efficiency`、`gpa-calculator`、`hat-size`、`hourly-wage`、`html-to-markdown`、`illuminance`、`inductance`、`inflation-calculator`、`jwt-generator`、`loc-counter`、`log-calculator`、`magnetic`、`menstrual-cycle`、`paper-size`、`permutation-combination`、`port-lookup`、`power-root`、`prime-factor`、`provident-fund-calc`、`query-params`、`ring-size`、`rounding-calculator`、`scientific-notation`、`shoe-size`、`trigonometry`、`variance-std`、`viscosity`、`wcag-contrast`、`weather`、`yaml-json`。

### 3.3 related 幽灵 id 明细（1 条）

| 工具 | meta.ts:行号 | 引用 | 正确值 |
|---|---|---|---|
| `gcd-lcm` | `src/tools/gcd-lcm/meta.ts:32` | `prime-factorization` | **`prime-factor`**（目录 `src/tools/prime-factor/`） |

> 说明：扫描过程中另有 35 条 `related → 'unit-convert'`（27 条）与 `related → 'github-stars'`（8 条）被初筛标记为幽灵，经复核二者均为**真实存在的工具目录**（其 meta.ts 只是含 TS 注解走了正则兜底），属误报，不计入。

### 3.4 description 长度越界明细（5 条，全部 >160）

| 工具 | 实际字数 | 建议 |
|---|---|---|
| `gitignore-gen` | 225 | 砍到 ≤160 |
| `udi-generator` | 185 | 砍到 ≤160 |
| `mcp-config-generator` | 183 | 砍到 ≤160 |
| `token-counter` | 176 | 砍到 ≤160 |
| `vat-calc` | 161 | 仅超 1 字 |

其余 224 个工具的 description 均落在 80–160 区间内。

### 3.5 无 `related` 的 51 个工具（内链机会，非缺陷）

`ai-price-compare`、`annual-tax-settlement`、`annualized-return`、`base-converter`、`base64`、`body-fat`、`calorie-burn`、`car-loan`、`card-installment`、`case-converter`、`child-height`、`clothing-size`、`color-converter`、`cron-parser`、`currency-convert`、`due-date`、`factorial`、`hash-calculator`、`http-status`、`ideal-weight`、`jian-fan-convert`、`json-formatter`、`jwt-decoder`、`markdown-preview`、`maternity-benefit`、`mcp-config-generator`、`medical-insurance`、`password-generator`、`password-strength`、`profit-margin`、`prompt-library`、`prompt-template`、`qrcode-generator`、`regex-tester`、`rental-yield`、`rsa-keygen`、`skill-generator`、`stamp-duty`、`text-counter`、`text-diff`、`timestamp-converter`、`token-counter`、`trigonometry`、`udi-decoder`、`udi-generator`、`url-encoder`、`uuid-generator`、`variance-std`、`water-intake`、`weather`、`workdays-count`

> 这 51 个工具页没有"相关工具"内链区，是**内链权重浪费**而非 bug，建议按分类批量补齐。

---

## 四、`src/data/` 数据校验结果

| 文件 | 结论 | 明细 |
|---|---|---|
| `changelog.ts` | ✅ **全清** | 11 个批次；时间序列 `2026-09-18 → 2026-08-04` **严格倒序**，无未来日期、无格式非法、无重复日期；`version` 与 `date` 100% 一致；登记工具条目 229 条、去重 229，**无重复登记**。与 `npm run changelog:check` 输出一致（229/229，0 悬空） |
| `timeDate.ts` | ✅ 全清 | 27 个 `toolIds` 全部命中真实工具目录；6 个分组图标 `clock/calendar/globe/timer/hash/sun` 全部存在于 `icons.ts` |
| `agents.ts` | ✅ 全清 | 4 个分组图标 `bot/code/sparkles/server` 全部存在；32 条外链均为 https 且格式合法 |
| `sites.ts` | ⚠️ 3 处 | ① **8 条 URL 重复**（同一站点出现在两个分组）：`redis.io`、`grafana.com`、`yuque.com`、`cloudflare.com`、`vercel.com`、`netlify.com`、`railway.app`、`producthunt.com` 各 ×2 —— 44 个分组共 791 条外链，去重后仅 783 条；② **21 条 `desc` 超过 20 字**（`SiteLink.desc` 接口注释第 17 行写明"≤20 字"），最长 32 字（`culture/Altered Qualia`）；③ **注释第 52 / 96 行写"675 条数据"，实际 791 条**，注释与实现不符 |

> `sites.ts.bak` 按要求不计入问题。
> 注：791 条外链的**真实可达性未做联网探测**，建议补一个定时死链扫描（见修复方案 R-55）。

---

## 五、修复方案（逐条精确到代码）

### R-1　契税面积分档改为 140㎡（P0）

`src/lib/china-calc-extra.ts:199-206`

```ts
// 改前
  const small = area <= 90;
  let rate: number;
  if (tier === 'first') rate = small ? 0.01 : 0.015;
  else if (tier === 'second') rate = small ? 0.01 : 0.02;
  else rate = 0.03;

// 改后：2024-12-01 起（财政部/税务总局/住建部 2024 年第 16 号公告）
// 唯一住房与第二套改善性住房的优惠面积界限由 90㎡ 提高到 140㎡
  const DEED_SMALL_AREA = 140;
  const small = area <= DEED_SMALL_AREA;
  let rate: number;
  if (tier === 'first') rate = small ? 0.01 : 0.015;
  else if (tier === 'second') rate = small ? 0.01 : 0.02;
  else rate = 0.03;
```

同时更新 `src/tools/deed-tax/content.mdx` 与 FAQ 里所有"90㎡"表述，并在文件头注释补政策文号。**改完必须同步重跑 `npm run mcp:build`**，否则 `deploy/mcp/catalog.json` 与 bundled `server.mjs` 仍是旧算法。

### R-2　`mortgage.ts` 加输入防御（P0）

在 `src/lib/mortgage.ts` 顶部加一个统一守卫，并在两个入口调用：

```ts
// 新增（放在 r2 之后）
function assertLoanInput(principal: number, annualRatePct: number, periods: number, method: string) {
  if (!Number.isFinite(principal) || principal <= 0)
    throw new Error('贷款本金必须是大于 0 的数字');
  if (!Number.isFinite(annualRatePct) || annualRatePct < 0)
    throw new Error('年利率必须是 ≥ 0 的数字');
  if (!Number.isInteger(periods) || periods <= 0 || periods > 600)
    throw new Error('还款期数必须是 1–600 之间的整数（月）');
  if (method !== 'equal-payment' && method !== 'equal-principal')
    throw new Error(`未知还款方式：${method}（可选 equal-payment / equal-principal）`);
}
```

- `equalPaymentMonthly`（`mortgage.ts:49`）首行插入：
  ```ts
  assertLoanInput(principal, annualRatePct, periods, 'equal-payment');
  ```
- `buildSchedule`（`mortgage.ts:63`）首行插入：
  ```ts
  assertLoanInput(principal, annualRatePct, periods, method);
  ```
  并把 `mortgage.ts:104` 的注释分支改成显式判断，杜绝"未知 method 静默走等额本金"：
  ```ts
  // 改前：// equal-principal：每月本金固定
  // 改后：
  if (method === 'equal-payment') { /* …现有逻辑… */ return {...}; }
  // 此处 method 已被 assertLoanInput 保证为 'equal-principal'
  const perPrincipal = P.div(periods);
  ```
- `calcEarlyRepayment`（`mortgage.ts:273`）同样在首行调用守卫，并补 `paidPeriods` / `prepayAmount` 校验：
  ```ts
  assertLoanInput(i.principal, i.annualRatePct, i.periods, i.method);
  if (!Number.isInteger(i.paidPeriods) || i.paidPeriods < 0 || i.paidPeriods >= i.periods)
    throw new Error('已还期数必须是 0 到（总期数-1）之间的整数');
  if (!Number.isFinite(i.prepayAmount) || i.prepayAmount <= 0)
    throw new Error('提前还款金额必须是大于 0 的数字');
  if (i.mode !== 'reduce' && i.mode !== 'shorten')
    throw new Error('提前还款模式必须是 reduce 或 shorten');
  ```

### R-3　补齐 46 个缺失图标（P0）

两种改法，任选其一：

**方案 A（推荐，一次性）**：把 38 个缺失图标的 `<path>` 补进 `src/components/icons.ts` 的 `ICONS`（Lucide ISC 协议，与现有 106 个同风格）。

**方案 B（快速止血）**：在 `src/tools/types.ts` 的 `defineTool` 里加构建期断言，先把"引用不存在图标"变成**显式报错**，再逐个替换 meta 里的图标名为已有图标：

```ts
// src/tools/types.ts —— defineTool 内
import { ICONS } from '@/components/icons';
if (import.meta.env.DEV && !(icon in ICONS)) {
  throw new Error(`[meta] 工具 ${id} 的 icon "${icon}" 不在 src/components/icons.ts 中`);
}
```

> 配套建议：把本报告 3.2 节的图标清单做成一个常驻脚本 `scripts/check-meta.mjs` 并挂到 `npm run check:meta`，防止再漂移。

### R-4　年终奖盲区判定改为"到手金额比较"（P1）

`src/lib/china-tax.ts:189-201`

```ts
// 改前
  for (const t of BONUS_BLIND_THRESHOLDS) {
    if (bonus > t && bonus <= t + 1) { … }
  }

// 改后：直接用「临界点档的到手额」比较，覆盖整个盲区区间
  let blindSpot = false;
  let blindNote: string | undefined;
  for (const t of BONUS_BLIND_THRESHOLDS) {
    if (bonus <= t) continue;
    // 临界点 t 的到手额
    const netAtThreshold = t - Math.max(0,
      new Decimal(t).times(bracketFor(t / 12, MONTHLY_BONUS_BRACKETS).rate)
        .minus(bracketFor(t / 12, MONTHLY_BONUS_BRACKETS).quickDeduction)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber());
    if (net < netAtThreshold - 0.005) {          // net 为本函数已算出的到手额
      blindSpot = true;
      blindNote = `奖金 ${t.toLocaleString('zh-CN')} 元是税率跳档临界点：` +
        `落在 ${t.toLocaleString('zh-CN')}–${Math.ceil(t * 1.0714).toLocaleString('zh-CN')} 区间内时，` +
        `到手反而少于 ${netAtThreshold.toFixed(2)} 元（当前 ${net.toFixed(2)} 元）。建议卡在 ${t.toLocaleString('zh-CN')} 元或发足下一档。`;
      break;
    }
  }
```

> 更严谨的做法是解析求解"net(b) = net(t)"的上界 b，直接给出区间右端点，避免 1.0714 这个经验系数硬编码。

### R-5　养老金计发月数表补档 + 入参校验（P1）

`src/lib/china-calc-extra.ts:252-275`

```ts
// 改前
export type PensionRetireAge = '50' | '55' | '60' | '65';
const PENSION_MONTHS: Record<PensionRetireAge, number> = { '50':195,'55':170,'60':139,'65':101 };

// 改后：渐进式延迟退休后 58/61/62/63 都是真实退休年龄，按现行表插值补档
export type PensionRetireAge = '50'|'55'|'58'|'60'|'61'|'62'|'63'|'65';
const PENSION_MONTHS: Record<PensionRetireAge, number> = {
  '50': 195, '55': 170, '58': 152, '60': 139,
  '61': 132, '62': 125, '63': 117, '65': 101,
};
```

并在 `calcPensionEstimate` 首行加守卫（与 R-2 同风格）：

```ts
  const months = PENSION_MONTHS[retireAge];
  if (!Number.isFinite(months) || months <= 0) {
    return { error: `暂不支持的退休年龄：${retireAge}（可选 ${Object.keys(PENSION_MONTHS).join('/')}）` };
  }
```

同时把 `mcp/server.mjs:430` 的 `enum: ['50','55','60','65']` 同步扩成 `['50','55','58','60','61','62','63','65']`。

### R-6　`china-calc-extra.ts` 统一 NaN 守卫（P1，覆盖 #6 #7）

在 `src/lib/china-calc-extra.ts` 顶部加工具函数，并把各函数的 `if (x < 0)` 改成 `if (!Number.isFinite(x) || x < 0)`：

```ts
const fin = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const need = (v: unknown, name: string, min = 0) => {
  if (!fin(v) || (v as number) < min) return { error: `${name}必须是 ≥ ${min} 的数字` };
  return null;
};
```

改动点：
- `calcDepositInterest:163-165` → `const e = need(p,'本金') || need(r,'利率') || (y > 0 ? null : {error:'存期需大于 0'}); if (e) return e;`
- `calcOvertimePay:224-225` → `need(s,'月工资',1e-9)`（注意原来是 `s <= 0`，改为 `> 0`）
- `calcRetirementAge:37-40` → 补 `!Number.isInteger(birthYear)` / `!Number.isInteger(birthMonth)`
- `calcAfterTaxSalary:134` / `calcDeedTax:196-197` / `calcPensionEstimate:266-268` 同法

并把 `:275` 的 `monthly / (w * idx || 1)` 改成 `w * idx > 0 ? monthly / (w * idx) : 0`。

### R-7　修复 `gcd-lcm` 的幽灵 related（P1）

`src/tools/gcd-lcm/meta.ts:32`

```ts
// 改前
  related: ['fraction-calculator', 'prime-factorization', 'roman-numeral'],
// 改后
  related: ['fraction-calculator', 'prime-factor', 'roman-numeral'],
```

### R-8　`indexnow.mjs` 三处修复（P1）

```js
// scripts/indexnow.mjs:42 —— 环境变量名
// 改前：const args = { host: DEFAULT_HOST, key: process.env.DEFAULT_KEY || DEFAULT_KEY };
// 改后：
const args = { host: DEFAULT_HOST, key: process.env.INDEXNOW_KEY || DEFAULT_KEY };

// scripts/indexnow.mjs:44-47 —— host 归一化（剥离协议 + 尾部斜杠）
function normalizeHost(h) {
  return String(h || '').replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}
// parseArgs 内：
    if (argv[i] === '--host' && argv[i + 1]) {
      args.host = normalizeHost(argv[i + 1]);
      i++;
    }
// main 内再加一道：
  const { host: rawHost, key } = parseArgs();
  const host = normalizeHost(rawHost);

// scripts/indexnow.mjs:118-126 —— 删掉 sitemap-index 兜底（推 sitemap 自身 URL 是无效提交）
// 改前：
  if (urls.length === 0) {
    if (!fs.existsSync(SITEMAP_INDEX_PATH)) { …exit… }
    urls = extractUrls(SITEMAP_INDEX_PATH);   // ← 删除这两行
  }
// 改后：SITEMAP_PATH 无 URL 就直接报错退出，并在推送前过滤非页面 URL
  urls = urls.filter((u) => !/\/sitemap(-index)?-?\d*\.xml$/.test(u));
```

并删除第 36 行 `SITEMAP_INDEX_PATH` 常量（随之失效）。

### R-9　`gen-github-tool-data.mjs` 加数据守卫（P1）

`scripts/gen-github-tool-data.mjs:63-84`，把 `.map` 前插入过滤与默认值：

```js
const repos = src.repos
  .filter((r) => !EXCLUDE.has(r.fullName))
  .filter((r) => r && r.fullName && (r.desc || (r.topics && r.topics.length)))
  .filter((r) => Number.isFinite(r.stars) && Number.isFinite(r.forks))
  .map((r) => ({
    n: r.name || String(r.fullName).split('/').pop(),
    f: r.fullName,
    d: clip(r.desc, 150),
    s: r.stars ?? 0,
    k: r.forks ?? 0,
    l: r.language || '',
    t: Array.isArray(r.topics) ? r.topics.slice(0, 4) : [],
    p: typeof r.pushedAt === 'string' ? r.pushedAt.slice(0, 7) : '',
    g: Array.isArray(r.dims) ? r.dims.map((x) => dimIndex.get(x)).filter((x) => x !== undefined) : [],
  }))
```

并在第 18 行前加：
```js
if (!fs.existsSync(resolve(ROOT, 'workbench/github-stars.json'))) {
  console.error('✗ 缺少 workbench/github-stars.json，请先跑 node scripts/fetch-github-stars.mjs');
  process.exit(1);
}
```
第 94/129 行 `src.generatedAt` 改为 `(src.generatedAt || new Date().toISOString()).slice(0, 10)`。

### R-10　`build-workbench.mjs` 状态文件兜底（P1）

`scripts/build-workbench.mjs:190`

```js
// 改前
  const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
// 改后
  let status;
  try {
    status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  } catch (e) {
    console.error(`✗ 读取 ${STATUS_FILE} 失败：${e.message}`);
    process.exit(1);
  }
  for (const k of ['project', 'deploy', 'milestones', 'todos', 'batches']) {
    if (!status[k]) { console.error(`✗ status.json 缺少字段 ${k}`); process.exit(1); }
  }
```
并按 `frontend()` 的实际读取补齐默认值：`status.deploy.domains ?? []`、`status.deploy.icp ?? {}`。

### R-11　MCP Server 启动崩溃路径（P1）

`mcp/server.mjs:54-62`

```js
// 改前
function getCatalog() {
  try {
    const p = new URL('./catalog.json', import.meta.url);
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
  } catch { /* ignore */ }
  return loadAllMeta();           // ← 在 try 之外，抛错即崩
}
// 改后
function getCatalog() {
  try {
    const p = new URL('./catalog.json', import.meta.url);
    if (existsSync(p)) {
      const j = JSON.parse(readFileSync(p, 'utf8'));
      if (Array.isArray(j.tools)) return { tools: j.tools, errors: Array.isArray(j.errors) ? j.errors : [] };
      console.warn('[mokakit-mcp] catalog.json 结构异常，回退运行时扫描');
    }
  } catch (e) {
    console.warn('[mokakit-mcp] catalog.json 读取失败：' + e.message);
  }
  try {
    return loadAllMeta();
  } catch (e) {
    console.error('[mokakit-mcp] 元数据加载失败，MCP 将以空目录启动：' + e.message);
    return { tools: [], errors: [{ id: '__catalog__', error: String(e && e.message) }] };
  }
}
```

### R-12　MCP 计算入参校验（P1）

在 `mcp/server.mjs` 的 `num()` 旁加校验器，并在两个房贷 tool 的 handler 中使用：

```js
function needInt(v, name, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max)
    throw new Error(`${name} 必须是 ${min}–${max} 之间的整数，实为 ${v}`);
  return n;
}
function needEnum(v, name, allowed) {
  if (!allowed.includes(v)) throw new Error(`${name} 必须是 ${allowed.join(' / ')} 之一，实为 ${v}`);
  return v;
}
```
- `server.mjs:267-268`：
  ```js
  handler: (a) => buildSchedule(
    num(a.principal), num(a.annualRatePct),
    needInt(a.periods, 'periods', 1, 600),
    needEnum(a.method, 'method', ['equal-payment', 'equal-principal']),
  ),
  ```
- `server.mjs:289-298`：对 `periods`、`method`、`paidPeriods`、`mode` 同样套用。
- `server.mjs:320-321`（`retirement_age_cn`）：`needInt(a.birthYear,'birthYear',1940,2010)`、`needInt(a.birthMonth,'birthMonth',1,12)`。
- `server.mjs:438-445`（`pension_estimate_cn`）：`needEnum(a.retireAge,'retireAge',['50','55','58','60','61','62','63','65'])`。

### R-13　MCP HTTP handler 统一 try/catch（P1）

`mcp/server.mjs:612`

```js
// 改前
const server = http.createServer(async (req, res) => {
// 改后
const server = http.createServer((req, res) => {
  Promise.resolve()
    .then(() => route(req, res))          // 把现有 async 主体抽成 async function route(req,res)
    .catch((err) => {
      console.error('[mokakit-mcp] 未捕获异常：', err);
      if (!res.headersSent) writeJson(res, 500, rpcError(null, -32603, 'Internal error'));
      else res.end();
    });
});
```
并补一行全局兜底：
```js
process.on('unhandledRejection', (e) => console.error('[mokakit-mcp] unhandledRejection:', e));
```

### R-14　MCP 鉴权加固（P1）

`mcp/server.mjs:614-619`

```js
// 改前
  if ((req.method === 'POST' || req.method === 'DELETE') && req.url === '/mcp') {
    if (REQUIRED_TOKEN && req.headers['authorization'] !== `Bearer ${REQUIRED_TOKEN}`) {
// 改后
  const path = (req.url || '').split('?')[0].replace(/\/+$/, '') || '/';
  if ((req.method === 'POST' || req.method === 'DELETE') && path === '/mcp') {
    if (REQUIRED_TOKEN && !tokenOk(req.headers['authorization'], REQUIRED_TOKEN)) {

// 新增（放在 writeJson 之前）
function tokenOk(header, expected) {
  if (typeof header !== 'string') return false;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!m) return false;
  const a = Buffer.from(m[1]);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
```
并把 `GET /` 的 `tokenRequired` 字段改为仅在 `REQUIRED_TOKEN` 为空时才返回（或直接删除该字段）。

### R-15　`meta-loader` 静默失败改为显式记录（P1）

`mcp/meta-loader.mjs:67-82`

```js
// 改前
    let meta;
    try {
      meta = evalMeta(raw);
    } catch {
      meta = { …正则兜底… };
    }
// 改后
    let meta;
    let degraded = false;
    try {
      meta = evalMeta(raw);
    } catch (e) {
      degraded = true;
      meta = { …正则兜底… };
    }
    if (degraded) errors.push({ id, error: `meta.ts 求值失败，已降级为正则抽取：${String(e && e.message)}` });
```
同时把 `:25` 的恒等 `.replace(/\);\s*$/, ');')` 直接删掉，并把 `:85` 的 `id` 改为优先取 `meta.id ?? id`，保证 `CONCRETE_BY_ID` 映射对得上：
```js
    tools.push({ id: meta.id || id, …
      url: `/tools/${id}/`,   // url 仍用目录名，因为路由按目录名生成
    });
```

### R-16　计数服务异步异常兜底（P1）

`deploy/counter/server.mjs:121`

```js
// 改前
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
// 改后
const server = http.createServer((req, res) => {
  handle(req, res).catch(() => { if (!res.headersSent) send(res, 500, { error: 'internal' }); });
});
async function handle(req, res) {
  let url;
  try { url = new URL(req.url, 'http://localhost'); }
  catch { send(res, 400, { error: 'bad request' }); return; }
  … 现有主体 …
}
```
并在 `:164` 限制 delta：
```js
const delta = Number.isFinite(parsed.delta) ? Math.min(1, Math.max(-1, Math.trunc(parsed.delta))) : 1;
```

### R-17　`_shared/time.ts` 负时长符号（P1）

```ts
// 改前（src/tools/_shared/time.ts:29-43）
export function secondsToHms(total: number): Hms {
  const sign = total < 0 ? -1 : 1;
  let t = Math.abs(Math.trunc(total));
  …
  return { h: h * sign, m, s };
}
export function fmtHms(total: number): string {
  const { h, m, s } = secondsToHms(total);
  const sign = h < 0 ? '-' : '';
  return `${sign}${pad(Math.abs(h))}:${pad(m)}:${pad(s)}`;
}

// 改后：把符号作为独立字段，避免 -0
export interface Hms { h: number; m: number; s: number; neg?: boolean }
export function secondsToHms(total: number): Hms {
  const neg = total < 0;
  let t = Math.abs(Math.trunc(total));
  const s = t % 60;
  t = Math.floor(t / 60);
  const m = t % 60;
  const h = Math.floor(t / 60);
  return { h, m, s, neg };
}
export function fmtHms(total: number): string {
  const { h, m, s, neg } = secondsToHms(total);
  return `${neg ? '-' : ''}${pad(h)}:${pad(m)}:${pad(s)}`;
}
export function hmsToSeconds(p: Hms): number {
  const v = p.h * 3600 + p.m * 60 + p.s;
  return p.neg ? -v : v;
}
```
调用方（`hms-add`、`hms-to-units`、`time-duration` 等）若直接读了 `Hms.h` 判断正负，需同步改用 `neg` 字段。

### R-18　`_shared/dates.ts` addMonths 月末钳制（P1）

```ts
// 改前（src/tools/_shared/dates.ts:41-45）
export function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getTime());
  r.setMonth(r.getMonth() + Math.trunc(n));
  return r;
}

// 改后
export function addMonths(d: Date, n: number): Date {
  const y = d.getFullYear();
  const mo = d.getMonth();
  const da = d.getDate();
  const target = new Date(y, mo + Math.trunc(n), 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(da, lastDay));   // 月末钳制：1/31 + 1月 = 2/28
  target.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
  return target;
}
```

### R-19　`_shared/image-utils.ts` 除零（P1）

```ts
// src/tools/_shared/image-utils.ts:59-68
  const width = targetW && targetW > 0 ? Math.round(targetW) : w;
  const height = targetH && targetH > 0 ? Math.round(targetH) : h;
  if (!keepRatio) return { width, height };
  if (!w || !h || !Number.isFinite(w) || !Number.isFinite(h)) return { width, height }; // 新增
  if (!targetH || targetH <= 0) return { width, height: Math.max(1, Math.round((h * width) / w)) };
  if (!targetW || targetW <= 0) return { height, width: Math.max(1, Math.round((w * height) / h)) };
```

### R-20　其余 P2 逐条修法（速查）

| 编号 | 修法 |
|---|---|
| #23 | `mcp/server.mjs:461` → `const results = searchCatalog(a.query, num(a.limit, 8)); return { query: a.query, count: results.length, results };` |
| #24 | `mcp/server.mjs` 增加 `const SESSION_TTL = 30*60*1000;` 与 `setInterval(() => { for (const [id,s] of sessions) if (Date.now()-s.createdAt > SESSION_TTL) sessions.delete(id); }, 60000).unref();` |
| #25 | `gen-sitemap.mjs:33` 前加 `if (!existsSync(DIST)) { console.error('✗ dist/ 不存在，请先 npm run build'); process.exit(1); }` |
| #26 | 删除 `china-calc-extra.ts:74-82` 的 `SALARY_BRACKETS`，`taxOf` 改为 `import { progressiveTax, ANNUAL_BRACKETS } from './china-tax'` 后 `progressiveTax(taxable, ANNUAL_BRACKETS)`——**税率表只保留一份** |
| #27 | `china-tax.ts:174` 去掉 `.toDecimalPlaces(2, …)`，改用 `new Decimal(bonus).div(12)`（不取整）定档 |
| #28 | `china-tax.ts:146` → `const effectiveRate = input.annualGross > 0 ? new Decimal(tax).div(input.annualGross).toNumber() : 0;`（已是此写法则补 `Math.max(0, …)`） |
| #29 | `china-social-security.ts:147-149` 改用已舍入值：`const combined = round2(new Decimal(personalTotalN).plus(employerTotalN));`，`personalRatePct` 用 `new Decimal(personalTotalN).div(baseApplied).times(100)` |
| #30 | `china-vat.ts:83` 前加 `if (r.plus(1).eq(0)) throw new Error('税率不能为 -100%');` |
| #33 | 删除 `SPECIAL_ADDITION_REF`、`CHINA_TAX_META` 两个无人消费的导出（若 content.mdx 需要展示专项附加扣除标准，改为在 mdx 里直接写文案） |
| #34 | **删除根目录的 `ts-resolve.mjs` 与 `check-units.mjs`**（与 `scripts/` 下新版重复且已过期） |
| #35 | `build-workbench.mjs:25` → `const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');` |
| #36 | `build-workbench.mjs:152-156` 改为逐对象解析：先 `cs.split(/\n  \{\n/)` 分块，再在每块内 `id:`/`slug:`/`name:` 单独匹配，避免跨对象 |
| #37 | `build-workbench.mjs:183` → 先 `const nonEmpty = tools.map(t=>t.createdAt).filter(Boolean);`，再用 `nonEmpty.reduce((a,b)=> b<a?b:a, '9999')` |
| #38 | `changelog-check.mjs:29` → `/^\s*id:\s*['"\`]([^'"`]+)['"\`]/m`，并在 `localTools.push` 前对解析不到 id 的目录 `errors.push` 而不是 `continue` |
| #39 | `changelog-check.mjs:44` → 限定在 `tools: [ … ]` 块内取 id，或改用 `/\bid:\s*'([a-z0-9-]+)'/g` 并对结果做 `known` 白名单过滤后再报悬空 |
| #40 | `gen-sitemap.mjs:19` → `const m = siteSrc.match(/^\s*url:\s*'(https?:\/\/[^']+)'/m);`（加行首锚定 + 协议校验），并在 `!m` 时 `console.warn` 而不是静默 fallback |
| #41 | `gen-sitemap.mjs:45` → 用本地日期：`const d = new Date(); const lastmod = \`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}\`;` |
| #43 | `check-units.mjs:89` → `'断言失败 ' + from + '->' + to + '：期望 ' + expect + '，实得 ' + got` |
| #44 | `new-tip.mjs:57-62` → 改为读每个目录 `meta.ts` 里的 `id` 字段（复用 `changelog-check.mjs:29` 的正则），校验集合用 `meta.id` 与目录名的**并集** |
| #45 | `new-tip.mjs:96` → `const q = (s) => \`"\${String(s).replace(/\\\\/g,'\\\\\\\\').replace(/"/g,'\\\\"').replace(/\\r?\\n/g,' ')}"\`;` |
| #46 | `new-tip.mjs:110` → `difficulty: ${q(difficulty)}` |
| #47 | `mcp/server.mjs:604` → `if (onlyNotification) { res.writeHead(202); res.end(); return; }`（去掉 `messages.length === 1` 条件，并前移到第 596 行循环之后立即判断） |
| #48 | `mcp/server.mjs:647` → 删除 `tokenRequired` 字段 |
| #49 | `mcp/server.mjs:591` → `const messages = Array.isArray(body) ? body : body ? [body] : [];`，`messages.length === 0` 时 `writeJson(res, 400, rpcError(null,-32700,'Parse error'))` |
| #50 | 删除 `mcp/meta-loader.mjs:25` 整行 |
| #52 | 见 R-15 |
| #53 | `mcp/server.mjs:253-255` → `desc('fund-loan-calc', …)` 改为 `desc('mortgage-early-repayment', …)` 之外的独立描述，或直接写死一段准确的"房贷还款计划"描述；若确实要复用公积金贷页面，则把 `CONCRETE_BY_ID['fund-loan-calc']` 指向一个语义匹配的 tool |
| #54 | `src/tools/_shared/dev-io.tsx:1-2` → `import { type ComponentChildren } from 'preact';` + `import { useState, useRef } from 'preact/hooks';` |
| #55 | ① `linear-convert.tsx:74` → `<option key={u.id} value={u.id}>`；② `copy.ts:27` → `const ok = document.execCommand('copy'); if (!ok) throw new Error('复制失败');`（让 `copyText` 的调用方能感知失败）；③ `wake-lock.ts:60` → `const nav = typeof navigator !== 'undefined' ? (navigator as any) : undefined; return { supported: !!nav && 'wakeLock' in nav };` |
| #54(data) | `sites.ts`：删除 8 组重复外链中的一份（或给重复项打 `tag` 说明分属不同分组）；把 21 条超长 `desc` 压到 ≤20 字；把第 52/96 行注释的"675 条"改成"791 条"或改成不含数字的表述 |
| — | **新增常驻校验**：把本报告 3.x 节的检查固化成 `scripts/check-meta.mjs`（校验 id/目录名一致、category 合法、icon 存在、related 非幽灵、日期区间、description 长度、keywords 数量），挂到 `package.json` 的 `"check:meta"` 并在 `build` 前串联执行，防止 46 个缺失图标这类问题再次静默上线 |

---

## 六、推荐的落地顺序

1. **当天**：R-1（契税 140㎡）+ R-3（图标兜底断言）+ R-7（幽灵 related），改完 `npm run build && npm run mcp:build` 重新发布。
2. **本周**：R-2（mortgage 守卫）+ R-5（养老金）+ R-6（NaN 守卫）+ R-4（盲区），并补 R-1 影响到的 `deed-tax` 文案。
3. **两周内**：R-8 ~ R-19（脚本与 MCP 的崩溃路径、鉴权、异常兜底）。
4. **迭代**：R-20 的 P2 清单 + 新增 `scripts/check-meta.mjs` 常驻校验。

---

*报告生成：2026-09-23　|　所有结论均基于只读静态分析 + Node 实测（验算脚本运行于临时目录，未写入仓库）*
