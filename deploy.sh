#!/bin/bash
# hr.29jewellery.com — Node API + static frontend
set -euo pipefail

export PATH="/root/.nvm/versions/node/v24.15.0/bin:$PATH"
ROOT="/var/www/hr_dashboard"

cd "$ROOT"
echo "==> git pull"
git pull --ff-only

echo "==> install dependencies"
npm install

echo "==> build"
npm run build

echo "==> restart app"
pm2 restart hr-dashboard
pm2 save 2>/dev/null || true

echo "==> done — https://hr.29jewellery.com"
echo "Hard refresh: Ctrl+Shift+R"
