# 🚀 RAILWAY-GA DEPLOY QILISH - STEP BY STEP

## QO'LLANMA (30 DAQIQA)

---

## STEP 1: GitHub-ga Push Qiling (5 DAQIQA)

### Terminal-da bu comandlarni run qiling:

```bash
# 1. Papkaga boring
cd /Users/bozorov/Desktop/habithero---challenge-tracker

# 2. Git config (agar birinchi marta bo'lsa)
git config user.name "Your Name"
git config user.email "your-email@example.com"

# 3. Barcha o'zgarishlarni add qiling
git add .

# 4. Commit qiling
git commit -m "Deploy to Railway: Frontend refactored, Backend integrated, Ready for production"

# 5. GitHub-ga push qiling
git push origin main
```

**Agar hato qo'lsa, boshlang:**
```bash
git init
git add .
git commit -m "Initial HabitHero commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/habithero.git
git push -u origin main
```

---

## STEP 2: Railway.app-da Project Yarating (5 DAQIQA)

1. **https://railway.app** ga boring
2. **"Start a new project"** bosing
3. **"Deploy from GitHub"** tanlang
4. **habithero** repository-ni tanlang
5. **Railway** auto-deploy qiladi! 

---

## STEP 3: PostgreSQL Qo'shing (3 DAQIQA)

Railway dashboard-da:

1. **"+ Add Service"** bosing
2. **"Database"** → **"PostgreSQL"** tanlang
3. **Create** bosing

**Railway avtomatik:**
- ✅ Database yaratadi
- ✅ DATABASE_URL qo'shadi
- ✅ Backup setup qiladi

---

## STEP 4: Environment Variables Set Qiling (5 DAQIQA)

Railway dashboard-da **"Variables"** tab:

### Backend variables qo'shing:

```
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij

JWT_SECRET=your-super-secret-key-min-32-characters-long

TELEGRAM_BOT_USERNAME=habithero_bot

NODE_ENV=production

FRONTEND_URL=https://habithero-frontend.up.railway.app

TELEGRAM_WEBHOOK_URL=https://habithero-backend.up.railway.app
```

*DATABASE_URL avtomatik qo'shilgan bo'ladi PostgreSQL-dan*

---

## STEP 5: Frontend Deploy Qiling (5 DAQIQA) (OPTIONAL)

Agar frontend-ni ham Railway-da deploy qilmoqchi bo'lsangiz:

1. **"+ Add Service"** bosing
2. **"Deploy from GitHub"** tanlang
3. **Repo-ni** tanlang
4. Build settings:
   - **Build command**: `npm run build`
   - **Start command**: `serve -s dist -l 3000`
5. Variables:
   ```
   VITE_API_URL=https://habithero-backend.up.railway.app/api
   VITE_GEMINI_API_KEY=your-key
   ```

---

## STEP 6: Telegram Webhook Setup (2 DAQIQA)

Backend deploy bo'lingandan keyin:

```bash
# Terminal-da:
# BACKEND_URL = your Railway backend URL (masalan: https://habithero-backend.up.railway.app)
# TOKEN = TELEGRAM_BOT_TOKEN

curl -X POST https://api.telegram.org/bot{TOKEN}/setWebhook \
  -d "url=https://habithero-backend.up.railway.app/api/telegram/webhook/{TOKEN}"
```

---

## STEP 7: TEST QILING! (5 DAQIQA)

### Health Check

```bash
# Backend ishlayotgan-ni tekshirish
curl https://habithero-backend.up.railway.app/health

# Javob: { "status": "ok" }
```

### Frontend Test

1. **https://habithero-frontend.up.railway.app** oching (yoki your URL)
2. **Login** page ko'ring
3. Telegram bot-dan `/start` yuboring
4. **Refresh** qiling
5. **Logged in!** ✅

### Groups Test

1. **"New Group"** bosing
2. Groupni nomlang
3. Ko'ring group-lar listda

**XOLOS!** 🎉

---

## ❓ PROBLEMS?

### "Build failed"
- Logs-ni o'qing (Railway dashboard)
- Dependencies to'g'ri install qilindi-mi?
- package.json to'g'ri-mi?

### "Database error"
- PostgreSQL service running-mi?
- DATABASE_URL o'rnatilgan-mi?
- Migrations qilindi-mi?

### "Bot not responding"
- TELEGRAM_BOT_TOKEN to'g'ri-mi?
- TELEGRAM_WEBHOOK_URL to'g'ri-mi?
- Backend running-mi?

### "Can't connect API"
- VITE_API_URL to'g'ri-mi?
- Backend URL accessible-mi?
- CORS enabled-mi?

---

## 📊 CHECKLIST

- [ ] GitHub-da push qilindi
- [ ] Railway project created
- [ ] PostgreSQL added
- [ ] Variables set qilindi
- [ ] Frontend deployed (optional)
- [ ] Telegram webhook configured
- [ ] Health check passing
- [ ] Can login
- [ ] Can create group
- [ ] No errors

---

## 🎊 SUCCESS!

Agar hamma ishlayotgan bo'lsa:

✅ Frontend live at HTTPS URL
✅ Backend responding
✅ Database working
✅ Telegram bot responding
✅ Users can login
✅ Real habit tracking! 💪

---

## 🚀 NEXT STEPS

1. **Monitor** - Logs ni o'qib turing
2. **Test** - Katta test qiling
3. **Share** - Users-ga yuboring
4. **Improve** - Feedback-dan features add qiling
5. **Scale** - Boshqa users qo'shing

---

**Deployment Ready:** NOW! 🚀

Read RAILWAY_DEPLOYMENT.md for detailed guide!

Execute commands above to deploy! 🎉

