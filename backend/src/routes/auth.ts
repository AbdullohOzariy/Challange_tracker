import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateVerificationToken } from '../utils/token.js';

const router = Router();

// Schemas
const VerificationSchema = z.object({
  code: z.string().length(6),
  telegramId: z.string(),
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

    // Check if token is expired (e.g., 5 minutes)
    const tokenAge = Date.now() - (user.verificationSentAt?.getTime() || 0);
    if (tokenAge > 5 * 60 * 1000) {
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
