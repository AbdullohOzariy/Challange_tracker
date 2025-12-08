# HabitHero Backend API 🚀

Production-ready Express.js backend for HabitHero habit tracking application.

## Features

✅ **User Management**
- Telegram authentication via bot
- Email verification
- User profiles

✅ **Groups**
- Create and manage groups
- Add members with roles
- Group-specific settings
- Penalty configuration

✅ **Challenges**
- Create daily/weekly challenges
- Track progress
- Multiple challenge categories
- Flexible scheduling

✅ **Tasks**
- Daily task management
- Completion tracking with proof
- Task notifications
- Activity logging

✅ **Analytics**
- Group statistics
- User leaderboards
- Challenge progress tracking
- Activity history

✅ **Telegram Bot Integration**
- Command-based interface
- Notifications
- Account linking
- Status updates

## Tech Stack

- **Node.js 20+**
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Prisma ORM** - Database management
- **Telegraf** - Telegram bot API
- **JWT** - Authentication
- **Zod** - Validation
- **Docker** - Containerization

## Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Setup database
npm run prisma:generate
npm run prisma:migrate

# 4. Start dev server
npm run dev
```

Server runs on `http://localhost:3000`

### With Docker

```bash
docker-compose up
```

Includes PostgreSQL, backend, and all services.

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/habithero

# Server
PORT=3000
NODE_ENV=development

# Auth
JWT_SECRET=your-secret-key

# Telegram
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_BOT_USERNAME=habithero_bot
TELEGRAM_WEBHOOK_URL=https://yourdomain.com

# Frontend
FRONTEND_URL=http://localhost:5173
```

## API Documentation

### Health Check
```
GET /health
```

### Authentication
```
POST /api/auth/telegram-login
POST /api/auth/verify-email
GET /api/auth/me
PUT /api/auth/profile
```

### Groups
```
POST /api/groups
GET /api/groups
GET /api/groups/:groupId
PUT /api/groups/:groupId
POST /api/groups/:groupId/members
GET /api/groups/:groupId/members
```

### Challenges
```
POST /api/challenges
GET /api/challenges/group/:groupId
GET /api/challenges/:challengeId
PUT /api/challenges/:challengeId
DELETE /api/challenges/:challengeId
```

### Tasks
```
POST /api/tasks/complete
GET /api/tasks/challenge/:challengeId/my-completions
GET /api/tasks/task/:taskId/completions
DELETE /api/tasks/completions/:completionId
```

### Analytics
```
GET /api/analytics/group/:groupId
GET /api/analytics/user/stats
GET /api/analytics/group/:groupId/activity
GET /api/analytics/challenge/:challengeId/progress
```

## Telegram Bot

### Commands
- `/start` - Initialize bot
- `/verify` - Verify account
- `/status` - Check progress
- `/challenges` - View challenges
- `/groups` - View groups
- `/help` - Show help

### Setup
1. Create bot with [@BotFather](https://t.me/botfather)
2. Add token to `.env`
3. Bot auto-connects when server starts

## Deployment

### Railway.app

1. Connect GitHub repository
2. Add PostgreSQL plugin
3. Set environment variables
4. Deploy!

See [SETUP.md](./SETUP.md) for detailed instructions.

### Docker
```bash
docker build -t habithero-backend .
docker run -p 3000:3000 habithero-backend
```

## Database

### Schema
- **Users** - User accounts and profiles
- **Groups** - Challenge groups
- **GroupMembers** - Group membership
- **Challenges** - Challenge definitions
- **Tasks** - Daily tasks
- **TaskCompletions** - Completion records
- **ActivityLog** - Group activity history
- **TelegramVerification** - Verification tokens

### Migrations
```bash
# Create migration
npm run prisma:migrate create

# Apply migrations
npm run prisma:migrate

# View database
npm run prisma:studio
```

## Development

### Scripts
```bash
npm run dev          # Start dev server
npm run build        # Build TypeScript
npm start            # Run production build
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open database UI
npm run lint         # Lint code
npm test             # Run tests
```

### Project Structure
```
backend/
├── src/
│   ├── index.ts          # Server entry point
│   ├── telegram/         # Bot implementation
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   └── utils/            # Helper functions
├── prisma/
│   └── schema.prisma     # Database schema
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── SETUP.md
```

## Error Handling

All errors return consistent JSON:
```json
{
  "error": "Error message",
  "code": "error_code",
  "path": "/api/endpoint"
}
```

## Security

- JWT-based authentication
- Telegram verification
- Input validation with Zod
- SQL injection protection (Prisma)
- Rate limiting ready
- CORS configured

## Performance

- Async/await for non-blocking I/O
- Database indexing on frequently queried fields
- Connection pooling with Prisma
- Query optimization
- Docker containerization

## Monitoring

- Health check endpoint: `/health`
- Error logging
- Request logging (dev mode)
- Performance metrics ready

## Support & Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [API Documentation](#api-documentation) - Endpoint reference
- [Prisma Docs](https://www.prisma.io/docs) - Database docs
- [Express Docs](https://expressjs.com) - Framework docs
- [Telegraf Docs](https://telegraf.js.org) - Bot docs

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

MIT - Feel free to use!

---

**Version:** 1.0.0  
**Created:** December 8, 2025  
**Maintainer:** HabitHero Team

Made with ❤️ for habit tracking

