# HabitHero - Refactoring & Implementation Guide

## 🎯 O'tkazish Reja (Step-by-Step)

### STEP 1: Environment Setup Tuzatish

```bash
# 1. .env.local faylni yangilash
echo "VITE_GEMINI_API_KEY=your_gemini_api_key_here" > .env.local

# 2. geminiService.ts ni tuzatish
```

**Befor:**
```typescript
const apiKey = process.env.API_KEY || '';
```

**After:**
```typescript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
```

---

### STEP 2: Hooks Directory Yaratish

```bash
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/components/views
mkdir -p src/components/modals
```

#### `src/hooks/useLocalStorage.ts`
```typescript
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
```

#### `src/hooks/useGroups.ts`
```typescript
import { useState, useCallback } from 'react';
import { Group } from '../types';
import { useLocalStorage } from './useLocalStorage';

const GROUPS_STORAGE_KEY = 'habit_hero_groups_v2';

export function useGroups() {
  const [groups, setGroups] = useLocalStorage<Group[]>(GROUPS_STORAGE_KEY, []);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  const addGroup = useCallback((group: Group) => {
    setGroups(prev => [...prev, group]);
  }, [setGroups]);

  const updateGroup = useCallback((groupId: string, updates: Partial<Group>) => {
    setGroups(prev =>
      prev.map(g => g.id === groupId ? { ...g, ...updates } : g)
    );
  }, [setGroups]);

  const deleteGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
  }, [setGroups]);

  const getCurrentGroup = useCallback((): Group | undefined => {
    return groups.find(g => g.id === currentGroupId);
  }, [groups, currentGroupId]);

  return {
    groups,
    currentGroupId,
    setCurrentGroupId,
    addGroup,
    updateGroup,
    deleteGroup,
    getCurrentGroup
  };
}
```

#### `src/hooks/useChallenges.ts`
```typescript
import { useCallback } from 'react';
import { Challenge, DayTask } from '../types';
import { useGroups } from './useGroups';

export function useChallenges() {
  const { groups, updateGroup } = useGroups();

  const addChallenge = useCallback((groupId: string, challenge: Challenge) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    updateGroup(groupId, {
      challenges: [...group.challenges, challenge]
    });
  }, [groups, updateGroup]);

  const updateChallenge = useCallback((groupId: string, challengeId: string, updates: Partial<Challenge>) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    updateGroup(groupId, {
      challenges: group.challenges.map(c =>
        c.id === challengeId ? { ...c, ...updates } : c
      )
    });
  }, [groups, updateGroup]);

  const deleteChallenge = useCallback((groupId: string, challengeId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    updateGroup(groupId, {
      challenges: group.challenges.filter(c => c.id !== challengeId)
    });
  }, [groups, updateGroup]);

  const completeTask = useCallback((groupId: string, challengeId: string, taskIndex: number, userId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const updatedChallenges = group.challenges.map(challenge => {
      if (challenge.id === challengeId) {
        const updatedTasks = challenge.tasks.map((task, idx) => {
          if (idx === taskIndex) {
            const completedBy = task.completedBy || [];
            if (!completedBy.includes(userId)) {
              completedBy.push(userId);
            }
            return { ...task, completedBy };
          }
          return task;
        });
        return { ...challenge, tasks: updatedTasks };
      }
      return challenge;
    });

    updateGroup(groupId, { challenges: updatedChallenges });
  }, [groups, updateGroup]);

  return {
    addChallenge,
    updateChallenge,
    deleteChallenge,
    completeTask
  };
}
```

---

### STEP 3: Validators Yaratish

#### `src/utils/validators.ts`
```typescript
import { Challenge, Group, GroupMember } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateChallenge(challenge: Partial<Challenge>): ValidationResult {
  const errors: string[] = [];

  if (!challenge.title?.trim()) {
    errors.push('Challenge title is required');
  }

  if (challenge.title && challenge.title.length > 100) {
    errors.push('Challenge title must be less than 100 characters');
  }

  if (!challenge.durationDays || challenge.durationDays < 1) {
    errors.push('Challenge duration must be at least 1 day');
  }

  if (challenge.durationDays && challenge.durationDays > 365) {
    errors.push('Challenge duration cannot exceed 365 days');
  }

  if (!challenge.tasks || challenge.tasks.length === 0) {
    errors.push('Challenge must have at least 1 task');
  }

  if (!challenge.startDate) {
    errors.push('Start date is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateGroup(group: Partial<Group>): ValidationResult {
  const errors: string[] = [];

  if (!group.name?.trim()) {
    errors.push('Group name is required');
  }

  if (group.name && group.name.length > 50) {
    errors.push('Group name must be less than 50 characters');
  }

  if (!group.members || group.members.length === 0) {
    errors.push('Group must have at least 1 member');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateGroupMember(member: Partial<GroupMember>): ValidationResult {
  const errors: string[] = [];

  if (!member.displayName?.trim()) {
    errors.push('Display name is required');
  }

  if (member.displayName && member.displayName.length > 30) {
    errors.push('Display name must be less than 30 characters');
  }

  if (!member.userId) {
    errors.push('User ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

---

### STEP 4: Utility Functions

#### `src/utils/dateHelpers.ts`
```typescript
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTaskDate(startDateStr: string, dayNumber: number): Date {
  const startDate = new Date(startDateStr);
  const taskDate = new Date(startDate);
  taskDate.setDate(startDate.getDate() + (dayNumber - 1));
  taskDate.setHours(0, 0, 0, 0);
  return taskDate;
}

export function isTaskForToday(startDateStr: string, dayNumber: number): boolean {
  const taskDate = getTaskDate(startDateStr, dayNumber);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return taskDate.getTime() === today.getTime();
}

export function isTaskInPast(startDateStr: string, dayNumber: number): boolean {
  const taskDate = getTaskDate(startDateStr, dayNumber);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return taskDate.getTime() < today.getTime();
}

export function formatFriendlyDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";

  return target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  });
}
```

#### `src/utils/idGenerator.ts`
```typescript
export function generateId(prefix: string = ''): string {
  const id = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${id}` : id;
}

export function generateGroupId(): string {
  return generateId('grp');
}

export function generateChallengeId(): string {
  return generateId('chl');
}

export function generateTaskId(): string {
  return generateId('tsk');
}
```

---

### STEP 5: Service Layer Refactoring

#### `src/services/geminiService.ts`
```typescript
interface MotivationResponse {
  text: string;
  error?: string;
  success: boolean;
}

export async function getMotivation(
  challengeTitle: string,
  progress: number
): Promise<MotivationResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      text: "Keep going! You're doing great!",
      error: 'API key not configured',
      success: false
    };
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Give me a short, punchy, 1-sentence motivational quote for someone who is ${progress}% through their "${challengeTitle}" challenge. Keep it under 15 words.`
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      text: text || "Consistency is key!",
      success: true
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      text: "You've got this! Keep pushing forward!",
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
  }
}
```

#### `src/services/backupService.ts`
```typescript
import { Group } from '../types';
import { getLocalDateString } from '../utils/dateHelpers';

interface BackupData {
  timestamp: string;
  version: string;
  data: Group[];
}

export function createBackup(groups: Group[]): BackupData {
  return {
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: groups
  };
}

export function downloadBackup(groups: Group[]): void {
  const backup = createBackup(groups);
  const backupJSON = JSON.stringify(backup, null, 2);
  
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(backupJSON)}`);
  element.setAttribute('download', `habithero-backup-${getLocalDateString()}.json`);
  element.style.display = 'none';
  
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function importBackup(backupJSON: string): BackupData | null {
  try {
    const backup = JSON.parse(backupJSON) as BackupData;
    
    if (!backup.data || !Array.isArray(backup.data)) {
      throw new Error('Invalid backup format');
    }

    return backup;
  } catch (error) {
    console.error('Error importing backup:', error);
    return null;
  }
}
```

---

### STEP 6: Analytics Service

#### `src/services/analyticsService.ts`
```typescript
import { Group, GroupMember } from '../types';

export interface GroupStats {
  totalChallenges: number;
  activeChallenges: number;
  completedTasks: number;
  totalTasks: number;
  memberStats: Map<string, MemberStats>;
}

export interface MemberStats {
  member: GroupMember;
  tasksCompleted: number;
  completionRate: number;
  streakDays: number;
}

export function calculateGroupStats(group: Group): GroupStats {
  const stats: GroupStats = {
    totalChallenges: group.challenges.length,
    activeChallenges: group.challenges.filter(c => c.status === 'active').length,
    completedTasks: 0,
    totalTasks: 0,
    memberStats: new Map()
  };

  // Initialize member stats
  group.members.forEach(member => {
    stats.memberStats.set(member.userId, {
      member,
      tasksCompleted: 0,
      completionRate: 0,
      streakDays: 0
    });
  });

  // Calculate stats
  group.challenges.forEach(challenge => {
    challenge.tasks.forEach(task => {
      stats.totalTasks++;

      if (task.completedBy && task.completedBy.length > 0) {
        stats.completedTasks += task.completedBy.length;

        task.completedBy.forEach(userId => {
          const memberStat = stats.memberStats.get(userId);
          if (memberStat) {
            memberStat.tasksCompleted++;
          }
        });
      }
    });
  });

  // Calculate completion rates
  stats.memberStats.forEach(memberStat => {
    if (stats.totalTasks > 0) {
      memberStat.completionRate = Math.round(
        (memberStat.tasksCompleted / stats.totalTasks) * 100
      );
    }
  });

  return stats;
}

export interface LeaderboardEntry {
  rank: number;
  member: GroupMember;
  score: number;
  tasksCompleted: number;
  completionRate: number;
}

export function getLeaderboard(group: Group): LeaderboardEntry[] {
  const stats = calculateGroupStats(group);
  
  const entries: LeaderboardEntry[] = Array.from(stats.memberStats.values()).map(
    (memberStat, index) => ({
      rank: index + 1,
      member: memberStat.member,
      score: memberStat.tasksCompleted * 10 + memberStat.completionRate,
      tasksCompleted: memberStat.tasksCompleted,
      completionRate: memberStat.completionRate
    })
  );

  // Sort by score descending
  entries.sort((a, b) => b.score - a.score);

  // Re-assign ranks based on sorted order
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return entries;
}
```

---

### STEP 7: File Structure After Refactoring

```
src/
├── App.tsx                 # Main app (reduced to ~300-400 lines)
├── index.tsx
├── index.html
├── types.ts
├── components/
│   ├── Icons.tsx
│   ├── ProgressBar.tsx
│   ├── Modal.tsx            # NEW: Reusable modal
│   ├── views/
│   │   ├── GroupView.tsx    # NEW
│   │   ├── ChallengeView.tsx # NEW
│   │   └── ProfileView.tsx   # NEW
│   └── modals/
│       ├── CreateGroupModal.tsx  # NEW
│       ├── CreateChallengeModal.tsx # NEW
│       ├── ActivityLogModal.tsx
│       └── PenaltyModal.tsx
├── hooks/
│   ├── useLocalStorage.ts    # NEW
│   ├── useGroups.ts          # NEW
│   └── useChallenges.ts      # NEW
├── services/
│   ├── geminiService.ts      # UPDATED
│   ├── backupService.ts      # NEW
│   └── analyticsService.ts   # NEW
└── utils/
    ├── validators.ts         # NEW
    ├── dateHelpers.ts        # NEW
    └── idGenerator.ts        # NEW
```

---

## 📋 Next Steps Checklist

- [ ] Create src directory
- [ ] Move existing files to src/
- [ ] Create hooks directory and files
- [ ] Create utils directory and files
- [ ] Create services directory with new files
- [ ] Update import paths in existing files
- [ ] Test all functionality
- [ ] Deploy to production

---

## 🚀 Package Install

```bash
npm install date-fns zod zustand
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

---

**Eslatma**: Hozir yo'nalish uchun TAHLIL_VA_TAKLIFLAR.md dokumentini o'qib chiqing.

