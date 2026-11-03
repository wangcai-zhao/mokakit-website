# MokaKit 摩卡工具箱 · 项目专属知识库

> 维护：大美丽（AI 桌面搭子）。**最后整理：2026-11-03**（合并基准文档 v1.0 的 10 项更正，淘汰过期表述）。
> **续干顺序（必读）**：① 本文件（全局结构 + 技术规范 + 节点 + 避雷 + **版本基线 §10** + **未决事项 §11**）→ ② `MEMORY.md`（高频操作速查 + 避雷速记）→ ③ 当日日志 `.workbuddy/memory/YYYY-MM-DD.md` → ④ 必要时 `conversation_search` 跨会话检索。
> **IMA 镜像知识库「MokaKit 项目专属知识库」与本文件保持同步，线上检索用 IMA，本地权威以本文件为准。**

## 0.0 基准声明与证据分级（2026-11-03 起执行）

**本文件是 MokaKit 的唯一定性基准（single source of baseline）。** 与之冲突的旧文档、旧记忆、口述一律以本文件为准；本文件与源码冲突时以源码为准，并立即回改本文件。

配套对照物：《MokaKit 项目基准文档 v1.0（2026-11-03）》，资料库 `node_id=xjHueaEZDz1RMQQwfxddK3`，本地 `D:\WorkBuddy\mokakit-baseline\MokaKit-项目基准文档-v1.0-2026-11-03.md`。两者分工：**基准文档管"完整盘点 + SOP + 风险登记册"（低频、大而全），本文件管"日常续干所需的结构与铁律"（高频、精而准）**。

证据分级（写任何结论都必须能标出级别）：

| 级别 | 含义 | 标注 |
|---|---|---|
| **A** | 源码/配置直读或只读命令实测 | `（A：文件:行）` |
| **B** | 项目自带只读校验脚本输出 | `（B：脚本名）` |
| **C** | 历史文档记载、**本次未复测** | `（C：文档 §x）` |
| **D** | 记忆/日志的过程记录 | `（D：日期）` |

**取舍原则**（本次合并 10 项更正时执行）：
1. **单一数值只留一处**：工具数、页面数、分类数统一写在 §1 元信息表，其余章节改为引用，避免"两处各写一个数、改一处漏一处"。
2. **过期结论不保留"曾经如此"的叙述**：直接改成本文现状，历史沿革只留在 §6 里程碑与 changelog 里。
3. **已修复的问题移出"未决"**：在 §11 标记关闭并写清关闭依据（哪一行代码），不再当作待办。
4. **无法复测的（C 级）保留但降权**：显式标"未复测"，不与 A/B 级事实混排。

---

## 0. 一句话定位
MokaKit = "AI 时代的工具箱"，**纯静态站点**，**282 个**免费在线工具 / 11 分类。战略核心是 **MCP Server**——让外部 LLM（Claude / GPT 等）能直接调用这些工具的能力。（数量以 §1 元信息表为准，本节不重复维护。）

---

## 1. 项目元信息
| 项 | 值 |
|---|---|
| 本地仓库 | `D:\WorkBuddy\website`（git `master`，远端 `github.com/wangcai-zhao/mokakit-website.git`） |
| 线上域名 | `https://www.mokakit.com` |
| ICP 备案 | 京ICP备2026051111号（见 `src/config/site.ts`） |
| 百度统计 ID | `c1ce047dfb4bbcfe58cba2418b56332a`（**以 `src/config/site.ts` 为准**） |
| AdSense | `ca-pub-0218164655974877`（`site.ts` 预留 `ads.enabled` 开关，默认 false） |
| 服务器 | 腾讯云 `58.87.68.151`（root） |
| 技术栈 | Astro 7 + Preact 10 + daisyUI 5 + Tailwind v4（纯静态；MCP 是唯一的 Node 运行时） |
| 当前规模 | **282 工具 / 11 分类**（A：2026-11-04 实测，`check:widgets` 报 282/282 已注册；动态值以 `src/tools/*/meta.ts` 为准） |
| 构建产物 | **675** 个 `index.html`；sitemap **673** 条（A：`find dist -name index.html`、`grep -c '<loc>' dist/sitemap-0.xml`） |
| 站内检索 | **360 条**（282 工具 + 78 浅层子页），索引 **56.5KB**，单次 **0.17ms**，77 项断言（B：`check:search`） |
| 工程版本 | **0.10.0**（A：`package.json`；页脚自动派生 `v0.10.0`，规则见 `docs/VERSIONING.md`） |
| MCP 工具面 | **20 个** = 19 个专用计算工具 + `mokakit_search`（A：`mcp/server.mjs`） |

> ⚠️ 上表是**唯一数量真源**。其他章节提到"N 个工具 / N 页"时一律引用本节，不另写数字。
> 分类分布（A 级实测）：calc 92 / dev 57 / convert 34 / text 22 / ai 20 / life 20 / security 13 / image 10 / fun 5 / clock 5 / barcode 3。

---

## 2. 目录结构与职责
```
src/
  components/        UI 组件 + 关键注册点 WidgetHost.astro（手动水合）
  config/
    site.ts         ★真源①：备案/统计/广告/版本(从 package.json 派生)/SITE.url
    categories.ts   ★真源②：11 个分类枚举（id + 展示信息）
  content/
    blog/           Markdown 博客（frontmatter：title/description/publishDate/tags，draft 默认 true 需显式 false）
  data/
    sites.ts        好站导航分组（SITE_GROUPS）
    agents.ts       智能体专栏（AGENT_GROUPS）
    changelog.ts    ★更新记录真源（RELEASES，新增工具必补 id，否则 changelog:check 红灯）
  layouts/
    ToolLayout.astro        ★SEO 标题入口①（通用工具页）
    ClockImmersiveLayout.astro ★SEO 标题入口②（category==='clock' 走这，改标题别漏）
  lib/              ★纯函数层：财金算法（china-tax / china-social-security / china-vat / china-calc-extra / mortgage）+ ★检索内核 search.ts / search-build.ts
  pages/            路由页（首页 / tools / blog / sites / agents / tips 等）
  styles/          全局样式
  tools/            ★工具本体：每工具一个目录 <id>/
    _shared/       工具间复用组件
  utils/           通用工具函数（含 goUrl() 出站链接）
  tools/types.ts    ★meta 契约（ToolMeta 类型定义）
  tools/registry.ts import.meta.glob 自动发现所有 meta.ts（但水合仍需手动注册）
astro.config.mjs    Astro 配置
package.json        scripts 与依赖版本基线
scripts/            optimize-sprite / gen-sitemap / check-widgets / check-icons / changelog-check / indexnow / test-*.mjs
deploy/            deploy.sh（build+上传+reload+indexnow）、server-setup.sh、nginx conf、systemd service
mcp/               build.mjs（esbuild → deploy/mcp/server.mjs + catalog.json）
dist/              构建产物（675 个 index.html，可重建，勿手改）
```

---

## 3. 技术规范（铁律）

### 3.1 新增工具「四件套」
每个工具是 `src/tools/<id>/` 下三个文件：
- `meta.ts` —— 导出 `meta`（遵循 `src/tools/types.ts` 的 `ToolMeta` 契约：name / seoTitle / description / category / icon / keywords 等）。
- `Tool.tsx` —— Preact 组件，含交互逻辑；默认导出。
- `content.mdx` —— 六段式 SEO 长文（正文，无 frontmatter）。

### 3.2 WidgetHost 手动注册四步（漏则「死壳」）
`registry.ts` 只自动发现 meta，**交互水合必须手动**在 `src/components/WidgetHost.astro` 补 4 处：
1. `import Xxx from '@/tools/<id>/Tool.tsx';`
2. `const isXxx = tool.id === '<id>';`
3. 加进 `known` 大 OR 表达式；
4. 渲染区补 `load` / `idle` / `visible` 三分支（如 `{isXxx && mode === 'visible' && <Xxx client:visible {...widgetProps} />}`）。

判定真上线：`grep -c astro-island dist/tools/<id>/index.html` ≥ 1。靠 `npm run check:widgets` 兜底（扫全部工具是否都注册，当前 282/282）。

### 3.3 命名规范
- 工具 id：kebab-case（`system-prompt-generator`），与目录名一致。
- 分类：只能用 `categories.ts` 的 11 个枚举：`convert` `text` `security` `calc` `dev` `image` `barcode` `ai` `life` `fun` `clock`。
- 新工具默认归 `calc`？——**否**，按实际语义选分类（AI 类归 `ai`）。

### 3.4 SEO 规范
- **`seoTitle` 与 `name` 分离**：`seoTitle` 只作用于 `<title>`；`name` 管卡片 / 面包屑 / h1。回退链：`seoTitle ?? title ?? tool.seoTitle ?? `${name} - 在线免费工具``。两处入口都要改（`ToolLayout` + `ClockImmersiveLayout`）。依据：Bing 实测标题首词命中查询词点击率约为未命中的 2.5 倍。
- `content.mdx` 正文六段式，**严禁裸 `<` `{` `}`**（MDX 当表达式解析 → `xxx is not defined` 构建报错）。JSON / 占位符示例一律走代码块或改写表述。
- `SITE.description` 里硬编码的工具总数，加工具要同步改。

### 3.5 财金算法单源（重要）
`src/lib/*.ts`（china-tax / china-social-security / china-vat / china-calc-extra / mortgage）是**纯函数层**，**MCP 与前端必须共用同一份**。禁止在 `Tool.tsx` 里另写一遍（契税 90㎡ vs 140㎡ 事故根因）。回归测试入口 `scripts/test-new-calc.mjs`。

### 3.6 图标复用
`src/components/icons.ts` 是 Lucide path 字典。优先复用已有图标；实在缺才补真实 path（源 `https://unpkg.com/lucide-static@1.47.0/icons/<name>.svg`）。`ICON_ALIASES` 刻意留空。新增工具若用未注册图标，`check:icons` 红灯。

### 3.7 changelog 必补
`src/data/changelog.ts` 顶部 `RELEASES` 每个 Release 必须包含本次新增的全部工具 id，否则 `changelog:check` 红灯（悬空 id 检测）。

### 3.8 出站链接
第三方链接统一走 `goUrl()`（`src/utils`），便于统计与安全管控。

### 3.9 站内检索单源（2026-10-23 建立）
`src/lib/search.ts` = **纯函数检索内核**（`normalize` / `prepareIndex` / `searchTools` / `hotTools` / `splitHighlight` / `editDistance`），
网页与 MCP **必须共用**，禁止再写第二份打分逻辑（同 3.5 财金单源原则）。
- `src/lib/search-build.ts` = 构建期索引生成器，**依赖 pinyin-pro（devDep）**，只在构建期跑，客户端永远拿不到拼音字典。
- 索引格式 v2 是**列式单字母 key**（n/g/k/y/s/c/p/u/i + cats），`buildSearchData()` 生成；`buildSearchIndex()` 是兼容层。
- 页面索引走 `<script type="application/json" id="mk-search-index">`，**不要塞进 astro-island props**（devalue 序列化会膨胀一倍多）。
- 拼音只在 `name` 上生成（全拼 + 首字母），keywords 不生成（收益低、体积高）。
- 回归测试 `scripts/test-search.mjs`（77 项，真实 meta 数据），已挂进 `check:all`。
- 方案全文 `docs/SEARCH-OPTIMIZATION-2026-10-23.md`。
- **长尾子页进索引（2026-11-03）**：`search-build.ts` 的 `subpageSources(owner, categoryName)` 把 `ToolMeta.subpages()` 展开成检索源，**`registry.buildSearchData()` 与 `mcp/build.mjs` 必须同调它**，否则「网站搜得到、MCP 搜不到」口径分裂。两条硬规则：
  - **只收浅层子页**（slug 不含 `/`）。全站 230 个子页里 213 个是单位换算深路径（`cm-to-km`），全收会把「厘米」冲成一片 cm-to-xxx；深路径由母页覆盖。
  - 子页的 `keywords` **只放母页名**，不放场景词/分类词（子页 name 已是完整问句，塞无关单字会放大单字噪音，并破掉「单字只命中名字含该字工具」断言）；`priority` 降 2 级，同分母页优先。
  - 现状：282 工具 + 78 浅层子页 = **360 条**，索引 56.5KB，单次检索 0.17ms。

---

## 4. 部署节点（线上拓扑）
| 节点 | 位置 | 说明 |
|---|---|---|
| Web 静态 | 服务器 `/var/www/mokakit` | nginx 托管；发布是**原子切换**（新内容先传 `.new`，校验后整体 `mv`，旧版留 `/var/www/mokakit.old` 可秒回滚） |
| MCP 服务 | 服务器 `/opt/mokakit-mcp` | systemd 服务 `mokakit-mcp`，监听 `127.0.0.1:18700`，由 nginx 反代对外；含 `server.mjs` + `catalog.json` + `.env` |
| 构建产物 | 本地 `dist/`（675 页） | 可重建，勿手改；sitemap 独立生成 |
| 部署脚本 | `deploy/deploy.sh` | `build → 上传 → nginx reload → IndexNow`；`--setup` 初始化、`--live` 切正式配置 |
| MCP 构建 | `npm run mcp:build` | esbuild 打包 `mcp/build.mjs` → `deploy/mcp/{server.mjs,catalog.json}`，再 scp 到 `/opt/mokakit-mcp` 并 `systemctl restart mokakit-mcp` |
| 域名 | `www.mokakit.com` | DNS → 58.87.68.151；HTTPS 由 nginx + Certbot 管理 |

**回滚**：`ssh root@58.87.68.151 'rm -rf /var/www/mokakit && mv /var/www/mokakit.old /var/www/mokakit && systemctl reload nginx'`。

---

## 5. 校验 / 构建 / 部署流程
1. **上线前必跑** `npm run check:all`（2026-11-03 起为**七项**：`check:widgets` + `check:icons` + `check:search` + `changelog:check` + `check:campaigns` + `check:ads` + `check:version`），全绿才敢 build。
2. **本地构建**（本机需 NODE_OPTIONS 垫片）：
   ```bash
   export NODE_OPTIONS="--require=D:/WorkBuddy/website/noop-shim.cjs"
   export PATH="/c/Users/zhao-/.workbuddy/binaries/node/versions/22.22.2-6:$PATH"
   node node_modules/astro/bin/astro.mjs build   # → optimize-sprite → gen-sitemap
   ```
3. **⚠️ sitemap 护栏**：`gen-sitemap.mjs` 在 `npm run build` 中**偶发静默不产出** sitemap（沙箱）。build 后务必 `ls dist/sitemap-0.xml` 确认；缺失则手动 `node scripts/gen-sitemap.mjs` 重跑，并把 `sitemap-0.xml` + `sitemap-index.xml` 单独 scp 到 `/var/www/mokakit/`。
4. **网站部署**：`bash deploy/deploy.sh root@58.87.68.151`（含 IndexNow 推送）；或手动 `tar -czf - -C dist . | ssh ...` 原子切换 + `nginx -t && systemctl reload nginx`。
5. **MCP 部署**：`npm run mcp:build` → scp `deploy/mcp/{server.mjs,catalog.json}` 到 `/opt/mokakit-mcp` → `chown mokakit:mokakit` → `systemctl restart mokakit-mcp`。

---

## 6. 更新记录（里程碑）
- **2026-10-06** 版本基线：astro 7.3.5 / @astrojs/mdx 8.0.2 / @astrojs/preact 6.0.5 / daisyUI 5.7.47 / ts 6.0.3。preact 锁 10.x、TS 勿升 7。
- **2026-10-09** SEO 标题策略重排（Bing 数据驱动）+ 全屏时钟拆分时钟族着陆页。
- **2026-10-11** 扩容至 **260 工具**（新增 14 个 AI / 智能体 / MCP 方向工具）；好站导航新增 MCP 分组 + 充实 ai-agent/ai-model；博客新增 `ai-agent-mcp-toolbox-2026.md`；全量部署上线 + MCP catalog 同步 260。
- **2026-10-12** 建立离线 + 线上双备份；制定本技术规范与项目专属知识库（KNOWLEDGE_BASE.md）；补充运行环境/版本基线（§10）与未决事项（§11）；github 远端同步（260 工具 + 知识库）；IMA 镜像知识库同步建立。
- **2026-10-23** 站内搜索重构：三套实现（SSR/客户端/MCP）收敛为 `src/lib/search.ts` 单源内核；补拼音（全拼+首字母）、英文 id 别名、词序/全角/标点归一、分层放宽与纠错、高亮与键盘导航；索引 52.6→39.8KB、搜索页 HTML 216→127KB；MCP `mokakit_search` 契约不变。详见 `docs/SEARCH-OPTIMIZATION-2026-10-23.md`。
- **2026-11-02** 场景选模型助手重做：18 场景 × 11 维能力 × 9 约束 + 自然语言需求识别 + 可解释推荐（加分项/代价/排除原因）+ 3 模型对比（表 + SVG 雷达）。算法抽 `src/tools/ai-model-selector/{data,logic}.ts`，价格与 `ai-price-compare/data` 同源；配 `npm run test:model-select`（38 项断言）。新增工具若需同类"选型/打分"能力，照此「data + logic + 纯函数 + 断言脚本」四件套落地。
- **2026-11-03** 场景选模型助手长出 18 个长尾子页并上线：`seo.ts`（每场景 slug/seoTitle/description/intro/faq）+ `meta.ts subpages()` 自动进 sitemap + `AiModelTaskContent.astro` 服务端渲染（Top5 排名表/权重表/首选理由/替代建议），`[...sub].astro` 透传 `initialTask` 让子页直达推荐结果。URL 规则 `/tools/ai-model-selector/<slug>/`。校验双保险：`npm run verify:subpages`（查 dist）、`scripts/verify-live-subpages.mjs`（查线上）。**`deploy.sh` 的 node/npm 路径已改为通配自动探测**（版本目录 `22.22.2` → `22.22.2-6` 曾导致失效）；🔴 **deploy.sh 必须前台 + dangerouslyDisableSandbox 跑，沙箱内 SSH 自检会因出站 22 被封而误报"无法连接"**。
- **2026-11-03（续）子页接入检索单源**：`subpageSources()` 成为子页入索引的唯一实现，`registry` 与 `mcp/build.mjs` 共用；索引 281→359 条、39.8→56.3KB、`check:search` 77 项全绿；网页与 MCP 均实测「搜『客服机器人』首条即 `customer-service` 子页」。同时修复 `scripts/ts-resolve.mjs` **不认 `@/` 别名**的老问题（原来只能解析相对路径，导致 Node 侧无法 import 带 `@/tools/types` 的 meta），现 `mcp:build` 与各 test:* 都要带 `--import ./scripts/ts-resolve.mjs`。MCP 产物替换后须 `systemctl restart mokakit-mcp`；旧版备份 `*.bak-<date>`；公网 401 是应用层鉴权（token 在 `/opt/mokakit-mcp/.env`）不是故障。
- **2026-11-03（三）治理三件套 → v0.10.0**：① 活动生命周期机制：新增 `src/config/campaigns.ts`（`startAt`/`endAt`/`active` + `resolveCampaign()`），构建期判定、到期自动下线，教师普惠（09-30 结束）按机制自动下线；`scripts/check-campaigns.mjs` 进闸门对过期/临期报警。② 广告版位治理：`SITE.ads.slots` 版位级开关（未登记=不投放）、`maxPerPage=2`、中文「广告」标识；`scripts/check-ads.mjs` 校验。③ 版本号规范：`docs/VERSIONING.md` + `bump-version.mjs` + `check-version.mjs`，changelog 新增 `pkgVersion` 字段建立"日期批次 ↔ 工程版本"映射。`check:all` 由 4 项扩为 7 项。
- 更细的逐日记录见 `.workbuddy/memory/YYYY-MM-DD.md`；结构化 Release 见 `src/data/changelog.ts`。

---

## 7. 避雷清单（血泪坑）
- 🔴 **WidgetHost 漏注册** → 构建成功但 0 个 astro-island，工具是死壳。改完必跑 `check:widgets`。
- 🔴 **财金算法写两份** → 口径漂移事故。只改 `src/lib/*.ts`，MCP/前端共用。
- 🔴 **gen-sitemap 静默** → build 后查 `dist/sitemap-0.xml`，缺失手动补跑 + 补传。
- 🔴 **git 提交**：用显式路径 `git add <具体文件>`，**绝不 `git add -A`**（仓库混有 `_cprof`/`dist_partial_*`/早期未提交内容，会卷进来）。
- ⚠️ **MDX 裸 `<` `{` `}`** → 构建报 `xxx is not defined`。批量生成 content.mdx 后必查。
- ⚠️ **SEO 标题两入口** → 改 `seoTitle` 别漏 `ClockImmersiveLayout`（clock 类页）。
- ⚠️ **NODE_OPTIONS 垫片**只用于 website 项目；切到别的项目前 `unset NODE_OPTIONS`，否则 MODULE_NOT_FOUND。
- ⚠️ **`.mjs` 块注释里别写 `src/tools/*/meta.ts`** —— `*/` 会提前闭合注释，报 `SyntaxError: Invalid or unexpected token`（2026-10-23 踩过，写 `<id>` 代替）。
- ⚠️ **静态站读不到 `?q=`**：`Astro.url.searchParams` 在构建期恒为空。任何依赖 URL 参数的交互都必须在客户端 `window.location.search` 里读（搜索页曾因此丢掉「分享链接复现搜索」）。
- ⚠️ 后台长命令禁止 `| tail`/`| head`（管道提前关闭会永久挂起），改用 `> _x.log 2>&1`。
- ⚠️ Bash PATH 偶发损坏，命令开头加 PortableGit 的 PATH 修复。
- ⚠️ 同一文件多条 Edit **必须顺序执行**（并行会互相覆盖）。
- ⚠️ astro 入口各项目不同：website 是 `node_modules/astro/bin/astro.mjs`。

---

## 8. 下次更新前必读清单
1. 先读 **本文件 + `MEMORY.md`**（本文件是全局大脑，`MEMORY.md` 是高频速查）。
2. 改/加工具前，先读 `src/tools/types.ts`（meta 契约）、`src/config/categories.ts`（分类枚举）、`src/tools/registry.ts` + `src/components/WidgetHost.astro`（注册机制）。
3. 新增工具必须：四件套齐全 + WidgetHost 四处注册 + `changelog.ts` 补 id。
4. 构建后必查 `dist/sitemap-0.xml`（防 gen-sitemap 静默漏产）。
5. 部署：网站走 `deploy/deploy.sh` / 原子切换；MCP 改后必 `mcp:build` + 远端重启 + 验证 `catalog` 工具数。
6. 提交代码：`git add` 显式路径，绝不 `-A`；push 走 HTTPS token 通道（前台 + `dangerouslyDisableSandbox`）。**垃圾目录 `_cprof` / `dist_partial_*` / `_genui_apps` / `_genui_dl` / `outputs` 必须显式避开**（见 §11.4 与 §7 避雷）。
   - 🔴 **push 失败先分清是哪一层断的（2026-11-03 实测踩了很久）**：`github.com:443` 被整段阻断（TCP 都连不上）时，**`api.github.com` 往往正常**。诊断顺序：`curl -o /dev/null -w '%{http_code} %{time_connect}' https://github.com/` → 若 `code=000 / connect=0` 是网络层断；再测 `https://api.github.com/` → 若 200 即 API 通道可用。
   - 环境里注入了代理 `http(s)_proxy=http://127.0.0.1:60045`，该代理会返回 **`CONNECT tunnel failed, response 502`**，所以脚本里必须 `export HTTPS_PROXY= HTTP_PROXY= ...` 清空后走直连；但清空后若 github.com 本身被阻断，仍会 `Connection was reset`。**两种失败要分开判断，别把 502 当成"代理没问题"**。
   - API 可用时用 `npm run push:api`（`scripts/push-via-api.mjs`）：blob → tree → commit → 快进分支引用，逐校验哈希、幂等。⚠️ GitHub 会重写 author/committer，**远端 commit 的 SHA 与本地必然不同**（内容逐字节一致），推完要 `git fetch origin && git reset --hard origin/master` 让历史收敛。
   - 另注：`~/.gitconfig` 有 `url.https://github.com/.insteadOf=git@github.com:`，所以 `git push git@github.com:...` 会被改写成 HTTPS —— 想走 SSH 必须临时 `-c url.https://github.com/.insteadOf=` 覆盖。
7. 任何破坏性 / 不可逆操作前，先备份、再二次确认。
8. **动依赖 / 升级运行时前必读 `§10 运行环境与版本基线`**：本地 Node 22 vs 服务器 Node 18 的差异（MCP 必须 esbuild `target=node18`）、TS 勿升 7、astro/preact 锁版本。
9. **未决事项见 `§11`**：财金算法去重（P-01）、闸门强制化（P-02）、大页渲染、GenUI 提交路径等，等旺财决策前**勿擅自改**源码。已关闭项（markdown-preview XSS、教师普惠开关）见 §11.2，不要再当待办处理。
10. 本机无绿盾，D 盘项目可直接读写落盘；但 `NODE_OPTIONS` 垫片仅 website 项目用，切项目前 `unset`。

---

## 9. 备份策略（2026-10-12 建立）
- **线下**：`D:/WorkBuddy/backups/mokakit-source-YYYYMMDD.tar.gz` —— 本地工作区快照（含未提交改动），排除 `node_modules/dist/.astro/_cprof/dist_partial_*/_eprof/_genui_*/generated-images/.git/*.log`。
- **线上**：服务器 `/var/backups/mokakit-www-YYYYMMDD.tar.gz`（站点）+ `mokakit-mcp-YYYYMMDD.tar.gz`（MCP）；每次大版本发布/重要变更前刷新。
- 最新快照（A：`ls -lh D:/WorkBuddy/backups/`，2026-11-03 实测）：`mokakit-source-20261012.tar.gz`（16M）、`mokakit-source-20261101.tar.gz`（43M）。**只有本地两份，无异地副本、无自动定时**——本机与服务器同毁即全失（基准文档 R-09）。

---

## 10. 运行环境与版本基线（2026-10-12 核实，动依赖前必读）

> ⚠️ 改 `package.json` 依赖 / 升级任何运行时前，先读本节。版本错配会直接 build 失败或 MCP 运行时崩溃。

### 10.1 本地构建环境（开发机 zhao-，Windows）
| 组件 | 版本 / 路径 | 用途 |
|---|---|---|
| Node.js（构建） | **v22.22.2**（托管版 `C:\Users\zhao-\.workbuddy\binaries\node\versions\22.22.2-6`） | Astro build / 脚本运行 |
| npm | 10.9.7 | 依赖管理（**别用 `npm i -g`**，污染系统） |
| Git | 2.55.0.windows.3 | 版本控制 |
| Python（托管） | 3.13.12（venv `...\python\envs\default`） | 脚本 / 批量处理（如 logo 生成） |
| 隔离 npm workspace | `C:\Users\zhao-\.workbuddy\binaries\node\workspace` | 装 `@cosui/genui-toolkit` 1.0.4、`@resvg/resvg-js` 等，不污染系统 |
| NODE_OPTIONS 垫片 | `--require=D:/WorkBuddy/website/noop-shim.cjs` | **仅 website 项目** build 用；切项目前 `unset` |

### 10.2 项目依赖基线（2026-11-03 实测复核：与 10-06 基线**零漂移**）
| 包 | 版本 | 约束 |
|---|---|---|
| astro | ^7.3.5 | 锁 7.x，勿动 |
| @astrojs/preact | ^6.0.5 | — |
| @astrojs/mdx | ^8.0.2 | — |
| preact | ^10.29.8 | 锁 10.x |
| daisyui | ^5.7.47 | — |
| tailwindcss | ^4.3.3 | v4（非 v3 写法） |
| @tailwindcss/vite | ^4.3.3 | — |
| typescript | ^6.0.3 | **勿升 7** |
| esbuild | 0.28.1 | MCP 构建（`mcp/build.mjs` 直接 import）｜⚠️ **未在 package.json 显式声明**，靠传递依赖存在，重装依赖后若 build.mjs 报找不到 esbuild，需补为 devDependency |
| dompurify | ^3.4.17（实装 3.4.17） | markdown-preview 消毒，勿删 |
| pinyin-pro | ^3.29.5（devDep） | 仅构建期生成拼音索引，不进客户端包 |

### 10.3 服务器环境（58.87.68.151，root）
| 项 | 值 |
|---|---|
| OS | Ubuntu 24.04.4 LTS (Noble Numbat) |
| nginx | 1.24.0 (Ubuntu)，HTTPS 由 Certbot 管理 |
| Node.js（MCP 运行时） | **v18.19.1** |
| 磁盘 | 50G 总 / 6.6G 用 / 41G 余（14%） |

### 10.4 服务进程与端口
- **mokakit-mcp**：systemd 服务（loaded + active），监听 `127.0.0.1:18700`，由 nginx 反代对外；重启 `systemctl restart mokakit-mcp`。
- **nginx**：托管 `/var/www/mokakit`，监听 80/443；reload `nginx -t && systemctl reload nginx`。

### 10.5 🔴 版本硬坑：本地 Node 22 vs 服务器 Node 18
MCP 服务跑在服务器 Node **v18**，没有 `--experimental-strip-types`，无法直接 import `.ts`。因此 `mcp/build.mjs` 用 esbuild 把 `mcp/server.mjs` + `src/lib/*.ts` 打成一个 `target=node18 / format=esm` 的自包含 `deploy/mcp/server.mjs`。**改 MCP 后必须 `npm run mcp:build` 重建**，手改 `server.mjs` 会被下次 build 覆盖。

---

## 11. 未决事项 / 待办（等旺财决策，勿擅自改）

> 这些项是"下次更新"前需要旺财拍板的，agent 看到不要自作主张动源码。
> **2026-11-03 重构**：原 §11 的第 2 项（XSS）与第 5 项（教师普惠）已关闭，移入 §11.2 留档；其余保留并重新编号。取舍依据见 §0.0 取舍原则第 3 条。

### 11.1 仍未决（按优先级）

1. **P-01 财金算法去重（5 个工具）— 最高优先**：`after-tax-salary` / `overtime-pay` / `deposit-interest` / `retirement-age` / `pension-estimate` 的算法仍写在各自 `Tool.tsx` 里，`src/lib` 中没有对应模块（A：`ls src/lib` 实测为空），而 MCP 侧已有 `after_tax_salary_cn` 等 5 个工具 → 双写风险实存。唯一真源应是 `src/lib/*.ts`（deed-tax 已治理，配 `scripts/test-deed-tax.mjs`）。改前先对齐税率/基数口径。
2. **P-02 闸门强制化**：`check:all` 已扩到 7 项，但 `check:units` / `test:model-select` / `test-china-tax` / `test-deed-tax` / `test-new-calc` / `verify:subpages` 仍未纳入；且 `npm run build` 与 `deploy.sh` 都不调用 `check:all`，无 CI 无 lint（A：`package.json`、`deploy.sh`）。→ 是否扩闸门、是否在 build 前强制、是否上 CI，等旺财定。
3. **P-03 大页渲染**：changelog 页约 465KB、tools 索引约 412KB 全量渲染（C 级，2026-11-03 **未复测**）。方案：分页 / 虚拟列表 / 分片 JSON。
4. **P-04 垃圾目录别提交**：`_cprof` / `dist_partial_*` / `_genui_apps` / `_genui_dl` / `outputs` / `_kms_src` 是被 git 跟踪或工作区遗留的临时产物；提交务必显式路径避开（§7 避雷 + §8.6）。
5. **P-05 百度 GenUI 小工具提交路径**：`.workbuddy/skills/genui-app-builder/` 已就位（含 3 个试验产物在 `_genui_apps/`，**未提交**），但 MokaKit 工具大量用 localStorage / CDN / clipboard，与 GenUI「纯本地不联网、状态不持久」硬约束冲突，移植需逐个改造。发布还需旺财 `genui login` 百度账号。动这条线前必问旺财。
6. **P-06 分类失衡**：calc 92 / dev 57（合计 53%），barcode 仅 3（A：§1 分类分布）。后续加工具优先补 barcode / image / fun / clock。
7. **P-07 GSC / MCP token 仍人工**：GSC 后台人工提交 sitemap-index.xml；MCP token 仍人工 mailto 审批（`/developers/mcp-token-apply/` 已有申请页，但是否自动化未定）。
8. **P-08 备份异地化**：只有本地两份 + 服务器本地目录，无异地、无定时（见 §9）。用哪家存储、频率、是否加密待定。
9. **P-09 推广投放执行**：方案见 `docs/PROMOTION-PLAN.md`；腾讯云推广联盟开户、百度联盟申请、付费预算均需旺财本人操作与决策。

### 11.2 已关闭（留档，含关闭依据）

| 原项 | 关闭结论 | 依据 |
|---|---|---|
| markdown-preview 的 `dangerouslySetInnerHTML` 无消毒 | **已修复**：已引入 `dompurify ^3.4.17`，渲染前 `DOMPurify.sanitize(raw)` | A：`src/tools/markdown-preview/Tool.tsx:3,50`；`package.json` dependencies |
| `site.ts` 教师普惠开关注释标 09-30 到期 | **已由机制接管**：活动统一登记到 `src/config/campaigns.ts`，`endAt: '2026-09-30'`，构建期判定为 `expired`，**自动不再渲染**；`active` 保留但不再是唯一开关。若官方续期，只需改 `endAt`，不必改代码 | A：`src/config/campaigns.ts`、`src/config/site.ts`（`teacherLive`）、`scripts/check-campaigns.mjs`；规范见 `docs/CAMPAIGN-POLICY.md` |

### 11.3 本轮已决策（2026-11-03，不再反复讨论）

| 决策 | 结论 | 落点 |
|---|---|---|
| 版本落点 | 0.9.12 → **0.10.0**（继续 0.x，1.0.0 留给 P0 债清完之后） | `package.json`、`docs/VERSIONING.md` §5 |
| 活动时间管理 | 采用「构建期判定 + 闸门报警 + 7 天内重建」三重机制，不引入运行时脚本 | `src/config/campaigns.ts`、`docs/CAMPAIGN-POLICY.md` |
| 广告位治理 | 版位必须显式登记才投放；单页上限 2；全部带中文「广告」标识 | `SITE.ads.slots`、`AdSlot.astro`、`scripts/check-ads.mjs` |
| 推广范围 | 先出方案 + 站内版位改造；开户与花钱由旺财执行 | `docs/PROMOTION-PLAN.md` |
