#!/usr/bin/env bash
# Deploy the latest main to the VPS. Run from the repo root on the server.
set -euo pipefail

APP_DIR="/var/www/high-court-clerk-cpt"
cd "$APP_DIR"

echo "→ pulling latest"
git pull --ff-only

echo "→ installing dependencies (workspaces)"
npm ci --workspaces --include-workspace-root

echo "→ building client (Vite + prerender)"
npm run build --workspace client

echo "→ restarting API"
pm2 reload deploy/ecosystem.config.cjs --update-env || pm2 start deploy/ecosystem.config.cjs --env production

echo "→ reloading nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "✓ deployed"
