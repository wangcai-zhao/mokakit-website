---
title: 让 AI 助手直接调工具：MokaKit MCP 接入指南
description: 用最直白的话讲清 MCP 是什么、MokaKit 的 MCP Server 怎么接入 Claude Desktop / Cursor，以及它支持哪些中国本土计算工具。
publishDate: 2026-08-19
tags: [MCP, 教程, AI]
---

如果你用过 Claude Desktop 或 Cursor，大概率遇到过这个尴尬：AI 很聪明，但它「看不到」也「碰不到」你电脑之外的实时工具。你问它「帮我算一下月薪 2 万的个税」，它只能给你讲公式，没法真的算出一个精确到分的数字。

MCP 就是来解决这个问题的。

## MCP 是什么，一句话版本

**MCP（Model Context Protocol，模型上下文协议）是 AI 客户端调用外部工具的一套标准接口。** 类比一下：MCP 之于 AI，就像 USB 之于鼠标键盘——只要双方都支持这个标准，插上就能用。

有了 MCP，AI 助手就能从一个「只会聊天」的模型，变成「能查数据、能算数、能执行」的智能体。而 MokaKit 做的，是把自己站上那 100 多个工具，通过 MCP 暴露给 AI。

## MokaKit MCP 能做什么

MokaKit 的 MCP Server 目前开放 15 个 tool，重点是**中国本土计算**这套国外工具彻底盲区的能力：

- 个税（[income_tax_cn](/tools/income-tax-cn/)）：输入年收入、三险一金、专项附加，输出税额和到手收入
- 五险一金（[social_security_cn](/tools/social-security-cn/)）：个人/单位各项缴费一键算
- 年终奖单独计税（[bonus_tax_cn](/tools/bonus-tax-cn/)）：含税率跳档盲区提示
- 房贷月供与提前还款（[mortgage_schedule_cn](/tools/mortgage-early-repayment/)）
- 增值税、退休年龄、税后工资、存款利息、契税、加班工资、养老金……
- 以及一个 `mokakit_search` 检索入口，按关键词搜全站 104 个工具

## 三步接入

**第 1 步：拿 Token。** 目前 MCP 采用 Bearer 鉴权，需要先通过 [开发者页](/developers/) 申请接入 token。

**第 2 步：在 AI 客户端里配置。** 以 Claude Desktop 为例，往配置文件里加一段：

```json
{
  "mcpServers": {
    "mokakit": {
      "url": "https://www.mokakit.com/mcp",
      "headers": { "Authorization": "Bearer <YOUR_TOKEN>" }
    }
  }
}
```

Cursor 等其他客户端同理，换成对应的 MCP 配置入口即可。

**第 3 步：直接问。** 配置完成后，你对 AI 说「我月薪 2 万、在北京，帮我把个税和五险一金一起算了」，它就会真正调用 MokaKit 的工具、返回精确结果，而不是给你一段「算法说明」。

## 一个真实场景

假设你要评估一份 offer：月薪 2.5 万，年终奖 3 个月。你希望 AI 一次说清「到手多少钱」。

传统 AI：给你讲七级超额累进税率表，让你自己套公式。
接入 MokaKit 后：AI 直接调 `income_tax_cn` 和 `bonus_tax_cn`，返回「年度个税 X 元、到手 Y 元、年终奖建议单独计税（省 Z 元）」。

这就是「人用 + AI 调」的差别。

## 关于协议与版本

- 传输：Streamable HTTP + JSON-RPC 2.0
- 端点：`https://www.mokakit.com/mcp`
- 版本：API_VERSION=v1；未来 breaking change 会走 `/mcp/v2`

更完整的协议说明、curl 示例和客户端配置片段，都在 [MCP 开发者文档](/developers/)。
