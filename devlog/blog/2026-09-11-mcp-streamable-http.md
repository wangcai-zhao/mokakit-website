---
title: 给工具箱接上 MCP：MokaKit 怎么做 Streamable HTTP 服务
date: 2026-09-11
draft: true
---

最近把 MokaKit 往 MCP 方向推了一步。MokaKit 是个一百来个工具的箱子，我一直想让它"AI 能直接调"——不是让人打开网页点，而是让另一个 AI 说一句"帮我算个税"就能拿到结果。MCP 是目前最顺手的协议，但怎么落到我已经写好的那堆纯函数上，得想清楚，不能为了接协议把底层重写一遍。

先定传输方式。stdio 直接出局：那是给本地 IDE 插件用的，我的工具箱最终要上云，远程和浏览器调不了 stdio。SSE 长连接也 Pass——维护一条常连麻烦，断线重连、心跳、多实例同步都头疼。MCP 新规范推的 Streamable HTTP 刚好对症：一次 POST 请求一次响应，没有常驻连接，前面挂个 nginx 就能出去。

server.mjs 就这么写：纯用 Node 内置的 http 和 crypto，零外部依赖，监听 MCP_PORT（默认 18700）。GET /mcp 返回 405，GET / 做健康检查。协议是 JSON-RPC 2.0。

工具从哪来？这是我最在意的。MokaKit 前端那 14 个中国本土计算器（个税、税后工资、社保、增值税、房贷、退休、存款利息、契税、加班工资、养老金……）背后都是 src/lib 下的 .ts 纯函数，没碰任何浏览器 API，纯算。MCP 这边直接 import 这些函数，换个皮调它们，零重写。"compute 入参即契约"——前端和 MCP 共用一套计算逻辑，不会出现两边算出来不一样。

100 个工具摆那，调谁？做了个 mokakit_search 当入口：按名字、描述、关键词打分排序，先搜出来告诉你"该调 income_tax_cn"，再让你直接调。等于给 AI 一个目录，不然它面对一百个 tool 会懵。

生产环境是 Node 18，没有 --experimental-strip-types，直接 import .ts 会炸。所以 mcp/build.mjs 用 esbuild 把 server.mjs 和依赖的 .ts 一起打成 deploy/mcp/server.mjs，自包含、零依赖；再把各工具的 meta 抽成 catalog.json，启动优先读 catalog，彻底不碰 src 目录。

这步做完，MCP 的底座算是看清了。剩下的事是体验版资源点够不够跑——那是另一篇要算的账。
