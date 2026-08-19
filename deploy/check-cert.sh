#!/usr/bin/env bash
# ============================================================
# MokaKit 证书到期检查脚本
# 用途：检测 Let's Encrypt 证书剩余天数，< 30 天则告警（退出码 1）。
#       配合 cron 每日运行，避免 acme.sh 续期失败后证书静默过期。
# 用法：bash check-cert.sh            # 手动跑一次看结果
#       cron: 0 6 * * * /opt/mokakit/check-cert.sh >> /var/log/mokakit-cert.log 2>&1
# ============================================================
set -euo pipefail

CERT=/etc/nginx/ssl/mokakit.com/fullchain.cer
THRESHOLD=30

if [[ ! -f "$CERT" ]]; then
  echo "[cert-check] ✗ 证书文件不存在：$CERT（可能还未申请证书，或路径不对）"
  exit 1
fi

END_STR=$(openssl x509 -enddate -noout -in "$CERT" | cut -d= -f2-)
END_TS=$(date -d "$END_STR" +%s)
NOW_TS=$(date +%s)
DAYS=$(( (END_TS - NOW_TS) / 86400 ))

# 顺带确认续期机制是否正常（certbot.timer 或 acme.sh，任一存在即可）
RENEW_INFO="未检测"
if systemctl list-timers 2>/dev/null | grep -q certbot.timer; then
  RENEW_INFO="certbot.timer 已启用（自动续期）"
elif [[ -f /root/.acme.sh/acme.sh ]]; then
  RENEW_INFO="acme.sh 已安装"
else
  RENEW_INFO="⚠️ 未检测到 certbot.timer 或 acme.sh 续期机制"
fi

echo "[cert-check] 到期时间：$END_STR"
echo "[cert-check] 续期任务：$RENEW_INFO"

if [[ "$DAYS" -lt "$THRESHOLD" ]]; then
  echo "[cert-check] ⚠️ 证书剩余 ${DAYS} 天（< ${THRESHOLD} 天），请检查续期是否正常"
  exit 1
else
  echo "[cert-check] ✓ 证书剩余 ${DAYS} 天，正常"
fi
