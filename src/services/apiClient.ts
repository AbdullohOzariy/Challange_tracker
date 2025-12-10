import axios, { AxiosInstance } from 'axios';

// Use environment variable if available, fallback to Railway backend URL placeholder
const API_BASE_URL = typeof process !== 'undefined' && process.env.VITE_API_URL
  ? process.env.VITE_API_URL
  : 'https://backend-production-91af8.up.railway.app/api';

class APIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000, // 10s timeout to avoid hanging during network issues
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add simple request logging for debugging in deployed env
    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        // avoid leaking in server logs
        // eslint-disable-next-line no-console
        console.debug('[API Request]', config.method?.toUpperCase(), config.url);
      }
      return config;
    });

    // Only attempt to access window/localStorage in browser
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        this.token = window.localStorage.getItem('auth_token');
        if (this.token) {
          this.setAuthToken(this.token);
        }
      } catch (e) {
        // Ignore localStorage errors in restricted environments
        console.warn('localStorage unavailable:', e);
      }
    }

    // Add response interceptor for error handling (safe - will run in browser runtime)
    this.client.interceptors.response.use(
      response => {
        if (typeof window !== 'undefined') {
          console.debug('[API Response]', response.config.url, response.status);
        }
        return response;
      },
      (error: any) => {
        // Protect access to window during server-side builds
        const status = error?.response?.status;
        const url = error?.config?.url;
        if (typeof window !== 'undefined') {
          console.error('API Error:', status, url, error?.message);
          if (status === 401) {
            this.clearAuth();
            // Redirect to home/login
            try { window.location.href = '/'; } catch (_) {}
          }
        } else {
          // Log server-side
          console.error('API Error (server):', status, url, error?.message);
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined' && window.localStorage) {
      try { window.localStorage.setItem('auth_token', token); } catch (e) { /* ignore */ }
    }
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuth() {
    this.token = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      try { window.localStorage.removeItem('auth_token'); } catch (e) { /* ignore */ }
    }
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Auth Endpoints
  async verifyCode(data: { code: string; telegramId: string }) {
    const response = await this.client.post('/auth/verify-code', data);
    if (response.data?.token) {
      this.setAuthToken(response.data.token);
    }
    return response;
  }

  async getCurrentUser() {
    return this.client.get('/auth/me');
  }

  async updateProfile(data: { email?: string; firstName?: string; lastName?: string; }) {
    return this.client.put('/auth/profile', data);
  }

  // Groups
  async createGroup(data: any) { return this.client.post('/groups', data); }
  async getGroups() { return this.client.get('/groups'); }
  async getGroup(groupId: string) { return this.client.get(`/groups/${groupId}`); }
  async updateGroup(groupId: string, data: any) { return this.client.put(`/groups/${groupId}`, data); }
  async addGroupMember(groupId: string, data: any) { return this.client.post(`/groups/${groupId}/members`, data); }
  async getGroupMembers(groupId: string) { return this.client.get(`/groups/${groupId}/members`); }

  // Challenges
  async createChallenge(data: any) { return this.client.post('/challenges', data); }
  async getChallenges(groupId: string) { return this.client.get(`/challenges/group/${groupId}`); }
  async getChallenge(challengeId: string) { return this.client.get(`/challenges/${challengeId}`); }
  async updateChallenge(challengeId: string, data: any) { return this.client.put(`/challenges/${challengeId}`, data); }
  async deleteChallenge(challengeId: string) { return this.client.delete(`/challenges/${challengeId}`); }

  // Tasks
  async completeTask(data: any) { return this.client.post('/tasks/complete', data); }
  async getMyCompletions(challengeId: string) { return this.client.get(`/tasks/challenge/${challengeId}/my-completions`); }
  async getTaskCompletions(taskId: string) { return this.client.get(`/tasks/task/${taskId}/completions`); }
  async undoTaskCompletion(completionId: string) { return this.client.delete(`/tasks/completions/${completionId}`); }

  // Analytics
  async getGroupStats(groupId: string) { return this.client.get(`/analytics/group/${groupId}`); }
  async getUserStats() { return this.client.get('/analytics/user/stats'); }
  async getActivityLog(groupId: string, limit = 50, offset = 0) { return this.client.get(`/analytics/group/${groupId}/activity?limit=${limit}&offset=${offset}`); }
  async getChallengeProgress(challengeId: string) { return this.client.get(`/analytics/challenge/${challengeId}/progress`); }
}

export const apiClient = new APIClient();

export type { APIClient };
