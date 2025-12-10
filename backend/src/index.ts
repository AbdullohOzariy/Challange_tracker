import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import 'express-async-errors';
import { PrismaClient } from '@prisma/client';
import { TelegrafBot } from './telegram/bot.js';
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import challengeRoutes from './routes/challenges.js';
import taskRoutes from './routes/tasks.js';
import analyticsRoutes from './routes/analytics.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

const app: Express = express();
export const prisma = new PrismaClient();
export const bot = new TelegrafBot();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', authMiddleware, groupRoutes);
app.use('/api/challenges', authMiddleware, challengeRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// Telegram webhook
const secretPath = `/api/telegram/webhook/${process.env.TELEGRAM_BOT_TOKEN}`;
app.post(secretPath, async (req: Request, res: Response) => {
  try {
    await bot.handleUpdate(req.body);
  } catch (error) {
    console.error('Telegram webhook error:', error);
  }
  res.send('OK');
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Server startup
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected');

    // Set webhook
    if (process.env.NODE_ENV === 'production' && process.env.BACKEND_URL) {
      const webhookUrl = `${process.env.BACKEND_URL}${secretPath}`;
      await bot.setWebhook(webhookUrl);
    } else {
      console.log('⚠️ Webhook not set in development mode. Use polling.');
    }

    console.log(`🚀 Server running on port ${PORT}`);
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    prisma.$disconnect();
    console.log('✅ Shutdown complete');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

export default app;
