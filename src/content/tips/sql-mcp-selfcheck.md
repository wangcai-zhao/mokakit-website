---
title: "让 AI 帮我写 SQL 并自查：接数据库的 MCP"
description: "把本地数据库通过 MCP 接进 WorkBuddy，让 AI 直接写 SQL 查数。但生成的 SQL 挤成一行难查错、返回的 JSON 嵌套看花眼，我用 SQL 格式化 + JSON 格式化自查，踩了连接拒绝和笛卡尔积两个真实坑。"
publishDate: 2026-09-08
tags: ["数据库", "MCP", "SQL自查"]
draft: false
series: "WorkBuddy 使用技巧"
order: 10
difficulty: 高手
relatedTools:
  - sql-formatter
  - json-formatter
author: 旺财先生
featured: false
showInvite: true
---

## 我遇到的具体问题

我们业务库在一台内网 Postgres 上，以前我想看「上个月各渠道的退款率」都得找后端同事跑 SQL，等他空下来至少半天。这回我琢磨：既然 WorkBuddy 能接 MCP，能不能让它直接连库自己查？我花了一晚上把 postgres MCP 配进 `~/.workbuddy/mcp.json`，结果第一次让它查就翻车——它吐出来的 SQL 挤成密密麻麻一行，我眼睛都看花了也没看出问题，直接跑下去返回了一堆数字，对了一下历史报表发现总数翻了三倍，明显不对。

## 为什么这事值得自动化

这类「临时查个数」的需求我一周起码碰三四次，每次找人等半天、自己写 SQL 又容易漏 JOIN 条件。把数据库接成 MCP 之后，我口头描述需求它就能出 SQL 并自查，单次从「等半天」压到几分钟。前提是得让它产出我能看懂、能核对的东西，而不是黑盒扔个数字。下面两个工具就是为此存在的。

## 我是怎么用 WorkBuddy 做的

先在 mcp.json 里加了一个 postgres 服务的条目（command 起本地桥接进程，env 里放连接串）。连通后我对 WorkBuddy 说：「查上个月每个渠道的退款率，分子是退款订单数、分母是支付订单数」。它回了段 SQL。我第一反应不是直接跑，而是把它粘进 [SQL 格式化](/tools/sql-formatter/)，一键展开成带缩进的多行——这一展开，问题立刻显形了，下面「中间卡哪」细说。

跑完库之后返回的是 JSON，字段嵌套了三层（渠道 → 月份 → 指标）。我把它贴进 [JSON 格式化](/tools/json-formatter/) 展开对齐，哪个渠道的退款率是 null、哪个数字明显异常，一眼就能定位，再让 WorkBuddy 针对性修 SQL。

## 中间卡在哪 & 怎么绕过去

第一个坑是连接本身。配完第一次触发查询，MCP 直接报 `Error: connect ECONNREFUSED 127.0.0.1:5432`。我一开始以为是 mcp.json 写错了，对着文档改了半天 host 还是连不上。后来 `netstat -an | grep 5432` 一看——端口压根没在监听。是我的 Postgres 服务那台机器没起，根本不是配置问题。把数据库服务拉起来后，同样的配置秒连。教训：ECONNREFUSED 先看服务在不在，别上来就怀疑配置。

第二个坑才是真要命的。格式化展开 SQL 后我这才看清：AI 写的 JOIN 漏了 `ON o.channel_id = c.id` 这个条件，两张表直接做了笛卡尔积，所以总数翻了三倍。如果我不格式化、眯着眼跑，这个错误数字就进报表了。格式化完我补上 JOIN 条件，返回立刻正常。再配合 [JSON 格式化](/tools/json-formatter/) 展开结果，我还发现有个新渠道因为没匹配到订单，`refund_rate` 是 null（LEFT JOIN 的锅），顺手让 WorkBuddy 把 null 兜底成 0，报表才干净。

## 顺带的几个发现

接上 MCP 后才发现几条意外好处。一是 [SQL 格式化](/tools/sql-formatter/) 不只是美化，它逼着 AI 的输出变得「可审查」——一旦展开成多行，漏条件、错别名这种低级错一眼现形，等于给我加了道复核关。二是 [JSON 格式化](/tools/json-formatter/) 把嵌套结果摊平后，我顺手把异常值（null、负数、超范围）筛出来单独看，比在终端里滚屏舒服太多。三是这整套「AI 写 → 格式化自查 → 再跑」的流程我现在固化成了一个习惯，临时查数的出错率肉眼可见地降了。

## 你也可以这样用

给你一个能直接抄的变体：如果你也有个能跑 MCP 的数据库，别让 AI 写完了就直接执行。先让它把 SQL 吐出来，过一遍 [SQL 格式化](/tools/sql-formatter/) 再核对 JOIN 和聚合；结果出来先过 [JSON 格式化](/tools/json-formatter/) 检查有没有 null/异常，确认无误再采信。顺序是：先看明白，再相信数字。

## 常见问题

**ECONNREFUSED 一定是 mcp.json 写错了吗？** 不一定。先 `netstat -an | grep <端口>` 确认服务真在监听，很多时候只是数据库没启动或监听了别的地址。

**AI 写的 SQL 看起来能跑，还有必要格式化吗？** 非常有必要。挤成一行的 SQL 最容易藏漏 JOIN、错别名字段这类错，格式化展开后才看得清，相当于免费复核。

**返回的 JSON 里出现 null 正常吗？** 常见于 LEFT/RIGHT JOIN 没匹配到行，不一定是 bug，但需要你兜底成 0 或「无数据」，否则下游报表会算错。

**MCP 直连生产库安全吗？** 建议连只读从库或给查询账号最小权限，别拿有写权限的账号接进来，避免 AI 误执行了写操作。
