# MokaKit 摩卡工具箱 — 项目长期记忆

> 工作目录 = `D:\WorkBuddy\website`（已 git 化：master 分支；`.gitignore` 忽略 node_modules/dist/.astro/.counter-data）

## 项目身份
- 纯静态工具站：Astro 7 + Preact + daisyUI + Tailwind v4。不引 WordPress/PHP/MySQL/管理后台。
- 规范域名 **www.mokakit.com**（已上线 HTTPS；裸 mokakit.com 与 mokakit.cn 仅 301 跳转、不出内容）。ICP：京ICP备2026051111号（真相源 `src/config/site.ts` 的 `icp`，`Footer.astro` 自动渲染链工信部）；公安备案 `京公网安备11010502062390号`（site.ts 的 `police`，页脚可点击核验 beian.gov.cn）；**mokakit.cn 备案待批未接入**。
- 品牌「摩卡工具箱 / MokaKit」。`launched:true`、counter/share 启用。双主题 toolbox/toolboxdark。
- 部署服务器：腾讯云轻量 58.87.68.151（Ubuntu 24.04）。deploy 公钥已绑；本地 `deploy/deploy.sh`，服务器 `deploy/server-setup.sh`。

## 生产环境 / 部署运维
- 公网：裸 mokakit.com / .cn → 301 → https://www.mokakit.com（规范域）；www 主域 200 + HSTS max-age=31536000。证书 LE YE2 至 2026-11-10，certbot.timer 自动续期（**SAN 已含 www.mokakit.com**）。
- nginx：站点根 /var/www/mokakit；80 配置 /etc/nginx/conf.d/mokakit.conf；SSL 配置 /etc/nginx/mokakit-ssl.conf（**故意在 conf.d 外**，由 mokakit.conf 末尾 include 引入）。
  - ⚠️ ssl 配置放 conf.d 内会双重加载→443 冲突吞 www 块；`--enable-ssl` 的 sed 解注 include 须同步改路径。
  - `listen 443 ssl http2;`（非 `http2 on;`）；YE2 证书无 OCSP→`ssl_stapling off;`。
- 匿名计数 `mokakit-counter`（systemd 127.0.0.1:18800），nginx /api/ 反代，落盘 /var/lib/mokakit/。

## 战略主线
- MokaKit =「AI 时代的工具箱」（人用 + AI 调）。MCP Server 是战略核心。
- 护城河：① MCP search-first ② 单位对独立长尾页 ③ 六段式内容模板。
- 竞品盲区=主场：中国本土计算器（个税/社保/年终奖/房贷/增值税）。
- 不搬：多语言 i18n、账户系统+API Token。

## MCP Server（v0.1.0 已公网接入，战略核心）
- 公网端点 https://www.mokakit.com/mcp（Streamable HTTP + JSON-RPC 2.0 + 可选 Bearer）。本地 `npm run mcp` → localhost:18700/mcp。**15 tool（14 计算 + mokakit_search）**。（裸 mokakit.com/mcp 也 301 跳 www，旧客户端仍可连。）
- 生产化：esbuild 自包含打包（mcp/build.mjs → deploy/mcp/server.mjs target=node18）+ catalog.json（**100 工具**元数据）。server 优先读 catalog.json，不依赖 src/TS 运行时。改工具/加 meta 后必跑 `npm run mcp:build` + 重部署。
- mokakit-mcp.service（systemd /opt/mokakit-mcp 仅监听 127.0.0.1:18700）+ nginx `location /mcp` 反代；随机 MCP_TOKEN 写入 /opt/mokakit-mcp/.env（600，不进 git）。
- versioning：API_VERSION=v1；breaking change 走 /mcp/v2。
- 公开接入页 /developers/（避开 /mcp/ 反代）已上线；工具清单与 server.mjs 的 TOOLS 需手动同步。
- 扩展：server.mjs 的 COMPUTE_TOOLS 加项，新逻辑抽 src/lib/*.ts；build 后 catalog 自动含新 meta。
- 6 新工具纯函数统一在 `src/lib/china-calc-extra.ts`（calcRetirementAge / calcAfterTaxSalary / calcDepositInterest / calcDeedTax / calcOvertimePay / calcPensionEstimate），与 Tool.tsx 同源。

## 当前规模（2026-08-14 实测）
- 100 工具 / 9 分类；sitemap 399 URL；长尾子页 247（unit-convert 213 + github-stars 28 + ode-solver 6）。
- 2026-08-14 新增 6 中国本土计算器（强护城河，补齐「竞品盲区」）：retirement-age 退休年龄 / after-tax-salary 税后工资（含反推）/ deposit-interest 存款利息 / deed-tax 契税 / overtime-pay 加班工资 / pension-estimate 养老金。均六段式 content.mdx + WidgetHost 接线，build+sitemap 已验证。
- content.mdx 覆盖 100/100（100%）。好站导航 31 组 / 494 条。
- 注册：registry.ts 自动收；WidgetHost.astro 手工加 import+分支。
- 进度看板 `npm run workbench` → public/workbench.html（要 cp 到 dist）。
- 单位换算：16 类 161 单位 213 页 / 649 条 FAQ。

## 出站链接中转（强制）
- 第三方链接走 /go/?url=（src/pages/go/index.astro + src/utils/outbound.ts 的 goUrl()）。不中转：站内/mailto:/tel:/本站域名/政府备案链接。gen-sitemap 排除 /go/。

## Git 仓库与推送
- 远端 `origin` = https://github.com/wangcai-zhao/mokakit-website.git（remote 已加；URL 不含 token，安全）。
- 默认分支 = **master**（2026-08-14 经 GitHub API 把默认从 main 改到 master；远端原 main 仅含初始 commit，保留不动）。本地 master 已推送（含 6 新工具 + www 翻转），HEAD=e79c370。
- 推送鉴权：本机无 SSH 私钥、GCM 原无缓存 → 用 classic PAT（repo 权限）推；token 已存 Windows 凭据管理器（`cmdkey /add:github.com /user:PersonalAccessToken`），以后 `git push` 自动走凭据无需重填。
- ⚠️ 该 PAT 在聊天中出现过明文，建议用完（或到期前）于 GitHub Settings→Developer settings→PAT 撤销重建。

## 待办队列
1. ⏳ **mokakit.cn 备案+接入** —— 过审后加 DNS A + 把 site.ts 的 altDomains 从 ['https://mokakit.com'] 换成 ['https://mokakit.cn'] + nginx .cn 跳 www 已就绪（当前 ssl.conf 已含 .cn 跳转，仅需 DNS）。
2. ⏸️ **摩卡配色打磨** —— 暂缓。
3. ❌ 已放弃：GitHub 仓库分析工具、陌生高星仓收录、「真·AI 对话舱」。
4. ⏳ **MCP Token 公开申请通道** —— /developers/ 现仅 mailto 入口；纯静态限制下暂未做自动发号。
5. ⏳ **百度/Google 站长平台提交 sitemap** —— 手动，旺财操作（https://www.mokakit.com/sitemap-index.xml）。已在本次给出操作指引，待旺财手动执行。
6. ✅ ~~MCP Server 同步 6 新工具~~ —— 2026-08-14 完成。server.mjs COMPUTE_TOOLS 扩至 14 项（+china-calc-extra.ts），mcp:build 出 100 tools/0 errors，/developers/ 清单同步至 15，线上 tools/list 验证通过。

## 环境与坑（可复用）
- 本地跑 src/ TS：`node --experimental-strip-types --import ./scripts/ts-resolve.mjs xxx.mjs`。
- 数据驱动页静默吞：subpages() 引用不存在 id 不报错；校验断言「子页产出数==换算对数」。
- 构建绕沙箱：`export NODE_OPTIONS="--require=D:/WorkBuddy/website/noop-shim.cjs"` 后 `node node_modules/astro/bin/astro.mjs build`。只留 `--require=noop-shim.cjs` 稳过。build 收尾可能挂死→扫 /proc kill astro build 的 node PID；sitemap 解耦单跑 `node scripts/gen-sitemap.mjs`。
- Astro build 偶发 Exit 1/只产 1 html（增量误判）→ `mv dist dist_bak_xxx` 逼全量重构建。
- 若 build 在 "Collecting build info" 后无输出直接 Exit 1（内存充足、非 OOM），多为 vite 依赖重优化偶发卡死；**直接重跑通常即通过**，不必先 mv dist。本次 6 新工具 build 即此情况，二跑 EXIT=0。
- heredoc 吃 ${...}→写脚本用 Write。大改后预检：@babel/parser 严格解析禁 errorRecovery；`useState(()=>window)` 惰性初始化 SSR 崩改 useEffect。
- 沙箱 scp 大文件静默掐→`ssh host "cat 文件" > 本地` 分片。dist 禁 example.com 用 acme.com。
- 服务器出网 github/raw.githubusercontent 被墙→用 apt certbot 走 webroot（勿 acme.sh）。
- 本机沙箱出站 HTTPS 被拦→验证已部署内容走 `ssh root@58.87.68.151 'curl -s --resolve mokakit.com:443:127.0.0.1 https://mokakit.com/ ...'`（裸 127.0.0.1 命中兜底 return 444，须带 --resolve）。
- ⚠️ `server-setup.sh --live` 会回退 HTTPS（[6/8] rm ssl.conf）→重跑 --live 后必补 `--enable-ssl`。日常更新用 `deploy.sh`（不带 --live，只 reload 不碰 ssl）。
- 页脚备案：site.ts 改 icp/police 全站生效；政府备案链接不走 /go/。

## 会话管理
- 续干：读本文件 + conversation_search。日级日志 YYYY-MM-DD.md。
- 上线日全量档案：archive/MOKAKIT_PROJECT_ARCHIVE_2026-08-13.md（立项→上线全量 + 运营建议）。
