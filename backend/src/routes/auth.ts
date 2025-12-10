import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma, bot } from '../index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateVerificationToken } from '../utils/token.js';

const router = Router();

// Schemas
const VerificationSchema = z.object({
  code: z.string().length(6),
  telegramId: z.string(),
});

const RequestCodeSchema = z.object({
  telegramId: z.string(),
});

// Request code (frontend-triggered) - creates/sends a code to the given Telegram ID
router.post('/request-code', async (req: Request, res: Response) => {
  const body = RequestCodeSchema.parse(req.body);

  try {
    // Find or create user for this telegramId
    let user = await prisma.user.findUnique({ where: { telegramId: body.telegramId } });

    if (!user) {
      // create a lightweight user record so we can attach the token
      const verificationToken = generateVerificationToken();
      user = await prisma.user.create({
        data: {
          telegramId: body.telegramId,
          username: null,
          firstName: null,
          lastName: null,
          photoUrl: null,
          globalUserId: body.telegramId,
          verificationToken,
          verificationSentAt: new Date(),
        },
      });

      // send message via bot
      try {
        await bot.sendMessage(body.telegramId, `🔐 Your HabitHero login code is: ${verificationToken}\nThis code is valid for 1 minute.`);
      } catch (err) {
        console.error('Failed to send code via bot (new user):', err);
      }

      return res.json({ message: 'Verification code sent' });
    }

    // Update existing user with new code
    const verificationCode = generateVerificationToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: verificationCode, verificationSentAt: new Date() },
    });

    // Try to send via bot
    try {
      await bot.sendMessage(body.telegramId, `🔐 Your HabitHero login code is: ${verificationCode}\nThis code is valid for 1 minute.`);
    } catch (err) {
      console.error('Failed to send code via bot (existing user):', err);
      // Even if sending fails, respond success to avoid leaking info; frontend will show error if user doesn't receive code
    }

    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Request code error:', error);
    throw new AppError(500, 'Failed to request verification code');
  }
});

// Verify login code
router.post('/verify-code', async (req: Request, res: Response) => {
  const body = VerificationSchema.parse(req.body);

  try {
    const user = await prisma.user.findFirst({
      where: {
        telegramId: body.telegramId,
        verificationToken: body.code,
      },
    });

    if (!user) {
      throw new AppError(400, 'Invalid code or Telegram ID');
    }

    // Check if token is expired (1 minute = 60,000 ms)
    const tokenAge = Date.now() - (user.verificationSentAt?.getTime() || 0);
    if (tokenAge > 1 * 60 * 1000) {
      throw new AppError(400, 'Verification code expired. Please request a new one.');
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null, // Invalidate the token
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        telegramId: user.telegramId,
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        isVerified: true,
        globalUserId: user.globalUserId,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Verification error:', error);
    throw new AppError(500, 'Verification failed');
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        groupMemberships: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        email: user.email,
        isVerified: user.isVerified,
        globalUserId: user.globalUserId,
        groupCount: user.groupMemberships.length,
      },
      groups: user.groupMemberships.map(m => ({
        id: m.group.id,
        name: m.group.name,
        role: m.role,
        displayName: m.displayName,
      })),
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Get user error:', error);
    throw new AppError(500, 'Failed to get user');
  }
});

// Update profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { email, firstName, lastName } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        email: email || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      },
    });

    res.json({
      message: 'Profile updated',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    throw new AppError(500, 'Failed to update profile');
  }
});

export default router;
