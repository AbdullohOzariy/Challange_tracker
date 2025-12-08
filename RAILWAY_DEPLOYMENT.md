# 🚀 HABITHERO - RAILWAY DEPLOYMENT GUIDE

**LIVE-GA CHIQARISH (30 DAQIQA)**

---

## STEP 1: GitHub Preparation

### 1.1 Hozirgi o'zgarishlarni commit qiling

```bash
cd /Users/bozorov/Desktop/habithero---challenge-tracker

# Barcha faylllarni add qiling
git add .

# Commit qiling
git commit -m "Add frontend refactoring and backend integration ready for deployment"

# GitHub-ga push qiling
git push origin main
```

**Agar git init qilmagan bo'lsangiz:**
```bash
git init
git add .
git commit -m "Initial commit - HabitHero full stack"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/habithero.git
git push -u origin main
```

---

## STEP 2: Railway Project Setup

### 2.1 Railway.app-ga kiring

1. **https://railway.app** ga boring
2. **GitHub** bilan signup qiling (o'z akkauntingizdan)
3. GitHub-da authorize qiling

### 2.2 Yangi project yaratish

1. **"New Project"** bosing
2. **"Deploy from GitHub"** tanlang
3. **habithero** reposini tanlang
4. **Railway** sizni repo-ni clone qiladi

### 2.3 Backend service qo'shish

Railway automatik Dockerfile-ni topib, backend-ni build qiladi.

1. **Backend** service avtomatik deploy bo'ladi
2. **URL** beriladi (masalan: `https://habithero-backend.up.railway.app`)

---

## STEP 3: PostgreSQL Database Qo'shish

Railway-da PostgreSQL plugini qo'shish:

1. **Project** ichida "**+ Add Service**" bosing
2. **"Database"** → **"PostgreSQL"** tanlang
3. Railway avtomatik:
   - Database yaratadi
   - `DATABASE_URL` environment variable qo'shadi
   - Migrations qiladi

**Jo'nadi!** 🎉

---

## STEP 4: Environment Variables Set Qilish

### Backend uchun

**Project Settings** → **Variables** tab-ga boring:

```
PORT=3000

NODE_ENV=production

JWT_SECRET=your-super-secret-key-32-chars-min

TELEGRAM_BOT_TOKEN=1234567890:ABCDEFGH...

TELEGRAM_BOT_USERNAME=your_bot_name

FRONTEND_URL=https://your-frontend-url.up.railway.app

TELEGRAM_WEBHOOK_URL=https://your-backend-url.up.railway.app
```

**Agar DATABASE_URL yo'q bo'lsa**, PostgreSQL service add qilganingizdan so'ng avtomatik qo'shiladi.

### Frontend uchun (agar deploy qilmoqchi bo'lsangiz)

**"+ Add Service"** → **"Deploy from GitHub"**

Frontend uchun variables:

```
VITE_API_URL=https://your-backend-url.up.railway.app/api
VITE_GEMINI_API_KEY=your-gemini-key
```

---

## STEP 5: Telegram Webhook Setup

Backend-ni deploy qilinggandan so'ng (URL olganingizdan keyin):

### Webhook URL-ni set qilish

```bash
# Bu commandni run qiling (replacement-lar bilan):
# TOKEN = TELEGRAM_BOT_TOKEN
# DOMAIN = your-backend-url (masalan: https://habithero-backend.up.railway.app)

curl -X POST https://api.telegram.org/bot{TOKEN}/setWebhook \
  -d "url=https://habithero-backend.up.railway.app/api/telegram/webhook/{TOKEN}"
```

### Verify qilish

```bash
curl https://api.telegram.org/bot{TOKEN}/getWebhookInfo
```

Response-da:
```json
{
  "ok": true,
  "result": {
    "url": "https://habithero-backend.up.railway.app/api/telegram/webhook/...",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

---

## STEP 6: Frontend Build & Deploy (Optional)

Agar frontend-ni ham Railway-da host qilmoqchi bo'lsangiz:

### Railway-ga frontend qo'shish

1. **"+ Add Service"** → **"Deploy from GitHub"**
2. **Frontend project** tanlang (yoki main repository agar root-dan deploy qilmoqchi)
3. **Build command**: `npm run build`
4. **Start command**: `serve -s dist -l 3000`

### O'zgarish (agar main repo-da bo'lsa)

Root-da `Dockerfile` mavjud, shuning uchun Railway avtomatik build qiladi.

**Build settings:**
- **Root Directory**: `.` (root)
- **Dockerfile Path**: `./Dockerfile`

---

## STEP 7: Verify Deployment

### Health Check

```bash
# Backend
curl https://your-backend-url.up.railway.app/health

# Response:
{
  "status": "ok",
  "uptime": 123.45
}
```

### Frontend Test

1. **https://your-frontend-url.up.railway.app** ni oching
2. Login page ko'rish kerak
3. Bot-dan /start yuboring
4. Login test qiling

### Database Check

```bash
# Railway dashboard-da PostgreSQL service-ni oching
# "Connect" tab-ni bosing
# Connection string ko'ring
```

---

## 🎯 PROBLEMS & SOLUTIONS

### Problem: "Build failed"

```
Error: Cannot find module
```

**Solution:**
```bash
# Ensure package.json has all dependencies
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Problem: "Database connection error"

```
Error: ECONNREFUSED
```

**Solution:**
1. Verify `DATABASE_URL` is set in Railway
2. PostgreSQL service is running
3. Migrations qilishni restart qiling:
   - Deploy settings-da `startCommand` o'zgartiring
   - `npm run prisma:migrate && npm start`

### Problem: "Bot not responding"

```
Webhook not working
```

**Solution:**
1. Check `TELEGRAM_BOT_TOKEN` is correct
2. Check `TELEGRAM_WEBHOOK_URL` is correct
3. Restart backend service
4. Verify webhook: `getWebhookInfo`

### Problem: "Frontend can't connect to backend"

```
CORS error
```

**Solution:**
1. Check `VITE_API_URL` is correct
2. Check backend `FRONTEND_URL` is set
3. Rebuild frontend
4. Clear browser cache (Ctrl+Shift+Del)

---

## 📊 PRODUCTION CHECKLIST

- [ ] Barcha code GitHub-da push qilindi
- [ ] Railway project created
- [ ] PostgreSQL added
- [ ] Backend variables set
- [ ] Frontend variables set (agar deploy qilmoqchi)
- [ ] Telegram webhook configured
- [ ] Health check passing
- [ ] Frontend loading at correct URL
- [ ] Login working
- [ ] Groups showing
- [ ] No errors in logs

---

## 🎉 SUCCESS INDICATORS

Agar hamma ishlayotgan bo'lsa:

✅ Frontend loads at HTTPS URL  
✅ Backend API responding  
✅ Database connected  
✅ Telegram bot responding  
✅ Can login  
✅ Can create groups  
✅ No console errors  
✅ No server errors  

---

## 📈 AFTER DEPLOYMENT

### Monitor Performance

1. **Railway Dashboard** → Logs tab
2. Watch for errors
3. Check response times

### Enable Auto-Deploy

Railway auto-deploy qiladi GitHub-dan push qilganingizda.

### Backup Database

Railway automatic backups qiladi.

---

## 🔐 SECURITY

- ✅ JWT_SECRET o'zgartirildi
- ✅ NODE_ENV=production
- ✅ HTTPS enabled (Railway default)
- ✅ TELEGRAM_BOT_TOKEN secure
- ✅ Database password secure

---

## 💰 COSTS

Railway free tier:
- ✅ First $5/month free
- ✅ Database free
- ✅ Great for testing

Production tier:
- Start from $5/month
- Auto-scaling available

---

## 🚀 NEXT STEPS

1. **Monitor logs** - Railway dashboard
2. **Test thoroughly** - Kattaroq test
3. **Add users** - Beta testing
4. **Feedback** - Users orqali
5. **Improvements** - Features add qiling

---

## 📞 SUPPORT

Railway problems uchun:
- https://docs.railway.app
- Support: https://railway.app/support

Code problems uchun:
- Check logs (F12 browser, Railway dashboard)
- Read error messages carefully

---

**Deployment Date:** December 8, 2025  
**Status:** Ready to deploy! 🚀

**Next:** Execute commands above in order!

