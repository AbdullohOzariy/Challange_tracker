// Types from the Frontend design layer that extend main `src/types.ts` without conflicting.

export enum FChallengeCategory {
  FITNESS = 'Fitness',
  LEARNING = 'Learning',
  MINDFULNESS = 'Mindfulness',
  PRODUCTIVITY = 'Productivity',
  HEALTH = 'Health',
  OTHER = 'Other',
}

export interface FDayTask {
  dayNumber: number;
  title: string;
  description?: string;
  isCompleted?: boolean;
  completedBy?: string[];
}

export interface FChallenge {
  id: string;
  groupId: string;
  title: string;
  description: string;
  category: FChallengeCategory;
  startDate: string;
  durationDays: number;
  tasks: FDayTask[];
  color?: string;
  createdAt?: number;
  mode?: 'solo' | 'duo';
  status?: 'setup' | 'active';
}

export interface FGroupMember {
  userId: string;
  displayName: string;
  avatar: string;
  role?: 'admin' | 'member';
  joinedAt?: number;
}

export interface FGroup {
  id: string;
  name: string;
  icon?: string;
  theme?: string;
  members: FGroupMember[];
  challenges: FChallenge[];
  createdAt?: number;
}

