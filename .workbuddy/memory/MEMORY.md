# MokaKit 摩卡工具箱 — 项目长期记忆

> 目录 `D:\WorkBuddy\website`；git master，远端 github.com/wangcai-zhao/mokakit-website.git。续干：读本文件 + 当日日志 + conversation_search。

## 架构
- Astro 7 + Preact 10 + daisyUI 5 + Tailwind v4，纯静态。**245 个工具** / 11 分类（2026-10-07，v0.9.12）。
- **新工具四件套**：`src/tools/<id>/` 的 meta.ts + Tool.tsx + content.mdx + **WidgetHost.astro 注册**。
  registry.ts 用 import.meta.glob 自动发现 meta，但**水合必须静态 import**：WidgetHost 里要补①import ②`const isXxx = tool.id==='<id>'`③加进 `known` ④渲染区 load/idle/visible 三分支。漏④→ build 成功但 0 个 astro-island，工具是死壳。靠 `npm run check:widgets` 兜。
- 判定真上线：`grep -c astro-island dist/tools/<id>/index.html` ≥1。
- 🔴 **财金算法只能有一份**：`src/lib/*.ts`（china-tax / china-social-security / china-vat / china-calc-extra / mortgage）是纯函数层，**MCP 与前端必须共用**。禁止在 Tool.tsx 里另写（契税 90㎡ vs 140㎡ 事故根因）。deed-tax 已治理并配 `scripts/test-deed-tax.mjs`；after-tax-salary / overtime-pay / deposit-interest / retirement-age / pension-estimate 待治理。
- 三类真源：`src/config/site.ts`（备案/统计/广告/版本由 package.json 派生）、`src/config/categories.ts`（分类）、`src/tools/types.ts`（meta 契约）。
- 出站第三方链接走 `goUrl()`；`SITE.description` 里工具总数硬编码，加工具要同步。新增工具后必须补 `src/data/changelog.ts` 的 id，否则 changelog:check 红灯。
- icons.ts 是 Lucide path 字典；`ICON_ALIASES` 刻意留空，缺图标就给 ICONS 补真实 path（源：`https://unpkg.com/lucide-static@1.47.0/icons/<name>.svg`）。

## 校验与构建
- 上线前 `npm run check:all`（check:widgets + check:icons + changelog:check）。
- `npm run build` = astro build → optimize-sprite → gen-sitemap。
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

## Git push（Agent 侧唯一可用通路）
```bash
export GIT_TERMINAL_PROMPT=0 HTTPS_PROXY= HTTP_PROXY= ALL_PROXY= https_proxy= http_proxy= all_proxy=
TOKEN=$(printf 'protocol=https\nhost=github.com\n' | git-credential-manager get | awk -F= '/^password=/{print $2}')
AUTH=$(printf 'wangcai-zhao:%s' "$TOKEN" | base64 | tr -d '\n')
timeout 150 git -c credential.helper= -c "http.extraheader=Authorization: Basic $AUTH" -c http.postBuffer=524288000 push origin master:master
```
必须**前台 + dangerouslyDisableSandbox**（后台会丢提权挂死）；`credential.helper=` 置空否则卡 GUI selector。验证：`git ls-remote --heads origin master` == HEAD。勿走 SSH；GitHub MCP 只读。

## 环境坑
- 🔴 astro check/build 输出带 ANSI 码，`grep " - error "` 永远匹配不到 → 先 `.replace(/\x1b\[[0-9;]*m/g,'')`。日志 ~40MB，落盘再解析。
- ⚠️ `.mjs` 不能写 TS 注解，用 JSDoc。⚠️ 同一文件多条 Edit 必须顺序执行（并行会互相覆盖）。
- ⚠️ 后台长命令禁止 `| tail`/`| head`（管道提前关闭会永久挂起），改 `> _x.log 2>&1`。
- Bash PATH 偶发损坏：开头加 `export PATH="/c/Users/zhao-/.workbuddy/binaries/PortableGit/versions/1.2.0/usr/bin:/c/Users/zhao-/.workbuddy/binaries/PortableGit/versions/1.2.0/bin:$PATH"`。
- 工作区内 `rm -rf` 可用（safe-delete 只在个人目录生效），但 `git add -A` 会卷进 `_cprof`/`dist_partial_*` 等垃圾，批量提交前先扫。
- MDX 里裸 `<` `{` `}` 会报语法错，批量生成后必查。tips 默认 draft:true，需显式 false。

## 待办（勿擅自改，等旺财决策）
① 5 个工具算法去重（见上）；② markdown-preview 的 dangerouslySetInnerHTML 无消毒（A 引 dompurify / B 自研 / C 接受）；③ changelog 页 465KB、tools 索引 412KB 全量渲染；④ 286M 临时产物被 git 跟踪待清理；⑤ site.ts 教师普惠开关注释标 09-30 到期。
其他：GSC 后台人工提交 sitemap-index.xml（agent 做不了）；MCP token 仍人工 mailto 审批；分类失衡（calc 80 / dev 53 / barcode 3）。
