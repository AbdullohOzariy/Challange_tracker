# HabitHero - Complete Deployment Guide 🚀

Full guide to deploy HabitHero (frontend + backend + database) to Railway.app

## 📋 Prerequisites

Before starting, you need:
- GitHub account
- Railway.app account (free tier available)
- Telegram bot token from @BotFather
- Domain name (optional, Railway provides default domain)
- Frontend repository pushed to GitHub

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              Railway.app (Cloud)                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Frontend    │  │   Backend    │  │Database  │ │
│  │  (Vite)      │  │  (Express)   │  │(Postgres)│ │
│  │  :3000       │  │  :5000       │  │ :5432    │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│         ↓                 ↓                  ↓      │
│    [Frontend]       [API Routes]      [Storage]    │
│                                                      │
└─────────────────────────────────────────────────────┘
         ↓
    [Telegram Bot Webhook]
         ↓
    [@BotFather Bot API]
```

---

## Step 1: Prepare GitHub Repositories

### Frontend Repository

```bash
# 1. Create .env.production file in frontend root
echo "VITE_API_URL=https://your-backend-domain.up.railway.app/api" > .env.production

# 2. Create Dockerfile for frontend
cat > Dockerfile << 'EOF'
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
EOF

# 3. Commit and push
git add .
git commit -m "Add production config and Dockerfile"
git push origin main
```

### Backend Repository

Already created in `backend/` folder. Make sure to:
- Update `.env.example`
- Commit `Dockerfile`
- Commit `railway.toml`
- Commit `docker-compose.yml`

```bash
cd backend
git add .
git commit -m "Add backend deployment files"
git push origin main
```

---

## Step 2: Create Railway Project

### 2.1 Create New Project

1. Go to [Railway.app](https://railway.app)
2. Click "**New Project**"
3. Select "**Deploy from GitHub**"
4. Authorize Railway to access your repositories
5. Select your **backend repository**

### 2.2 Configure Backend Service

1. Select the `backend` directory as root
2. Railway auto-detects:
   - **Builder**: Dockerfile
   - **Port**: 3000 (from Dockerfile)

### 2.3 Add PostgreSQL Database

1. In your Railway project, click "**+ Add**"
2. Select "**Database**" → "**PostgreSQL**"
3. Railway automatically sets `DATABASE_URL` env var
4. Database is now ready!

### 2.4 Set Environment Variables

In **Variables** tab, add:

```
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg

JWT_SECRET=generate-a-random-secret-key-here-min-32-chars

FRONTEND_URL=https://your-frontend.up.railway.app

TELEGRAM_WEBHOOK_URL=https://your-backend.up.railway.app

NODE_ENV=production
```

### 2.5 Deploy Backend

```bash
# Push code to trigger deployment
git push origin main

# Or manually trigger in Railway dashboard
# It will:
# 1. Build Docker image
# 2. Run migrations
# 3. Start server
# 4. Health check
```

**Check deployment logs** to ensure:
```
✅ Database connected
✅ Telegram bot started
🚀 Server running on port 3000
```

---

## Step 3: Deploy Frontend

### 3.1 Create Frontend Service

1. In Railway project, click "**+ Add Service**"
2. Select "**Deploy from GitHub**"
3. Select your **frontend repository**
4. Configure:
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run preview` or `serve -s dist`

### 3.2 Add Environment Variables

```
VITE_API_URL=https://your-backend-url.up.railway.app/api
```

### 3.3 Deploy Frontend

Push to trigger deployment:
```bash
git push origin main
```

Or manually deploy in Railway dashboard.

---

## Step 4: Setup Telegram Bot Webhook

Once both services are deployed:

### 4.1 Get URLs

1. Open Railway project dashboard
2. Click on **backend** service
3. Copy the public URL (e.g., `https://habithero-backend.up.railway.app`)
4. Click on **frontend** service
5. Copy the public URL (e.g., `https://habithero-frontend.up.railway.app`)

### 4.2 Configure Bot Webhook

```bash
# Set webhook for Telegram bot
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook \
  -d "url=https://your-backend.up.railway.app/api/telegram/webhook/${TELEGRAM_BOT_TOKEN}"

# Verify webhook
curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo
```

Response should show:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-backend.up.railway.app/api/telegram/webhook/...",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### 4.3 Update Frontend Config

Update `.env.production`:
```
VITE_API_URL=https://your-backend-url.up.railway.app/api
```

Redeploy frontend.

---

## Step 5: Database Migrations

### Run Migrations

Migrations run automatically on deploy via `railway.toml`:

```toml
[deploy]
startCommand = "npm run prisma:generate && npm run prisma:migrate && npm start"
```

If needed, manually run:

```bash
# SSH into backend service
railway shell

# Inside shell
npm run prisma:migrate

# Exit
exit
```

### Seed Database (Optional)

Create `backend/src/seed.ts`:

```typescript
import { prisma } from './index.js';

async function main() {
  console.log('Seeding database...');
  // Add seed data here
  console.log('Seeding complete');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seed:
```bash
npm run seed
```

---

## Step 6: Verify Deployment

### Health Checks

```bash
# Backend health
curl https://your-backend.up.railway.app/health
# Response: { "status": "ok" }

# Frontend (should load app)
curl https://your-frontend.up.railway.app
# Should return HTML
```

### Test API

```bash
# Telegram login
curl -X POST https://your-backend.up.railway.app/api/auth/telegram-login \
  -H "Content-Type: application/json" \
  -d '{
    "telegramId": "123456789",
    "username": "testuser"
  }'
```

### Test Bot

1. Open Telegram
2. Find your bot (@habithero_bot or custom name)
3. Send `/start`
4. Should receive welcome message

---

## Step 7: Custom Domain (Optional)

### Add Custom Domain

1. Go to Railway **Project Settings**
2. Click "**Domains**"
3. Click "**+ New Domain**"
4. Enter your domain (e.g., `habithero.com`)
5. Follow DNS configuration instructions

### Update Telegram Webhook

If using custom domain:
```bash
curl -X POST https://api.telegram.org/bot${TOKEN}/setWebhook \
  -d "url=https://habithero.com/api/telegram/webhook/${TOKEN}"
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# In Railway dashboard, click service → Logs tab

# Or via CLI
railway logs -f   # Follow logs

# Filter by service
railway logs backend
railway logs postgres
railway logs frontend
```

### Performance Monitoring

Monitor in Railway:
- CPU usage
- Memory usage
- Network I/O
- Response times

---

## 🔧 Troubleshooting

### Deployment Failed

```
Error: Build failed
```

**Solution:**
```bash
# Check logs
railway logs

# Verify dependencies
npm ci  # Not npm install

# Check Dockerfile
# Ensure Node.js version compatibility
```

### Database Connection Error

```
Error: getaddrinfo ENOTFOUND postgres
```

**Solution:**
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Railway auto-sets this
# If missing, add PostgreSQL plugin

# Restart services
railway up
```

### Telegram Bot Not Responding

```
Error: Webhook not working
```

**Solution:**
```bash
# Verify webhook set
curl https://api.telegram.org/bot${TOKEN}/getWebhookInfo

# Restart backend
# In Railway dashboard, restart backend service

# Check backend logs for errors
railway logs backend
```

### Frontend Can't Connect to Backend

```
CORS error in browser console
```

**Solution:**
1. Verify `VITE_API_URL` is correct
2. Check `FRONTEND_URL` in backend env
3. Rebuild frontend
4. Clear browser cache

---

## 📈 Scaling

### Increase Resources

1. Go to **Service Settings**
2. Adjust:
   - **Memory**: Default 512MB → Increase if needed
   - **CPU**: Scale as needed
3. Save changes

### Database Scaling

1. Go to **PostgreSQL Service Settings**
2. Increase storage/memory as needed
3. Railway handles scaling

---

## 🔐 Security Checklist

- [ ] Change `JWT_SECRET` to random 32+ char string
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (Railway does by default)
- [ ] Configure CORS properly
- [ ] Use strong Telegram bot token
- [ ] Hide `.env` file
- [ ] Enable database backups
- [ ] Monitor error logs regularly
- [ ] Set up rate limiting
- [ ] Regular security updates

---

## 💾 Backup & Recovery

### Database Backups

Railway provides automatic backups. To restore:

1. Go to PostgreSQL service
2. Click "**Backups**"
3. Click "**Restore**"
4. Select backup date
5. Confirm restoration

### Manual Backup

```bash
# Export database
pg_dump "postgresql://user:pass@host/habithero" > backup.sql

# Restore
psql "postgresql://user:pass@host/habithero" < backup.sql
```

---

## 📞 Support Resources

### Documentation
- [Railway Docs](https://railway.app/docs)
- [Express.js Guide](https://expressjs.com)
- [Prisma Guide](https://www.prisma.io/docs)
- [Telegraf Docs](https://telegraf.js.org)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

### Community
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Create an issue
- Stack Overflow: Tag with `railway`, `express`, `prisma`

---

## 🎉 Success Indicators

After deployment, verify:

✅ Frontend loads at `https://your-frontend.up.railway.app`  
✅ Backend health check: `/health` returns `{ "status": "ok" }`  
✅ Database connected (check backend logs)  
✅ Telegram bot responds to `/start`  
✅ Can create group via API  
✅ Can create challenge via API  
✅ Activity logs show in leaderboard

---

## 📋 Deployment Checklist

- [ ] GitHub repositories ready
- [ ] `.env.example` files complete
- [ ] Dockerfiles in place
- [ ] `railway.toml` configured
- [ ] Telegram bot token obtained
- [ ] JWT_SECRET generated
- [ ] Railway project created
- [ ] PostgreSQL added
- [ ] Environment variables set
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Database migrations completed
- [ ] Telegram webhook configured
- [ ] All health checks passing
- [ ] API endpoints tested
- [ ] Bot commands working

---

## 🚀 Post-Deployment

### Monitor Performance
```bash
railway shell
# Inside shell, check processes
ps aux | grep node
```

### Update Code
```bash
# Make changes locally
git commit -m "Fix or feature"
git push origin main

# Railway auto-deploys!
```

### Rollback (if needed)
1. Go to Railway dashboard
2. Click service → Deployments
3. Select previous deployment
4. Click "Redeploy"

---

**Deployment Version:** 1.0.0  
**Created:** December 8, 2025

🎉 Your HabitHero app is now live!

Questions? Check the [Backend SETUP.md](./backend/SETUP.md) for more details.

