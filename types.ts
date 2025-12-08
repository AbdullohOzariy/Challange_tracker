export enum ChallengeCategory {
  FITNESS = 'Fitness',
  LEARNING = 'Learning',
  MINDFULNESS = 'Mindfulness',
  PRODUCTIVITY = 'Productivity',
  HEALTH = 'Health',
  OTHER = 'Other'
}

export interface DayTask {
  dayNumber: number;
  title: string;
  description?: string;
  isCompleted?: boolean; // Deprecated: Kept for legacy support
  completedBy?: string[]; // New: Array of userIds who completed this task
}

export interface Challenge {
  id: string;
  groupId: string; // Links challenge to a specific group
  title: string;
  description: string;
  category: ChallengeCategory;
  startDate: string; // ISO Date string
  durationDays: number;
  tasks: DayTask[];
  color: string; // Hex or Tailwind class suffix
  createdAt: number;
  mode: 'solo' | 'duo';
  status?: 'setup' | 'active'; 
  deleteApprovals?: string[]; // List of userIds who approved deletion
  deadlineTime?: string; // HH:MM format (e.g., "22:00"). If null, no daily deadline.
  frequency?: 'daily' | '2days' | '3days' | 'weekly' | 'weekdays' | 'custom'; // Schedule frequency
  customFrequencyDays?: number; // Days interval for custom frequency
}

export interface GroupMember {
  userId: string; // Global ID of the user (browser session)
  displayName: string; // Name specific to this group
  avatar: string; // Emoji or URL specific to this group
  role: 'admin' | 'member'; // Kept for legacy compatibility, but functionally everyone is equal now
  joinedAt: number;
  strikes?: number; // Count of missed tasks manually assigned by group
  penaltiesPaid?: number; // Count of penalties fulfilled
}

export interface Group {
  id: string;
  name: string;
  icon: string; // Emoji
  theme?: string; // Color theme key (e.g. 'indigo', 'rose')
  members: GroupMember[];
  pendingRequests: GroupMember[]; // Users waiting for approval
  challenges: Challenge[]; // Challenges specific to this group
  createdAt: number;
  deleteApprovals?: string[]; // List of userIds who approved group deletion
  penaltyConfig?: {
    threshold: number; // e.g., Every 3 strikes
    description: string; // e.g., "Buy Coffee" or "50 Pushups"
  };
}