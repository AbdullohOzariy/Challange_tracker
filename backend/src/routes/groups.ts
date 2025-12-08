import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../index.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Schemas
const CreateGroupSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  icon: z.string().optional().default('✨'),
  theme: z.string().optional().default('indigo'),
  penaltyConfig: z.object({
    threshold: z.number().positive(),
    description: z.string(),
  }).optional(),
});

const UpdateGroupSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  theme: z.string().optional(),
  penaltyConfig: z.object({
    threshold: z.number().positive(),
    description: z.string(),
  }).optional(),
});

const AddMemberSchema = z.object({
  userId: z.string(),
  displayName: z.string().min(1).max(30),
  avatar: z.string().optional(),
});

// Create group
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const body = CreateGroupSchema.parse(req.body);

  try {
    const group = await prisma.group.create({
      data: {
        name: body.name,
        description: body.description,
        icon: body.icon,
        theme: body.theme,
        createdById: req.user!.id,
        members: {
          create: {
            userId: req.user!.id,
            displayName: 'You',
            role: 'admin',
          },
        },
        penaltyConfig: body.penaltyConfig ? {
          create: {
            threshold: body.penaltyConfig.threshold,
            description: body.penaltyConfig.description,
          },
        } : undefined,
      },
      include: {
        members: true,
        penaltyConfig: true,
      },
    });

    res.status(201).json({
      message: 'Group created',
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        icon: group.icon,
        theme: group.theme,
        memberCount: group.members.length,
      },
    });
  } catch (error) {
    console.error('Create group error:', error);
    throw new AppError(500, 'Failed to create group');
  }
});

// Get all groups for user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.user!.id },
      include: {
        group: {
          include: {
            members: true,
            challenges: {
              where: { status: 'active' },
            },
            penaltyConfig: true,
          },
        },
      },
    });

    const groups = memberships.map(m => ({
      id: m.group.id,
      name: m.group.name,
      description: m.group.description,
      icon: m.group.icon,
      theme: m.group.theme,
      role: m.role,
      displayName: m.displayName,
      memberCount: m.group.members.length,
      activeChallenges: m.group.challenges.length,
      createdAt: m.group.createdAt,
    }));

    res.json({ groups });
  } catch (error) {
    console.error('Get groups error:', error);
    throw new AppError(500, 'Failed to get groups');
  }
});

// Get group details
router.get('/:groupId', authMiddleware, async (req: AuthRequest, res) => {
  const { groupId } = req.params;

  try {
    // Check membership
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

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                username: true,
                firstName: true,
              },
            },
          },
        },
        challenges: true,
        penaltyConfig: true,
      },
    });

    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    res.json({ group });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Get group error:', error);
    throw new AppError(500, 'Failed to get group');
  }
});

// Update group
router.put('/:groupId', authMiddleware, async (req: AuthRequest, res) => {
  const { groupId } = req.params;
  const body = UpdateGroupSchema.parse(req.body);

  try {
    // Check if user is admin
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user!.id,
        },
      },
    });

    if (!membership || membership.role !== 'admin') {
      throw new AppError(403, 'Only admins can update group');
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: body.name,
        description: body.description,
        icon: body.icon,
        theme: body.theme,
        penaltyConfig: body.penaltyConfig ? {
          upsert: {
            create: {
              threshold: body.penaltyConfig.threshold,
              description: body.penaltyConfig.description,
            },
            update: {
              threshold: body.penaltyConfig.threshold,
              description: body.penaltyConfig.description,
            },
          },
        } : undefined,
      },
    });

    res.json({ message: 'Group updated', group });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Update group error:', error);
    throw new AppError(500, 'Failed to update group');
  }
});

// Add member to group
router.post('/:groupId/members', authMiddleware, async (req: AuthRequest, res) => {
  const { groupId } = req.params;
  const body = AddMemberSchema.parse(req.body);

  try {
    // Check if user is member
    const userMembership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user!.id,
        },
      },
    });

    if (!userMembership) {
      throw new AppError(403, 'Not a member of this group');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: body.userId },
    });

    if (!targetUser) {
      throw new AppError(404, 'User not found');
    }

    // Check if already member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: body.userId,
        },
      },
    });

    if (existingMember) {
      throw new AppError(400, 'User is already a member');
    }

    // Add member
    const member = await prisma.groupMember.create({
      data: {
        groupId,
        userId: body.userId,
        displayName: body.displayName,
        avatar: body.avatar,
      },
    });

    res.status(201).json({
      message: 'Member added',
      member,
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Add member error:', error);
    throw new AppError(500, 'Failed to add member');
  }
});

// Get group members
router.get('/:groupId/members', authMiddleware, async (req: AuthRequest, res) => {
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

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            photoUrl: true,
          },
        },
      },
    });

    res.json({ members });
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Get members error:', error);
    throw new AppError(500, 'Failed to get members');
  }
});

export default router;

