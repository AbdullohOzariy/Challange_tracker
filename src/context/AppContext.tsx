import React, { createContext, useState, useCallback, ReactNode } from 'react';

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
  tasks: any[];
}

export interface AppContextType {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Groups state
  groups: Group[];
  setGroups: (groups: Group[]) => void;
  currentGroupId: string | null;
  setCurrentGroupId: (id: string | null) => void;

  // Challenges state
  challenges: Challenge[];
  setChallenges: (challenges: Challenge[]) => void;

  // Loading & Error state
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Helper functions
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setGroups([]);
    setCurrentGroupId(null);
    setChallenges([]);
  }, []);

  const value: AppContextType = {
    user,
    setUser,
    groups,
    setGroups,
    currentGroupId,
    setCurrentGroupId,
    challenges,
    setChallenges,
    loading,
    setLoading,
    error,
    setError,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
