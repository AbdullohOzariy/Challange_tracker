import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateVerificationToken } from '../utils/token.js';

const router = Router();

// Telegram Login Schema
const TelegramLoginSchema = z.object({
  telegramId: z.string(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  photoUrl: z.string().optional(),
});

// Verification Token Schema
const VerificationSchema = z.object({
  token: z.string(),
  email: z.string().email(),
});

// Login with Telegram
router.post('/telegram-login', async (req: Request, res: Response) => {
  const body = TelegramLoginSchema.parse(req.body);

  try {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId: body.telegramId },
    });

    if (!user) {
      // Create new user
      const verificationToken = generateVerificationToken();
      user = await prisma.user.create({
        data: {
          telegramId: body.telegramId,
          username: body.username,
          firstName: body.firstName,
          lastName: body.lastName,
          photoUrl: body.photoUrl,
          globalUserId: body.telegramId,
          verificationToken,
          verificationSentAt: new Date(),
        },
      });
    }

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
        isVerified: user.isVerified,
        globalUserId: user.globalUserId,
      },
    });
  } catch (error) {
    console.error('Telegram login error:', error);
    throw new AppError(500, 'Login failed');
  }
});

// Verify Email
router.post('/verify-email', async (req: Request, res: Response) => {
  const body = VerificationSchema.parse(req.body);

  try {
    const verification = await prisma.telegramVerification.findUnique({
      where: { token: body.token },
    });

    if (!verification) {
      throw new AppError(400, 'Invalid verification token');
    }

    if (new Date() > verification.expiresAt) {
      throw new AppError(400, 'Verification token expired');
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: verification.userId },
      data: {
        isVerified: true,
        verificationToken: null,
        email: body.email,
      },
    });

    // Mark verification as completed
    await prisma.telegramVerification.update({
      where: { id: verification.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    res.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        isVerified: user.isVerified,
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

// utils
interface JwtPayload  {
  userId: string;
  telegramId: string;
}
