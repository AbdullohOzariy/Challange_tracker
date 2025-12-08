# ⚡ HabitHero - QUICK START (5 Minutes!)

## Step 1: Get Telegram Bot Token (1 minute)

```
1. Open Telegram
2. Search for @BotFather
3. Send: /newbot
4. Follow prompts
5. Copy your bot token
```

**Save this token - you'll need it in Step 2!**

---

## Step 2: Start Backend (2 minutes)

### Open Terminal 1:

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Edit .env.local file
nano .env.local
# OR just edit in your editor

# Replace "get-from-botfather" with your token from Step 1:
# TELEGRAM_BOT_TOKEN="123456789:ABCDEF..."
```

**Or just copy-paste your token:**
```bash
# Edit DATABASE_URL if needed (for local PostgreSQL)
# Make sure PostgreSQL is running!
```

**Then run migrations and start:**
```bash
npm run prisma:migrate
npm run dev
```

**You should see:**
```
✅ Database connected
✅ Telegram bot started
🚀 Server running on port 3000
```

---

## Step 3: Start Frontend (2 minutes)

### Open Terminal 2 (in project root):

```bash
# Make sure you're in the root directory
cd ..  # if you're still in backend folder

# Install dependencies
npm install

# Start dev server
npm run dev
```

**You should see:**
```
  VITE v6.2.0  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## Step 4: Open in Browser (Instant!)

```
Go to: http://localhost:5173
```

You should see:
- HabitHero login screen
- "Login with Telegram Bot" button
- Clean dark interface ✨

---

## Step 5: Test Login

### Open Telegram:
1. Find your bot (search for @YourBotName)
2. Click "Start" or send `/start`
3. You should get a welcome message ✅

### In Browser:
- Click "Login with Telegram Bot"
- It will show instructions to find your bot
- After sending /start in Telegram, refresh browser
- You should be logged in! 🎉

---

## 🎉 YOU DID IT!

### What You Should See:
- ✅ Login screen → Groups screen
- ✅ "New Group" button working
- ✅ Can create groups
- ✅ Groups show in grid
- ✅ Logout button works

---

## 🐛 TROUBLESHOOTING

### Backend won't start?
```bash
cd backend

# Check Node version
node --version  # Should be 18+

# Reinstall
rm -rf node_modules package-lock.json
npm install

# Make sure PostgreSQL is running!
npm run prisma:migrate
npm run dev
```

### Database error?
```bash
# Make sure PostgreSQL is running
# On Mac: brew services start postgresql
# On Linux: sudo service postgresql start

# Check DATABASE_URL in .env.local is correct
# Default: postgresql://habithero:habithero_password@localhost:5432/habithero
```

### Frontend won't load?
```bash
# Check if running on right port
# Should be http://localhost:5173

# Check .env.local has correct API URL
cat .env.local
# Should have: VITE_API_URL=http://localhost:3000/api
```

### Can't login?
```bash
1. Check you have bot token in backend .env.local
2. Check backend is running (should see "Telegram bot started")
3. Make sure you sent /start to the bot
4. Refresh browser
5. Check browser console for errors (F12)
```

---

## 📚 NEXT STEPS

After everything is working:

1. **Explore the code**
   - Backend: `backend/src/`
   - Frontend: `src/`
   - API client: `src/services/apiClient.ts`

2. **Create a group**
   - Click "New Group"
   - Name it "Test Group"
   - Should appear in grid

3. **Deploy to production**
   - When ready, see `DEPLOYMENT_RAILWAY.md`

4. **Customize**
   - Add more features
   - Style to your taste
   - Build your habit tracking empire! 💪

---

## 📞 HELP

**Check these if stuck:**
1. `QUICK_REFERENCE.md` - Common commands
2. `backend/SETUP.md` - Detailed backend guide
3. `backend/README.md` - Backend docs

---

## ✅ CHECKLIST

Before you start:
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Telegram bot token obtained
- [ ] 5 minutes free

Then follow the 5 steps above! 🚀

---

**Time to Setup:** ~5 minutes  
**Difficulty:** Easy ✅  
**Result:** Working full-stack app! 🎉

Good luck! 🍀

