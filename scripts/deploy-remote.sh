#!/bin/bash
# Manual deploy from a machine that can SSH to production.
set -euo pipefail

HOST="${DEPLOY_HOST:-root@129.212.226.234}"
REMOTE_DIR="${DEPLOY_DIR:-/var/www/hr_dashboard}"

echo "==> Deploying to $HOST:$REMOTE_DIR"
ssh "$HOST" "cd $REMOTE_DIR && bash deploy.sh"
echo "==> Done — https://hr.29jewellery.com (hard refresh: Ctrl+Shift+R)"
