# MokaKit 摩卡工具箱 — 项目长期记忆

> 工作目录 = `D:\WorkBuddy\website`（git：master 分支；.gitignore 忽略 node_modules/dist/.astro/.counter-data）

## 项目身份
- 纯静态：Astro 7 + Preact + daisyUI + Tailwind v4。无后端/WordPress/PHP/MySQL。
- 规范域 www.mokakit.com（HTTPS；裸 mokakit.com / mokakit.cn 仅 301 跳转）。ICP 京ICP备2026051111号（site.ts `icp`，Footer 自动链工信部）；公安备案 京公网安备11010502062390号（site.ts `police`，官方 beian.mps.gov.cn 格式 + public/police-icon.png）。
- 品牌「摩卡工具箱 / MokaKit」，launched:true，双主题 toolbox/toolboxdark，counter/share 启用。
- 百度统计 hm.js ID = c1ce047dfb4bbcfe58cba2418b56332a（site.ts `analytics.baiduId`，BaseLayout 注入）。
- 部署：腾讯云轻量 58.87.68.151（Ubuntu 24.04）。deploy 公钥已绑；本地 deploy/deploy.sh，服务器 deploy/server-setup.sh。

## 生产环境
- 裸 mokakit.com/.cn → 301 → https://www.mokakit.com；www 200 + HSTS max-age=31536000。证书 LE(ECDSA) 至 2026-11-20，certbot.timer 自动续期；SAN 已含 mokakit.com/www.mokakit.com/mokakit.cn/www.mokakit.cn（2026-08-23 重签）。
- nginx：根 /var/www/mokakit；80 配置 /etc/nginx/conf.d/mokakit.conf；SSL /etc/nginx/mokakit-ssl.conf（在 conf.d 外，由 mokakit.conf 末尾 include）。⚠️ ssl 放 conf.d 内会双重加载→443 冲突吞 www 块。`listen 443 ssl http2;`，YE2 无 OCSP→`ssl_stapling off;`。
- 匿名计数 mokakit-counter（systemd 127.0.0.1:18800），nginx /api/ 反代，落盘 /var/lib/mokakit/。

## 战略主线
- AI 时代工具箱（人用 + AI 调）；MCP Server 战略核心。护城河：MCP search-first / 单位对长尾页 / 六段式内容模板。竞品盲区=主场：中国本土计算器（个税/社保/年终奖/房贷/增值税/组合贷）。不搬：i18n、账户系统+API Token。

## MCP Server（v0.1.0 公网接入）
- 端点 https://www.mokakit.com/mcp（Streamable HTTP + JSON-RPC 2.0 + 可选 Bearer）。本地 npm run mcp → localhost:18700/mcp。15 tool（14 计算 + mokakit_search）。
- 生产化：esbuild 打包 mcp/build.mjs → deploy/mcp/server.mjs(target=node18) + catalog.json(104 工具元数据)。改工具/加 meta 后必跑 npm run mcp:build + 重部署。
- mokakit-mcp.service(systemd /opt/mokakit-mcp 仅 127.0.0.1:18700) + nginx location /mcp 反代；MCP_TOKEN 写 /opt/mokakit-mcp/.env(600)。
- 对外邮箱 bo.zhao2026@outlook.com（/developers/ 与 /submit/ 均用此；勿用 wangcai@mokakit.com）。
- 扩展：server.mjs COMPUTE_TOOLS 加项，新逻辑抽 src/lib/*.ts；6 中国计算器纯函数在 src/lib/china-calc-extra.ts。

## 当前规模（2026-08-25）
- 123 工具 / 10 分类（calc 54 / dev 23 / text 8 / security 6 / ai 6 / convert 6 / life 8 / fun 5 / clock 4 / barcode 3）；sitemap 440 URL；长尾子页 247。4 批数学/实用计算器（第十七/十八批各 10 个）均六段式 content.mdx + WidgetHost 接线 + 各配 1 篇 SEO 博客；上线核验全绿（dist 总 HTML 434）。详情见 2026-08-25.md。
- content.mdx 覆盖 100%。好站导航 31 组 / 494 条。进度看板 npm run workbench → public/workbench.html（要 cp 到 dist）。单位换算 16 类 161 单位 213 页 / 649 FAQ。
- ⚠️ 曾 19 个"死工具"（meta+Tool 但 WidgetHost 未接线）→ 2026-08-19 全补（commit 693524d）。

## 出站链接中转
- 第三方链接走 /go/?url=（src/pages/go + src/utils/outbound.ts goUrl()）。不中转：站内/mailto:/tel:/本站域/政府备案链接。gen-sitemap 排除 /go/。

## Git 与推送
- 远端 https://github.com/wangcai-zhao/mokakit-website.git（master）。最新本地 commit=75c1957（2026-08-20 公安备案链接修复）。
- ⚠️ 原 classic PAT 2026-08-20 失效（401），push 被阻断。需旺财到 GitHub 重建 repo PAT，或存回 Windows 凭据管理器后 push。

## 待办
1. ✅ mokakit.cn 接入（2026-08-23 完成：备案/ DNS/ 证书 SAN/ 301 全验证）。
2. ⏸️ 摩卡配色打磨（暂缓）。
3. ⏳ MCP Token 公开申请通道（/developers/ 仅 mailto）。
4. ⏳ 百度/Google 站长平台提交 sitemap（sitemap 已上线，GSC 验证文件待加 public/）。
5. ✅ MCP Server 同步 6 中国计算器（2026-08-14）。

## 环境与坑（可复用）
- 本地跑 src/ TS：`node --experimental-strip-types --import ./scripts/ts-resolve.mjs xxx.mjs`。
- 构建绕沙箱：`export NODE_OPTIONS="--require=D:/WorkBuddy/website/noop-shim.cjs"` 后 `node node_modules/astro/bin/astro.mjs build`。build 收尾可能挂死→扫 /proc kill astro build node PID；sitemap 解耦单跑 `node scripts/gen-sitemap.mjs`。
- Astro build 偶发 Exit 1/只产 1 html→ `mv dist dist_bak_xxx` 逼全量；或 vite 重优化卡死时直接重跑通常即通过。
- ⚠️ build Exit 1 产物可能不完整（缺页）→ 上传前必校验 dist 关键页（index + developers + 页面数）。deploy.sh 内嵌构建卡死时，用已校验 dist 走「tar 上传 + nginx reload」。
- ⚠️ `server-setup.sh --live` 会回退 HTTPS→重滚后必补 `--enable-ssl`。日常更新用 deploy.sh（不带 --live）。
- ⚠️ **百度统计脚本**：BaseLayout 注入 hm.js 时切勿 `define:vars`+`set:html` 共用（冲突吞脚本），只用 `set:html` 且 ID 在模板字面量插值；改完抽 hm.baidu/_hmt 核对产物。
- 页脚备案：site.ts 改 icp/police 全站生效；政府备案链接不走 /go/。
- 沙箱 scp 大文件静默掐→`ssh host "cat 文件" > 本地` 分片。dist 禁 example.com 用 acme.com。服务器出网 github/raw 被墙→apt certbot webroot。本机沙箱出站 HTTPS 被拦→验证用 `ssh root@58.87.68.151 'curl -s --resolve mokakit.com:443:127.0.0.1 https://mokakit.com/ ...'`。

## 会话管理
- 续干：读本文件 + conversation_search。日级日志 YYYY-MM-DD.md。
- 立项→上线全量档案：archive/MOKAKIT_PROJECT_ARCHIVE_2026-08-13.md。
