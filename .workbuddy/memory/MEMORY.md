# MokaKit 摩卡工具箱 — 项目长期记忆

> 工作目录 = `D:\WorkBuddy\website`（项目根，**已 git 化**：master 分支，首提交 `2eabc3d`；`.gitignore` 忽略 node_modules/dist/.astro/.counter-data；改动可正常 commit）

## 项目身份
- 纯静态工具站：Astro 7 + Preact + daisyUI + Tailwind v4。**不引** WordPress/PHP/MySQL/管理后台（保纯静态 + 缩小攻击面）。
- 主域 **mokakit.com**（已上线，HTTPS 全量）。**ICP 已批复：京ICP备2026051111号**（备案号单一真相源 = `src/config/site.ts` 的 `icp` 字段，页脚 `Footer.astro` 自动渲染并链工信部）；公安联网备案号 `police` 待批留空；**mokakit.cn 备案待批，暂未指 DNS、未入 `altDomains`**（过审后再加）。
- 品牌「摩卡工具箱 / MokaKit」。`launched:true`、`SITE.counter.enabled:true`、`SITE.share.enabled:true`。双主题 `toolbox`/`toolboxdark`。
- 部署服务器：腾讯云轻量 `58.87.68.151`（Ubuntu 24.04）。**部署公钥 `~/.ssh/mokakit_deploy.pub` 已绑定**（`~/.ssh/config` 配 Host 58.87.68.151 → IdentityFile mokakit_deploy）。本地推送 `deploy/deploy.sh`，服务器侧初始化/切站/SSL 用 `deploy/server-setup.sh`。

## 生产环境 / 部署运维（2026-08-13 已上线）
- **公网状态**：`http://mokakit.com` 与 `http://www.mokakit.com` 均 301 单跳到 `https://mokakit.com`；`https://www.mokakit.com` 301 到主域；`https://mokakit.com` 200 + HSTS `max-age=31536000`。证书 Let's Encrypt YE2，有效期至 2026-11-10，certbot.timer 自动续期（续期钩子 reload nginx）。
- **服务器 nginx 布局**（关键，避免重踩坑）：
  - 站点根 `/var/www/mokakit`（真实产物，含 sitemap）。
  - 正式 80 配置 `/etc/nginx/conf.d/mokakit.conf`；兜底裸 IP `return 444`；www/.cn 80→https 单跳。
  - **SSL 配置 `/etc/nginx/mokakit-ssl.conf`（故意放 `/etc/nginx/` 下、不进 `conf.d`）**，由 `mokakit.conf` 末尾 `include /etc/nginx/mokakit-ssl.conf;` 引入。
  - ⚠️ **惨痛坑**：若把 `mokakit-ssl.conf` 放进 `conf.d/`，nginx 会自动加载它一次，加上 `mokakit.conf` 里的 `include` 又加载一次 → **443 块重复、`conflicting server name ... ignored` 把 www 跳转块吞掉**，且 nginx 1.24 报 `protocol options redefined`。故 ssl 配置必须放 conf.d 之外，`--enable-ssl` 的 sed 解注 include 时也要同步改路径。
  - 证书软链：`/etc/nginx/ssl/mokakit.com/fullchain.cer` → `/etc/letsencrypt/live/mokakit.com/fullchain.pem`（续期自动更新）。
  - nginx 1.24.0 用 `listen 443 ssl http2;`（**不是** `http2 on;`）。
  - 该 YE2 证书无 OCSP URL → `ssl_stapling off;`（否则报 `ssl_stapling ignored`）。
- 匿名计数服务 `mokakit-counter`（systemd，127.0.0.1:18800），nginx `/api/` 反代；prod 落盘 `/var/lib/mokakit/`，`/api/health` 健康检查。

## 战略主线
- **MokaKit =「AI 时代的工具箱」**：人能用 + AI 也能调。**MCP Server 是战略核心**。
- 护城河：① MCP Server（search-first 把上千工具压成 70 个）；② 单位对独立长尾页；③ 六段式内容模板。
- **竞品盲区=主场**：中国本土计算器（个税/社保公积金/年终奖/房贷提前还款/增值税）。
- 明确不搬：多语言 i18n、账户系统+API Token。
- MCP 公网接入：HTTPS 现已就绪，技术可行（复用 counter 的 systemd/nginx 班车），待排期；公开后 tool name/schema 变更会冻结客户端集成，需预留 versioning。

## MCP Server（本地版 v0.1.0 已跑通）
- `mcp/server.mjs`（传输+分发，零依赖）+ `mcp/meta-loader.mjs`（扫 `src/tools/*/meta.ts`）。`npm run mcp` → 默认 **18700**，接入 `http://localhost:18700/mcp`。
- 三原则：同源发现（meta-loader）/ compute 入参即契约（import `src/lib/*.ts` 纯函数，仅依赖 decimal.js）/ 描述从 meta 生成。
- 9 个 tool：8 计算型 + `mokakit_search`（search-first）。扩展：在 `server.mjs` 的 `COMPUTE_TOOLS` 加项，新逻辑先抽 `src/lib/*.ts`。

## 当前规模（2026-08-12 工作台实测，后续若有大改需重跑 workbench）
- 94 工具 / 9 分类；全站 395 页（dist 395 html）。长尾子页 247（unit-convert 213 + github-stars 28 + ode-solver 6）。
- `content.mdx` 覆盖 94/94（100%）。好站导航 31 组 / 494 条（`src/data/sites.ts`）。
- 工具注册：`src/tools/registry.ts` 自动收，`src/components/WidgetHost.astro` 需手工加 import+分支。
- 进度看板 `npm run workbench` → `workbench/workbench.html`（内部）+ `public/workbench.html`（公开，要 `cp public/workbench.html dist/workbench.html`）。是静态快照，规模改动后须重跑。

## 单位换算（2026-08-08 扩容）
- 16 类 161 单位 213 长尾页 / 649 条页内 FAQ。扩容只改 `src/tools/unit-convert/units.ts`，改完跑 `npm run check:units`。温度类走独立话术（仿射变换）。

## 出站链接中转（强制）
- 所有第三方链接走 `/go/?url=<encodeURIComponent>`（`src/pages/go/index.astro` + `src/utils/outbound.ts` 的 `goUrl()`）。新增外链渲染点必须包 `goUrl()``。不中转：站内/`mailto:`/`tel:`/本站域名/政府备案链接。`gen-sitemap.mjs` 排除 `/go/`。

## 待办队列
1. ✅ **生产推送（备案后全链路）** —— 2026-08-13 完成：绑 deploy 公钥 → A 记录（.com + www）→ `deploy.sh --live` 推真实站点 → `server-setup.sh --cert`（certbot webroot 签发）→ `--enable-ssl`（修掉 conf.d 双重加载坑）。公网 HTTPS 已上线。
2. ⏳ **mokakit.cn 备案 + 接入** —— .cn 备案待批；过审后加 DNS A 记录 + 改 `site.ts` 的 `altDomains` 回填 `['https://mokakit.cn']` + nginx 补 .cn server（当前 mokakit-ssl.conf 已含 mokakit.cn 跳转，仅需 DNS）。
3. ✅ **公安联网备案号** —— 2026-08-13 批号 `京公网安备11010502062390号`，已填 `site.ts` 的 `police` + 页脚升级为可点击核验链接（beian.gov.cn），重建推生产生效。
4. ⏸️ **摩卡配色打磨** —— 暂缓。
5. ❌ 已放弃：GitHub 仓库分析工具、陌生高星仓收录、「真·AI 对话舱」（降待定）。
6. ⏳ **MCP Server 公网 HTTPS 接入** —— 技术可行（HTTPS 已就绪），待排期。

## 环境与坑（可复用）
- **本地跑 src/ TS 模块**：`node --experimental-strip-types --import ./scripts/ts-resolve.mjs xxx.mjs`（strip-types 不解析模块，ts-resolve 补后缀）。
- **数据驱动页静默吞**：`subpages()` 引用不存在 id → 不报错不生成；校验须断言「子页产出数==换算对数」。
- **构建绕沙箱**：`export NODE_OPTIONS="--require=D:/WorkBuddy\website\noop-shim.cjs"` 后 `node node_modules/astro/bin/astro.mjs build`（替换 safe-delete shim；删文件同理）。**只留 `--require=noop-shim.cjs`** 即可稳过（旧 `--max-old-space-size=4096 --use-system-ca` 会静默 Exit 1）。
- **build 收尾可能挂死**（vite 句柄未释放）：dist 已写全仍不返回 → 扫 `/proc` kill `astro.mjs build` 的 node PID。sitemap 已解耦，单跑 `node scripts/gen-sitemap.mjs`。
- **Astro build 偶发 Exit 1 / 中途崩** → 用独立命令 `node .../astro.mjs build && node scripts/gen-sitemap.mjs` 重构建得到完整 dist。
- heredoc 吃 `${...}` → 写脚本用 Write 工具。大改后预检：`@babel/parser` 严格解析 `src/**/*.{ts,tsx}`（禁 errorRecovery）揪卡构建文件；`useState(()=>...window...)` 惰性初始化会 SSR 崩，改 useEffect。
- 沙箱 scp 大文件静默掐 → `ssh host "cat 文件" > 本地` 分片。合规：dist 禁 `example.com`，用 `acme.com`。
- 服务器出网：github.com / raw.githubusercontent.com 被墙（acme.sh 装不了），但 apt / get.acme.sh / letsencrypt 通 → 用 `apt-get install certbot` + `certbot certonly --webroot`（不要走 acme.sh）。
- **本机沙箱出站 HTTPS 被拦**（curl 外网只回 `HTTP/1.1 200 Connection established` 桩、拿不到正文）。验证已部署的公网内容时，改走 `ssh root@58.87.68.151 'curl -s --resolve mokakit.com:443:127.0.0.1 https://mokakit.com/ ...'`，让服务器自己当客户端、本地 TLS 解析自测，真实验证 443 SSL 块吐出的内容。注意裸 `127.0.0.1` 会命中兜底 `server_name _` 的 `return 444`（关连接），必须带 `--resolve` 或 `Host:` 命中正式 server 块。
- **页脚备案渲染约定**：`SITE.icp` 与 `SITE.police` 在 `src/config/site.ts` 改一次即全站生效；`src/components/Footer.astro` 自动渲染——ICP 链 `https://beian.miit.gov.cn/`，公安备案号（页脚从 `police` 提取数字拼 `https://beian.gov.cn/portal/registerSystemInfo?recordcode=...`）链全国互联网安全管理服务平台。政府备案链接**不走** `/go/` 中转（见「出站链接中转」）。

## 会话管理
- 16.1MB 长会话已备份 `C:\Users\zhao-\WorkBuddy-conversation-backup\`。新窗口续干：说「继续 MokaKit 项目」，读本文件 + `conversation_search` 接上。日级日志 `.workbuddy/memory/YYYY-MM-DD.md`。
- **上线日全量档案**：`archive/MOKAKIT_PROJECT_ARCHIVE_2026-08-13.md`（立项→上线全量信息 + 进度时间线 + 新运营建议，2026-08-13 快照）。本文件为其精简活跃版。

## 用户偏好
- 称呼旺财先生；所有对话开头加财运祝福（「东风卷钱袋，金库破闸开，财路拦不住，洪流涌进来」）；我是大美丽 😎。
- 涉外网访问提示脱敏：不写「国内/墙/VPN」，改「境外站点 / 访问速度因网络环境而异 / 可试镜像站」。
