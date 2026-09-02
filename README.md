# High Court Clerk CPT

Practice platform for the **Computer Proficiency Test (C.P.T.)** — the qualifying
practical stage of the Punjab & Haryana High Court / S.S.S.C. Clerk recruitment.
Two papers: **English typing** (pass at 30 W.P.M.) and an **MS Excel spreadsheet
practical** (pass at 4 / 10). First mock free; **₹119 for 45 days**, no auto-renewal.

React 18 + Vite (client) · Node 20 + Express 4 (server) · MySQL 8 · Razorpay.
Deterministic grading (no AI). See `CLAUDE.md` for the exam facts and engineering rules.

## Local development

```bash
npm install                 # installs both workspaces
cp .env.example .env        # fill DB + (optional) Razorpay/SMS keys
npm run dev:server          # API on http://127.0.0.1:4000
npm run dev:client          # SPA on http://localhost:5173 (proxies /api)
```

Run the tests (grading, security, rank):

```bash
npm run test --workspace server
npm run test --workspace client
```

Build the static site (Vite build + prerender to `client/dist/*.html`):

```bash
npm run build
```

## Verifying against a database (Phases 4–6 flows)

Auth (OTP), the ₹119 pass, order persistence and the rank list need MySQL 8:

```bash
# create the database + user, then:
mysql -u hcc -p hcc_cpt < db/schema.sql        # or: RUN_MIGRATIONS=true npm run dev:server
node server/db-migrate.js                        # applies schema + seeds passages/mocks
```

Then, with the server running: sign in (the OTP is printed to the server log in
dev), take an **exam-mode** typing test and an Excel mock, and the rank list fills
after the 5-minute rebuild (or call `rebuildLeaderboard()` once).

## Deploying to a Hostinger KVM VPS (Ubuntu) — first run, in order

> Shared hosting cannot hold a Node process; the API + MySQL + cron need the KVM VPS.

```bash
# 1. Node 20 (via nvm) + build tools
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20 && nvm use 20 && npm i -g pm2

# 2. MySQL 8
sudo apt update && sudo apt install -y mysql-server
sudo mysql_secure_installation
sudo mysql -e "CREATE DATABASE hcc_cpt CHARACTER SET utf8mb4;"
sudo mysql -e "CREATE USER 'hcc'@'localhost' IDENTIFIED BY 'CHANGE_ME';"
sudo mysql -e "GRANT ALL PRIVILEGES ON hcc_cpt.* TO 'hcc'@'localhost'; FLUSH PRIVILEGES;"

# 3. Firewall
sudo apt install -y ufw
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable

# 4. App + build
sudo mkdir -p /var/www /var/log/hcc && sudo chown -R "$USER" /var/www /var/log/hcc
cd /var/www && git clone <repo-url> high-court-clerk-cpt && cd high-court-clerk-cpt
cp .env.example .env   # set real DB_PASSWORD, RAZORPAY_*, SMS_*, COOKIE_SECRET
npm ci --workspaces --include-workspace-root
RUN_MIGRATIONS=true node server/db-migrate.js
npm run build --workspace client

# 5. nginx
sudo apt install -y nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/highcourtclerkcpt
sudo ln -s /etc/nginx/sites-available/highcourtclerkcpt /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. TLS
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d highcourtclerkcpt.in -d www.highcourtclerkcpt.in

# 7. PM2 (API + crons) and start-on-boot
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save && pm2 startup   # run the command it prints

# 8. Nightly mysqldump
chmod +x deploy/backup.sh
( crontab -l 2>/dev/null; echo "15 2 * * * DB_PASSWORD='...' /var/www/high-court-clerk-cpt/deploy/backup.sh >> /var/log/hcc/backup.log 2>&1" ) | crontab -
```

Razorpay: add the webhook `https://highcourtclerkcpt.in/api/orders/webhook` in the
Razorpay dashboard with the `RAZORPAY_WEBHOOK_SECRET` you set in `.env`, subscribe to
`payment.captured`. Redeploy later with `deploy/deploy.sh`.

## Layout

```
client/   React SPA + prerender.js (static HTML per public route)
server/   Express API, grading/ (deterministic), routes/, services/, jobs/, seed/
db/       schema.sql
deploy/   nginx.conf, ecosystem.config.cjs, deploy.sh, backup.sh
```
