# MokaKit 摩卡工具箱 — 项目全量档案（上线日快照 · 2026-08-13）

> **用途**：从立项（2026-08-04）到公网正式上线（2026-08-13）的全部项目信息 + 进度过程存档，供「新运营启动」前通读交接。
> **配套记忆**：`MEMORY.md`（活跃长期记忆，随改动持续更新）为本档案的精简版；本档案是一次性完整快照，不与 MEMORY.md 重叠维护。
> **生成时间**：2026-08-13 11:23（北京时间）。本档案数据以「上线日实测」为准。
> **日级流水**：`.workbuddy/memory/2026-08-04.md`（起源，置于 archive/）~ `2026-08-13.md` 共 9 天日志为逐日明细，本档案提炼其结论。

---

## 0. 状态快照（2026-08-13 上线日）

| 维度 | 状态 |
|------|------|
| 公网 | ✅ `https://mokakit.com` 已上线，全量 HTTPS + HSTS(`max-age=31536000`)；http/www 均 301 单跳主域 |
| 主域 | mokakit.com（已上线）；mokakit.cn（备案待批，未指 DNS、未入 altDomains） |
| ICP 备案 | ✅ 京ICP备2026051111号（工信部，已渲染页脚并链 beian.miit.gov.cn） |
| 公安联网备案 | ✅ 京公网安备11010502062390号（页脚可点击核验链接 beian.gov.cn） |
| 证书 | Let's Encrypt YE2，2026-08-12 ~ 2026-11-10；certbot.timer 自动续期 |
| 部署服务器 | 腾讯云轻量 `58.87.68.151`（Ubuntu 24.04），deploy 公钥 `mokakit_deploy` 已绑 |
| 规模 | 94 工具 / 9 分类 / 全站 395 页 / 长尾子页 247 / 深度内容 94/94=100% / 好站导航 31 组 494 条 |
| MCP Server | 本地版 v0.1.0 跑通（9 tool，默认 18700）；公网 HTTPS 接入待排期 |
| 分享+计数 | 已上线（SITE.share.enabled / SITE.counter.enabled 均 true），匿名计数服务 prod 落盘 |
| Git | master 分支，首提交 `2eabc3d`，最新提交 `7bd2dcb`（08-12 feat(seo)）。⚠️ **08-13 上线日改动尚未 commit**（见 §7） |
| 品牌/主题 | 摩卡工具箱 / MokaKit；双主题 `toolbox` / `toolboxdark`；launched:true |

---

## 1. 项目身份与技术栈

- **定位**：纯静态工具站。「AI 时代的工具箱」——人能用 + AI 也能调。
- **技术栈**：Astro 7 + Preact + daisyUI + Tailwind v4。零运行时后端（除可选计数/ MCP 班车）。
- **不引入**（已拍板）：WordPress / PHP / MySQL / 管理后台（保纯静态 + 缩小攻击面）；多语言 i18n；账户系统 + API Token。
- **架构原则**：数据文件驱动（`src/data/*.ts`）+ 工具自动注册（`src/tools/registry.ts` 的 import.meta.glob）；`src/components/WidgetHost.astro` 是唯一手工注册点（import + 布尔开关 + load/idle/visible 三档水合）。
- **新增工具惯例**：归入现有分类，配套 `meta.ts` + `Tool.tsx` + 六段式 `content.mdx`；纯计算逻辑抽 `src/lib/*.ts`（仅依赖 decimal.js，供 MCP 复用）。

---

## 2. 战略主线与护城河

- **主线**：MokaKit = AI 时代的工具箱。MCP Server 从「可选项」升格为**战略核心**（2026-08-08 旺财拍板）。
- **三条护城河**：
  1. **MCP Server（search-first）**：把上千工具压成 ~70 个（借鉴 calculatorlib.com），避免撑爆 LLM 上下文。
  2. **单位对独立长尾页**：每个单位换算对生成 SEO 独立页（213 个长尾页）。
  3. **六段式内容模板**：数学公式 → 能做什么 → 使用方法 → 公式详解 → 实例演算 → FAQ（深度内容 100% 覆盖）。
- **竞品盲区 = 主场**：中国本土计算器（个税 / 社保公积金 / 年终奖 / 房贷提前还款 / 公积金贷款 / 增值税）——calculatorlib.com（528 工具）完全空白，搜索量高。
- **明确不搬**：i18n、账户系统+API Token。
- **已放弃**：GitHub 仓库分析工具、陌生高星仓收录、「真·AI 对话舱」（降待定，因耗时大、差异化弱、合规红线、超当前能力）。

---

## 3. 当前规模（上线日真相）

| 指标 | 数值 | 备注 |
|------|------|------|
| 工具总数 | 94 | meta.ts 94 个，全站一致 |
| 分类 | 9（全非空） | 计算/换算/开发/AI/文本/安全/条码标识/生活/趣味等 |
| 全站页面 | 395 | dist html（含 3 顶层 + 分类/工具/长尾子页） |
| 长尾子页 | 247 | unit-convert 213 + github-stars 28 + ode-solver 6 |
| 深度内容 | 94/94 = 100% | 六段式 content.mdx 全覆盖（含归一化「这个工具能做什么」小标题） |
| 单位换算 | 16 类 / 161 单位 / 213 对 / 649 FAQ | 选品优先中文高搜索量场景 |
| 好站导航 | 31 组 / 494 条 | ⚠️ 数字口径见 §6 注（08-11 曾记 36 组 624 条，以最新 MEMORY.md 为准） |
| 工具页结构化数据 | WebApplication / FAQ / Breadcrumb / ItemList | SEO 基建已强 |
| sitemap | 393 条 URL | 排除 /go/ 与 /workbench.html |

---

## 4. 生产环境 / 部署运维（已上线）

- **公网实测**（08-13）：
  - `http://mokakit.com` 301 → `https://mokakit.com/`（单跳）
  - `http://www.mokakit.com` 301 → `https://mokakit.com/`
  - `https://www.mokakit.com` 301 → `https://mokakit.com/`
  - `https://mokakit.com` 200 + HSTS `max-age=31536000`
  - 证书 YE2（无 OCSP URL → `ssl_stapling off;`）；nginx 1.24.0 `listen 443 ssl http2;`
  - `/api/health` 正常；`/robots.txt`、`/sitemap-index.xml` 200
- **nginx 布局**（关键，避免重踩坑）：
  - 站点根 `/var/www/mokakit`（tar 原子替换，旧版留 `.old`）
  - 80 配置 `/etc/nginx/conf.d/mokakit.conf`；兜底裸 IP `return 444`；www/.cn 80→https 单跳
  - **SSL 配置 `/etc/nginx/mokakit-ssl.conf`（故意放 `/etc/nginx/` 下、不进 `conf.d`）**，由 `mokakit.conf` 末尾 `include /etc/nginx/mokakit-ssl.conf;` 引入
  - ⚠️ **惨痛坑**：ssl 配置若进 `conf.d/` 会被自动加载一次 + include 又加载一次 → 443 块重复、`conflicting server name ... ignored` 吞掉 www 跳转块 + `protocol options redefined`。已固化修复。
  - 证书软链：`/etc/nginx/ssl/mokakit.com/fullchain.cer` → `/etc/letsencrypt/live/mokakit.com/fullchain.pem`
- **计数服务**：`mokakit-counter`（systemd，127.0.0.1:18800），nginx `/api/` 反代；prod 落盘 `/var/lib/mokakit/`（web root 之外，避免 deploy 原子替换抹掉）。
- **本地构建命令**（沙箱绕坑）：`export NODE_OPTIONS="--require=D:/WorkBuddy/website/noop-shim.cjs"` 后 `node node_modules/astro/bin/astro.mjs build && node scripts/gen-sitemap.mjs`。⚠️ 旧 `--max-old-space-size=4096 --use-system-ca` 会概率性瞬时 OOM 静默 Exit 1，只留 shim 即稳过。
- **服务器出网限制**：github.com / raw.githubusercontent.com 被墙（acme.sh 装不了）→ 用 `apt-get install certbot` + `certbot certonly --webroot`。

---

## 5. 核心功能模块拆解

### 5.1 单位换算长尾（08-08 扩容）
- `src/tools/unit-convert/units.ts` 重写：6 类 44 单位 → **16 类 161 单位 / 213 对**；FEATURED_PAIRS 抽 `buildSubpages`/`buildPairFaq()`。
- 新增 10 类：time / speed / data-rate / power / energy / pressure / angle / force / torque / frequency；现有 6 类同步扩容。
- 温度类走独立话术（仿射变换，不写「乘以系数」）；data-rate 补「100M 宽带为何只有 12.5MB/s」。
- 校验脚本 `npm run check:units`（scripts/check-units.mjs + ts-resolve.mjs）：四层校验防静默吞页（含 -40°C=-40°F 零点断言）。

### 5.2 中国本土计算器（差异化主场 · 08-11 全上线）
- 6 个工具，每个抽纯 TS compute 层（`src/lib/*.ts`，decimal.js 保精度，供 MCP 复用）：
  - `income-tax-cn` 个税（china-tax.ts，综合所得 7 级 + 60000 免征额）
  - `bonus-tax-cn` 年终奖（税率盲区警示 + 单独 vs 并入对比）
  - `social-security-cn` 五险一金（china-social-security.ts）
  - `mortgage-early-repayment` 房贷提前还款 + `fund-loan-calc` 公积金贷款（共用 mortgage.ts）
  - `vat-calc` 增值税（china-vat.ts，一般/简易/含税还原）
- 断言校验：房贷月供 100万/3.85%/30年=4688.08；提前还款缩短期限省约 32.7 万；增值税留抵 11.7 万。

### 5.3 六段式内容模板（SEO 核心 · 08-12 收口 100%）
- 模板：数学公式(KaTeX) → 能做什么 → 使用方法 → 公式详解 → 实例演算 → FAQ。
- 08-12 归一化小标题「这个工具能做什么」（63→83 页，源码 0 残留「## 什么是」变体）；10 个手写批（指南式）保留不套。

### 5.4 好站导航（08-04 起，08-12 加图焕新）
- `src/data/sites.ts`（31 组 / 494 条，uniform nofollow）+ `/sites/` 卡片网格。
- 08-12 加 `favicon.ts`：卡片字母头像叠 favicon `<img>`（loading=lazy / referrerpolicy=no-referrer / onerror 兜底）；首页新增「精选好站」带图区块。

### 5.5 出站链接统一中转 /go/（08-06 落地，08-07 修 bug）
- `src/pages/go/index.astro` + `src/utils/outbound.ts` 的 `goUrl()`：所有第三方外链包 `/go/?url=<encodeURIComponent>`，校验仅放行 http/https 且非本站域名，noindex，sitemap 排除。
- ⚠️ SSG 关键坑：依赖运行时 query 的页面必须客户端 JS 读 `window.location.search`，不能靠 `Astro.url` 构建期读（否则「链接不可用」烤死静态壳）。
- 不走 /go/：站内 / mailto: / tel: / 本站域名 / 政府备案链接。

### 5.6 分享 + 匿名计数（08-12 收口）
- 分享：原生 `navigator.share` + 复制链接兜底（前端 JS 早已就位，开门禁即生效）。
- 计数：`SITE.counter.enabled:false→true` 一行开门禁；服务 `deploy/counter/server.mjs`（零依赖 Node，127.0.0.1:18800，落盘 /var/lib/mokakit/）+ systemd + nginx 反代。工具页「已被使用 N 次」+ 页脚「累计访问 N」。

### 5.7 MCP Server（战略核心 · 本地 v0.1.0）
- `mcp/server.mjs`（零依赖 Node http/crypto，Streamable HTTP + JSON-RPC 2.0）+ `mcp/meta-loader.mjs`（扫 `src/tools/*/meta.ts`）。`npm run mcp` → 默认 **18700**，接入 `http://localhost:18700/mcp`。
- 三原则：同源发现（meta-loader）/ compute 入参即契约（import `src/lib/*.ts`）/ 描述从 meta 生成。
- 9 tool：8 计算型（个税/年终奖/年终奖对比/五险一金/增值税一般/增值税简易/房贷计划/房贷提前还款）+ `mokakit_search`（search-first）。
- 公网 HTTPS 接入：技术可行（复用 counter 班车），待排期；公开后 tool name/schema 变更冻结客户端集成，需预留 versioning。

### 5.8 进度工作台 workbench
- `npm run workbench` → `workbench/workbench.html`（内部）+ `public/workbench.html`（公开脱敏）。是**静态快照**，规模改动后须重跑 + `cp public/workbench.html dist/workbench.html`。
- KPI 6 维：工具/分类/静态页面/长尾子页/深度内容覆盖/sitemap；含里程碑时间线、分类分布、待办、全工具表。
- ⚠️ 脱敏规则：公开副本必须替换「旺财先生/旺财/大美丽」及本地盘符路径；曾漏 3 处「旺财确认」。

---

## 6. 进度过程时间线（2026-08-04 → 2026-08-13）

| 日期 | 阶段 | 关键动作 | 工具数(日志口径) | 页面数 |
|------|------|----------|------------------|--------|
| 08-04 | 立项+本地铺量 | 域名备案提交；服务器重置 Ubuntu24.04；生成 deploy 密钥；第 3–11 批工具（含 /sites 导航、免费 SSL 方案、摩卡配色 v1、进度工作台、页脚版本号）；琥珀档 AI 对话舱降待定 | 7→31 | 62→89 |
| 08-05 | 代码审计 | 迭代体检 P0–P3 四阶段规划；发现 workbench.html 泄露内网 IP/真实姓名/备份路径、/search//about//privacy/ 死链、sitemap 缺 lastmod | 67（注①） | 89 |
| 08-06 | 构建修复 | 修 copyText 搅坏的 4 文件（prompt-library/qrcode/totp/aes）+ SearchIsland SSR 崩溃；/go/ 中转落地（493 条）；build-your-own-x 25 条深链化 | 31/67 | 190→192 |
| 08-07 | 中转收尾 | /go/「链接不可用」bug 修复（SSG query 必须客户端读）；dev 资源核查（dev-roadmap/system-design 不强行深链）；分享+计数方案定稿 | 31/67 | 192 |
| 08-08 | 战略+换算 | 竞品 calculatorlib.com 研究；主线「AI 时代的工具箱」；单位换算 16 类 161 单位 213 对；workbench 大修（scanAssets 直 import TS） | 67 | 192→356 |
| 08-09 | 移植 ODE | ode-solver 微分方程求解器（移植 bchrt.com，RK4 数值解） | 67→69 | 357→364 |
| 08-11 | 本土计算器 | 工作台刷新 88 工具；中国本土计算器第一批（个税+年终奖）→ 第二批（社保/房贷提前还款/公积金贷款/增值税）全上线 | 88→94 | 389→395 |
| 08-12 | 收口+上线配置 | 六段式归一化 100%；首页/好站导航加图焕新；ICP 批复填号 launched:true；MCP Server v0.1.0 跑通（9 tool）；分享+计数上线；git init 首提交 2eabc3d；SEO/投稿表单（robots.txt+/search//submit/） | 94 | 395→396 |
| 08-13 | **公网上线** | 绑 deploy 公钥→A 记录→deploy.sh --live→server-setup.sh --cert→--enable-ssl；修 nginx conf.d 双重加载坑；certbot webroot 签发；公安备案号上线（页脚可点击核验）；重建推送生产 | 94 | 395 |

**注① 工具数口径差异**：各日志工具数存在跳跃（08-04 记 31、08-05 起记 67、08-08 记 67、08-09 记 69、08-11 记 88→94）。08-04 与 08-05 间的差额源于时间日期类（calculatorlib 复刻 24 个净增 21）+ coolexplore URL 列表批量复刻等批次，未在 08-04 日志逐条记录。**最终以 94 为准**。具体工具清单见 `src/tools/` 目录与 workbench 全工具表。

**注② 好站导航口径**：08-11 日志曾记 36 组 624 条，MEMORY.md（08-13 最新）记 31 组 494 条，存在后续删减可能；以最新 MEMORY.md 为准，如 08-11 后有过调整需核对 `src/data/sites.ts`。

---

## 7. 待办队列 + 未决项

| # | 项 | 状态 | 说明 |
|---|----|------|------|
| 1 | 生产推送（备案后全链路上线） | ✅ 完成 | 08-13 公网 HTTPS 上线 |
| 2 | 分享+计数 | ✅ 完成 | 08-12 开门禁 |
| 3 | 公安联网备案号 | ✅ 完成 | 京公网安备11010502062390号，页脚可点击核验 |
| 4 | 摩卡配色打磨 | ⏸ 暂缓 | 第一版已落地，待旺财微调意见 |
| 5 | mokakit.cn 备案 + 接入 | ⏳ 待批 | 过审后加 DNS A + 改 site.ts altDomains + nginx 补 .cn server |
| 6 | MCP Server 公网 HTTPS 接入 | ⏳ 待排期 | 技术可行（HTTPS 已就绪），需预留 versioning |
| 7 | **08-13 上线日改动 commit** | ⚠️ 未提交 | 当前 git 未提交：deploy/nginx/*、deploy/server-setup.sh、deploy/deploy.sh、Footer.astro、site.ts、MEMORY.md、scripts/_fix-ssl.sh、deploy-run.log、2026-08-13.md。建议旺财确认后 `git add -A && git commit` |
| 8 | 六段式内容质量迭代 | 持续 | 已 100% 覆盖，可进阶 KaTeX 公式精修 / OG 动态化 |
| 9 | 百度统计 | 接口预留 | BaseLayout 已注入 `analytics.baiduId`，给 ID 即生效 |

**已放弃**：GitHub 仓库分析工具、陌生高星仓收录、「真·AI 对话舱」（降待定）。

---

## 8. 环境坑与可复用经验

- **本地跑 src/ TS 模块**：`node --experimental-strip-types --import ./scripts/ts-resolve.mjs xxx.mjs`（strip-types 不解析模块，ts-resolve 补后缀）；比跑构建快 40 倍。
- **数据驱动页静默吞**：`subpages()` 引用不存在 id → 不报错不生成；校验须断言「子页产出数 == 换算对数」（`check:units` 已做）。
- **构建绕沙箱**：只留 `NODE_OPTIONS="--require=.../noop-shim.cjs"` 稳过；旧 `--max-old-space-size=4096 --use-system-ca` 概率性瞬时 OOM 静默 Exit 1。
- **build 收尾可能挂死**（vite 句柄未释放）：dist 已写全仍不返回 → 扫 `/proc` kill `astro.mjs build` 的 node PID；sitemap 已解耦单跑。
- **Astro build 偶发 Exit 1** → 独立命令 `node .../astro.mjs build && node scripts/gen-sitemap.mjs` 重构建。
- **AST 扫描假阴性**：`@babel/parser` 默认导出取 `pkg.parse`（非 `pkg.parser.parse`），且禁 `errorRecovery`（否则脑补吞真错）；严格解析才能揪真语法错误文件。
- **SSR 崩溃**：`useState(()=>...window...)` 惰性初始化会 SSR 崩 → 改 `useEffect`。
- **heredoc 吃 `${...}`** → 写脚本用 Write 工具，不用 Bash heredoc。
- **沙箱 scp 大文件静默掐** → `ssh host "cat 文件" > 本地` 分片；合规：dist 禁 `example.com`，用 `acme.com`。
- **本机沙箱出站 HTTPS 被拦**（curl 外网只回 `HTTP/1.1 200 Connection established` 桩）→ 验证公网内容改走 `ssh root@58.87.68.151 'curl -s --resolve mokakit.com:443:127.0.0.1 https://mokakit.com/ ...'`；裸 `127.0.0.1` 命中兜底 `return 444`，须带 `--resolve`。
- **页脚备案渲染约定**：`SITE.icp`/`SITE.police` 改一次全站生效；Footer.astro 自动渲染并链政府站点（不走 /go/）。
- **workbench 双份不同步**：`public/workbench.html` 改后 `dist/workbench.html` 不自动变，须 `cp`；规模改动后顺手 `npm run workbench`。

---

## 9. 会话管理与用户偏好

- **会话管理**：16.1MB 长会话已备份 `C:\Users\zhao-\WorkBuddy-conversation-backup\`。新窗口续干：说「继续 MokaKit 项目」，读 `MEMORY.md` + 本档案 + `conversation_search` 接上。日级日志 `.workbuddy/memory/YYYY-MM-DD.md`。
- **用户偏好**（跨项目，见 `~/.workbuddy/MEMORY.md`）：称呼旺财先生；所有对话开头加财运祝福（「东风卷钱袋，金库破闸开，财路拦不住，洪流涌进来」）；我是大美丽 😎；涉外网访问提示脱敏（不写「国内/墙/VPN」，改「境外站点 / 访问速度因网络环境而异 / 可试镜像站」）。
- **本机环境约束**：文件删除被「安全删除」策略拦截（rm 失败）；pip/Playwright 装包见用户长期偏好；管理版 Python/Node 在隔离目录。

---

## 10. 新运营启动建议（分层）

### A. Pre-launch 收尾（上线即做）
- 🔴 **commit 08-13 上线日改动**（§7 #7），让版本库反映真实公网状态。
- 🟡 补百度统计 ID（`analytics.baiduId`）激活访问看板。
- 🟡 确认 workbench 公开副本是否继续保留（页脚已不链，但直接 URL 仍可访问）。

### B. Launch 验证（上线后 1–2 周）
- 🟢 盯 `/api/health` + certbot 续期（2026-11-10 到期前自动续）。
- 🟢 公网 SEO 抓取验证：sitemap 393 条被收录、六段式页排名、长尾换算页长尾词。
- 🟢 mokakit.cn 备案过审即接入（§7 #5）。

### C. Growth（运营主线）
- 🟢 **MCP Server 公网化**（§7 #6）：战略核心，先排期 + 预留 versioning，对外放出让 AI 能调 MokaKit。
- 🟢 内容增长：六段式精修（KaTeX 公式 / OG 动态图）、本土计算器扩场景（工资条、年终奖筹划）。
- 🟢 单位换算长尾扩类目（已 16 类，可加体积流量/密度等）。
- 🟢 好站导航扩量 + 投稿闭环（/submit/ 已就位，接真实 GitHub 仓库）。
- ⏸ 摩卡配色打磨（旺财满意前暂缓）。

### D. 风险护栏
- 纯静态架构不变（不引后端/账户），保持小攻击面。
- 任何影响规模的改动后跑 `npm run workbench` + 重新 build + sitemap。
- 公网改动走 deploy 班车，先本地构建验证再 `--live`。

---

> **档案完**。本文件为 2026-08-13 上线日一次性快照；后续改动以 `MEMORY.md` 为准，新运营里程碑建议追加到对应日级日志与本档案 §6 时间线。
