import { Router } from 'express';
import { prisma } from '../index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Get group statistics
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

    // Get group with all data
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            taskCompletions: true,
          },
        },
        challenges: {
          include: {
            tasks: {
              include: {
                completions: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    // Calculate statistics
    let totalTasks = 0;
    let completedTasks = 0;

    const memberStats = group.members.map(member => {
      let memberCompleted = 0;

      group.challenges.forEach(challenge => {
        challenge.tasks.forEach(task => {
          totalTasks++;
          if (task.completions.some(c => c.memberId === member.id)) {
            completedTasks++;
            memberCompleted++;
          }
        });
      });

      return {
        id: member.id,
        displayName: member.displayName,
        avatar: member.avatar,
        tasksCompleted: memberCompleted,
        strikes: member.strikes,
        penaltiesPaid: member.penaltiesPaid,
        completionRate: Math.round((memberCompleted / (group.challenges.length * 7)) * 100) || 0, // 7 days average
      };
    });

    // Sort by completion rate
    memberStats.sort((a, b) => b.tasksCompleted - a.tasksCompleted);

    res.json({
      stats: {
        totalMembers: group.members.length,
        totalChallenges: group.challenges.length,
        activeChallenges: group.challenges.filter(c => c.status === 'active').length,
        totalTasks: totalTasks / group.members.length || 0,
        completedTasks,
        completionRate: Math.round((completedTasks / totalTasks) * 100) || 0,
      },
      leaderboard: memberStats,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Get group stats error:', error);
    throw new AppError(500, 'Failed to get group statistics');
  }
});

// Get user statistics
router.get('/user/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        groupMemberships: {
          include: {
            group: {
              include: {
                challenges: true,
              },
            },
            taskCompletions: true,
          },
        },
        taskCompletions: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Calculate personal stats
    let totalCompleted = 0;
    let totalStrikes = 0;
    const groupStats = user.groupMemberships.map(membership => {
      const groupCompleted = membership.taskCompletions.length;
      totalCompleted += groupCompleted;
      totalStrikes += membership.strikes;

      return {
        groupId: membership.group.id,
        groupName: membership.group.name,
        tasksCompleted: groupCompleted,
        activeChallenges: membership.group.challenges.filter(c => c.status === 'active').length,
        strikes: membership.strikes,
      };
    });

    res.json({
      stats: {
        username: user.username,
        firstName: user.firstName,
        totalGroups: user.groupMemberships.length,
        totalTasksCompleted: totalCompleted,
        totalStrikes: totalStrikes,
        isVerified: user.isVerified,
      },
      groups: groupStats,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Get user stats error:', error);
    throw new AppError(500, 'Failed to get user statistics');
  }
});

// Get activity log for group
router.get('/group/:groupId/activity', authMiddleware, async (req: AuthRequest, res) => {
  const { groupId } = req.params;
  const { limit = '50', offset = '0' } = req.query;

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

    const activities = await prisma.activityLog.findMany({
      where: { groupId },
      include: {
        challenge: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.activityLog.count({
      where: { groupId },
    });

    res.json({
      activities,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Get activity log error:', error);
    throw new AppError(500, 'Failed to get activity log');
  }
});

// Get challenge progress
router.get('/challenge/:challengeId/progress', authMiddleware, async (req: AuthRequest, res) => {
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
                member: {
                  select: {
                    displayName: true,
                    avatar: true,
                  },
                },
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

    // Calculate progress
    const taskProgress = challenge.tasks.map(task => ({
      dayNumber: task.dayNumber,
      title: task.title,
      completions: task.completions.map(c => ({
        member: c.member.displayName,
        completedAt: c.completedAt,
      })),
      completionCount: task.completions.length,
      completedBy: task.completions.map(c => c.member.displayName),
    }));

    const totalCompleted = challenge.tasks.reduce((sum, task) => sum + task.completions.length, 0);
    const completionPercentage = Math.round(
      (totalCompleted / (challenge.tasks.length * challenge.group.members.length)) * 100
    ) || 0;

    res.json({
      challenge: {
        id: challenge.id,
        title: challenge.title,
        category: challenge.category,
        startDate: challenge.startDate,
        durationDays: challenge.durationDays,
        status: challenge.status,
      },
      progress: {
        completedTasks: totalCompleted,
        totalPossibleCompletions: challenge.tasks.length * challenge.group.members.length,
        completionPercentage,
        taskProgress,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Get challenge progress error:', error);
    throw new AppError(500, 'Failed to get challenge progress');
  }
});

export default router;

