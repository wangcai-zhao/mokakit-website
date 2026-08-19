#!/usr/bin/env bash
# ============================================================
# MokaKit 一键部署（在你本机的 Git Bash 里执行）
#
# 用法：
#   bash deploy/deploy.sh root@1.2.3.4 --setup   # 首次：初始化服务器（装 Nginx + 上占位页）
#   bash deploy/deploy.sh root@1.2.3.4           # 日常：构建并发布站点内容
#   bash deploy/deploy.sh root@1.2.3.4 --live    # 备案通过后：发布内容并切换到正式配置
#
# 也可以先设好环境变量省掉每次输 IP：
#   export MOKAKIT_SSH=root@1.2.3.4
#   bash deploy/deploy.sh
#
# 部署是原子切换的：新版本先传到临时目录，校验无误后再整体替换，
# 上一版会保留在 /var/www/mokakit.old，出问题可以立刻回滚。
# ============================================================
set -euo pipefail

SSH_TARGET="${1:-${MOKAKIT_SSH:-}}"
ACTION="${2:-}"
[[ "$SSH_TARGET" == --* ]] && { ACTION="$SSH_TARGET"; SSH_TARGET="${MOKAKIT_SSH:-}"; }

if [[ -z "$SSH_TARGET" ]]; then
  echo "用法：bash deploy/deploy.sh root@服务器IP [--setup|--live]"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

c_ok()   { printf '\033[32m  ✓ %s\033[0m\n' "$*"; }
c_head() { printf '\n\033[1m%s\033[0m\n' "$*"; }

# ------------------------------------------------------------
# --setup：把部署配置传上去并初始化服务器
# ------------------------------------------------------------
if [[ "$ACTION" == "--setup" ]]; then
  # 护栏①：若服务器已部署正式站点，--setup 会把它切回备案占位页，必须先人工确认
  if ssh "$SSH_TARGET" 'test -f /var/www/mokakit/index.html && echo EXISTS' 2>/dev/null | grep -q EXISTS; then
    c_head "⚠️ 检测到服务器已部署正式站点（/var/www/mokakit/index.html 存在）"
    c_warn "--setup 会把站点切回备案占位页（icp-pending），正式站将无法访问！"
    read -r -p "确认要继续吗？输入 yes 继续，其他任意键取消: " ANS
    [[ "$ANS" == "yes" ]] || { echo "已取消 --setup"; exit 1; }
  fi
  c_head "上传部署配置并初始化服务器"
  # Windows 写出来的文件可能是 CRLF 换行，Linux 下会报 bad interpreter，先统一转掉
  tar -czf - deploy | ssh "$SSH_TARGET" "
    set -e
    rm -rf /root/mokakit-deploy
    mkdir -p /root/mokakit-deploy
    tar -xzf - -C /root/mokakit-deploy --strip-components=1
    find /root/mokakit-deploy -type f \( -name '*.sh' -o -name '*.conf' -o -name '*.html' \) -exec sed -i 's/\r\$//' {} +
    bash /root/mokakit-deploy/server-setup.sh
  "
  c_ok "服务器初始化完成"
  exit 0
fi

# ------------------------------------------------------------
# 构建
# ------------------------------------------------------------
c_head "[1/3] 本地构建"

# 本机的 npm shim 在 Git Bash 下会把 /c/... 错解析成 d:\c\...，直接调 npm-cli.js 绕开
NPM_CLI="C:/Users/zhao-/.workbuddy/binaries/node/versions/22.22.2/node_modules/npm/bin/npm-cli.js"
if [[ -f "$NPM_CLI" ]]; then
  BUILD_CMD=(node "$NPM_CLI" run build)
else
  BUILD_CMD=(npm run build)
fi

# Windows 上文件监视器偶尔会锁住 .astro/content.d.ts 导致 astro sync 报 EPERM，
# 每次构建前清掉这个目录可以稳定绕过。
# 注意：本机「安全删除」策略会拦截 rm（FAIL_CLOSED），清不掉不中断——
# Astro 构建会自动重建 .astro，跳过清理不影响产物。
rm -rf .astro 2>/dev/null || true

"${BUILD_CMD[@]}"

PAGE_COUNT=$(find dist -name 'index.html' | wc -l | tr -d ' ')
DIST_SIZE=$(du -sh dist | cut -f1)
c_ok "构建完成：${PAGE_COUNT} 个页面，共 ${DIST_SIZE}"

# 上线前的最后一道保险：站点基础域名（sitemap / canonical / og:url）不应仍是占位域名。
# 注意：url-parser 工具的演示占位值里本来就有 example.com，属正常内容，不能误杀，
# 因此只校验「站点级」域名引用（sitemap 与 canonical/og 标签），不扫全文。
if grep -rlE "example\.com" dist --include='sitemap*.xml' 2>/dev/null | grep -q .; then
  printf '\033[31m  ✗ sitemap 里还有 example.com 占位域名，检查 src/config/site.ts 的 url\033[0m\n'
  exit 1
fi
if grep -rlE "<link rel=\"canonical\"[^>]*example\.com|property=\"og:url\"[^>]*example\.com" dist --include='*.html' 2>/dev/null | grep -q .; then
  printf '\033[31m  ✗ 页面 canonical/og 里还有 example.com 占位域名，检查 src/config/site.ts 的 url\033[0m\n'
  exit 1
fi
c_ok "域名检查通过，产物里没有占位域名"

# ------------------------------------------------------------
# 上传
# ------------------------------------------------------------
c_head "[2/3] 上传到 $SSH_TARGET"

tar -czf - -C dist . | ssh "$SSH_TARGET" "
  set -e
  rm -rf /var/www/mokakit.new
  mkdir -p /var/www/mokakit.new
  tar -xzf - -C /var/www/mokakit.new
  if [ ! -f /var/www/mokakit.new/index.html ]; then
    echo '上传的内容里没有 index.html，中止替换'
    exit 1
  fi
  if [ -d /var/www/mokakit ]; then
    rm -rf /var/www/mokakit.old
    mv /var/www/mokakit /var/www/mokakit.old
  fi
  mv /var/www/mokakit.new /var/www/mokakit
  if id -u www-data >/dev/null 2>&1; then
    chown -R www-data:www-data /var/www/mokakit
  elif id -u nginx >/dev/null 2>&1; then
    chown -R nginx:nginx /var/www/mokakit
  fi
"
c_ok "站点内容已发布（上一版保留在 /var/www/mokakit.old）"

# ------------------------------------------------------------
# 生效
# ------------------------------------------------------------
c_head "[3/3] 让 Nginx 生效"

if [[ "$ACTION" == "--live" ]]; then
  tar -czf - deploy | ssh "$SSH_TARGET" "
    set -e
    rm -rf /root/mokakit-deploy
    mkdir -p /root/mokakit-deploy
    tar -xzf - -C /root/mokakit-deploy --strip-components=1
    find /root/mokakit-deploy -type f \( -name '*.sh' -o -name '*.conf' -o -name '*.html' \) -exec sed -i 's/\r\$//' {} +
    bash /root/mokakit-deploy/server-setup.sh --live
  "
  c_ok "已切换到正式站点配置"
  # 护栏②：--live 会移除 ssl 配置导致 HTTPS 回退；若证书已就绪则自动补 --enable-ssl 恢复
  if ssh "$SSH_TARGET" 'test -f /etc/nginx/ssl/mokakit.com/fullchain.cer && echo CERTOK' 2>/dev/null | grep -q CERTOK; then
    ssh "$SSH_TARGET" "bash /root/mokakit-deploy/server-setup.sh --enable-ssl" >/dev/null
    c_ok "检测到证书已就绪，已自动恢复 HTTPS（--enable-ssl）"
  else
    c_warn "未检测到证书 /etc/nginx/ssl/mokakit.com/fullchain.cer，HTTPS 未开启；证书就绪后执行 bash server-setup.sh --enable-ssl"
  fi
else
  ssh "$SSH_TARGET" "nginx -t >/dev/null 2>&1 && systemctl reload nginx && echo reloaded" >/dev/null
  c_ok "Nginx 已重载"
fi

echo
printf '\033[1m部署完成。\033[0m\n'
echo "  回滚：ssh $SSH_TARGET 'rm -rf /var/www/mokakit && mv /var/www/mokakit.old /var/www/mokakit && systemctl reload nginx'"
echo
