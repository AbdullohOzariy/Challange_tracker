export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isVerified: boolean;
  globalUserId: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  theme?: string;
  memberCount: number;
  activeChallenges: number;
  createdAt: string;
}

export interface Challenge {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  category: string;
  startDate: string;
  durationDays: number;
  status: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  completed: boolean;
}

export interface GroupMember {
  id: string;
  displayName: string;
  avatar?: string;
  tasksCompleted?: number;
  strikes?: number;
}

export enum ChallengeCategory {
  FITNESS = 'FITNESS',
  LEARNING = 'LEARNING',
  MINDFULNESS = 'MINDFULNESS',
  PRODUCTIVITY = 'PRODUCTIVITY',
  HEALTH = 'HEALTH',
  OTHER = 'OTHER',
}

