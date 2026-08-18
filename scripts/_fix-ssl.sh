#!/usr/bin/env bash
set -e
cd /root/mokakit-deploy
# 用最新本地脚本覆盖服务器上的（保持同步）
tar xzf /tmp/mokakit-deploy.tar.gz

# 1) 把 ssl 配置装到 /etc/nginx/（不进 conf.d，避免被 nginx 自动加载两次 -> 443 块冲突）
install -m 644 nginx/mokakit-ssl.conf /etc/nginx/mokakit-ssl.conf

# 2) 删掉历史上误放进 conf.d 的自动加载副本
rm -f /etc/nginx/conf.d/mokakit-ssl.conf

CONF=/etc/nginx/conf.d/mokakit.conf

# 3) 主站 80 -> https 跳转解注
sed -i 's|^[[:space:]]*# return 301 https://mokakit.com$request_uri;.*|    return 301 https://mokakit.com$request_uri;|' "$CONF"

# 4) include 路径修正到 /etc/nginx/mokakit-ssl.conf（兼容注释/未注释、新/旧路径）
sed -i 's|^[[:space:]]*#\? *include /etc/nginx/\(conf\.d/\)\?mokakit-ssl.conf;.*|include /etc/nginx/mokakit-ssl.conf;|' "$CONF"

# 5) www/.cn 备用域 http -> https 直接跳转
sed -i 's|return 301 http://mokakit.com$request_uri;|    return 301 https://mokakit.com$request_uri;|' "$CONF"

echo "=== mokakit.conf 中 ssl/include 相关行 ==="
grep -n "mokakit-ssl\|return 301" "$CONF"
echo "=== conf.d 目录 ==="
ls -la /etc/nginx/conf.d/
echo "=== nginx -t ==="
nginx -t
systemctl reload nginx
echo "RELOAD-OK"
