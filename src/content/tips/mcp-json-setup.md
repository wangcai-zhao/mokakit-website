---
title: "mcp.json 从零配好：让 AI 一次调通本地工具"
description: "手把手把本地工具接进 WorkBuddy 的 MCP，从手写 mcp.json 踩坑到用配置生成器一次过。附能直接抄的 JSON 模板与调试思路。"
publishDate: 2026-08-31
tags: ["MCP", "WorkBuddy 配置", "效率工具"]
draft: false
series: "WorkBuddy 使用技巧"
order: 1
difficulty: 入门
relatedTools:
  - mcp-config-generator
  - json-formatter
author: 旺财先生
featured: true
showInvite: true
---

## 我遇到的具体问题

上个月我想让 WorkBuddy 直接帮我查公司内网的一张库存表——数据存在受控机器上的 Excel 里，平时得手动导出来看。思路很直接：写个小服务把数据暴露成 MCP，WorkBuddy 就能自己调。

第一次手写 `mcp.json`，我照着记忆拼了一个：

```json
{
  "mcpServers": {
    "local-stock": {
      "command": "node",
      "args": ["server.js"],
      "env": { "TOKEN": "xxx" }
    }
  }
}
```

结果 WorkBuddy 一启动就报 `MCP server local-stock failed to start`。我盯着那行错看了十分钟，以为是 node 路径问题，换了绝对路径还是不行。

## 为什么这事值得自动化

说白了，MCP 配置不是写一次就完的。后来我又接了三个本地工具（计算器、文档检索、定时抓取），每加一个就要手写一份 JSON、排一次错。一个月碰上四五次，每次平均耗我二十分钟——光是记那些 `command` 和 `args` 的写法就够烦的。

更坑的是，手写容易在逗号、引号上翻车，一个尾逗号就能让整段 JSON 解析失败，但报错信息又不会告诉你第几行。

## 我是怎么用 WorkBuddy 做的

后来我换了个思路：不让 AI 直接帮我写配置，而是让它调用 [MCP 配置生成器](/tools/mcp-config-generator/) 这种专门工具产出标准 JSON。

我把需求说清楚——"本地用 node 起一个 server.js，需要读 TOKEN 环境变量"——生成器直接吐出结构正确的配置，连 `env` 的格式都帮我排好了。我再把它粘进 WorkBuddy 的 `mcp.json` 里，一次过。

生成完我还顺手用 [JSON 格式化工具](/tools/json-formatter/) 把整段缩进对齐、校验了一遍语法，确认没有尾逗号之类的问题再保存。

## 中间卡在哪 & 怎么绕过去

那个 `failed to start` 的真凶，后来才发现是 `args` 里路径分隔符的问题：Windows 下我写了 `src/server.js`，但服务的工作目录不在项目根，应该是 `dist/server.js`。WorkBuddy 的报错不会展开这个细节，得自己去服务日志里看。

绕过去的办法：先用命令行单独跑 `node server.js` 确认服务本身能起来，再把它套进 `mcp.json`。分两步排错比盯着一份 JSON 瞎猜快得多。

另一个坑是 `env` 的值如果有特殊字符（比如含等号的连接串），一定要用引号包住整段，否则解析会断在中间。

## 顺带的几个发现

接上 MCP 之后，最意外的收益是 WorkBuddy 开始"主动"帮我查库存了——我问一句"XX 型号还有多少"，它自己调接口、自己回来报数，不用我再导出文件。

顺带把 [JSON 格式化工具](/tools/json-formatter/) 固定成了我改任何配置前的第一步。以前觉得格式化是形式主义，真碰到一次尾逗号导致的解析失败之后，才知道这步能省多少返工。

## 你也可以这样用

如果你也有本地脚本想让 AI 调，别从零手写。先想清楚三件事：服务怎么启动（`command` + `args`）、需不需要环境变量（`env`）、是本地进程还是远程地址（stdio 还是 http）。想清楚这三点，丢给配置生成器，比自己拼稳得多。

## 常见问题

**Q：WorkBuddy 报 MCP server failed to start 但 JSON 看着没问题？**
先单独用命令行跑你的服务，确认它能起来。八成是路径或工作目录不对，不是 JSON 的锅。

**Q：stdio 和 http 该选哪个？**
本地用命令启动的服务用 stdio；接入别人已经部署好的远程服务用 http（SSE）。新手从 stdio 起步最稳。

**Q：env 里的密钥会泄露吗？**
`mcp.json` 是本地文件，不会上传。但别把它提交到公开的代码仓库，涉密的值建议用环境变量注入而不是写死。
