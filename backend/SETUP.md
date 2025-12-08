# HabitHero - Backend Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Docker & Docker Compose (optional)
- Telegram Bot Token (from @BotFather)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Setup Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required environment variables:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/habithero
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

### Step 3: Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Optional: Open Prisma Studio
npm run prisma:studio
```

### Step 4: Create Telegram Bot

1. Open Telegram and chat with [@BotFather](https://t.me/botfather)
2. Create a new bot with `/newbot`
3. Copy the bot token
4. Paste it in your `.env` file as `TELEGRAM_BOT_TOKEN`

### Step 5: Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

---

## 🐳 Docker Setup (Recommended)

### Using Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Manual Docker

```bash
# Build image
docker build -t habithero-backend .

# Run container with PostgreSQL
docker run -d \
  --name habithero-db \
  -e POSTGRES_PASSWORD=password \
  postgres:16-alpine

docker run -d \
  --name habithero-backend \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:password@habithero-db:5432/habithero \
  -e TELEGRAM_BOT_TOKEN=your-token \
  --link habithero-db \
  habithero-backend
```

---

## 🚂 Railway Deployment

### Prerequisites
- Railway.app account
- GitHub repository (fork or push code)
- PostgreSQL plugin in Railway

### Step 1: Connect Repository

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose your repository
5. Select the `backend` directory as the root directory

### Step 2: Add PostgreSQL

1. Click "Add Service"
2. Select "Database" → "PostgreSQL"
3. Railway will auto-configure `DATABASE_URL`

### Step 3: Configure Environment Variables

In Railway project settings, add:

```
TELEGRAM_BOT_TOKEN=your-bot-token
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-frontend-domain.com
TELEGRAM_WEBHOOK_URL=https://your-railway-domain.up.railway.app
```

### Step 4: Configure Telegram Webhook

Once deployed, update your bot webhook:

```bash
curl -X POST https://api.telegram.org/bot${TOKEN}/setWebhook \
  -d url=https://your-railway-domain.up.railway.app/api/telegram/webhook/${TOKEN}
```

Or use Railway's deploy URL automatically.

### Step 5: Deploy

Push to your repository:

```bash
git push origin main
```

Railway will automatically build and deploy!

---

## 📚 API Endpoints

### Authentication

```http
POST /api/auth/telegram-login
Content-Type: application/json

{
  "telegramId": "123456789",
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe"
}
```

Response:
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "telegramId": "123456789",
    "username": "john_doe",
    "isVerified": false
  }
}
```

### Groups

```http
# Create Group
POST /api/groups
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Fitness Squad",
  "description": "Getting fit together",
  "icon": "💪",
  "theme": "emerald"
}

# Get User Groups
GET /api/groups
Authorization: Bearer {token}

# Get Group Details
GET /api/groups/:groupId
Authorization: Bearer {token}

# Add Member
POST /api/groups/:groupId/members
Authorization: Bearer {token}

{
  "userId": "user-id",
  "displayName": "John",
  "avatar": "👤"
}
```

### Challenges

```http
# Create Challenge
POST /api/challenges
Authorization: Bearer {token}
Content-Type: application/json

{
  "groupId": "group-id",
  "title": "30-Day Push-up Challenge",
  "description": "Do push-ups every day",
  "category": "FITNESS",
  "startDate": "2025-12-08T00:00:00Z",
  "durationDays": 30,
  "deadlineTime": "22:00",
  "tasks": [
    {
      "dayNumber": 1,
      "title": "Day 1: 10 push-ups",
      "description": "Start with 10 push-ups"
    }
  ]
}

# Get Group Challenges
GET /api/challenges/group/:groupId
Authorization: Bearer {token}

# Get Challenge Details
GET /api/challenges/:challengeId
Authorization: Bearer {token}
```

### Tasks

```http
# Complete Task
POST /api/tasks/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "taskId": "task-id",
  "challengeId": "challenge-id",
  "proofUrl": "https://example.com/proof.jpg",
  "notes": "Done! 💪"
}

# Get User Completions
GET /api/tasks/challenge/:challengeId/my-completions
Authorization: Bearer {token}

# Get Task Completions
GET /api/tasks/task/:taskId/completions
Authorization: Bearer {token}
```

### Analytics

```http
# Get Group Statistics
GET /api/analytics/group/:groupId
Authorization: Bearer {token}

# Get User Statistics
GET /api/analytics/user/stats
Authorization: Bearer {token}

# Get Activity Log
GET /api/analytics/group/:groupId/activity?limit=50&offset=0
Authorization: Bearer {token}

# Get Challenge Progress
GET /api/analytics/challenge/:challengeId/progress
Authorization: Bearer {token}
```

---

## 🤖 Telegram Bot Commands

When bot is running, these commands are available:

```
/start - Initialize bot and get welcome message
/verify - Verify your account
/status - Check your progress
/challenges - View active challenges
/groups - View your groups
/help - Show all commands
```

---

## 🧪 Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Open Prisma Studio (visual database editor)
npm run prisma:studio

# Lint code
npm run lint

# Run tests
npm test
```

---

## 📋 Database Schema

### Main Tables

**Users**
- id, telegramId, username, firstName, lastName
- email, photoUrl, isVerified
- createdAt, updatedAt

**Groups**
- id, name, description, icon, theme
- createdById (user who created)
- createdAt, updatedAt

**GroupMembers**
- id, groupId, userId
- displayName, avatar, role
- strikes, penaltiesPaid
- joinedAt

**Challenges**
- id, groupId, title, description
- category, startDate, durationDays
- status, color, mode, deadlineTime
- frequency, customFrequencyDays

**Tasks**
- id, challengeId, dayNumber
- title, description

**TaskCompletions**
- id, taskId, memberId, challengeId
- proofUrl, notes, completedAt

**ActivityLog**
- id, groupId, challengeId
- action, description, metadata
- createdAt

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: getaddrinfo ENOTFOUND postgres
```
**Solution:** Check DATABASE_URL in .env and ensure PostgreSQL is running

### Telegram Bot Not Responding
```
Error: TelegramError: 401 Unauthorized
```
**Solution:** Verify TELEGRAM_BOT_TOKEN is correct

### Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution:** 
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### Migration Error
```
Error: schema already exists
```
**Solution:**
```bash
npx prisma migrate resolve --rolled-back
npm run prisma:migrate
```

---

## 📚 Technologies Used

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT
- **Bot**: Telegraf (Telegram API wrapper)
- **Validation**: Zod

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Configure `TELEGRAM_WEBHOOK_URL` to your domain
- [ ] Setup email verification (if needed)
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Setup logging/monitoring
- [ ] Backup database regularly
- [ ] Setup CI/CD pipeline
- [ ] Monitor error rates
- [ ] Setup rate limiting
- [ ] Configure database backups

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check Prisma documentation: https://www.prisma.io/docs
4. Check Express documentation: https://expressjs.com
5. Check Telegraf documentation: https://telegraf.js.org

---

## 📄 License

MIT

---

**Created:** December 8, 2025  
**Backend Version:** 1.0.0

