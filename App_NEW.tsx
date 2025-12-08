import React, { useState, useEffect } from 'react';
import { apiClient } from './services/apiClient';
import { IconLogOut, IconPlus, IconUsers } from './components/Icons';

interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
}

interface Group {
  id: string;
  name: string;
  icon?: string;
  memberCount: number;
  activeChallenges: number;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await apiClient.getCurrentUser();
          setUser(response.data.user);

          // Load groups
          const groupsResponse = await apiClient.getGroups();
          setGroups(groupsResponse.data.groups);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle Telegram login (simplified - would use Telegram SDK in production)
  const handleTelegramLogin = async () => {
    try {
      setError(null);
      // In production, this would use Telegram Login Widget
      // For now, show instructions
      alert('Open Telegram and search for your bot name\nThen send /start command');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  // Logout
  const handleLogout = () => {
    apiClient.clearAuth();
    setUser(null);
    setGroups([]);
    setCurrentGroupId(null);
  };

  // Create new group
  const handleCreateGroup = async () => {
    const name = prompt('Enter group name:');
    if (!name) return;

    try {
      setError(null);
      const response = await apiClient.createGroup({
        name,
        icon: '✨',
        theme: 'indigo',
      });

      // Reload groups
      const groupsResponse = await apiClient.getGroups();
      setGroups(groupsResponse.data.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/80 backdrop-blur border border-slate-700 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-2">
              HabitHero
            </h1>
            <p className="text-slate-400">Build better habits together</p>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleTelegramLogin}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            🤖 Login with Telegram Bot
          </button>

          <p className="text-slate-400 text-xs text-center mt-6">
            Find our Telegram bot and send /start to login
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              HabitHero
            </h1>
            <p className="text-sm text-slate-400">
              Welcome, {user.firstName || user.username || 'User'}! 👋
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleCreateGroup}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
            >
              <IconPlus className="w-5 h-5" />
              New Group
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-900/30 hover:bg-red-900/50 text-red-400 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
            >
              <IconLogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="text-center py-12">
            <IconUsers className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-300 mb-2">No Groups Yet</h2>
            <p className="text-slate-400 mb-6">Create your first group to get started!</p>
            <button
              onClick={handleCreateGroup}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => setCurrentGroupId(group.id)}
                className={`bg-slate-800/50 backdrop-blur border ${
                  currentGroupId === group.id ? 'border-indigo-500' : 'border-slate-700'
                } rounded-xl p-6 cursor-pointer hover:border-indigo-500 transition-all transform hover:scale-105`}
              >
                <div className="text-4xl mb-3">{group.icon || '✨'}</div>
                <h3 className="text-xl font-bold text-slate-200 mb-2">{group.name}</h3>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>👥 {group.memberCount} members</span>
                  <span>🔥 {group.activeChallenges} active</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentGroupId && (
          <div className="mt-8 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-200 mb-4">Group Details</h2>
            <p className="text-slate-400">Group ID: {currentGroupId}</p>
            <p className="text-slate-400 text-sm mt-4">
              ℹ️ Full group management coming soon in expanded views
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>HabitHero © 2025 • Build better habits together</p>
        </div>
      </footer>
    </div>
  );
};

export default App;

