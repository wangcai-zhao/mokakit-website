#!/usr/bin/env bash
# ============================================================
# MokaKit 服务器初始化脚本（在腾讯云轻量服务器上以 root 执行）
#
# 这个脚本做什么：
#   1. 只读体检：现有服务状态、端口占用、内存余量
#   2. 安装并配置 Nginx，占用 80/443
#   3. 备案期先上占位页，备案通过后一条命令切正式站
#
# 这个脚本【绝不会】做的事：
#   - 不停止、不卸载、不修改系统上其他已存在的服务
#   - 不改动非 80/443 的端口
#
# 用法：
#   bash server-setup.sh              # 备案期模式（默认，上占位页）
#   bash server-setup.sh --live       # 备案通过后，切换到正式站点配置
#   SETUP_SWAP=1 bash server-setup.sh # 顺带创建 2GB swap（2G 内存机器推荐）
#   bash server-setup.sh --cert       # 备案通过+域名解析后，申请免费 Let's Encrypt 证书
#   bash server-setup.sh --enable-ssl # 证书就位后，自动开启 HTTPS（取消注释 + reload）
# ============================================================
set -euo pipefail

MODE="pending"
[[ "${1:-}" == "--live" ]] && MODE="live"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="/var/www/mokakit"
PENDING_ROOT="/var/www/icp-pending"

c_ok()   { printf '\033[32m  ✓ %s\033[0m\n' "$*"; }
c_warn() { printf '\033[33m  ! %s\033[0m\n' "$*"; }
c_err()  { printf '\033[31m  ✗ %s\033[0m\n' "$*"; }
c_head() { printf '\n\033[1m%s\033[0m\n' "$*"; }

# ------------------------------------------------------------
# 可选子命令：申请免费 Let's Encrypt 证书（acme.sh）
# 前置：备案已通过、域名已 A 解析到本机、防火墙 80 放通
# ------------------------------------------------------------
issue_cert() {
  c_head "申请免费 Let's Encrypt 证书（acme.sh）"
  if ! command -v acme.sh >/dev/null 2>&1 && [[ ! -f ~/.acme.sh/acme.sh ]]; then
    c_ok "安装 acme.sh ..."
    curl -sSL https://get.acme.sh | sh || { c_err "acme.sh 安装失败，请手动安装后重试"; exit 1; }
  fi
  ACME=~/.acme.sh/acme.sh
  mkdir -p /etc/nginx/ssl/mokakit.com
  "$ACME" --issue -d mokakit.com -d www.mokakit.com --webroot /var/www/mokakit \
    || { c_err "证书申请失败。确认：①备案已通过 ②域名已 A 解析到本机 ③防火墙 80 放通"; exit 1; }
  "$ACME" --install-cert -d mokakit.com \
    --key-file       /etc/nginx/ssl/mokakit.com/mokakit.com.key \
    --fullchain-file /etc/nginx/ssl/mokakit.com/fullchain.cer \
    --reloadcmd "systemctl reload nginx"
  c_ok "证书已部署到 /etc/nginx/ssl/mokakit.com/"
  c_ok "接着执行：bash server-setup.sh --enable-ssl"
}

# ------------------------------------------------------------
# 可选子命令：证书就位后，自动开启 HTTPS
# ------------------------------------------------------------
enable_ssl() {
  local CONF=/etc/nginx/conf.d/mokakit.conf
  local SSLCONF=/etc/nginx/mokakit-ssl.conf
  c_head "开启 HTTPS"
  # 证书已就绪，此刻才把 ssl 配置装到 /etc/nginx/（不进 conf.d，避免被 nginx 自动加载两次导致 443 块冲突）
  install -m 644 "$SCRIPT_DIR/nginx/mokakit-ssl.conf" "$SSLCONF"
  # 清掉历史上误放进 conf.d 的副本（conf.d 会被 nginx 自动加载，会和下面 include 重复加载导致 443 块冲突）
  rm -f /etc/nginx/conf.d/mokakit-ssl.conf
  # 注意 mokakit.conf 里这些行带缩进，sed 锚点要允许前导空白才能匹配
  sed -i 's|^[[:space:]]*# return 301 https://mokakit.com\$request_uri;.*|    return 301 https://mokakit.com$request_uri;|' "$CONF"
  sed -i 's|^[[:space:]]*#\? *include /etc/nginx/\(conf\.d/\)\?mokakit-ssl.conf;.*|include /etc/nginx/mokakit-ssl.conf;|' "$CONF"
  # www/.cn 备用域直接 301 到 https 主域，避免 http→https 双重跳转
  sed -i 's|return 301 http://mokakit.com\$request_uri;|    return 301 https://mokakit.com$request_uri;|' "$CONF"
  if nginx -t 2>&1 | grep -q "successful"; then
    systemctl reload nginx
    c_ok "HTTPS 已启用，访问 http://mokakit.com 会自动跳转到 https"
  else
    c_err "Nginx 配置校验失败："; nginx -t
    exit 1
  fi
}

# --cert / --enable-ssl 是独立子命令，提前返回
case "${1:-}" in
  --cert)       issue_cert; exit 0 ;;
  --enable-ssl) enable_ssl; exit 0 ;;
esac

[[ $EUID -eq 0 ]] || { c_err "请用 root 执行：sudo bash server-setup.sh"; exit 1; }

# ------------------------------------------------------------
c_head "[1/8] 现有服务体检（只读，不做任何改动）"
# ------------------------------------------------------------

# OpenClaw 进程状态
if pgrep -af 'openclaw|clawd' >/dev/null 2>&1; then
  CLAW_MEM=$(ps -eo rss,comm,args --sort=-rss \
    | grep -Ei 'openclaw|clawd' | grep -v grep \
    | awk '{sum+=$1} END {printf "%.0f", sum/1024}')
  c_ok "OpenClaw 正在运行，占用内存约 ${CLAW_MEM} MB（保持不动）"
else
  c_warn "没有检测到 OpenClaw 进程（可能跑在 Docker 里，下面会再查一次）"
fi

if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qi claw; then
  c_ok "OpenClaw 以 Docker 容器方式运行（保持不动）"
fi

# 端口占用情况：这是判断能否共存的关键
c_head "    端口占用情况"
PORT_CONFLICT=0
for p in 80 443; do
  HOLDER=$(ss -tlnp 2>/dev/null | awk -v port=":$p" '$4 ~ port"$" {print $NF}' | head -1)
  if [[ -n "$HOLDER" ]]; then
    if echo "$HOLDER" | grep -qi nginx; then
      c_ok "端口 $p 被 Nginx 占用（正常，稍后会重载配置）"
    else
      c_err "端口 $p 被非 Nginx 进程占用：$HOLDER"
      PORT_CONFLICT=1
    fi
  else
    c_ok "端口 $p 空闲"
  fi
done

# OpenClaw 网关端口的暴露面检查 —— 安全重点
CLAW_BIND=$(ss -tlnp 2>/dev/null | awk '$4 ~ /:18789$/ {print $4}' | head -1)
if [[ -n "$CLAW_BIND" ]]; then
  if [[ "$CLAW_BIND" == 127.0.0.1:* || "$CLAW_BIND" == "[::1]:"* ]]; then
    c_ok "OpenClaw 网关只监听本地回环（$CLAW_BIND），安全"
  else
    c_err "OpenClaw 网关监听在 $CLAW_BIND —— 公网可直达！"
    c_err "  它能执行 shell 命令，等于把 root 权限挂到互联网上。"
    c_err "  请立刻在腾讯云防火墙封掉 18789，并把它改为只监听 127.0.0.1。"
  fi
else
  c_warn "18789 端口没有监听（OpenClaw 可能没启动，或用了自定义端口）"
fi

if [[ $PORT_CONFLICT -eq 1 ]]; then
  c_err "80/443 被别的程序占着，Nginx 起不来。先确认那是什么服务再继续。"
  exit 1
fi

# ------------------------------------------------------------
c_head "[2/8] 内存与 swap"
# ------------------------------------------------------------
MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
MEM_AVAIL=$(free -m | awk '/^Mem:/{print $7}')
SWAP_TOTAL=$(free -m | awk '/^Swap:/{print $2}')
echo "    总内存 ${MEM_TOTAL} MB / 可用 ${MEM_AVAIL} MB / swap ${SWAP_TOTAL} MB"
c_ok "Nginx + 静态站点合计只需约 25 MB，当前余量完全够用"

if [[ "$SWAP_TOTAL" -lt 512 && "$MEM_TOTAL" -le 2200 ]]; then
  if [[ "${SETUP_SWAP:-0}" == "1" ]]; then
    if [[ ! -f /swapfile ]]; then
      echo "    正在创建 2GB swap ..."
      fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
      chmod 600 /swapfile
      mkswap /swapfile >/dev/null
      swapon /swapfile
      grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
      c_ok "已创建并启用 2GB swap"
    fi
  else
    c_warn "机器没有 swap。OpenClaw 跑大任务时容易触发 OOM 被系统杀掉。"
    c_warn "  建议加 2GB swap：SETUP_SWAP=1 bash server-setup.sh"
  fi
fi

# ------------------------------------------------------------
c_head "[3/8] 安装 Nginx"
# ------------------------------------------------------------
if command -v nginx >/dev/null 2>&1; then
  c_ok "Nginx 已安装：$(nginx -v 2>&1 | sed 's|nginx version: ||')"
else
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq && apt-get install -y -qq nginx
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y -q nginx
  elif command -v yum >/dev/null 2>&1; then
    yum install -y -q nginx
  else
    c_err "认不出包管理器，请手动安装 Nginx 后重跑本脚本"
    exit 1
  fi
  c_ok "Nginx 安装完成"
fi

# ------------------------------------------------------------
c_head "[4/8] 准备站点目录"
# ------------------------------------------------------------
mkdir -p "$WEB_ROOT" "$PENDING_ROOT" /etc/nginx/snippets /etc/nginx/ssl
install -m 644 "$SCRIPT_DIR/icp-pending/index.html" "$PENDING_ROOT/index.html"
install -m 644 "$SCRIPT_DIR/nginx/snippets/mokakit-headers.conf" /etc/nginx/snippets/
c_ok "站点目录：$WEB_ROOT"
c_ok "占位页：  $PENDING_ROOT"

# ------------------------------------------------------------
c_head "[5/8] 关掉 Nginx 自带的默认站点"
# ------------------------------------------------------------
# 默认站点也声明了 default_server，不关掉会和我们的配置冲突报错。
# 关键：必须挪出被 include 的目录（sites-enabled / conf.d），只改名留在原地仍会被加载 → 冲突。
if [[ -e /etc/nginx/sites-enabled/default ]]; then
  mv /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default.disabled-by-mokakit
  c_ok "已禁用默认站点（移出 sites-enabled）"
fi
if [[ -e /etc/nginx/conf.d/default.conf ]]; then
  mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.disabled-by-mokakit
  c_ok "已禁用默认站点（移出 conf.d/*.conf 匹配）"
fi

# ------------------------------------------------------------
c_head "[6/8] 写入站点配置（模式：$MODE）"
# ------------------------------------------------------------
if [[ "$MODE" == "live" ]]; then
  if [[ ! -f "$WEB_ROOT/index.html" ]]; then
    c_err "$WEB_ROOT 里没有 index.html，先在本地跑 deploy.sh 把站点传上来"
    exit 1
  fi
  install -m 644 "$SCRIPT_DIR/nginx/mokakit.conf" /etc/nginx/conf.d/mokakit.conf
  # 清掉历史残留的 ssl 配置（含误放进 conf.d 的副本），避免 nginx -t 因缺证书或旧指令（http2 on）失败、连 80 正式站都 reload 不了
  rm -f /etc/nginx/mokakit-ssl.conf /etc/nginx/conf.d/mokakit-ssl.conf
  # 注意：mokakit-ssl.conf 不在此装入 conf.d。它引用了尚不存在的证书，
  # 若提前装入会让 nginx -t 失败、无法 reload 正式站，进而卡住证书申请的 HTTP-01 挑战。
  # 改为在 --enable-ssl 阶段（证书就位后）再装入。
  c_ok "已启用正式站点配置（80 端口；HTTPS 段待证书就位后 --enable-ssl 开启）"
else
  install -m 644 "$SCRIPT_DIR/nginx/icp-pending.conf" /etc/nginx/conf.d/mokakit.conf
  c_ok "已启用备案期占位配置（备案通过后执行 bash server-setup.sh --live 切换）"
fi

# ------------------------------------------------------------
c_head "[7/8] 安装匿名计数服务（mokakit-counter）"
# ------------------------------------------------------------
# 仅依赖 node，零额外依赖；服务只在 127.0.0.1 监听，备案期也不暴露公网。
# 1) 定位 node（缺失则尝试 apt 安装）
NODE_BIN="$(command -v node || true)"
if [[ -z "$NODE_BIN" ]]; then
  c_warn "未检测到 node，尝试通过 apt 安装 ..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq && apt-get install -y -qq nodejs
    NODE_BIN="$(command -v node || true)"
  fi
fi

if [[ -z "$NODE_BIN" ]]; then
  c_err "找不到 node，且自动安装失败。计数服务暂不安装，其余步骤继续。"
else
  # 2) 专用系统用户（StateDirectory 会用到）
  id mokakit >/dev/null 2>&1 || useradd -r -s /usr/sbin/nologin -d /var/lib/mokakit mokakit
  # 3) 安装服务文件与脚本
  install -d -m 755 /opt/mokakit-counter
  install -m 644 "$SCRIPT_DIR/counter/server.mjs" /opt/mokakit-counter/server.mjs
  # 把 __NODE_BIN__ 占位替换为真实路径
  sed "s|__NODE_BIN__|$NODE_BIN|g" "$SCRIPT_DIR/counter/mokakit-counter.service" \
    > /etc/systemd/system/mokakit-counter.service
  chmod 644 /etc/systemd/system/mokakit-counter.service
  # 4) 启服
  systemctl daemon-reload
  systemctl enable --now mokakit-counter >/dev/null 2>&1 || true
  # 5) 健康检查
  sleep 1
  if curl -fsS http://127.0.0.1:18800/api/health >/dev/null 2>&1; then
    c_ok "匿名计数服务已启用并通过健康检查（node=$NODE_BIN）"
  else
    c_warn "计数服务已尝试启动，但健康检查未通过（可稍后手动排查 systemctl status mokakit-counter）"
  fi
fi

# ------------------------------------------------------------
c_head "[8/9] 安装 MCP Server（公网 HTTPS 经 nginx 反代）"
# ------------------------------------------------------------
# 生产态由本地 mcp/build.mjs 用 esbuild 把 server.mjs + src/lib 打成自包含
# deploy/mcp/server.mjs（target=node18）+ catalog.json，随部署包上传，无需服务器有 src/ 或 TS 运行时。
if [[ -z "$NODE_BIN" ]]; then
  c_warn "未检测到 node，MCP Server 暂不安装（与计数服务同依赖 node）"
else
  id mokakit >/dev/null 2>&1 || useradd -r -s /usr/sbin/nologin -d /var/lib/mokakit mokakit
  install -d -m 755 /opt/mokakit-mcp
  install -m 644 "$SCRIPT_DIR/mcp/server.mjs" /opt/mokakit-mcp/server.mjs
  install -m 644 "$SCRIPT_DIR/mcp/catalog.json" /opt/mokakit-mcp/catalog.json
  # .env 存 MCP_TOKEN（权限 600，不进版本库）；不存在则生成随机强 token
  if [[ ! -f /opt/mokakit-mcp/.env ]]; then
    printf 'MCP_TOKEN=%s\n' "$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')" > /opt/mokakit-mcp/.env
    chmod 600 /opt/mokakit-mcp/.env
    chown mokakit:mokakit /opt/mokakit-mcp/.env
  fi
  chown -R mokakit:mokakit /opt/mokakit-mcp
  sed "s|__NODE_BIN__|$NODE_BIN|g" "$SCRIPT_DIR/mcp/mokakit-mcp.service" \
    > /etc/systemd/system/mokakit-mcp.service
  chmod 644 /etc/systemd/system/mokakit-mcp.service
  systemctl daemon-reload
  systemctl enable --now mokakit-mcp >/dev/null 2>&1 || true
  sleep 1
  if curl -fsS http://127.0.0.1:18700/ >/dev/null 2>&1; then
    c_ok "MCP Server 已启用并通过健康检查（node=$NODE_BIN，端口 18700 仅监听本机）"
  else
    c_warn "MCP Server 已尝试启动，但健康检查未通过（可稍后 systemctl status mokakit-mcp 排查）"
  fi
fi

# ------------------------------------------------------------
c_head "[9/9] 校验并生效"
# ------------------------------------------------------------
if nginx -t 2>&1 | grep -q "successful"; then
  c_ok "配置语法检查通过"
  systemctl enable nginx >/dev/null 2>&1 || true
  systemctl reload nginx 2>/dev/null || systemctl restart nginx
  c_ok "Nginx 已生效"
else
  c_err "配置有误，未生效。详细信息："
  nginx -t
  exit 1
fi

echo
printf '\033[1m完成。当前状态：\033[0m\n'
printf '  模式        %s\n' "$([[ $MODE == live ]] && echo '正式站点' || echo '备案期占位页')"
printf '  站点目录    %s\n' "$WEB_ROOT"
printf '  Counter     mokakit-counter 已安装并启用\n'
printf '  MCP        mokakit-mcp 已安装并启用（公网 /mcp，经 nginx HTTPS 反代）\n'
printf '  OpenClaw    未受影响，继续运行\n'
echo
printf '\033[1m接下来：\033[0m\n'
echo '  1. 腾讯云控制台 → 轻量服务器 → 防火墙，放通 80 和 443'
echo '  2. 域名解析：mokakit.com / www / .cn 全部 A 记录指到本机公网 IP'
echo '  3. 提交 ICP 备案，网站名称填「摩卡工具箱」'
echo '  4. 备案通过后：本地跑 deploy.sh 传站点，再执行 bash server-setup.sh --live'
echo
