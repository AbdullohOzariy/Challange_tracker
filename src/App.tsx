import React, { useEffect, useState } from 'react';
import { apiClient } from './services/apiClient';
import { useAppContext } from './context/AppContext';
import { IconLogOut, IconPlus, IconUsers } from './components/Icons';
import CreateGroupModal from './components/CreateGroupModal';

const App: React.FC = () => {
  const { user, setUser, groups, setGroups, loading, setLoading, error, setError, currentGroupId, setCurrentGroupId, logout } = useAppContext();
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [loginCode, setLoginCode] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [groupDetails, setGroupDetails] = useState<any | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Check for existing token
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          setLoading(true);
          const response = await apiClient.getCurrentUser();
          setUser(response.data.user);
          const groupsResponse = await apiClient.getGroups();
          setGroups(groupsResponse.data.groups);
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('auth_token');
        } finally {
          setLoading(false);
        }
      }
    };
    checkAuth();
  }, [setUser, setGroups, setLoading]);

  // Handle Telegram login (redirect to bot)
  const handleTelegramLogin = () => {
    const botUsername = "tekshiruv_verfbot";
    window.open(`https://t.me/${botUsername}`, '_blank');
    setShowCodeInput(true);
  };

  // Handle code submission
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginCode || !telegramId) {
      setError("Telegram ID and code are required.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.verifyCode({ code: loginCode, telegramId });
      localStorage.setItem('auth_token', response.data.token);
      setUser(response.data.user);

      // Clear fields and hide input
      setShowCodeInput(false);
      setLoginCode('');
      setTelegramId('');

      // Reload groups after successful login
      const groupsResponse = await apiClient.getGroups();
      setGroups(groupsResponse.data.groups);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Invalid code or Telegram ID.');
    } finally {
      setLoading(false);
    }
  };

  // Request code from backend to send via bot
  const handleRequestCode = async () => {
    if (!telegramId) {
      setError('Please enter your Telegram ID to request the code');
      return;
    }
    try {
      setRequestingCode(true);
      setError(null);
      setInfoMessage(null);
      await apiClient.requestCode({ telegramId });
      setInfoMessage('Verification code sent — check your Telegram. It is valid for 1 minute.');
    } catch (err) {
      console.error('Request code failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to request code');
    } finally {
      setRequestingCode(false);
    }
  };

  // Create new group (from modal)
  const handleCreateGroupModal = async (payload: { name: string; icon?: string; theme?: string }) => {
    try {
      setCreatingGroup(true);
      setError(null);
      setLoading(true);

      const createResp = await apiClient.createGroup({
        name: payload.name,
        icon: payload.icon || '✨',
        theme: payload.theme || 'indigo',
      });

      // Refresh groups
      const groupsResponse = await apiClient.getGroups();
      setGroups(groupsResponse.data.groups || []);

      const createdGroup = createResp?.data?.group || (groupsResponse.data.groups[0] ?? null);
      if (createdGroup) setCurrentGroupId(createdGroup.id);

      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Create group failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create group');
      throw err;
    } finally {
      setCreatingGroup(false);
      setLoading(false);
    }
  };

  // Open group and load its details
  const openGroup = async (groupId: string) => {
    try {
      setGroupLoading(true);
      setError(null);
      setCurrentGroupId(groupId);
      const resp = await apiClient.getGroup(groupId);
      setGroupDetails(resp.data.group || resp.data || null);
    } catch (err) {
      console.error('Failed to load group details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load group');
      setGroupDetails(null);
    } finally {
      setGroupLoading(false);
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

          {!showCodeInput ? (
            <button
              onClick={handleTelegramLogin}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              🤖 Login with Telegram Bot
            </button>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  placeholder="Enter your Telegram ID"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={requestingCode}
                  className="px-3 py-3 rounded-xl bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600"
                >
                  {requestingCode ? 'Sending...' : 'Request code'}
                </button>
              </div>
              <input
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                placeholder="Enter 6-digit code from bot"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Verify
              </button>
              {infoMessage && (
                <div className="text-sm text-slate-300 mt-2">{infoMessage}</div>
              )}
              <p className="text-slate-400 text-xs text-center mt-6">
                Check your Telegram bot for the login code. You can get your Telegram ID from a bot like @userinfobot.
              </p>
            </form>
          )}
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
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
            >
              <IconPlus className="w-5 h-5" />
              New Group
            </button>

            <button
              onClick={logout}
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
                onClick={() => openGroup(group.id)}
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
          <div className="mt-8">
            {groupLoading ? (
              <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading group...</p>
              </div>
            ) : groupDetails ? (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-200 mb-2">{groupDetails.name}</h2>
                    <p className="text-slate-400 mb-4">{groupDetails.description || 'No description'}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>👥 {groupDetails.memberCount ?? groupDetails.members?.length ?? 0} members</span>
                      <span>🔥 {groupDetails.activeChallenges ?? groupDetails.challenges?.length ?? 0} active</span>
                      <span className="text-xs">ID: {groupDetails.id}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setCurrentGroupId(null); setGroupDetails(null); }} className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300">Back</button>
                  </div>
                </div>

                {/* Members */}
                <div className="mt-6">
                  <h3 className="text-sm text-slate-300 font-semibold mb-2">Members</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(groupDetails.members || []).map((m: any) => (
                      <div key={m.id} className="bg-slate-900/60 p-3 rounded-lg">
                        <div className="text-slate-200 font-medium">{m.displayName}</div>
                        <div className="text-xs text-slate-400">{m.user?.username || ''}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenges */}
                <div className="mt-6">
                  <h3 className="text-sm text-slate-300 font-semibold mb-2">Challenges</h3>
                  {(groupDetails.challenges || []).length === 0 ? (
                    <p className="text-slate-400 text-sm">No challenges yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(groupDetails.challenges || []).map((c: any) => (
                        <div key={c.id} className="bg-slate-900/60 p-3 rounded-lg">
                          <div className="text-slate-200 font-medium">{c.title}</div>
                          <div className="text-xs text-slate-400">{c.category} • {c.status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 text-center">
                <p className="text-slate-400">Group not found or failed to load.</p>
                <div className="mt-3">
                  <button onClick={() => { setCurrentGroupId(null); setGroupDetails(null); }} className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300">Back</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>HabitHero © 2025 • Build better habits together</p>
        </div>
      </footer>

      {/* Render create modal */}
      <CreateGroupModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onCreate={handleCreateGroupModal} loading={creatingGroup} />
    </div>
  );
};

export default App;
