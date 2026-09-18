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
- icons.ts 是 Lucide path 字典（84+ 图标），键名即图标名（.camelCase 为主），缺图标回落默认方块。

## 规模（截至 2026-09-18）
- **229 工具 / 11 分类**（新增 image 图片处理）；dist **578 页 / 73M**；好站导航 **44 组 / 791 条**（分「工作/生活」两大区，含 hot + tag 字段）；单位换算 16 类 161 单位 / 649 FAQ。进度看板 `npm run workbench`。
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
- ⚠️ 勿走 SSH 推送（本地配置会把 SSH 重写为 HTTPS，且 deploy key 只读）；GitHub MCP 连接器只读（push_files 403）。

## 待办
- GSC：DNS TXT `google-site-verification=Jdq425qhDTUKyXMl00HefI7AYGuyQX2Ce821cTkMtcg` 待加 DNSPod 记录，通过后提交 sitemap-index.xml（Bing 验证文件已在 public/）。
- MCP Token 申请自动化审批；摩卡配色打磨（暂缓）。

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
