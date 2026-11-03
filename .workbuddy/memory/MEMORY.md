# MokaKit 摩卡工具箱 — 项目长期记忆

> 目录 `D:\WorkBuddy\website`；git master → github.com/wangcai-zhao/mokakit-website.git。
> **详细规范在 `.workbuddy/memory/KNOWLEDGE_BASE.md`**（目录结构 / 新增工具四件套 / 部署节点 / 避雷清单），改动或部署前先读它。续干顺序：KB → 本文件 → 当日日志 → conversation_search。

## 线上状态（2026-11-04 部署后实测）
- `www.mokakit.com` = **v0.10.1**；677 page 构建 / 676 index.html / sitemap 674 条；**282 个工具 / 11 分类**（calc 92 / dev 57 / barcode 3）。
- 银行卡号校验已补法律风险边界说明（2026-11-04 部署，`f1c476b`）：页面底部边界区块 + mdx 长版 + 2 条 FAQ。
- 时区转换器（第 282 个）已上线、astro-island=1；`/blog/`、`/tips/` 盘点双页已上线；教师普惠已下线、邀请卡保留；离线脱敏版可下载；HTTPS 证书 2027-01-20 到期；旧版留 `/var/www/mokakit.old` 可回滚。
- ✅ **Git 两端 SHA 已对齐**（2026-11-04 07:50 复核）：曾因 `github.com:443` 阻断走 `scripts/push-via-api.mjs` 产生分叉，现已摊平并对齐，HEAD=`f1c476b` 与远端一致。下次若再见「领先 N 个提交」先 `git ls-remote --heads origin master` 比 SHA，别盲目 push。

## 架构与真源
- Astro 7 + Preact 10 + daisyUI 5 + Tailwind v4，纯静态。
- 三类真源：`src/config/site.ts`（备案/统计/广告/版本派生自 package.json）、`src/config/categories.ts`、`src/tools/types.ts`。
- **新工具四件套**：`src/tools/<id>/` 的 meta.ts + Tool.tsx + content.mdx + **WidgetHost.astro 注册**。registry 靠 import.meta.glob 自动发现 meta，但**水合必须静态 import**：①import ②`const isXxx = tool.id==='<id>'` ③加进 `known` ④渲染区 load/idle/visible 三分支。漏④ → build 成功但 0 个 astro-island（死壳），靠 `check:widgets` 兜。真上线判据：`grep -c astro-island dist/tools/<id>/index.html` ≥1。
- 🔴 **财金算法只能有一份**：纯函数放 `src/lib/*.ts`（china-tax / china-social-security / china-vat / china-calc-extra / mortgage），MCP 与前端共用，禁止在 Tool.tsx 里另写（契税 90㎡ vs 140㎡ 事故根因）。deed-tax 已治理 + `scripts/test-deed-tax.mjs`；after-tax-salary / overtime-pay / deposit-interest / retirement-age / pension-estimate 待治理。
- 🔴 **`seoTitle` ≠ `name`**：seoTitle 只作用于 `<title>`，name 管卡片 / 面包屑 / h1。回退序 `seoTitle ?? title ?? tool.seoTitle ?? \`${name} - 在线免费工具\``。接入点**两处**：`ToolLayout.astro` 与 `ClockImmersiveLayout.astro`（clock 分类走后者）。依据 2026-10-09 Bing 实测：标题首词命中查询词的点击率约 2.5 倍。
- 出站第三方链接走 `goUrl()`；`SITE.description` 里工具总数硬编码，加工具要同步；新增工具必须补 `src/data/changelog.ts` 的 id，否则 `changelog:check` 红灯。
- icons.ts 是 Lucide path 字典，`ICON_ALIASES` 刻意留空；缺图标补真实 path（`https://unpkg.com/lucide-static@1.47.0/icons/<name>.svg`）。

## 治理机制（v0.10.0 起）
- **版本号**：唯一真源 `package.json`，`changelog.Release.pkgVersion` 映射批次↔版本；升版 `npm run release:patch|minor|major`；规则 `docs/VERSIONING.md`（1.0.0 留给 R-01/02/03 清完）。
- **活动时间窗**：`src/config/campaigns.ts` 的 `startAt/endAt/active`，构建期 `resolveCampaign()` 判定到期不渲染；组件读 `inviteLive`/`teacherLive`，**别读 `active`**；`check:campaigns` 报警；规范 `docs/CAMPAIGN-POLICY.md`（结束 7 天内必须重建）。
- **广告位**：先在 `SITE.ads.slots` 登记才投放（未登记 = 不投放），单页上限 2，带中文「广告」标识；`check:ads` 校验；方案 `docs/PROMOTION-PLAN.md`。
- **闸门 `check:all` 共 7 项**：widgets / icons / search / changelog / campaigns / ads / version。

## 校验与构建
- 上线前必跑 `npm run check:all`。`npm run build` = astro build → optimize-sprite → gen-sitemap。
- 构建：`export NODE_OPTIONS="--require=D:/WorkBuddy/website/noop-shim.cjs"`（**只用于 website**，换项目前 `unset`，否则 MODULE_NOT_FOUND）；node 在 `~/.workbuddy/binaries/node/versions/22.22.2-6/`。
- 版本基线（2026-10-06）：astro 7.3.5 / @astrojs/mdx 8.0.2 / @astrojs/preact 6.0.5 / daisyui 5.7.47 / ts 6.0.3 / @astrojs/check 0.9.10。**preact 锁 10.x、TS 别升 7**。
- ⚠️ 存量 64 类型错误（33 文件）：vat-calc 17 / bonus-tax-cn 11 / ratio-calculator 5 / timestamp-converter 4，新代码别再加。
- 测试脚本：`node --experimental-strip-types --no-warnings --import ./scripts/ts-resolve.mjs scripts/<x>.mjs`；算法回归统一入口 `scripts/test-new-calc.mjs`。
- build 卡死 / 只产 1 个 html，或 dist/tools 只出 160 个且缺 a–l 段 → `mv .astro _astro_bak_xxx` 清缓存重建。
- astro 入口各项目不同：website `node_modules/astro/bin/astro.mjs`；personal-site `node_modules/astro/astro.js`。
- 🔧 **离线单文件版**：`npm run offline:desensitize`（`scripts/build-offline-desensitize.mjs`）用 esbuild 把站内 `doc-desensitize/desensitize.ts` 打成 IIFE 注入自包含 HTML → `public/download/mokakit-doc-desensitize.html`（26KB 零外链）。**引擎必须从站内那份 .ts 打包，禁止复制重写**；站内改识别规则要重跑。

## MCP（战略核心）
- www.mokakit.com/mcp；systemd `/opt/mokakit-mcp`，127.0.0.1:18700 + nginx 反代。改工具后必须 `npm run mcp:build`（esbuild → deploy/mcp/server.mjs + catalog.json）再部署。

## 每日工具升级自动化
- 单一全自动自动化 `86f3d35a-7205-4a97-b626-85fd246381c3`（每天 20:00，ACTIVE）；原晚总结 `7eaf3aec-…` 已于 2026-11-01 删除。
- 流程：`scripts/pick-stale-tools.mjs` 选 2-5 个陈旧工具（默认 3，updatedAt 升序 + 分类轮转避让）→ 按升级点（算法核对 / bug / seoTitle·description·faq / 长尾 subpages / UI / mdx）改 → 每工具跑 `check:all`，动 `src/lib` 加跑 `mcp:build` + 回归 → 失败 `git checkout` 回滚该工具。
- 已砍：确认门、GitHub 借鉴、公众号素材、资料库上传；`upgrade-daily/kb-node.json` 与素材层弃用，结果记 `.workbuddy/memory/TODAY.md`。
- 硬护栏：git 已跟踪文件必须干净（否则当天跳过）、只动计划内工具、不 commit/push/build/部署。

## Git push（Agent 侧唯一通路）
```bash
export GIT_TERMINAL_PROMPT=0
TOKEN=$(printf 'protocol=https\nhost=github.com\n' | git-credential-manager get | awk -F= '/^password=/{print $2}')
AUTH=$(printf 'wangcai-zhao:%s' "$TOKEN" | base64 | tr -d '\n')
timeout 150 git -c credential.helper= -c "http.extraheader=Authorization: Basic $AUTH" -c http.postBuffer=524288000 -c http.proxy="$HTTPS_PROXY" push origin master:master
```
- 必须**前台 + dangerouslyDisableSandbox**（后台丢提权会挂死）；`credential.helper=` 置空否则卡 GUI selector。验证 `git ls-remote --heads origin master` == HEAD。勿走 SSH；GitHub MCP 只读。
- 🔴 **保留环境代理 `$HTTPS_PROXY`**（端口动态，2026-11-04 两次实测分别是 59937 / 63795，**别写死**），显式 `-c http.proxy="$HTTPS_PROXY"`；清空代理走直连会 TCP 超时并误判「被墙」。
- ⚠️ 抖动两种：直连超时 → 走代理；代理偶发 `CONNECT tunnel failed 502` → 间隔 8-12 秒重试，通常第 3 次通。
- ⚠️ 本地/远端 SHA 分叉是常态（别的会话用 push:api 把多提交压成一条）。逐个 `git diff --quiet HEAD:<f> origin/master:<f>` 比文件，一致就 `git reset --soft origin/master` 摊平后重提。**别 `reset --hard`**，工作区可能有并行会话的活。
- **personal-site 例外**：远端 SSH、分支 **main**、本机直通，`git push origin main` 即可，别套上面的 token 方案。
- 🔴 提交用**显式路径** `git add`，绝不 `git add -A`（会卷进 `_cprof` / `dist_partial_*` 与早期会话残留）。

## 环境坑
- 🔴 astro check/build 输出带 ANSI，`grep " - error "` 永不匹配 → 先 `.replace(/\x1b\[[0-9;]*m/g,'')`；日志 ~40MB，落盘再解析。
- 🔴 **后台任务拿不到沙箱提权**：`run_in_background` 跑 `deploy/deploy.sh` / git push 时 `~/.ssh/*` 读取被拒，589ms 就 exit 1、日志几乎空，极易误判成 build 挂了。凡涉 SSH / 推送 / 凭证必须前台 + 关沙箱。
- ⚠️ 后台长命令禁止 `| tail` / `| head`（管道提前关闭永久挂起），改 `> _x.log 2>&1`。
- ⚠️ `.mjs` 不能写 TS 注解，用 JSDoc；同一文件多条 Edit 必须顺序执行（并行互相覆盖）。
- PATH 偶发损坏 → 命令开头 `export PATH="/c/Users/zhao-/.workbuddy/binaries/PortableGit/versions/1.2.0/usr/bin:/c/Users/zhao-/.workbuddy/binaries/PortableGit/versions/1.2.0/bin:$PATH"`。
- MDX 里裸 `<` `{` `}` 报语法错，批量生成后必查；tips 默认 draft:true，需显式 false。
- ⚠️ `gen-sitemap.mjs` 偶发静默不产出，上线前 `ls dist/sitemap-0.xml`；缺则手动 `node scripts/gen-sitemap.mjs` 重跑并补传 `/var/www/mokakit/`。
- 🔴 **交付文件升版禁止原地 `mv`**：旧路径消失＝旺财打开旧卡片「无内容」。新建带新版本号的文件、旧版保留。
- ⚠️ **资料库在线文档 ≠ 本地 .md**：上传后「md → 在线文档 → md」往返会丢表格内 `|`（拆列）、`**` 逃逸成 `\*\*`，属不可逆导出损耗。**权威副本永远是本地 .md**。读正文用 `skills/library` 的 `doc/get_doc_reviews.py --page-id`；新建用 `doc/create_doc.py --content-file`（别用 LibraryUpload）。资料库无删除节点 API，淘汰旧版靠改名 + 正文公告。
- ⚠️ **IMA 同步（可用旁路）**：知识库 id `7515215847499395`；主路径 `create_media→COS→add_knowledge` 坏（STS secret_id 格式异常，COS InvalidAccessKeyId / 403），改用 `import_urls` 导入 GitHub raw 的 `KNOWLEDGE_BASE.md`（ret_code 0）。改完 KB 先 push 再 import。
- 📌 **基准文档**：v1.1 现行 `node_id=7Qgcf0KPlutnGPlQFaGZ7N`（含 §14 治理落地），本地 `D:\WorkBuddy\mokakit-baseline\MokaKit-项目基准文档-v1.1-2026-11-03.md`；v1.0 `xjHueaEZDz1RMQQwfxddK3` 已改名「【已归档·以 v1.1 为准】」。写 MokaKit 结论先对齐它，证据分 A(源码实测) / B(脚本实测) / C(历史未复测) / D(记忆)。

## 待办（勿擅自改，等旺财决策）
- ① 5 个工具算法去重 **仍未做**：`src/lib` 缺 after-tax-salary / overtime-pay / deposit-interest / retirement-age / pension-estimate，MCP 侧已有对应工具。
- R-02（部分缓解）：`check:all` 已 7 项，但 check:units / test:model-select / test-china-tax / test-deed-tax / test-new-calc / verify:subpages **仍在闸门外**。
- R-03 **仍开**：build 与 deploy.sh 都不调用 `check:all`，无 CI 无 lint，部署前需人工先跑。
- R-09 备份仅本地两份（最新 11-01，43M），无异地。
- ③ changelog 页 465KB / tools 索引 412KB 全量渲染（C 级未复测）；④ 临时产物被 git 跟踪待清理。
- 其他：GSC 后台人工提交 sitemap-index.xml；MCP token 仍人工 mailto 审批；分类失衡（calc + dev 占 53%）。
