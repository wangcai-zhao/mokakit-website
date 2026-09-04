# WorkBuddy 使用技巧 · 选题待办库

> 本文件是「WorkBuddy 使用技巧」专栏的选题储备。每周二、五由 automation 取待写选题生成草稿。
> 写作规范见 `scripts/new-tip.mjs` 生成的骨架：真人场景 + 操作流 + 踩坑 + 内链 MokaKit 工具。
> 正文**不写任何具体积分数字**（活动规则会变），积分话术只在 `InviteCta` 组件里以「以官方活动页为准」出现。

## 选题池（按优先级，待写 → 写作中 → 已发布）

| 选题 | 目标搜索词 | 内链工具（MokaKit） | WorkBuddy 功能点 | 难度 | 状态 |
|---|---|---|---|---|---|
| mcp.json 从零配好 | mcp.json 配置 / workbuddy mcp / 配置 mcp server | mcp-config-generator, json-formatter | MCP 连接本地工具 | 入门 | 已发布 |
| SKILL.md 怎么写才好用 | skill.md 怎么写 / workbuddy 自定义技能 | skill-generator, case-converter | 自定义技能编写 | 入门 | 已发布 |
| 日报写到第 20 天就写不下去 | 自动生成周报 / workbuddy 自动化 | changelog-gen, commit-gen, weekly-hours | 定时任务 + Git 集成 | 进阶 | 已发布 |
| 一堆 JSON 要改、单位要换 | 批量 json 格式化 / 批量单位换算 | json-formatter, unit-convert, base64, case-converter | AI 批量处理文件 | 入门 | 已发布 |
| 个税/社保算不明白，让 AI 调计算器 | workbuddy 算个税 / ai 计算 | income-tax-cn, social-security-cn, bonus-tax-cn | 让 AI 调用工具 + MCP | 入门 | 写作中 |
| 房贷月供到底多少，别再拿计算器瞎按 | workbuddy 房贷计算 / ai 算房贷 | mortgage-early-repayment, fund-loan-calc | AI 编排多步计算 | 进阶 | 写作中 |
| 把常用命令固化成 Skill，开机即用的小助手 | workbuddy 常用命令 skill | skill-generator, cron-parser | Skill + 命令封装 | 入门 | 写作中 |
| 会议纪要自动整理：录音转文字再提炼 | workbuddy 会议纪要 / ai 整理会议纪要 | text-dedup, case-converter | 文件读取 + 摘要 | 进阶 | 写作中 |
| 用 WorkBuddy 批量重命名 + 格式转换 | workbuddy 批量重命名 / 批量转换 | case-converter, base64 | 批量文件操作 | 入门 | 待写 |
| 让 AI 帮我写 SQL 并自查：接数据库的 MCP | workbuddy 连数据库 / mcp 数据库 | sql-formatter, json-formatter | 数据库 MCP | 高手 | 待写 |
| 定时抓取竞品价格， weekly 汇总给我 | workbuddy 定时抓取 / 网页抓取 | json-formatter, unit-convert | 定时任务 + 网页抓取 | 进阶 | 待写 |
| 把重复的客户回复做成模板技能 | workbuddy 自动回复 / 客服技能 | case-converter, base64 | 自定义回复技能 | 入门 | 待写 |
| 接入企业微信，让 AI 远程帮我跑任务 | workbuddy 企业微信 / 远程操控 | mcp-config-generator | 企微通道 + MCP | 高手 | 待写 |
| 用本地大模型跑敏感数据，不外传 | workbuddy 本地模型 / 隐私计算 | base64, json-formatter | 本地/隐私工具链 | 进阶 | 待写 |
| 一篇搞定：WorkBuddy 全技巧合集（月度专题） | workbuddy 教程 / workbuddy 使用技巧 | 全站工具 | 综合 | 进阶 | 待写 |

## 写作约束（每次生成草稿前自查）

1. 标题口语化、带「我」的第一人称场景，避免「史上最全」「一文搞定」等绝对化用语。
2. 每篇内链 ≥ 2 个真实存在的 MokaKit 工具 id（先在 `src/tools/` 下确认目录存在）。
3. 正文不出现裸邀请链接；邀请只在文末 `InviteCta`（已自动渲染）与首页/导航/工具页入口。
4. 不写具体积分数值；涉及规则一律「以官方活动页为准」。
5. 必须含「中间卡在哪 & 怎么绕过去」一节（真实报错 + 排查），这是去 AI 味的关键。
6. frontmatter：`draft: true`（默认不发布，人工审后改 false）、`series` 默认「WorkBuddy 使用技巧」、`author` 默认「旺财先生」。

## 引流路径回顾

- 文章文末 `InviteCta`（full）→ 注册领官方权益（rel=sponsored nofollow，明示跳转 codebuddy.cn）
- 首页专栏卡区（featured 前 3 篇）→ `/tips/`
- Header 导航「技巧」→ `/tips/`
- 工具页内嵌（skill-generator / mcp-config-generator /agents/workbuddy-eco）→ 文末/侧栏 `InviteCta` compact
- 每篇正文自然内链 2+ MokaKit 工具，把 WorkBuddy 读者导到工具页
