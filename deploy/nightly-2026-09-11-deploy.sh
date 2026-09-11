#!/usr/bin/env bash
# ============================================================
# 2026-09-11 夜间批次 + 上午续作 · 续部署脚本（站点 + MCP，一条命令）
#
# 背景：夜间 Agent 已完成：
#   · 198 工具 / 533 页 / 36 组 675 条导航
#   · tips 专栏 12 篇全部放行（draft: true → false）
#   · 新建 /wangcai/ 旺财先生个人主页（Footer/About 双向入口）
#   · MCP catalog 198 工具重建
# 但沙箱策略拦截了 ~/.ssh 读取，无法自动 SSH 上线。本脚本请在旺财本机执行。
#
# 用法（Git Bash 或 PowerShell 7+）：
#   bash deploy/nightly-2026-09-11-deploy.sh
#
# 本脚本做两件事：
#   1) 站点：流式传 dist + 原子切换（dist 已全量校验过，不再重建）
#   2) MCP ：上传新打的 server.mjs + catalog.json(198 工具) 并重启服务
# ============================================================
set -euo pipefail
SSH_TARGET="root@58.87.68.151"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# ---------- 前置校验 ----------
echo "== [0/2] dist 与 MCP 产物校验 =="
test -f dist/index.html || { echo "❌ dist/index.html 不在，请先 npm run build"; exit 1; }
test -f deploy/mcp/server.mjs || { echo "❌ deploy/mcp/server.mjs 不在，请先 npm run mcp:build"; exit 1; }
test -f deploy/mcp/catalog.json || { echo "❌ deploy/mcp/catalog.json 不在"; exit 1; }
echo "✅ dist 与 MCP 产物就绪"

# ---------- [1/2] 站点原子切换 ----------
echo ""
echo "== [1/2] 站点 dist 上传 + 原子切换 =="
tar -czf - -C dist . | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "$SSH_TARGET" '
  set -e
  rm -rf /var/www/mokakit.new
  mkdir -p /var/www/mokakit.new
  tar -xzf - -C /var/www/mokakit.new
  if [ ! -f /var/www/mokakit.new/index.html ]; then echo "上传内容无 index.html，中止"; exit 1; fi
  echo "新版本页面数: $(find /var/www/mokakit.new -name index.html | wc -l)"
  rm -rf /var/www/mokakit.old
  mv /var/www/mokakit /var/www/mokakit.old
  mv /var/www/mokakit.new /var/www/mokakit
  chown -R www-data:www-data /var/www/mokakit
  nginx -t >/dev/null 2>&1 && systemctl reload nginx && echo reloaded
  echo SITE_DEPLOY_OK
'

# ---------- [2/2] MCP Server 更新 ----------
echo ""
echo "== [2/2] MCP Server 上传 + 重启 =="
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "$SSH_TARGET" '
  set -e
  mkdir -p /opt/mokakit-mcp
'
scp -o StrictHostKeyChecking=no deploy/mcp/server.mjs deploy/mcp/catalog.json "$SSH_TARGET:/opt/mokakit-mcp/"
ssh -o StrictHostKeyChecking=no "$SSH_TARGET" '
  set -e
  chmod 600 /opt/mokakit-mcp/.env 2>/dev/null || true
  if [ -f /opt/mokakit-mcp/.env ]; then set -a; . /opt/mokakit-mcp/.env; set +a; fi
  systemctl restart mokakit-mcp
  sleep 1
  systemctl is-active mokakit-mcp
  echo MCP_RESTART_OK
'

echo ""
echo "============================================================"
echo "✅ 部署完成。线上抽查建议："
echo "   https://www.mokakit.com/tools/stock-fee-calc/  （新增 12 工具之一）"
echo "   https://www.mokakit.com/tips/sql-mcp-selfcheck/  （新放行的 tips）"
echo "   https://www.mokakit.com/wangcai/                （旺财先生个人主页）"
echo "   https://www.mokakit.com/sites/finance/          （含理杏仁等新导航）"
echo ""
echo "如果浏览器看到旧内容，强制刷新（Ctrl+Shift+R / Cmd+Shift+R）或等 5-10 分钟 CDN。"
echo "============================================================"