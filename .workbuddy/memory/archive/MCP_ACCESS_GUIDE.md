# MokaKit MCP Server 公网接入指南

> 战略核心「AI 时代的工具箱」的对外接口。本文档供接入 MCP 客户端（Claude Desktop / Cursor / 自建 agent）参考。
> 生成于 2026-08-13，对应 commit `e7e62ee`。

## 端点
- **公网**：`https://mokakit.com/mcp`
- **协议**：Streamable HTTP（MCP 规范）+ JSON-RPC 2.0
- **支持的 MCP 协议版本**：`2025-06-18`、`2024-11-05`
- **API 版本标识**：`v1`（breaking change 将走 `/mcp/v2` 路径，不破坏已有客户端）

## 鉴权
- 类型：Bearer Token（HTTP Header `Authorization: Bearer <token>`）
- Token 位置（服务器）：`/opt/mokakit-mcp/.env` 的 `MCP_TOKEN`
- 获取：`ssh root@58.87.68.151 'cat /opt/mokakit-mcp/.env'`
- 未带 token 调用写操作 → `401 Unauthorized`；`GET /mcp` → `405 Method Not Allowed`
- 健康检查（本地，无需 token）：`curl http://127.0.0.1:18700/` 返回
  `{name, version, apiVersion, tokenRequired, tools, catalogSize, endpoint}`

## 工具清单（9 个）
| # | tool name | 说明 |
|---|-----------|------|
| 1 | `income_tax_cn` | 中国综合所得（工资薪金）年度个税计算 |
| 2 | `bonus_tax_cn` | 全年一次性奖金单独计税（2024–2027 延续政策） |
| 3 | `bonus_compare_cn` | 年终奖「单独计税 vs 并入综合所得」对比 |
| 4 | `social_security_cn` | 五险一金计算（全国通用参考费率，可自定义） |
| 5 | `vat_general_cn` | 增值税一般计税（一般纳税人） |
| 6 | `vat_simple_cn` | 增值税简易计税（小规模纳税人/特定业务） |
| 7 | `mortgage_schedule_cn` | 房贷还款计划（等额本息/等额本金） |
| 8 | `mortgage_early_repayment_cn` | 房贷提前还款测算（减月供/缩期限对比） |
| 9 | `mokakit_search` | 全站工具 search-first 检索；返回 id/名称/链接，若配有计算 tool 则附 `mcpTool` 名，AI 可直接调用 |

## 客户端接入示例

### Claude Desktop / Cursor（mcp config）
```json
{
  "mcpServers": {
    "mokakit": {
      "url": "https://mokakit.com/mcp",
      "headers": { "Authorization": "Bearer <你的 MCP_TOKEN>" }
    }
  }
}
```

### curl 手测
```bash
TOKEN=$(ssh root@58.87.68.151 'grep -oP "MCP_TOKEN=\K.*" /opt/mokakit-mcp/.env')

# 1) initialize（拿 session）
curl -s -D - -X POST https://mokakit.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}}'
# 从响应头取 Mcp-Session-Id: <session>

# 2) tools/list
curl -s -X POST https://mokakit.com/mcp \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: <session>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 3) tools/call（search-first 示例）
curl -s -X POST https://mokakit.com/mcp \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: <session>" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"mokakit_search","arguments":{"query":"房贷"}}}'
```

## 运维
- **工具/文案改动后重部署**：本地 `npm run mcp:build`（重新生成 `deploy/mcp/server.mjs` + `catalog.json`）→ 走 `deploy.sh` 或 `server-setup.sh --live` + `--enable-ssl` 全流程 → 服务器 `/opt/mokakit-mcp/` 由部署脚本自动更新。
- 日志：`journalctl -u mokakit-mcp -f`
- 重启：`systemctl restart mokakit-mcp`
- 安全边界：进程仅监听 `127.0.0.1:18700`，公网只经 nginx HTTPS 反代暴露 `/mcp`；`ProtectSystem=strict` 只读系统盘。

## 对外公开前 checklist
- [ ] 保留 Bearer 鉴权（不要设空 token 上线）
- [ ] 不在仓库/日志/前端明文泄露 `MCP_TOKEN`
- [ ] 视流量考虑加限流（当前无）
- [ ] tool name / inputSchema 一旦被客户端集成即视为冻结 → breaking change 必须走 `/mcp/v2` 并保留 v1 一段时间
- [ ] 写一份面向开发者的公开接入页（可放 `/sites/` 或独立文档站）
