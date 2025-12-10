import { Router } from 'express';
import { z } from 'zod';
import { prisma, bot } from '../index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Schemas
const CompleteTaskSchema = z.object({
  taskId: z.string(),
  challengeId: z.string(),
  proofUrl: z.string().optional(),
  notes: z.string().optional(),
});

// Complete task
router.post('/complete', authMiddleware, async (req: AuthRequest, res) => {
  const body = CompleteTaskSchema.parse(req.body);

  try {
    // Get challenge and validate membership
    const challenge = await prisma.challenge.findUnique({
      where: { id: body.challengeId },
    });

    if (!challenge) {
      throw new AppError(404, 'Challenge not found');
    }

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

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id: body.taskId },
    });

    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    // Check if already completed
    const existingCompletion = await prisma.taskCompletion.findUnique({
      where: {
        taskId_memberId: {
          taskId: body.taskId,
          memberId: membership.id,
        },
      },
    });

    if (existingCompletion) {
      throw new AppError(400, 'Task already completed by this user');
    }

    // Create completion
    const completion = await prisma.taskCompletion.create({
      data: {
        taskId: body.taskId,
        challengeId: body.challengeId,
        memberId: membership.id,
        userId: req.user!.id,
        proofUrl: body.proofUrl,
        notes: body.notes,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        groupId: challenge.groupId,
        challengeId: body.challengeId,
        memberId: membership.id,
        action: 'task_completed',
        description: `${membership.displayName} completed: ${task.title}`,
      },
    });

    // Send notification to group members
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId: challenge.groupId },
      include: { user: true },
    });

    for (const member of groupMembers) {
      if (member.userId !== req.user!.id) {
        try {
          await bot.sendNotification(
            member.userId,
            `${membership.displayName} completed "${task.title}" in "${challenge.title}"!`
          );
        } catch (error) {
          console.error('Notification error:', error);
        }
      }
    }

    res.status(201).json({
      message: 'Task completed',
      completion,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Complete task error:', error);
    throw new AppError(500, 'Failed to complete task');
  }
});

// Get user's completions for challenge
router.get('/challenge/:challengeId/my-completions', authMiddleware, async (req: AuthRequest, res) => {
  const { challengeId } = req.params;

  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new AppError(404, 'Challenge not found');
    }

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

    const completions = await prisma.taskCompletion.findMany({
      where: {
        challengeId,
        memberId: membership.id,
      },
      include: {
        task: true,
      },
    });

    res.json({ completions });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Get completions error:', error);
    throw new AppError(500, 'Failed to get completions');
  }
});

// Get all completions for a task
router.get('/task/:taskId/completions', authMiddleware, async (req: AuthRequest, res) => {
  const { taskId } = req.params;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { challenge: true },
    });

    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: task.challenge.groupId,
          userId: req.user!.id,
        },
      },
    });

    if (!membership) {
      throw new AppError(403, 'Not a member of this group');
    }

    const completions = await prisma.taskCompletion.findMany({
      where: { taskId },
      include: {
        member: {
          select: {
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    res.json({ completions });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Get task completions error:', error);
    throw new AppError(500, 'Failed to get completions');
  }
});

// Undo task completion
router.delete('/completions/:completionId', authMiddleware, async (req: AuthRequest, res) => {
  const { completionId } = req.params;

  try {
    const completion = await prisma.taskCompletion.findUnique({
      where: { id: completionId },
      include: {
        member: true,
        task: {
          include: {
            challenge: true,
          },
        },
      },
    });

    if (!completion) {
      throw new AppError(404, 'Completion not found');
    }

    // Check if user is the one who completed or is admin
    if (completion.member.userId !== req.user!.id) {
      throw new AppError(403, 'Can only delete your own completions');
    }

    await prisma.taskCompletion.delete({
      where: { id: completionId },
    });

    res.json({ message: 'Completion deleted' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Delete completion error:', error);
    throw new AppError(500, 'Failed to delete completion');
  }
});

export default router;
