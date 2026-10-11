# MokaKit 摩卡工具箱 · 项目专属知识库

> 维护：大美丽（AI 桌面搭子）。最后整理：2026-10-12（含版本基线 §10、未决事项 §11、IMA 镜像）。
> **续干顺序（必读）**：① 本文件（全局结构 + 技术规范 + 节点 + 避雷 + **版本基线 §10** + **未决事项 §11**）→ ② `MEMORY.md`（高频操作速查 + 避雷速记）→ ③ 当日日志 `.workbuddy/memory/YYYY-MM-DD.md` → ④ 必要时 `conversation_search` 跨会话检索。
> 本文件是"项目大脑"，任何涉及 MokaKit 的新增 / 修改 / 部署操作前，先通读本文件与 `MEMORY.md`。**IMA 镜像知识库「MokaKit 项目专属知识库」与本文件保持同步，线上检索用 IMA，本地权威以本文件为准。**

---

## 0. 一句话定位
MokaKit = "AI 时代的工具箱"，**纯静态站点**，260 个免费在线工具 / 11 分类。战略核心是 **MCP Server**——让外部 LLM（Claude / GPT 等）能直接调用这 260 个工具的能力。

---

## 1. 项目元信息
| 项 | 值 |
|---|---|
| 本地仓库 | `D:\WorkBuddy\website`（git `master`，远端 `github.com/wangcai-zhao/mokakit-website.git`） |
| 线上域名 | `https://www.mokakit.com` |
| ICP 备案 | 京ICP备2026051111号（见 `src/config/site.ts`） |
| 百度统计 ID | `c1ce047dfb4bbcfe58cba2418b56332a`（**以 `src/config/site.ts` 为准**） |
| AdSense | `ca-pub-0218164655974877`（`site.ts` 预留 `ads.enabled` 开关，默认 false） |
| 服务器 | 腾讯云 `58.87.68.151`（root） |
| 技术栈 | Astro 7 + Preact 10 + daisyUI 5 + Tailwind v4（纯静态；MCP 是唯一的 Node 运行时） |
| 当前规模 | 260 工具 / 11 分类（2026-10-11 达成；动态，以 `src/tools` 为准） |

---

## 2. 目录结构与职责
```
src/
  components/        UI 组件 + 关键注册点 WidgetHost.astro（手动水合）
  config/
    site.ts         ★真源①：备案/统计/广告/版本(从 package.json 派生)/SITE.url
    categories.ts   ★真源②：11 个分类枚举（id + 展示信息）
  content/
    blog/           Markdown 博客（frontmatter：title/description/publishDate/tags，draft 默认 true 需显式 false）
  data/
    sites.ts        好站导航分组（SITE_GROUPS）
    agents.ts       智能体专栏（AGENT_GROUPS）
    changelog.ts    ★更新记录真源（RELEASES，新增工具必补 id，否则 changelog:check 红灯）
  layouts/
    ToolLayout.astro        ★SEO 标题入口①（通用工具页）
    ClockImmersiveLayout.astro ★SEO 标题入口②（category==='clock' 走这，改标题别漏）
  lib/              ★财金算法单源（china-tax / china-social-security / china-vat / china-calc-extra / mortgage 等 .ts 纯函数）
  pages/            路由页（首页 / tools / blog / sites / agents / tips 等）
  styles/          全局样式
  tools/            ★工具本体：每工具一个目录 <id>/
    _shared/       工具间复用组件
  utils/           通用工具函数（含 goUrl() 出站链接）
  tools/types.ts    ★meta 契约（ToolMeta 类型定义）
  tools/registry.ts import.meta.glob 自动发现所有 meta.ts（但水合仍需手动注册）
astro.config.mjs    Astro 配置
package.json        scripts 与依赖版本基线
scripts/            optimize-sprite / gen-sitemap / check-widgets / check-icons / changelog-check / indexnow / test-*.mjs
deploy/            deploy.sh（build+上传+reload+indexnow）、server-setup.sh、nginx conf、systemd service
mcp/               build.mjs（esbuild → deploy/mcp/server.mjs + catalog.json）
dist/              构建产物（610+ index.html，可重建，勿手改）
```

---

## 3. 技术规范（铁律）

### 3.1 新增工具「四件套」
每个工具是 `src/tools/<id>/` 下三个文件：
- `meta.ts` —— 导出 `meta`（遵循 `src/tools/types.ts` 的 `ToolMeta` 契约：name / seoTitle / description / category / icon / keywords 等）。
- `Tool.tsx` —— Preact 组件，含交互逻辑；默认导出。
- `content.mdx` —— 六段式 SEO 长文（正文，无 frontmatter）。

### 3.2 WidgetHost 手动注册四步（漏则「死壳」）
`registry.ts` 只自动发现 meta，**交互水合必须手动**在 `src/components/WidgetHost.astro` 补 4 处：
1. `import Xxx from '@/tools/<id>/Tool.tsx';`
2. `const isXxx = tool.id === '<id>';`
3. 加进 `known` 大 OR 表达式；
4. 渲染区补 `load` / `idle` / `visible` 三分支（如 `{isXxx && mode === 'visible' && <Xxx client:visible {...widgetProps} />}`）。

判定真上线：`grep -c astro-island dist/tools/<id>/index.html` ≥ 1。靠 `npm run check:widgets` 兜底（扫 260 个工具是否都注册）。

### 3.3 命名规范
- 工具 id：kebab-case（`system-prompt-generator`），与目录名一致。
- 分类：只能用 `categories.ts` 的 11 个枚举：`convert` `text` `security` `calc` `dev` `image` `barcode` `ai` `life` `fun` `clock`。
- 新工具默认归 `calc`？——**否**，按实际语义选分类（AI 类归 `ai`）。

### 3.4 SEO 规范
- **`seoTitle` 与 `name` 分离**：`seoTitle` 只作用于 `<title>`；`name` 管卡片 / 面包屑 / h1。回退链：`seoTitle ?? title ?? tool.seoTitle ?? `${name} - 在线免费工具``。两处入口都要改（`ToolLayout` + `ClockImmersiveLayout`）。依据：Bing 实测标题首词命中查询词点击率约为未命中的 2.5 倍。
- `content.mdx` 正文六段式，**严禁裸 `<` `{` `}`**（MDX 当表达式解析 → `xxx is not defined` 构建报错）。JSON / 占位符示例一律走代码块或改写表述。
- `SITE.description` 里硬编码的工具总数，加工具要同步改。

### 3.5 财金算法单源（重要）
`src/lib/*.ts`（china-tax / china-social-security / china-vat / china-calc-extra / mortgage）是**纯函数层**，**MCP 与前端必须共用同一份**。禁止在 `Tool.tsx` 里另写一遍（契税 90㎡ vs 140㎡ 事故根因）。回归测试入口 `scripts/test-new-calc.mjs`。

### 3.6 图标复用
`src/components/icons.ts` 是 Lucide path 字典。优先复用已有图标；实在缺才补真实 path（源 `https://unpkg.com/lucide-static@1.47.0/icons/<name>.svg`）。`ICON_ALIASES` 刻意留空。新增工具若用未注册图标，`check:icons` 红灯。

### 3.7 changelog 必补
`src/data/changelog.ts` 顶部 `RELEASES` 每个 Release 必须包含本次新增的全部工具 id，否则 `changelog:check` 红灯（悬空 id 检测）。

### 3.8 出站链接
第三方链接统一走 `goUrl()`（`src/utils`），便于统计与安全管控。

---

## 4. 部署节点（线上拓扑）
| 节点 | 位置 | 说明 |
|---|---|---|
| Web 静态 | 服务器 `/var/www/mokakit` | nginx 托管；发布是**原子切换**（新内容先传 `.new`，校验后整体 `mv`，旧版留 `/var/www/mokakit.old` 可秒回滚） |
| MCP 服务 | 服务器 `/opt/mokakit-mcp` | systemd 服务 `mokakit-mcp`，监听 `127.0.0.1:18700`，由 nginx 反代对外；含 `server.mjs` + `catalog.json` + `.env` |
| 构建产物 | 本地 `dist/`（610+ 页） | 可重建，勿手改；sitemap 独立生成 |
| 部署脚本 | `deploy/deploy.sh` | `build → 上传 → nginx reload → IndexNow`；`--setup` 初始化、`--live` 切正式配置 |
| MCP 构建 | `npm run mcp:build` | esbuild 打包 `mcp/build.mjs` → `deploy/mcp/{server.mjs,catalog.json}`，再 scp 到 `/opt/mokakit-mcp` 并 `systemctl restart mokakit-mcp` |
| 域名 | `www.mokakit.com` | DNS → 58.87.68.151；HTTPS 由 nginx + Certbot 管理 |

**回滚**：`ssh root@58.87.68.151 'rm -rf /var/www/mokakit && mv /var/www/mokakit.old /var/www/mokakit && systemctl reload nginx'`。

---

## 5. 校验 / 构建 / 部署流程
1. **上线前必跑** `npm run check:all`（= `check:widgets` + `check:icons` + `changelog:check`），三项全绿才敢 build。
2. **本地构建**（本机需 NODE_OPTIONS 垫片）：
   ```bash
   export NODE_OPTIONS="--require=D:/WorkBuddy/website/noop-shim.cjs"
   export PATH="/c/Users/zhao-/.workbuddy/binaries/node/versions/22.22.2-6:$PATH"
   node node_modules/astro/bin/astro.mjs build   # → optimize-sprite → gen-sitemap
   ```
3. **⚠️ sitemap 护栏**：`gen-sitemap.mjs` 在 `npm run build` 中**偶发静默不产出** sitemap（沙箱）。build 后务必 `ls dist/sitemap-0.xml` 确认；缺失则手动 `node scripts/gen-sitemap.mjs` 重跑，并把 `sitemap-0.xml` + `sitemap-index.xml` 单独 scp 到 `/var/www/mokakit/`。
4. **网站部署**：`bash deploy/deploy.sh root@58.87.68.151`（含 IndexNow 推送）；或手动 `tar -czf - -C dist . | ssh ...` 原子切换 + `nginx -t && systemctl reload nginx`。
5. **MCP 部署**：`npm run mcp:build` → scp `deploy/mcp/{server.mjs,catalog.json}` 到 `/opt/mokakit-mcp` → `chown mokakit:mokakit` → `systemctl restart mokakit-mcp`。

---

## 6. 更新记录（里程碑）
- **2026-10-06** 版本基线：astro 7.3.5 / @astrojs/mdx 8.0.2 / @astrojs/preact 6.0.5 / daisyUI 5.7.47 / ts 6.0.3。preact 锁 10.x、TS 勿升 7。
- **2026-10-09** SEO 标题策略重排（Bing 数据驱动）+ 全屏时钟拆分时钟族着陆页。
- **2026-10-11** 扩容至 **260 工具**（新增 14 个 AI / 智能体 / MCP 方向工具）；好站导航新增 MCP 分组 + 充实 ai-agent/ai-model；博客新增 `ai-agent-mcp-toolbox-2026.md`；全量部署上线 + MCP catalog 同步 260。
- **2026-10-12** 建立离线 + 线上双备份；制定本技术规范与项目专属知识库（KNOWLEDGE_BASE.md）；补充运行环境/版本基线（§10）与未决事项（§11）；github 远端同步（260 工具 + 知识库）；IMA 镜像知识库同步建立。
- 更细的逐日记录见 `.workbuddy/memory/YYYY-MM-DD.md`；结构化 Release 见 `src/data/changelog.ts`。

---

## 7. 避雷清单（血泪坑）
- 🔴 **WidgetHost 漏注册** → 构建成功但 0 个 astro-island，工具是死壳。改完必跑 `check:widgets`。
- 🔴 **财金算法写两份** → 口径漂移事故。只改 `src/lib/*.ts`，MCP/前端共用。
- 🔴 **gen-sitemap 静默** → build 后查 `dist/sitemap-0.xml`，缺失手动补跑 + 补传。
- 🔴 **git 提交**：用显式路径 `git add <具体文件>`，**绝不 `git add -A`**（仓库混有 `_cprof`/`dist_partial_*`/早期未提交内容，会卷进来）。
- ⚠️ **MDX 裸 `<` `{` `}`** → 构建报 `xxx is not defined`。批量生成 content.mdx 后必查。
- ⚠️ **SEO 标题两入口** → 改 `seoTitle` 别漏 `ClockImmersiveLayout`（clock 类页）。
- ⚠️ **NODE_OPTIONS 垫片**只用于 website 项目；切到别的项目前 `unset NODE_OPTIONS`，否则 MODULE_NOT_FOUND。
- ⚠️ 后台长命令禁止 `| tail`/`| head`（管道提前关闭会永久挂起），改用 `> _x.log 2>&1`。
- ⚠️ Bash PATH 偶发损坏，命令开头加 PortableGit 的 PATH 修复。
- ⚠️ 同一文件多条 Edit **必须顺序执行**（并行会互相覆盖）。
- ⚠️ astro 入口各项目不同：website 是 `node_modules/astro/bin/astro.mjs`。

---

## 8. 下次更新前必读清单
1. 先读 **本文件 + `MEMORY.md`**（本文件是全局大脑，`MEMORY.md` 是高频速查）。
2. 改/加工具前，先读 `src/tools/types.ts`（meta 契约）、`src/config/categories.ts`（分类枚举）、`src/tools/registry.ts` + `src/components/WidgetHost.astro`（注册机制）。
3. 新增工具必须：四件套齐全 + WidgetHost 四处注册 + `changelog.ts` 补 id。
4. 构建后必查 `dist/sitemap-0.xml`（防 gen-sitemap 静默漏产）。
5. 部署：网站走 `deploy/deploy.sh` / 原子切换；MCP 改后必 `mcp:build` + 远端重启 + 验证 `catalog` 工具数。
6. 提交代码：`git add` 显式路径，绝不 `-A`；push 走 HTTPS token 通道（前台 + `dangerouslyDisableSandbox`）。**垃圾目录 `_cprof` / `dist_partial_*` / `_genui_apps` / `_genui_dl` / `outputs` 必须显式避开**（见 §11.4 与 §7 避雷）。
7. 任何破坏性 / 不可逆操作前，先备份、再二次确认。
8. **动依赖 / 升级运行时前必读 `§10 运行环境与版本基线`**：本地 Node 22 vs 服务器 Node 18 的差异（MCP 必须 esbuild `target=node18`）、TS 勿升 7、astro/preact 锁版本。
9. **未决事项见 `§11`**：财金算法去重、markdown-preview XSS、GenUI 提交路径等，等旺财决策前**勿擅自改**源码。
10. 本机无绿盾，D 盘项目可直接读写落盘；但 `NODE_OPTIONS` 垫片仅 website 项目用，切项目前 `unset`。

---

## 9. 备份策略（2026-10-12 建立）
- **线下**：`D:/WorkBuddy/backups/mokakit-source-YYYYMMDD.tar.gz` —— 本地工作区快照（含未提交改动），排除 `node_modules/dist/.astro/_cprof/dist_partial_*/_eprof/_genui_*/generated-images/.git/*.log`。
- **线上**：服务器 `/var/backups/mokakit-www-YYYYMMDD.tar.gz`（站点）+ `mokakit-mcp-YYYYMMDD.tar.gz`（MCP）；每次大版本发布/重要变更前刷新。
- 最新快照：2026-10-12（线下 16M/260 工具 meta；线上站点 30M/261 页 + MCP 95K）。

---

## 10. 运行环境与版本基线（2026-10-12 核实，动依赖前必读）

> ⚠️ 改 `package.json` 依赖 / 升级任何运行时前，先读本节。版本错配会直接 build 失败或 MCP 运行时崩溃。

### 10.1 本地构建环境（开发机 zhao-，Windows）
| 组件 | 版本 / 路径 | 用途 |
|---|---|---|
| Node.js（构建） | **v22.22.2**（托管版 `C:\Users\zhao-\.workbuddy\binaries\node\versions\22.22.2-6`） | Astro build / 脚本运行 |
| npm | 10.9.7 | 依赖管理（**别用 `npm i -g`**，污染系统） |
| Git | 2.55.0.windows.3 | 版本控制 |
| Python（托管） | 3.13.12（venv `...\python\envs\default`） | 脚本 / 批量处理（如 logo 生成） |
| 隔离 npm workspace | `C:\Users\zhao-\.workbuddy\binaries\node\workspace` | 装 `@cosui/genui-toolkit` 1.0.4、`@resvg/resvg-js` 等，不污染系统 |
| NODE_OPTIONS 垫片 | `--require=D:/WorkBuddy/website/noop-shim.cjs` | **仅 website 项目** build 用；切项目前 `unset` |

### 10.2 项目依赖基线（package.json，2026-10-12）
| 包 | 版本 | 约束 |
|---|---|---|
| astro | ^7.3.5 | 锁 7.x，勿动 |
| @astrojs/preact | ^6.0.5 | — |
| @astrojs/mdx | ^8.0.2 | — |
| preact | ^10.29.8 | 锁 10.x |
| daisyui | ^5.7.47 | — |
| tailwindcss | ^4.3.3 | v4（非 v3 写法） |
| @tailwindcss/vite | ^4.3.3 | — |
| typescript | ^6.0.3 | **勿升 7** |
| esbuild | 0.28.1 | MCP 构建（`mcp/build.mjs` 直接 import） |

### 10.3 服务器环境（58.87.68.151，root）
| 项 | 值 |
|---|---|
| OS | Ubuntu 24.04.4 LTS (Noble Numbat) |
| nginx | 1.24.0 (Ubuntu)，HTTPS 由 Certbot 管理 |
| Node.js（MCP 运行时） | **v18.19.1** |
| 磁盘 | 50G 总 / 6.6G 用 / 41G 余（14%） |

### 10.4 服务进程与端口
- **mokakit-mcp**：systemd 服务（loaded + active），监听 `127.0.0.1:18700`，由 nginx 反代对外；重启 `systemctl restart mokakit-mcp`。
- **nginx**：托管 `/var/www/mokakit`，监听 80/443；reload `nginx -t && systemctl reload nginx`。

### 10.5 🔴 版本硬坑：本地 Node 22 vs 服务器 Node 18
MCP 服务跑在服务器 Node **v18**，没有 `--experimental-strip-types`，无法直接 import `.ts`。因此 `mcp/build.mjs` 用 esbuild 把 `mcp/server.mjs` + `src/lib/*.ts` 打成一个 `target=node18 / format=esm` 的自包含 `deploy/mcp/server.mjs`。**改 MCP 后必须 `npm run mcp:build` 重建**，手改 `server.mjs` 会被下次 build 覆盖。

---

## 11. 未决事项 / 待办（等旺财决策，勿擅自改）

> 这些项是"下次更新"前需要旺财拍板的，agent 看到不要自作主张动源码。

1. **财金算法去重（5 个工具）**：`after-tax-salary` / `overtime-pay` / `deposit-interest` / `retirement-age` / `pension-estimate` 仍可能双写；唯一真源是 `src/lib/*.ts`（deed-tax 已治理，配 `scripts/test-deed-tax.mjs`）。改前先对齐。
2. **markdown-preview 的 `dangerouslySetInnerHTML` 无消毒**：A 引 dompurify / B 自研 / C 接受。安全相关，等决策。
3. **changelog 页 465KB、tools 索引 412KB 全量渲染**：性能待优化（按需加载 / 分页）。
4. **垃圾目录别提交**：`_cprof` / `dist_partial_*` / `_genui_apps` / `_genui_dl` / `outputs` 是被 git 跟踪或工作区遗留的临时产物；提交务必显式路径避开（§7 避雷 + §8.6）。
5. **`site.ts` 教师普惠开关注释标 09-30 到期**：需确认是否续期或移除。
6. **百度 GenUI 小工具提交路径未决**：`.workbuddy/skills/genui-app-builder/` 已就位（含 3 个试验产物在 `_genui_apps/`，**未提交**），但 MokaKit 工具大量用 localStorage / CDN / clipboard，与 GenUI「纯本地不联网、状态不持久」硬约束冲突，移植需逐个改造。发布还需旺财 `genui login` 百度账号。动这条线前必问旺财。
7. **分类失衡**：calc 80 / dev 53 / barcode 3，后续加工具可往稀疏类目补。
8. **GSC / MCP token 仍人工**：GSC 后台人工提交 sitemap-index.xml；MCP token 仍人工 mailto 审批。
