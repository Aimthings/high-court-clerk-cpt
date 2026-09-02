#!/usr/bin/env bash
# Nightly MySQL backup. Add to root's crontab:
#   15 2 * * * /var/www/high-court-clerk-cpt/deploy/backup.sh >> /var/log/hcc/backup.log 2>&1
set -euo pipefail

DB_NAME="${DB_NAME:-hcc_cpt}"
DB_USER="${DB_USER:-hcc}"
BACKUP_DIR="/var/backups/hcc"
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y-%m-%d_%H%M)"
OUT="$BACKUP_DIR/${DB_NAME}_${STAMP}.sql.gz"

# DB_PASSWORD must be exported in the environment (never hard-coded here).
mysqldump --single-transaction --quick --user="$DB_USER" --password="${DB_PASSWORD:?set DB_PASSWORD}" "$DB_NAME" \
  | gzip > "$OUT"

echo "$(date -Is) wrote $OUT ($(du -h "$OUT" | cut -f1))"

# prune old dumps
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +"$KEEP_DAYS" -delete
