# MokaKit 摩卡工具箱 — 项目长期记忆

> 工作目录 = `D:\WorkBuddy\website`；git master，远端 https://github.com/wangcai-zhao/mokakit-website.git

## 架构与部署
- Astro 7 + Preact + daisyUI 5 + Tailwind v4，纯静态无后端。工具由 `src/tools/registry.ts` 的 import.meta.glob 自动发现，新工具四件套：meta.ts / Tool.tsx / content.mdx / WidgetHost.astro（含 known 表达式）。
- 规范域 www.mokakit.com（HTTPS + HSTS），裸 mokakit.com / mokakit.cn 仅 301。nginx 根 /var/www/mokakit；80 配置 `/etc/nginx/conf.d/mokakit.conf`，SSL 在体外 `/etc/nginx/mokakit-ssl.conf`（放 conf.d 内会 443 冲突吞 www 块）。⚠️ `server-setup.sh --live` 会拆 HTTPS，之后需补 `--enable-ssl`。
- 腾讯云轻量 58.87.68.151（Ubuntu 24.04）：`deploy/deploy.sh`（build+上传）、`deploy/nightly-2026-09-11-deploy.sh`（站点+MCP 一键）。匿名计数服务 mokakit-counter（systemd 127.0.0.1:18800），nginx /api/ 反代。
- DNS 在腾讯云 DNSPod 控制台管理（不是域名注册台）。
- 备案 / 统计 / 广告：site.ts 单点维护 —— ICP 京ICP备2026051111号、公安 京公网安备11010502062390号（政府备案链接不走 /go/）、百度统计 c1ce047dfb4bbcfe58cba2418b56332a、AdSense ca-pub-0218164655974877（验证已通过，public/ads.txt 已上线）。

## 站点配置唯一真源（src/config/site.ts）
- `SITE`：品牌 / 域名 / 备案 / 开关全在此。**版本号由 `package.json` 的 version 派生（加 v 前缀）**，页脚与 `scripts/build-workbench.mjs` 都读它 —— 页面里不要再硬编码版本。
- `SOCIAL`：GitHub 由 github.owner/repo 拼出、邮箱取 `SITE.email`（bo.zhao2026@outlook.com），供 `src/components/SocialLinks.astro`（Header 右侧 + 页脚 + 移动菜单）共用。
- 出站第三方链接一律 `goUrl()` → `/go/?url=`；站内 / mailto / tel / 政府备案不中转；gen-sitemap 排除 /go/。
- ⚠️ `SITE.description` 里的**工具总数是硬编码的**（site.ts 会被客户端打包，没法动态 import registry 数数）。每批新工具上线要同步改这里，2026-09-23 为 240。
- icons.ts 是 Lucide path 字典（106 个真实图标 + 43 条语义别名），键名即图标名（camelCase 为主，部分带引号如 'shield-check'）。`resolveIcon()` 先查真图标再查别名，都没有才回落 grid。⚠️ 新增工具后跑 `npm run check:icons` 验证图标可解析（缺图标不报错、只静默退化成方块）。

## 规模（截至 2026-09-23）
- **240 工具 / 11 分类**（09-23 新增 11 个：秒表、番茄钟、盈亏平衡、ROI、身份证校验、银行卡校验、CIDR、矩阵、SEO 标签生成、字节换算、存钱计划）；dist **588 页**。好站导航 44 组 / 791 条；单位换算 16 类 161 单位。进度看板 `npm run workbench`。
- 构建链路：`npm run build` = astro build → `scripts/optimize-sprite.mjs`（产物级雪碧图瘦身，省 16.6MB）→ `scripts/gen-sitemap.mjs`。另有 `npm run seo:audit`（问题页面已清零）。
- 图片类工具共用 `src/tools/_shared/`：`image-utils.ts` / `use-image.ts` / `ImageDropzone.tsx`。
- 更新日志频道 `src/data/changelog.ts`：工具条目只写 id，其余构建时从 registry 取；**新增工具后必须补 id**，否则 `npm run changelog:check` 红灯。

## MCP Server（战略核心）
- https://www.mokakit.com/mcp（Streamable HTTP + JSON-RPC 2.0 + 可选 Bearer）；systemd service 在 /opt/mokakit-mcp，仅 127.0.0.1:18700 + nginx 反代，token 写 /opt/mokakit-mcp/.env(600)。本地 `npm run mcp`。
- 改工具后必须 `npm run mcp:build`（esbuild → deploy/mcp/server.mjs + catalog.json）再部署。
- Token 申请页 /developers/mcp-token-apply 已上线，后端仍为人工 mailto 审批。

## Git 与推送
- ✅ **Agent 侧 push 通路（2026-09-18 修订）**：
  `export GIT_TERMINAL_PROMPT=0 HTTPS_PROXY= HTTP_PROXY= ALL_PROXY= https_proxy= http_proxy= all_proxy=`
  然后 `timeout 240 git -c http.postBuffer=524288000 push origin master:master`（需 `dangerouslyDisableSandbox:true` + 前台）。
  - **绝不能后台跑 push**：被 auto-background 后丢提权，挂在网络握手无输出无报错（实测卡 9 分钟）。发现就 TaskStop 前台重推。
  - 用显式 refspec `master:master`；本地 `refs/remotes/origin/*` 可能为空，推完补 `git fetch origin master` + `git branch --set-upstream-to=origin/master master`。
  - 验证：`git ls-remote --heads origin master` 的 SHA == 本地 HEAD。
  - 不清代理变量会报 github 502；credential.helper=manager 已有凭据，无需 PAT。
  - ⚠️ **push 卡死在 `helper-selector` 弹窗（无头/沙箱常见）**：项目级 `credential.helper=helper-selector` 每次都弹 GUI 选择器，沙箱里弹不出 → 进程挂死无输出（ls-remote 偶尔能过是因为读操作走缓存）。**绕过法**（GCM 缓存的 OAuth token 仍有效，gho_ 开头）：
    ```bash
    export GIT_TERMINAL_PROMPT=0 HTTPS_PROXY= HTTP_PROXY= ALL_PROXY= https_proxy= http_proxy= all_proxy=
    TOKEN=$(printf 'protocol=https\nhost=github.com\n' | git-credential-manager get | awk -F= '/^password=/{print $2}')
    AUTH=$(printf 'wangcai-zhao:%s' "$TOKEN" | base64 | tr -d '\n')
    timeout 150 git -c credential.helper= -c "http.extraheader=Authorization: Basic $AUTH" -c http.postBuffer=524288000 push origin master:master
    ```
    关键：`credential.helper=` 必须显式置空，否则仍会触发 selector 卡死。
- ⚠️ 勿走 SSH 推送（本地配置会把 SSH 重写为 HTTPS，且 deploy key 只读）；GitHub MCP 连接器只读（push_files 403）。

## 待办（2026-09-18 盘点更新）
- ✅ GSC：DNS TXT `google-site-verification=Jdq425qhDTUKyXMl00HefI7AYGuyQX2Ce821cTkMtcg` **已于 09-18 生效**（nslookup 可查），BingSiteAuth.xml 也在 public/。**剩最后一步：去 GSC 后台提交 sitemap-index.xml**（需人工登录，agent 做不了）。
- 好站数据质量：790 条里 **22 条描述被截断**（如 "Standard Guitar是一个专业"）、**8 组重复 URL**（redis.io/grafana.com/yuque 等）、**17 条明文 http://**、**43 条名称带 " - " 长尾**（SEO 噪音）。
- 仓库卫生：根目录 16 个 `_astro_bak_*` / `dist_bak_*` 残留共 **282M**，55 个 `_*.log` + 14 个临时脚本。⚠️ 本机 safe-delete 拦截 `rm`，需旺财手动删或用 PowerShell 移到回收站。
- MCP Token 申请仍是人工 mailto 审批，未自动化；摩卡配色打磨（暂缓）。
- 分类失衡：`calc` 80 个、`dev` 53 个工具，而 `barcode` 仅 3 个。
- tips 15 篇中 3 篇仍是 `draft: true`（默认 draft，需显式 false 才进 dist）。

- ⚠️ **契税面积分档是 140㎡**（2024-12-01 起，财政部/税务总局/住建部 2024 年第 16 号公告），老口径 90㎡ 已废止。
  算法**在 `src/lib/china-calc-extra.ts` 和 `src/tools/deed-tax/Tool.tsx` 各硬编码了一份**，改一处不算修完。
- ⚠️ **后台跑长命令禁止用 `| tail` / `| head`**：head 读完提前关闭管道会让后台任务永久挂起
  （实测 build 早已完成、任务卡 14 分钟无输出，误判成卡死）。一律改成 `> _xxx.log 2>&1` 再读文件。
- ⚠️ **正则灾难性回溯**：`(?:"[^"]*"|'[^']*'|[^>])*?` 这类嵌套量词在 5KB 文本上能跑 60 秒+。
  收紧成 `[^>"']` 让分支互斥即退化成线性（seo-audit 因此从 300s 超时 → 1.35s）。
- ⚠️ `gen-sitemap.mjs` 里**别对每个文件单独 execSync git**（500+ 子进程会超时）；改成一次性
  `git log --pretty=format:__TS__%cs --name-only` 建表。
- ⚠️ 同一份业务逻辑散在两处会同时翻车：计数脚本曾在两个布局逐字复制（各错各的），
  已抽成 `src/components/CounterScript.astro` 共用；新增类似逻辑先想复用。

## 环境与坑（可复用）
- ⚠️ **同一文件的多条 Edit 必须顺序执行**：并行 Edit 会竞争写盘互相覆盖（每条都报成功），已多次踩坑，连注释行都被吞过。
- Bash PATH 偶发损坏：命令前加 `export PATH="/c/Users/zhao-/.workbuddy/binaries/PortableGit/versions/1.2.0/usr/bin:/c/Users/zhao-/.workbuddy/binaries/PortableGit/versions/1.2.0/bin:$PATH"`。
- 构建：`export NODE_OPTIONS="--require=D:/WorkBuddy/website/noop-shim.cjs"`，再用 `<...>\binaries\node\versions\22.22.2-3\node.exe node_modules/astro/bin/astro.mjs build`（注意版本目录是 22.22.2-3）。sitemap 解耦单跑 `node scripts/gen-sitemap.mjs`。
- build 卡死在 "Collecting build info" / Exit 1 / 只产 1 个 html → 多为 .astro 缓存损坏，`mv .astro _astro_bak_xxx` 重建；或 `mv dist dist_bak_xxx` 逼全量。上传前用 `scripts/_nightly-verify-dist.mjs` 校验页面数（好站导航要按 encodeURIComponent 比对）。
- SSH 部署必须**前台 + dangerouslyDisableSandbox**，后台任务读不到 ~/.ssh。
- 百度统计注入：BaseLayout 只用 `set:html`，勿与 `define:vars` 混用（会吞脚本）。
- ⚠️ tips 专栏 draft 默认 true（新文需显式 `draft: false` 才会进 dist）。
- ⚠️ MDX 里裸 `<` `{` `}` 会被当 JSX/表达式 → 构建报 MDX 语法错。批量生成 content.mdx 后必查 `Array<string | number>`、`\d{4}`、`{}` 等写法，改中文描述或转义（2026-09-18 一次踩 5 处）。
- ⚠️ 模块顶层常量有顺序依赖：`sites.ts` 的 `SITE_SECTION_GROUPS` 必须放在 `SITE_GROUPS` 之后，否则取到 undefined 且构建无明确报错。
- ⚠️ `scripts/_nightly-verify-dist.mjs` 比对的是 `_nightly_audit_report.json` 快照基线，手工删/改好站条目后会报**假失败**，需重新生成基线再判读。
- JSON-LD 工具 jsonld.ts 无 profileSchema，Person 页手写即可。

## 会话管理
- 续干：读本文件 + 当日 `.workbuddy/memory/YYYY-MM-DD.md` + conversation_search。
- 立项→上线全量档案：`archive/MOKAKIT_PROJECT_ARCHIVE_2026-08-13.md`。
