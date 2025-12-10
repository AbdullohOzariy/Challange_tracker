import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('API Base URL:', API_BASE_URL); // Debugging log

class APIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      this.setAuthToken(this.token);
    }

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.response?.status, error.config?.url); // Debugging log
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearAuth();
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem('auth_token');
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Auth Endpoints
  async verifyCode(data: { code: string; telegramId: string }) {
    const response = await this.client.post('/auth/verify-code', data);
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response;
  }

  async getCurrentUser() {
    return this.client.get('/auth/me');
  }

  async updateProfile(data: {
    email?: string;
    firstName?: string;
    lastName?: string;
  }) {
    return this.client.put('/auth/profile', data);
  }

  // Groups Endpoints
  async createGroup(data: {
    name: string;
    description?: string;
    icon?: string;
    theme?: string;
    penaltyConfig?: {
      threshold: number;
      description: string;
    };
  }) {
    return this.client.post('/groups', data);
  }

  async getGroups() {
    return this.client.get('/groups');
  }

  async getGroup(groupId: string) {
    return this.client.get(`/groups/${groupId}`);
  }

  async updateGroup(groupId: string, data: any) {
    return this.client.put(`/groups/${groupId}`, data);
  }

  async addGroupMember(groupId: string, data: {
    userId: string;
    displayName: string;
    avatar?: string;
  }) {
    return this.client.post(`/groups/${groupId}/members`, data);
  }

  async getGroupMembers(groupId: string) {
    return this.client.get(`/groups/${groupId}/members`);
  }

  // Challenges Endpoints
  async createChallenge(data: any) {
    return this.client.post('/challenges', data);
  }

  async getChallenges(groupId: string) {
    return this.client.get(`/challenges/group/${groupId}`);
  }

  async getChallenge(challengeId: string) {
    return this.client.get(`/challenges/${challengeId}`);
  }

  async updateChallenge(challengeId: string, data: any) {
    return this.client.put(`/challenges/${challengeId}`, data);
  }

  async deleteChallenge(challengeId: string) {
    return this.client.delete(`/challenges/${challengeId}`);
  }

  // Tasks Endpoints
  async completeTask(data: {
    taskId: string;
    challengeId: string;
    proofUrl?: string;
    notes?: string;
  }) {
    return this.client.post('/tasks/complete', data);
  }

  async getMyCompletions(challengeId: string) {
    return this.client.get(`/tasks/challenge/${challengeId}/my-completions`);
  }

  async getTaskCompletions(taskId: string) {
    return this.client.get(`/tasks/task/${taskId}/completions`);
  }

  async undoTaskCompletion(completionId: string) {
    return this.client.delete(`/tasks/completions/${completionId}`);
  }

  // Analytics Endpoints
  async getGroupStats(groupId: string) {
    return this.client.get(`/analytics/group/${groupId}`);
  }

  async getUserStats() {
    return this.client.get('/analytics/user/stats');
  }

  async getActivityLog(groupId: string, limit = 50, offset = 0) {
    return this.client.get(
      `/analytics/group/${groupId}/activity?limit=${limit}&offset=${offset}`
    );
  }

  async getChallengeProgress(challengeId: string) {
    return this.client.get(`/analytics/challenge/${challengeId}/progress`);
  }
}

export const apiClient = new APIClient();

// Export types for use in components
export interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
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
  completions: TaskCompletion[];
}

export interface TaskCompletion {
  id: string;
  memberId: string;
  completedAt: string;
  proofUrl?: string;
  notes?: string;
}

export interface GroupMember {
  id: string;
  displayName: string;
  avatar?: string;
  tasksCompleted?: number;
  strikes?: number;
  penaltiesPaid?: number;
  completionRate?: number;
}
