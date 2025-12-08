import { Telegraf, Context } from 'telegraf';
import { prisma } from '../index.js';
import { generateVerificationToken } from '../utils/token.js';

export interface BotContext extends Context {
  user?: {
    id: string;
    telegramId: string;
    username?: string;
  };
}

export class TelegrafBot {
  private bot: Telegraf<BotContext>;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN not set');
    }

    this.bot = new Telegraf(token);
    this.setupMiddleware();
    this.setupCommands();
    this.setupActions();
  }

  private setupMiddleware() {
    this.bot.use(async (ctx, next) => {
      try {
        const telegramId = ctx.from?.id.toString();

        if (telegramId) {
          const user = await prisma.user.findUnique({
            where: { telegramId },
          });

          ctx.user = user ? {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username || undefined,
          } : undefined;
        }

        return next();
      } catch (error) {
        console.error('Middleware error:', error);
        return next();
      }
    });
  }

  private setupCommands() {
    // /start command
    this.bot.start(async (ctx) => {
      const startParam = ctx.startPayload;

      try {
        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { telegramId: ctx.from!.id.toString() },
        });

        if (!user) {
          // Create new user
          const verificationToken = generateVerificationToken();
          user = await prisma.user.create({
            data: {
              telegramId: ctx.from!.id.toString(),
              username: ctx.from!.username,
              firstName: ctx.from!.first_name,
              lastName: ctx.from!.last_name,
              photoUrl: ctx.from!.photo_url,
              globalUserId: ctx.from!.id.toString(),
              verificationToken,
              verificationSentAt: new Date(),
            },
          });
        }

        const welcomeMessage = `
🎉 <b>Welcome to HabitHero!</b>

I'm your personal habit tracking companion. Let's build better habits together! 💪

<b>Commands:</b>
/verify - Verify your account
/status - Check your progress
/challenges - View active challenges
/groups - View your groups
/help - Get help

<b>To get started:</b>
1. Click /verify to link your account
2. Join or create a group
3. Set your first challenge
4. Complete daily tasks
5. Build your streak! 🔥
        `;

        await ctx.replyWithHTML(welcomeMessage, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Verify Account', callback_data: 'verify_start' }],
              [{ text: '📱 Open HabitHero', url: process.env.FRONTEND_URL || 'https://habithero.app' }],
            ],
          },
        });
      } catch (error) {
        console.error('Start command error:', error);
        await ctx.reply('❌ Error processing your request. Please try again.');
      }
    });

    // /verify command
    this.bot.command('verify', async (ctx) => {
      try {
        if (!ctx.user) {
          await ctx.reply('❌ User not found. Please use /start first.');
          return;
        }

        // Check if already verified
        if (ctx.user && await prisma.user.findUnique({ where: { id: ctx.user.id } }).then(u => u?.isVerified)) {
          await ctx.reply('✅ Your account is already verified!');
          return;
        }

        // Generate verification link
        const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
        const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${user?.verificationToken}`;

        await ctx.replyWithHTML(`
🔐 <b>Account Verification</b>

Click the button below to verify your account and link it with HabitHero:
        `, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Verify Now', url: verificationLink }],
            ],
          },
        });
      } catch (error) {
        console.error('Verify command error:', error);
        await ctx.reply('❌ Error. Please try again.');
      }
    });

    // /status command
    this.bot.command('status', async (ctx) => {
      try {
        if (!ctx.user) {
          await ctx.reply('❌ Please use /start first.');
          return;
        }

        const user = await prisma.user.findUnique({
          where: { id: ctx.user.id },
          include: {
            groupMemberships: {
              include: {
                group: {
                  include: {
                    challenges: true,
                  },
                },
              },
            },
          },
        });

        if (!user?.groupMemberships.length) {
          await ctx.reply('📭 You are not a member of any group yet. Create or join a group!');
          return;
        }

        let statusText = `📊 <b>Your Status</b>\n\n`;

        for (const membership of user.groupMemberships) {
          statusText += `<b>${membership.group.name}</b>\n`;
          statusText += `├ Role: ${membership.role}\n`;
          statusText += `├ Strikes: ${membership.strikes} ⚠️\n`;
          statusText += `├ Active Challenges: ${membership.group.challenges.filter(c => c.status === 'active').length}\n`;
          statusText += `└ Joined: ${membership.joinedAt.toLocaleDateString()}\n\n`;
        }

        await ctx.replyWithHTML(statusText);
      } catch (error) {
        console.error('Status command error:', error);
        await ctx.reply('❌ Error. Please try again.');
      }
    });

    // /help command
    this.bot.help(async (ctx) => {
      const helpText = `
<b>HabitHero Bot Commands:</b>

/start - Start the bot
/verify - Verify your account
/status - Check your progress
/challenges - View active challenges
/groups - View your groups
/help - Show this message

<b>Features:</b>
✅ Track daily habits
✅ Join groups
✅ Complete challenges
✅ Compete with friends
✅ Get motivation

<b>Need help?</b>
Visit: ${process.env.FRONTEND_URL || 'https://habithero.app'}
      `;

      await ctx.replyWithHTML(helpText);
    });
  }

  private setupActions() {
    // Callback query handlers
    this.bot.action('verify_start', async (ctx) => {
      try {
        if (!ctx.user) {
          await ctx.answerCbQuery('❌ User not found', { show_alert: true });
          return;
        }

        const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
        const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${user?.verificationToken}`;

        await ctx.answerCbQuery('Opening verification link...', { show_alert: false });
        await ctx.editMessageText(`
🔐 <b>Click the link below to verify:</b>
        `, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Verify Now', url: verificationLink }],
            ],
          },
          parse_mode: 'HTML',
        });
      } catch (error) {
        console.error('Verify action error:', error);
        await ctx.answerCbQuery('❌ Error', { show_alert: true });
      }
    });
  }

  async launch() {
    const webhook = process.env.TELEGRAM_WEBHOOK_URL;

    if (webhook) {
      // Webhook mode for production
      await this.bot.telegram.setWebhook(`${webhook}/api/telegram/webhook/${process.env.TELEGRAM_BOT_TOKEN}`);
      console.log('🌐 Telegram bot webhook set');
    } else {
      // Polling mode for development
      await this.bot.launch();
      console.log('🔄 Telegram bot polling started');
    }
  }

  async stop() {
    await this.bot.stop();
  }

  async sendMessage(telegramId: string, message: string, options?: any) {
    try {
      await this.bot.telegram.sendMessage(Number(telegramId), message, options);
    } catch (error) {
      console.error('Send message error:', error);
    }
  }

  async sendNotification(userId: string, message: string) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await this.sendMessage(user.telegramId, `🔔 ${message}`);
      }
    } catch (error) {
      console.error('Send notification error:', error);
    }
  }

  getBot() {
    return this.bot;
  }
}

