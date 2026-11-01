# MokaKit 摩卡工具箱 · 更新路线图（2026-11 版）

> 制定：大美丽（AI 桌面搭子）｜基点：2026-11-01｜配套真值源：`.workbuddy/memory/KNOWLEDGE_BASE.md` + `MEMORY.md`  
> 本文为**规划文档**，所有改动在旺财先生确认后分阶段执行；标 🔴 项需旺财拍板，执行前不动源码。

---

## 0. 现状评估（基于 2026-11-01 实测）

| 维度                   | 状态                                            | 证据                                                                                                                                                                |
| -------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 规模                   | **281 工具 / 11 分类**                            | `check:all` 报告工具总数 281                                                                                                                                            |
| 健康闸门 `check:all`     | **全绿**                                        | 281/281 注册 WidgetHost；图标 145 字典全解析；搜索 71 项测试通过；changelog 无漏登/悬空                                                                                                   |
| 依赖版本                 | 与 2026-10-06 基线**零漂移**                        | astro 7.3.5 / preact 10.29.8 / daisyui 5.7.47 / ts 6.0.3 与基线一致                                                                                                    |
| 本地 Node / 服务器 Node   | v22.22.2 / v18.19.1（双版本约束）                    | MCP 必须 esbuild `target=node18`                                                                                                                                    |
| 最近提交                 | **2026-10-26**                                | `git log`                                                                                                                                                         |
| **未提交改动**            | **🔴 32 个文件 dirty**                           | `git status -s`；每日升级自动化只改不 commit，有丢失/无版本历史风险                                                                                                                     |
| 财金算法单源               | **🔴 完全未抽层**                                  | after-tax-salary / overtime-pay / deposit-interest / retirement-age / pension-estimate 在 `src/lib` 中 lib 计数均为 **0**，逻辑全在各自 `Tool.tsx`（178–261 行），MCP 无法复用、口径漂移风险高 |
| markdown-preview XSS | **🔴 实锤**                                     | `src/tools/markdown-preview/Tool.tsx:55` `dangerouslySetInnerHTML={{__html: html}}` 无消毒                                                                           |
| 存量 TS 类型错误           | **64 处 / 33 文件**（需 re-baseline 复核）            | 长期积累，与 TS6 无关（vat-calc 17 / bonus-tax-cn 11 / ratio-calculator 5 / timestamp-converter 4，其余分散）                                                                    |
| 大页渲染                 | changelog 页 ~465KB、tools 索引 ~412KB 全量渲染       | KNOWLEDGE_BASE §11.3，性能待优化                                                                                                                                        |
| 分类失衡                 | calc 80 / dev 53 / barcode 3                  | KNOWLEDGE_BASE §11.7                                                                                                                                              |
| 待决策项                 | 教师普惠开关（09-30 到期）、GenUI 提交路径、GSC/MCP token 仍人工 | KNOWLEDGE_BASE §11                                                                                                                                                |

**结论**：项目**功能可达、闸门健康**，但处于"每日微迭代、零战略维护"状态——依赖 8 周未升、技术债累积、32 个改动未落地。这与"长时间未维护"的判断一致（维护停留在加法，缺少健康度维护）。

---

## 1. 依赖与版本升级策略

### 1.1 可安全升级（同大版本内 minor/patch，低风险）

`npm outdated` 实测可用升级：

| 包               | 当前 → 目标             | 类型    | 风险       |
| --------------- | ------------------- | ----- | -------- |
| astro           | 7.3.5 → **7.4.1**   | minor | 低（锁 7.x） |
| @astrojs/mdx    | 8.0.2 → **8.1.0**   | minor | 低        |
| @astrojs/preact | 6.0.5 → **6.1.0**   | minor | 低        |
| @astrojs/check  | 0.9.10 → **0.9.12** | patch | 低        |
| daisyui         | 5.7.47 → **5.7.50** | patch | 低        |
| gpt-tokenizer   | 4.0.0 → **4.1.0**   | minor | 低        |
| marked          | 18.1.0 → **18.1.2** | patch | 低        |

### 1.2 明确冻结（MAJOR，按铁律不升）

- **preact：锁 10.x**（latest 11.1.1，MAJOR，破坏性，禁止跳 11）
- **typescript：锁 6.x**（latest 7.0.2，MAJOR，禁止升 7）
- 升级前必读 KNOWLEDGE_BASE §10 + §7 避雷（NODE_OPTIONS 垫片、sitemap 静默、双 Node 约束）。

### 1.3 升级流程护栏

1. 单独分支升级 → `check:all` 全绿 → `astro check` 复核 → 本地 `build` 验证。
2. build 后必查 `dist/sitemap-0.xml`（`gen-sitemap` 偶发静默漏产）。
3. 升级后必重跑 `npm run mcp:build`（双 Node 约束，MCP 打包产物须重建）。
4. 灰度：先 dev 跑通 → 单工具冒烟 → 全量构建 → 部署。

---

## 2. 功能改进与缺陷修复优先级

### P0 — 安全 / 正确性（必须，先止血）

1. 🔴 **财金 5 工具抽纯函数层**：在 `src/lib/` 落地 `after-tax-salary.ts` 等 5 个纯函数模块，前端 `Tool.tsx` 与 MCP 共用；补齐回归测试（参照 `scripts/test-deed-tax.mjs` / `test-new-calc.mjs`）。
2. 🔴 **markdown-preview XSS 消毒**：引入 `dompurify`（方案 A，推荐）或自研白名单（B），替换裸 `dangerouslySetInnerHTML`。
3. 🔴 **落地 32 个未提交改动 + 清理 git 垃圾目录**：显式 `git add` 具体文件（**绝不 `-A`**），避开 `_cprof` / `dist_partial_*` / `_genui_*` / `outputs`。

### P1 — 质量 / 性能（重要）

1. **TS 错误基线治理**：re-baseline 实际数量 → 收敛至 0 或可控上限（新代码零新增）。
2. **大页渲染优化**：changelog / tools 索引改分页或按需加载（虚拟列表 / 分片 JSON）。
3. **站内搜索索引持续优化**：列式索引 39.9KB 已佳，关注增量工具接入后的体积/时延。
4. **分类失衡补充**：往 barcode(3)/fun 等稀疏类目补工具，平衡导航。

### P2 — 增强（待决策）

1. 教师普惠开关（site.ts 09-30 到期待旺财定续期或移除）。
2. GenUI 小工具提交路径（与 GenUI「纯本地不联网」硬约束冲突，需逐个改造 + 百度账号 login，动前问旺财）。
3. MCP tool 数自动校验接入 `check:all`；GSC sitemap / MCP token 审批尝试自动化。

---

## 3. 必要的重构或迁移建议

- **财金算法单源化（最高优先级重构）**：现状 5 工具各自为政，MCP 侧等于盲写一份。抽 `src/lib` 后前端 + MCP 共用，消除口径事故（契税 90/140㎡ 前车之鉴）。
- **工具注册自动化**：`WidgetHost.astro` 手动四步极易漏（漏则死壳）。建议探索 `import.meta.glob` 自动水合，或脚本在新增工具时自动补全四处注册；`check:widgets` 作兜底。
- **SEO 标题两入口统一**：`ToolLayout.astro` 与 `ClockImmersiveLayout.astro` 改 `seoTitle` 易漏其一。抽公共 `<title>` 组装函数，单点维护。
- **大页渲染 → 分片/虚拟列表**：changelog、tools 索引改客户端分页，首屏体积砍掉 70%+。
- **测试体系增强**：现有 `scripts/*` 单测（search 71 / calc 51 / deed-tax）已稳，建议接入定时回归（本机环境特殊，CI 用 GitHub Actions 需另行评估）。

---

## 4. 测试与发布策略

- **本地闸门**：`npm run check:all`（widgets/icons/search/changelog）全绿 + `astro check` 复核 TS 基线。
- **构建护栏**：`NODE_OPTIONS="--require=D:/WorkBuddy/website/noop-shim.cjs"`；build 后查 `dist/sitemap-0.xml`；抽查 `grep -c astro-island dist/tools/<id>/index.html ≥ 1` 确认真水合。
- **发布**：网站走 `deploy/deploy.sh` 原子切换（新内容传 `.new` → 校验 → `mv`，旧版留 `.old` 可秒回滚）；MCP 改后必 `mcp:build` → scp `deploy/mcp/{server.mjs,catalog.json}` → `systemctl restart mokakit-mcp` → 校验 catalog 工具数=281。
- **灰度顺序**：单工具冒烟 → 单分类 → 全量；回滚命令见 KNOWLEDGE_BASE §4。
- **备份**：发布前刷新 `D:/WorkBuddy/backups/mokakit-source-YYYYMMDD.tar.gz` 与服务器 `/var/backups/mokakit-*-YYYYMMDD.tar.gz`。

---

## 5. 分阶段执行时间表

### Phase 0 — 现状冻结与基线（约 1–2 天）

- **目标**：把"未知"变"已知"，锁住可发布状态。
- **关键任务**：① re-baseline 实际 TS 错误数（跑 `astro check` 落盘解析）；② 备份源 + 线上；③ 梳理 32 个未提交改动归属；④ 更新 KNOWLEDGE_BASE 现状段。
- **交付物**：`TS-ERROR-BASELINE.md`（真实计数）；完整备份；现状快照。
- **退出标准**：已知债务清单精确化，仓库有一个可发布基线 commit。

### Phase 1 — 安全与正确性（P0，约 3–5 天）

- **目标**：止血 3 个 P0。
- **关键任务**：① 财金 5 工具抽 `src/lib` 纯函数层 + 回归测试；② markdown-preview 引 dompurify 消毒；③ 提交 32 改动 + 清垃圾目录。
- **交付物**：5 个 lib 模块 + 测试；XSS 修复；干净 git 树 + 基线 commit。
- **退出标准**：`check:all` 全绿、MCP catalog 复用新 lib、XSS 测试通过、git 树干净。

### Phase 2 — 依赖升级（约 2–3 天）

- **目标**：吃掉可用 minor/patch，不动 MAJOR。
- **关键任务**：升级 §1.1 七包 → `check:all` + `astro check` + 本地 build + `mcp:build` 全过。
- **交付物**：package.json 更新 + lockfile + 升级 commit；升级前后 `check:all` 对照记录。
- **退出标准**：站点与 MCP 均构建通过、回归测试无退化。

### Phase 3 — 质量与性能（P1，约 1–2 周）

- **目标**：收敛 TS 债、压大页。
- **关键任务**：TS 错误治理（新代码零新增）；changelog/tools 索引分页或按需加载；稀疏分类补工具。
- **交付物**：TS 收敛报告；大页优化 PR；分类补充若干工具。
- **退出标准**：TS 错误达上限内、首屏体积显著下降、changelog:check 仍全绿。

### Phase 4 — 架构重构（P2，可选，约 1 周）

- **目标**：降长期维护成本。
- **关键任务**：WidgetHost 注册自动化；SEO 标题两入口统一；测试接入定时回归。
- **交付物**：注册脚本/自动水合；统一 title 函数；回归计划。
- **退出标准**：新增工具不再需手动四步；SEO 单点维护；死壳风险归零。

### Phase 5 — 全量发布与监控（约 2–3 天）

- **目标**：安全上线 + 可观测。
- **关键任务**：全量 build + sitemap 校验 + 原子部署 + MCP 重启校验 + 备份刷新；GSC 提交 sitemap-index（人工）。
- **交付物**：线上 281 工具 + 同步 MCP catalog；发布记录写入 `src/data/changelog.ts`。
- **退出标准**：线上+ MCP 双通道可用，回滚预案验证有效。

---

## 6. 关键风险与决策点

| 风险 / 决策               | 说明                            | 处置                          |
| --------------------- | ----------------------------- | --------------------------- |
| 🔴 财金抽层范围             | 5 工具口径需对齐个税/社保现行规则            | 抽层前先核对最新税率表，避免"修旧错"         |
| 🔴 XSS 方案选型           | dompurify（A，推荐）/ 自研（B）/ 接受（C） | 旺财拍板，默认 A                   |
| 🔴 每日自动化与 Phase 冲突    | 自动化仍会本地改工具                    | Phase 执行期暂停自动化或限定其只动非冲突区    |
| 双 Node 版本             | 本地 22 / 服务器 18                | MCP 改动后必须 `mcp:build`，勿手改产物 |
| 未决项（教师开关/GenUI/token） | 等旺财决策                         | 不擅自改源码，列入 P2 决策门            |



---

> 下一步：旺财先生确认路线图后，我从 **Phase 0** 开干（先 re-baseline + 备份 + 梳理 32 未提交改动）。标 🔴 项请在 Phase 1 前给结论（尤其 XSS 方案、财金抽层口径、每日自动化是否暂停）。
