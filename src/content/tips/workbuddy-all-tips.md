---
title: "一篇搞定：WorkBuddy 全技巧合集（月度专题）"
description: "旺财先生把半年里用 WorkBuddy 跑通的活儿收成一张地图——配 MCP、写技能、算个税房贷、抓数据、接企微，每条都附真实踩坑和对应的 MokaKit 工具，照着抄就能搭起自己的自动化流水线。"
publishDate: 2026-09-18
tags: ["WorkBuddy", "自动化", "效率", "MCP", "技能"]
draft: true
series: "WorkBuddy 使用技巧"
order: 15
difficulty: 进阶
relatedTools:
  - mcp-config-generator
  - skill-generator
  - json-formatter
  - unit-convert
  - cron-parser
  - sql-formatter
  - base64
  - case-converter
  - text-dedup
  - income-tax-cn
  - mortgage-early-repayment
  - commit-gen
  - weekly-hours
author: 旺财先生
featured: false
showInvite: true
---

## 我遇到的具体问题

半年下来，我在 WorkBuddy 里东一榔头西一棒槌，攒了一堆能跑的活儿：每天自动签到、周报自动出、竞品价格定时抓、个税房贷随手算。可真要跟同事讲"我到底拿 WorkBuddy 干了啥"时，脑子里是一团浆糊——命令散在十几个会话里，有的 Skill 改过三版，有的定时任务连我当时为啥写都忘了。

前阵子一个同事问"你那个每天自动签到到底怎么弄的"，我翻了将近四十分钟聊天记录，才把完整步骤拼出来。那一刻我决定：把这些散落的用法收拢成一张能直接照抄的地图，省得下次再翻。

## 为什么这事值得自动化

这些活儿单看每次就省几分钟，但全是高频。我粗算过自己这半年的节奏：

- 每日签到：每天 1 次，手点要点开好几个页面，漏了还得补
- 周报：每周 1 次，每次从聊天记录和 Git 里捞素材至少 15 分钟
- 竞品价格抓取：每周 1 次，三家网页格式还不一样
- 个税 / 房贷 / 社保：每月随口问好几次，每次重新想公式
- 批量改名 + 转格式：跟着项目爆发，一次几十上百个文件

频率乘单次耗时，光周报和签到一个月就反复两套流程，每次从头回忆步骤 5 到 15 分钟，零散搭进去三四个小时。收成一张地图后，新同事或者三个月后的我自己，照抄十分钟就能复现，不用再翻记录。

## 我是怎么用 WorkBuddy 做的

我把这半年跑通的活儿按"想干的事 → 用哪个工具 → 看哪篇技巧文"整理成了一张表，核心就三步走：

第一步，把本机脚本变成 AI 能调的工具。用 [mcp 配置生成器](/tools/mcp-config-generator/) 生成 `mcp.json`，把本地那些 Python / Node 小脚本暴露出来，WorkBuddy 就能直接喊它们跑，不用我手动执行。

第二步，把常用命令固化成技能。签到、批量改名这种重复动作，用 [skill 生成器](/tools/skill-generator/) 写成 Skill，下次一句话就能触发，不用再把命令贴一遍。

第三步，算账和数据处理交给现成工具。个税、社保、房贷我不再手敲公式，直接让 AI 调 [个税计算器](/tools/income-tax-cn/)、[房贷计算器](/tools/mortgage-early-repayment/)；下载回来的脏数据用 [JSON 格式化](/tools/json-formatter/)、[单位换算](/tools/unit-convert/)、[Base64](/tools/base64/)、[大小写转换](/tools/case-converter/)、[文本去重](/tools/text-dedup/) 先收拾干净。

接数据库的自查 SQL 用 [SQL 格式化](/tools/sql-formatter/) 顺手排版；定时跑的任务用 [cron 表达式解析](/tools/cron-parser/) 把"每周五 18:00"翻成调度表达式；周报素材靠 [提交记录生成](/tools/commit-gen/) 和 [工时统计](/tools/weekly-hours/) 从 Git 里捞。想手机上远程使唤，就走企微通道让 AI 帮我跑。

对话里我一般这么开：`"把本周的提交和工时整理成周报，用 commit-gen 和 weekly-hours 那套"`——它自己会去调对应工具，不用我操心中间步骤。

## 中间卡在哪 & 怎么绕过去

踩过的坑比顺滑的路多，挑三个最典型的：

**1. mcp.json 的 args 写成字符串，服务起不来。** 我第一版手写配置时图省事把参数拍成了一行字符串：

```json
{ "args": "mcp-config-generator --live" }
```

结果一连就报 `could not determine executable to run`。查了半天才发现 args 必须是数组，写成字符串后框架认不出可执行文件。后来直接用 [mcp 配置生成器](/tools/mcp-config-generator/) 出配置，从源头避开手写出错。

**2. 接本地大模型跑敏感数据，连不上。** 我想把客户资料放本地模型处理不外传，配好地址一跑直接 `ECONNREFUSED 127.0.0.1:11434`。排查顺序：先 `curl 127.0.0.1:11434` 看服务在不在，发现 Ollama 根本没起；起来后还连不上，是上次的进程占了端口，杀掉重起才通。

**3. 以为 Base64 算脱敏，其实一解码就还原。** 有回我把带身份证号的字段 Base64 编码后存日志，自我安慰"脱敏了"。结果同事拿去一解就还原成明文——Base64 只是编码不是加密。正确做法是直接在本机丢弃敏感字段再落盘，别指望编码能瞒住谁。

还有个隐蔽的：用 cron 排"每周五晚 6 点"，表达式 `0 18 * * 5` 被当成 UTC，北京实际是晚 8 点才跑，差点错过汇报窗口。带时区的调度一定要显式标清楚。

## 顺带的几个发现

收地图的过程中，有些工具给了我计划外的好处：

竞品抓价那次，[JSON 格式化](/tools/json-formatter/) 不止帮我排版，还顺手暴露出对方 API 偷偷把字段改了名——之前我就因为字段对不上踩过 `Cannot read properties of undefined (reading 'textContent')` 的坑，格式化后一眼就看出结构变了。

比价时 [单位换算](/tools/unit-convert/) 救过我一次：三家供应商一个按"打"、一个按"件"、一个按"箱"报，量级差出十二倍，不先统一单位直接求平均会离谱到没法看。

[大小写转换](/tools/case-converter/) 解决了一个一直没在意的尴尬：客户名一会儿"张伟"一会儿"zhangwei"，发出去的回复显得很不专业，统一成首字母大写后干净多了。[文本去重](/tools/text-dedup/) 则在会议纪要转写稿上立功——同一句话录音里重复了三遍，去重后才像人话。

## 你也可以这样用

你不是我，没有签到和个税需求也没关系，照抄的骨架是一样的：挑你最高频的三件事，先用 [mcp 配置生成器](/tools/mcp-config-generator/) 接一个本地脚本，再用 [skill 生成器](/tools/skill-generator/) 把它固化成技能，最后用 [cron 表达式解析](/tools/cron-parser/) 排个期。

举个具体例子：假设你是一个每周要交运营数据的人，可以这么起手——

1. 把"拉取本周数据并导出 CSV"写成一个本地脚本
2. 用 mcp 配置生成器接进 WorkBuddy
3. 用 skill 生成器包成 `周报数据` 技能
4. 用 cron 解析排成"每周五 17:00"
5. 让 AI 调用 [JSON 格式化](/tools/json-formatter/) 顺手规整导出结果

跑通这一条，其余的高频活儿都是同一个模子拓出来。

## 常见问题

**Q：这些 MokaKit 工具要单独装吗？**
不用。工具在 mokakit.com 上直接能用；WorkBuddy 这边接的是你自己机器上的脚本，两者各管各的。

**Q：mcp.json 写错了会让站点构建崩吗？**
WorkBuddy 的 tips 内容有 zod 校验，字段错了构建会直接挂；但 MCP 连接本身是运行时的事。最稳的办法是用 [mcp 配置生成器](/tools/mcp-config-generator/) 生成，别手写。

**Q：定时任务错过会自动补发吗？**
本机自动化错过就跳过、不补发，得保证电脑开机且联网。我之前有次笔记本合盖，周五的抓取直接没跑，只能手动补。

**Q：文里提到的工具和 WorkBuddy 技能是一回事吗？**
不是。工具是 MokaKit 上的计算器、转换器这类现成能力；技能是你自己在 WorkBuddy 里封装的命令流。两者配合，前者补计算、后者管流程。
