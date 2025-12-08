import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getDayNumber } from '../utils/token.js';

const router = Router();

// Schemas
const CreateChallengeSchema = z.object({
  groupId: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.enum(['FITNESS', 'LEARNING', 'MINDFULNESS', 'PRODUCTIVITY', 'HEALTH', 'OTHER']),
  startDate: z.string().datetime(),
  durationDays: z.number().min(1).max(365),
  color: z.string().optional().default('indigo'),
  mode: z.enum(['solo', 'duo']).optional().default('solo'),
  deadlineTime: z.string().optional(), // HH:MM
  frequency: z.enum(['daily', '2days', '3days', 'weekly', 'weekdays', 'custom']).optional().default('daily'),
  customFrequencyDays: z.number().optional(),
  tasks: z.array(z.object({
    dayNumber: z.number(),
    title: z.string(),
    description: z.string().optional(),
  })),
});

// Create challenge
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const body = CreateChallengeSchema.parse(req.body);

  try {
    // Check if user is member of group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: body.groupId,
          userId: req.user!.id,
        },
      },
    });

    if (!membership) {
      throw new AppError(403, 'Not a member of this group');
    }

    // Create challenge with tasks
    const challenge = await prisma.challenge.create({
      data: {
        groupId: body.groupId,
        title: body.title,
        description: body.description,
        category: body.category,
        startDate: new Date(body.startDate),
        durationDays: body.durationDays,
        color: body.color,
        mode: body.mode,
        deadlineTime: body.deadlineTime,
        frequency: body.frequency,
        customFrequencyDays: body.customFrequencyDays,
        status: 'active',
        tasks: {
          create: body.tasks.map(task => ({
            dayNumber: task.dayNumber,
            title: task.title,
            description: task.description,
          })),
        },
      },
      include: {
        tasks: true,
      },
    });

    res.status(201).json({
      message: 'Challenge created',
      challenge: {
        id: challenge.id,
        title: challenge.title,
        durationDays: challenge.durationDays,
        taskCount: challenge.tasks.length,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Create challenge error:', error);
    throw new AppError(500, 'Failed to create challenge');
  }
});

// Get challenges for group
router.get('/group/:groupId', authMiddleware, async (req: AuthRequest, res) => {
  const { groupId } = req.params;

  try {
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user!.id,
        },
      },
    });

    if (!membership) {
      throw new AppError(403, 'Not a member of this group');
    }

    const challenges = await prisma.challenge.findMany({
      where: { groupId },
      include: {
        tasks: {
          include: {
            completions: {
              select: {
                memberId: true,
                completedAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ challenges });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Get challenges error:', error);
    throw new AppError(500, 'Failed to get challenges');
  }
});

// Get challenge details
router.get('/:challengeId', authMiddleware, async (req: AuthRequest, res) => {
  const { challengeId } = req.params;

  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        group: true,
        tasks: {
          include: {
            completions: {
              include: {
                member: true,
              },
            },
          },
        },
      },
    });

    if (!challenge) {
      throw new AppError(404, 'Challenge not found');
    }

    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: challenge.groupId,
          userId: req.user!.id,
        },
      },
    });

    if (!membership) {
      throw new AppError(403, 'Not a member of this group');
    }

    res.json({ challenge });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Get challenge error:', error);
    throw new AppError(500, 'Failed to get challenge');
  }
});

// Update challenge
router.put('/:challengeId', authMiddleware, async (req: AuthRequest, res) => {
  const { challengeId } = req.params;
  const { title, description, status, deadlineTime } = req.body;

  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new AppError(404, 'Challenge not found');
    }

    // Check if user is member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: challenge.groupId,
          userId: req.user!.id,
        },
      },
    });

    if (!membership) {
      throw new AppError(403, 'Not a member of this group');
    }

    const updated = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        title: title || undefined,
        description: description || undefined,
        status: status || undefined,
        deadlineTime: deadlineTime || undefined,
      },
    });

    res.json({ message: 'Challenge updated', challenge: updated });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Update challenge error:', error);
    throw new AppError(500, 'Failed to update challenge');
  }
});

// Delete challenge
router.delete('/:challengeId', authMiddleware, async (req: AuthRequest, res) => {
  const { challengeId } = req.params;

  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new AppError(404, 'Challenge not found');
    }

    // Check if user is member
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: challenge.groupId,
          userId: req.user!.id,
        },
      },
    });

    if (!membership) {
      throw new AppError(403, 'Not a member of this group');
    }

    await prisma.challenge.delete({
      where: { id: challengeId },
    });

    res.json({ message: 'Challenge deleted' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Delete challenge error:', error);
    throw new AppError(500, 'Failed to delete challenge');
  }
});

export default router;

