# MokaKit 摩卡工具箱 — 项目长期记忆

> 📚 **项目专属知识库（更新前必读）**：`.workbuddy/memory/KNOWLEDGE_BASE.md` —— 含目录结构、技术规范（新增工具四件套 / WidgetHost 注册 / SEO / 财金单源）、部署节点、更新记录里程碑、避雷清单、下次更新前必读清单。任何 MokaKit 改动 / 部署前先读它。
> 目录 `D:\WorkBuddy\website`；git master，远端 github.com/wangcai-zhao/mokakit-website.git。续干：KNOWLEDGE_BASE.md → 本文件 → 当日日志 → conversation_search。

## 架构
- Astro 7 + Preact 10 + daisyUI 5 + Tailwind v4，纯静态。**282 个工具** / 11 分类（2026-11-04 实测；dist 677 页 / sitemap 674 条）。
- 📌 **基准文档（2026-11-03，v1.1 为准）**：资料库现行 `node_id=7Qgcf0KPlutnGPlQFaGZ7N`（v1.1，含 §14 治理落地）；v1.0 条目 `node_id=xjHueaEZDz1RMQQwfxddK3` 已改名「【已归档·以 v1.1 为准】…」并在正文顶部写入归档声明（2026-11-03 落地），**勿在其上继续维护**。⚠️ 资料库**无节点删除 API**（Agent 删不掉条目），淘汰旧版只能靠改名 + 正文公告。本地目录另有 `README.md` 作版本索引。本地 `D:\WorkBuddy\mokakit-baseline\MokaKit-项目基准文档-v1.1-2026-11-03.md`。含模块地图/节点/执行标准/SOP-01~12/迭代周期/风险登记册 R-01~20/待决策 P-01~10/**旧文档 10 项更正**/治理落地记录。写任何 MokaKit 结论先对齐它，并按 A(源码实测)/B(脚本实测)/C(历史文档未复测)/D(记忆) 标证据级别。
- 🔧 **治理机制（2026-11-03 落地，v0.10.0）**：
  - **版本号**：唯一真源 `package.json`（当前 `0.10.0`），`changelog.Release.pkgVersion` 建立"日期批次 ↔ 工程版本"映射；升版用 `npm run release:patch|minor|major`；规则 `docs/VERSIONING.md`（1.0.0 留给 R-01/02/03 清完之后）。
  - **活动时间管理**：起止与开关在 `src/config/campaigns.ts`（`startAt/endAt/active`），构建期 `resolveCampaign()` 判定，到期自动不渲染；组件读 `inviteLive`/`teacherLive`，**别读 `active`**；`check:campaigns` 报警；规范 `docs/CAMPAIGN-POLICY.md`（活动结束后 7 天内必须重建）。教师普惠已用此机制关闭。
  - **广告位**：必须先在 `SITE.ads.slots` 登记才投放（**未登记 = 不投放**），单页上限 `maxPerPage: 2`，带中文「广告」标识；`check:ads` 校验；方案 `docs/PROMOTION-PLAN.md`。
  - **闸门**：`check:all` 已由 4 项扩为 **7 项**（widgets / icons / search / changelog / campaigns / ads / version）。
- 🔴 **`seoTitle` 与 `name` 要分开**：`ToolMeta.seoTitle` / `SubPage.seoTitle` 只作用于 `<title>`，`name` 管卡片、面包屑、h1。回退顺序 `seoTitle ?? title ?? tool.seoTitle ?? \`${name} - 在线免费工具\``。接入点有**两处**：`ToolLayout.astro` 和 **`ClockImmersiveLayout.astro`**（`category==='clock'` 的页走后者，改 SEO 标题时别漏）。依据：2026-10-09 Bing 数据实测，同一排名区间下标题首词命中查询词的点击率约为未命中的 2.5 倍。
- **新工具四件套**：`src/tools/<id>/` 的 meta.ts + Tool.tsx + content.mdx + **WidgetHost.astro 注册**。
  registry.ts 用 import.meta.glob 自动发现 meta，但**水合必须静态 import**：WidgetHost 里要补①import ②`const isXxx = tool.id==='<id>'`③加进 `known` ④渲染区 load/idle/visible 三分支。漏④→ build 成功但 0 个 astro-island，工具是死壳。靠 `npm run check:widgets` 兜。
- 判定真上线：`grep -c astro-island dist/tools/<id>/index.html` ≥1。
- 🔴 **财金算法只能有一份**：`src/lib/*.ts`（china-tax / china-social-security / china-vat / china-calc-extra / mortgage）是纯函数层，**MCP 与前端必须共用**。禁止在 Tool.tsx 里另写（契税 90㎡ vs 140㎡ 事故根因）。deed-tax 已治理并配 `scripts/test-deed-tax.mjs`；after-tax-salary / overtime-pay / deposit-interest / retirement-age / pension-estimate 待治理。
- 三类真源：`src/config/site.ts`（备案/统计/广告/版本由 package.json 派生）、`src/config/categories.ts`（分类）、`src/tools/types.ts`（meta 契约）。
- 出站第三方链接走 `goUrl()`；`SITE.description` 里工具总数硬编码，加工具要同步。新增工具后必须补 `src/data/changelog.ts` 的 id，否则 changelog:check 红灯。
- icons.ts 是 Lucide path 字典；`ICON_ALIASES` 刻意留空，缺图标就给 ICONS 补真实 path（源：`https://unpkg.com/lucide-static@1.47.0/icons/<name>.svg`）。

## 校验与构建
- 上线前 `npm run check:all`（**7 项**：widgets + icons + search + changelog + campaigns + ads + version）。
- `npm run build` = astro build → optimize-sprite → gen-sitemap。
- 🔧 **离线单文件版机制（2026-11-04 落地）**：`npm run offline:desensitize` → `scripts/build-offline-desensitize.mjs` 用 esbuild 把站内 `doc-desensitize/desensitize.ts` 打成 IIFE 注入自包含 HTML，产出 `public/download/mokakit-doc-desensitize.html`（26KB，零外链，双击可用），随 public 发布到站点 `/download/`。**引擎必须从站内那份 .ts 打包（同源），禁止复制重写**；站内改了识别规则要重跑本脚本，否则离线版会落后。
- 版本基线（2026-10-06）：astro 7.3.5 / @astrojs/mdx 8.0.2 / @astrojs/preact 6.0.5 / daisyui 5.7.47 / ts 6.0.3 / @astrojs/check 0.9.10。**preact 锁 10.x、TS 别升 7**。
- ⚠️ **存量 64 个类型错误（33 文件）**，与 TS6 无关是长期积累：vat-calc 17 / bonus-tax-cn 11 / ratio-calculator 5 / timestamp-converter 4，其余分散。新代码别再增加。
- 测试脚本跑法：`node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/<x>.mjs`（test-china-tax / test-deed-tax / test-new-libs / check:units）。
- 构建命令：`export NODE_OPTIONS="--require=D:/WorkBuddy/website/noop-shim.cjs"`，node 用 `.../binaries/node/versions/22.22.2-3/node.exe`。
- build 卡死/只产 1 个 html → `mv .astro _astro_bak_xxx` 重建缓存。2026-10-07 实测过另一种症状：`dist/tools` 只出 160 个且缺 a–l 段、日志只有 1.70s，同样清缓存解决。
- astro 入口**各项目不同**：website 是 `node_modules/astro/bin/astro.mjs`；personal-site 是 `node_modules/astro/astro.js`。
- `NODE_OPTIONS="--require=D:/WorkBuddy/website/noop-shim.cjs"` **只**用于 website；切到别的项目前必须 `unset NODE_OPTIONS`，否则 MODULE_NOT_FOUND。
- 算法回归测试统一入口：`scripts/test-new-calc.mjs`（2026-10-07 新建，51 项断言，覆盖 5 个新算法的正常算例与边界输入）。

## MCP（战略核心）
- www.mokakit.com/mcp；systemd /opt/mokakit-mcp，127.0.0.1:18700 + nginx 反代。改工具后必须 `npm run mcp:build`（esbuild → deploy/mcp/server.mjs + catalog.json）再部署。

## 每日工具升级自动化（全自动·单步，2026-11-01 简化合并）
- 现为一个全自动自动化 `86f3d35a-7205-4a97-b626-85fd246381c3`（每天 20:00，ACTIVE）。原晚总结 `7eaf3aec-b3f5-4fe1-a9ee-621e9572dc86` 已于 2026-11-01 删除。
- 流程：每天定点自动选 2-5 个陈旧工具（默认 3，走 `scripts/pick-stale-tools.mjs`，updatedAt 升序 + 分类轮转避让）→ 按内置升级点（算法口径核对 / 修 bug / 补 seoTitle·description·faq / 长尾 subpages / UI / 补 mdx）改代码 → 每工具跑 `check:all`，动 `src/lib` 加跑 `mcp:build`+回归 → 失败自动 `git checkout` 回滚该工具。
- **已砍掉的复杂环节**：确认门（方式一/方式二）、GitHub 检索借鉴、公众号素材产出、资料库上传。`upgrade-daily/` 下 `kb-node.json` 与素材层已不再使用；`YYYY-MM-DD.md` 不再写计划，结果改记 `.workbuddy/memory/TODAY.md`。
- 硬护栏：git 已跟踪文件干净为前提（不干净则当天自动跳过，避免与手动工作冲突）、只动计划内工具、不 commit/push/build/部署。
- 筛选器 `scripts/pick-stale-tools.mjs`：`--count 2-5`、`--stale-days 14`，只读。状态目录 `.workbuddy/upgrade-daily/history.json`（分类轮转 last/prevCategories）。

## Git push（Agent 侧唯一可用通路）
```bash
export GIT_TERMINAL_PROMPT=0 HTTPS_PROXY= HTTP_PROXY= ALL_PROXY= https_proxy= http_proxy= all_proxy=
TOKEN=$(printf 'protocol=https\nhost=github.com\n' | git-credential-manager get | awk -F= '/^password=/{print $2}')
AUTH=$(printf 'wangcai-zhao:%s' "$TOKEN" | base64 | tr -d '\n')
timeout 150 git -c credential.helper= -c "http.extraheader=Authorization: Basic $AUTH" -c http.postBuffer=524288000 push origin master:master
```
必须**前台 + dangerouslyDisableSandbox**（后台会丢提权挂死）；`credential.helper=` 置空否则卡 GUI selector。验证：`git ls-remote --heads origin master` == HEAD。勿走 SSH；GitHub MCP 只读。
- ⚠️ **本机到 GitHub 链路瞬时抖动**（2026-10-12 实测）：小请求（ls-remote）偶尔通、持续大包上传会 `Connection was reset` / 超时连不上。首次 push 失败别慌，**间隔几秒重试即成功**（同 token 通道）。别因此改用别的远端或镜像。
- **personal-site 例外**：远端是 SSH（`ssh://git@github.com/wangcai-zhao/wangcai-personal-site.git`，分支 **main**，不是 master），**SSH 在本机通**，直接 `git push origin main` 即可，别套上面的 HTTPS token 方案。
- 🔴 **提交前必有避雷：用显式路径 `git add`，绝不 `git add -A`**——personal-site 仓库里长期堆着十几个早期会话的未提交内容，website 里有 `_cprof`/`dist_partial_*`，一锅端会把别人的活卷进来。

## 环境坑
- 🔴 astro check/build 输出带 ANSI 码，`grep " - error "` 永远匹配不到 → 先 `.replace(/\x1b\[[0-9;]*m/g,'')`。日志 ~40MB，落盘再解析。
- ⚠️ `.mjs` 不能写 TS 注解，用 JSDoc。⚠️ 同一文件多条 Edit 必须顺序执行（并行会互相覆盖）。
- ⚠️ 后台长命令禁止 `| tail`/`| head`（管道提前关闭会永久挂起），改 `> _x.log 2>&1`。
- Bash PATH 偶发损坏：开头加 `export PATH="/c/Users/zhao-/.workbuddy/binaries/PortableGit/versions/1.2.0/usr/bin:/c/Users/zhao-/.workbuddy/binaries/PortableGit/versions/1.2.0/bin:$PATH"`。
- 工作区内 `rm -rf` 可用（safe-delete 只在个人目录生效），但 `git add -A` 会卷进 `_cprof`/`dist_partial_*` 等垃圾，批量提交前先扫。
- MDX 里裸 `<` `{` `}` 会报语法错，批量生成后必查。tips 默认 draft:true，需显式 false。
- ⚠️ `gen-sitemap.mjs` 在 `npm run build` 中偶发静默不产出 sitemap（沙箱），上线前 `ls dist/sitemap-0.xml` 确认；缺失则手动 `node scripts/gen-sitemap.mjs` 重跑并补传远端 `/var/www/mokakit/`。2026-10-11 实测踩过，deploy 流程无该护栏。
- 🔴 **交付文件升版禁止原地 `mv`（2026-11-03 事故）**：把 `...-v1.0-...md` 直接 `mv` 成 `v1.1` 会让旧路径消失，旺财打开旧卡片就是"无内容"。正确做法：**新建带新版本号的文件、旧版保留**（或先 `cp` 备份再改）。对外发过的路径＝承诺，不能单方面作废。
- ⚠️ **资料库在线文档 ≠ 本地 `.md`（2026-11-03 实测）**：`LibraryUpload` 上传 md 得到的是真在线文档（正文 block 完整，v1.0 实测 365KB），方式没问题；但导出走「md → 在线文档 → md」往返，**表格单元格内含 `|` 的行会被拆列**（实测 E-03 / 发布方式 / G-01 三处），`**` 也会逃逸成 `\*\*`。属**不可逆导出损耗，不是内容缺失**。故：权威副本永远是本地 `.md`，资料库版只用于在线检索阅读、别回导当源。文档正文读取用 `python3 "$CODEBUDDY_SKILL_DIR/doc/get_doc_reviews.py" --page-id <nodeId>`（`CODEBUDDY_SKILL_DIR` = `.../plugins/workbuddy-builtin/skills/library`），新建文档用 `doc/create_doc.py --content-file`（不要用 LibraryUpload 上传 md 代替）。
- ⚠️ **IMA 同步知识库方法（2026-10-12 实测，已跑通）**：「MokaKit 项目专属知识库」id = `7515215847499395`（旺财在 IMA 建）。**主路径 `create_media→COS→add_knowledge` 当前坏**：IMA 下发的 STS `secret_id` 格式异常（带连字符，非标准腾讯 AKID），腾讯云 COS 标准端点 `InvalidAccessKeyId`、custom_domain 403 Forbidden；官方 `cos-nodejs-sdk-v5` 同样报错，确认是 IMA 凭证发放侧问题，非签名 bug。**可用旁路 = `import_urls`**：传 `knowledge_base_id=7515215847499395`、空 `folder_id`、`urls=[https://raw.githubusercontent.com/wangcai-zhao/mokakit-website/master/.workbuddy/memory/KNOWLEDGE_BASE.md]`，把 GitHub raw 链接导入即可（ret_code 0、解析成功）。改完本地 KB 后 commit+push 到 GitHub，再 `import_urls` 同 URL 即更新（同 URL 可能产生新条目，必要时在 IMA 删旧条）。

## 待办（勿擅自改，等旺财决策）
> 2026-11-03 只读复核更新：② markdown-preview 已修（dompurify 3.4.17 已装，Tool.tsx:50 已 sanitize），该项关闭；分类数字已变（calc 92 / dev 57 / barcode 3）；新增最高优先 R-01~R-03 见基准文档 §8。
① 5 个工具算法去重（见上）——**仍未做**：`src/lib` 无 after-tax-salary / overtime-pay / deposit-interest / retirement-age / pension-estimate，MCP 侧却已有对应 5 个工具；② ~~markdown-preview 无消毒~~（2026-11-03 复核：已修）；③ changelog 页 465KB、tools 索引 412KB 全量渲染（C 级，未复测）；④ 临时产物被 git 跟踪待清理；⑤ ~~教师普惠过期仍在展示~~（2026-11-03 已由 `campaigns.ts` 机制接管，构建期自动下线，线上实测 0 命中）。
**剩余开项（2026-11-04 复核）**：
- R-02（部分缓解）：`check:all` 已由 4 项扩到 **7 项**（+campaigns +ads +version）；但 check:units / test:model-select / test-china-tax / test-deed-tax / test-new-calc / verify:subpages **仍在闸门外**。
- R-03 **仍开**：`npm run build` 与 `deploy/deploy.sh` 都不调用 `check:all`，无 CI 无 lint。部署前需人工先跑（最近两次都是我手动跑的）。
- R-09 备份仅本地两份（最新 11-01 43M）无异地。
- ~~版本号未 bump~~（2026-11-03 已升 **0.10.0** 并建立 `release:patch|minor|major` 工具链 + `check:version`；rules 见 `docs/VERSIONING.md`）。
**线上状态（2026-11-04 00:59 部署后实测）**：`www.mokakit.com` = **v0.10.0**，676 page 构建 / 675 index.html / sitemap 673 条，教师普惠已下线、邀请卡保留、离线脱敏版可下载、HTTPS 证书 2027-01-20 到期。旧版留 `/var/www/mokakit.old` 可回滚。
其他：GSC 后台人工提交 sitemap-index.xml（agent 做不了）；MCP token 仍人工 mailto 审批；分类失衡（calc 92 / dev 57 / barcode 3，calc+dev 占 53%）。
