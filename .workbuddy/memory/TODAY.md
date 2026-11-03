# 2026-11-01 每日工具升级（全自动单步）

- 筛选：`scripts/pick-stale-tools.mjs --count 3`，候选池 249，选中 3 个（均 89 天未升级，updatedAt=2026-08-04）：markdown-preview（text）、mcp-config-generator（ai）、password-generator（security）。与 10-29 计划同批（该计划从未确认，故三者依旧垫底）。
- 安全前提：git tracked 干净（10-26 遗留 WIP 已被人工提交），通过。

## 逐工具结果

### 1. markdown-preview — done
- 改动文件：`src/tools/markdown-preview/Tool.tsx`（重写）、`meta.ts`、`content.mdx`。
- 修复硬伤：description 承诺「流程图、数学公式、脚注」均未实现 → 收敛为真实支持的 GFM 子集（标题/列表/任务列表/表格/代码块/引用/链接/图片/删除线），并补齐表格、任务列表、删除线、图片的预览样式（原样式表缺 table）。
- 新增：语法工具栏（11 个按钮，光标处插入/包裹/行前缀）、一键复制渲染 HTML（对准公众号排版场景）、字符与行数统计；DEMO 增加表格与任务列表示例。
- SEO：补 seoTitle「Markdown预览 - 在线Markdown编辑器实时渲染，支持表格代码块」；description 重写 ~105 字；related 3 个（markdown-table-gen / html-to-markdown / markdown-toc）；FAQ 2→3 条。
- 注：XSS（dangerouslySetInnerHTML 未消毒）此前已在 55e9b2c 提交修复（DOMPurify 已就位），今日复核确认无需再改。
- check:all：✅ 通过（EXIT=0）。

### 2. mcp-config-generator — done
- 改动文件：`src/tools/mcp-config-generator/Tool.tsx`（重写）、`meta.ts`、`content.mdx`。
- 修复硬伤：content.mdx 承诺「生成 stdio 与 HTTP/SSE 类型配置」但实现只有 stdio → 新增「远程服务（SSE）」「远程服务（Streamable HTTP）」两个预置（url + 可选请求头，生成带 type/url/headers 的标准配置）；meta FAQ 与 content.mdx 中「只生成 stdio、远程手动加 url」的旧口径全部同步。
- 修 bug：自定义 args 按空格/逗号硬拆，Windows 含空格路径被截断 → 改引号感知分词（双/单引号内不拆分，逗号仍可作分隔）。
- SEO：补 seoTitle「MCP配置生成器 - 在线生成mcp.json，支持stdio与HTTP/SSE远程服务」；description 重写 ~105 字；related 4 个；FAQ 2→3 条（新增「参数带空格怎么办」）。
- check:all：✅ 通过（EXIT=0）。

### 3. password-generator — done
- 改动文件：`src/tools/password-generator/Tool.tsx`、`meta.ts`、`content.mdx`。
- 修复硬伤：description 承诺 4-128 位但滑块 max=64 → 上限改 128，刻度补 96/128，新增 12/16/20/32/64/128 快捷档位；aria-valuemax=128 与实际一致。
- 修口径：content.mdx 全字符集 87→88（实现为 26+26+10+26=88），熵值表述核对无误。
- SEO：补 seoTitle「随机密码生成器 - 在线生成高强度安全密码，4-128位可调」；related 4 个；FAQ 5→6 条（新增「最长可以生成多少位」）。
- check:all：✅ 通过（EXIT=0）。

## 收尾
- `src/data/changelog.ts`：2026.10.23 Release notes 追加 3 条【升级】（markdown-preview / mcp-config-generator / password-generator）。
- `.workbuddy/upgrade-daily/history.json`：lastDate=2026-11-01，lastCategories=[text,ai,security]，prevCategories=[convert,dev,convert]。
- 未动 src/lib（无算法层改动），未跑 mcp:build / build / 部署。
- changelog:check 复核：281 个工具全部登记，无漏登记。

## 遗留待办（留人工）
- commit / push / 部署：未执行。提交时务必用显式路径 `git add`，**禁用 `git add -A`**（仓库有 `_cprof`/`dist_partial_*` 等未跟踪产物）。本次改动文件：
  - src/tools/markdown-preview/{Tool.tsx,meta.ts,content.mdx}
  - src/tools/mcp-config-generator/{Tool.tsx,meta.ts,content.mdx}
  - src/tools/password-generator/{Tool.tsx,meta.ts,content.mdx}
  - src/data/changelog.ts
  - .workbuddy/upgrade-daily/history.json、.workbuddy/memory/TODAY.md
- 下一批次候选升级点（本次未做）：三工具的长尾子页（markdown 语法速查 / mcp.json 配置示例 / 密码长度与熵对照表）——需改共享的 `src/pages/tools/[tool]/[...sub].astro` 加构建期数据分支，建议改完后人工跑一次 `npm run build` 验证再提交。
- mcp-config-generator 预置包名（@modelcontextprotocol/server-github / server-puppeteer 等）可能已归档：无外部检索条件下未改名，仅在 UI 加了「按客户端报错替换社区维护版本」的提示，留待人工核实。

---

# 2026-11-02 每日工具升级（全自动单步）

- 结果：**跳过**（安全前提不满足：git 已跟踪文件存在未提交改动，触发硬护栏，未执行任何升级）。
- 未提交改动构成（18 个已跟踪 M + 9 个未跟踪 ??）：
  - 11-01 自动化升级 WIP（待人工提交）：markdown-preview / mcp-config-generator / password-generator 三工具（Tool.tsx/content.mdx/meta.ts）+ src/data/changelog.ts + .workbuddy/upgrade-daily/history.json + KNOWLEDGE_BASE.md；昨天 check:all 每工具均已通过。
  - 手动工作 WIP（推断为旺财或其他会话正在进行的活）：ai-model-selector 大改（Tool.tsx +900 行，新增未跟踪 data.ts / logic.ts / scripts/test-ai-model-select.mjs）、新增 src/components/WechatFollow.astro、src/config/site.ts +27 行、Footer.astro、public/images/、_kms_src/。
- 未执行选人升级（仅只读跑了一次 pick-stale-tools 取明日预报），未改任何源码，未跑 check:all / mcp:build / build。
- 明日预报（仓库干净后下轮 20:00 将选中）：bill-split（life，89 天陈旧）/ bmi-calculator（calc，89 天）/ countdown-timer（life，89 天）——与 10-30 skipped 计划同批。
- 下一步（人工）：用显式路径分批提交上述 WIP（**禁 git add -A**；未跟踪目录 _kms_src/、public/images/、_genui_* 按需决定去留，别误卷入），提交后下轮自动运行即恢复。

---

# 2026-11-03 每日工具升级（全自动单步）

- 结果：**跳过**（安全前提不满足：git 已跟踪文件存在未提交改动，触发硬护栏，未执行任何升级）。
- 未提交改动构成（8 个已跟踪 M，+870/-49，均出现于 11-03 09:59 人工提交 c9db672 之后，判定为手动工作新一波 WIP，与自动化无关）：
  - deploy/mcp/catalog.json（+747，MCP 目录大改）、mcp/build.mjs（+53）、package.json（版本行）、scripts/test-search.mjs、scripts/ts-resolve.mjs、src/lib/search-build.ts（+47）、src/tools/registry.ts、src/components/WechatFollow.astro。
  - 构成看是 MCP 目录 + 搜索构建 + registry 基础设施层改动，规模与昨日 ai-model-selector 大改同级，正是护栏要避开的冲突场景。
- 未执行选人升级（仅只读跑了一次 pick-stale-tools.mjs 取预报，已验证不写文件、history.json 未变），未改任何源码，未跑 check:all / mcp:build / build。
- 明日预报（仓库干净后下轮 20:00 将选中）：bill-split（life，90 天陈旧）/ bmi-calculator（calc，90 天）/ countdown-timer（life，90 天）——与 10-30 skipped 计划同批。
- 下一步（人工）：用显式路径分批提交上述 8 个文件（**禁 git add -A**；提交前建议人工确认这波 MCP/搜索改动的验收状态），提交后下轮自动运行即恢复。
