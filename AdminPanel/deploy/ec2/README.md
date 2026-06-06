# EC2 Single-Server Setup (App + Local PostgreSQL)

This setup runs your Next.js app and PostgreSQL on the same EC2 machine.

## 1) Server prerequisites

Use Ubuntu 22.04+ EC2, then:

```bash
sudo apt-get update -y
sudo apt-get install -y curl git build-essential
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 2) Clone project and install dependencies

```bash
git clone <your-repo-url> quirkyhome
cd quirkyhome
npm install
```

## 3) Install and configure PostgreSQL locally

```bash
export APP_DB_NAME=quirkyhome
export APP_DB_USER=quirkyhome_user
export APP_DB_PASSWORD='CHANGE_THIS_STRONG_PASSWORD'
sudo bash deploy/ec2/setup_postgres.sh
```

## 4) Configure app env

```bash
cp .env.production.example .env.production
```

Edit `.env.production`:
- set `DATABASE_URL` password same as `APP_DB_PASSWORD`

## 5) Create all DB tables

```bash
bash deploy/ec2/apply_schema.sh
```

## 6) Build and run app

```bash
npm run build
npm run start
```

For background process (recommended):

```bash
sudo npm install -g pm2
pm2 start "npm run start" --name quirkyhome
pm2 save
pm2 startup
```

## 7) Daily backup

```bash
bash deploy/ec2/backup_postgres.sh
```

Automate with cron (daily 2 AM):

```bash
crontab -e
```

Add:

```cron
0 2 * * * cd /home/ubuntu/quirkyhome && /usr/bin/bash deploy/ec2/backup_postgres.sh >> /tmp/quirkyhome_backup.log 2>&1
```

## Notes

- This is good for MVP/small traffic.
- Keep PostgreSQL private (localhost only).
- Take backups seriously.
- For higher scale/HA, move DB to RDS/Aurora later.
