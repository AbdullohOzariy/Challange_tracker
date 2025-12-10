import React, { useState, useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: { name: string; icon?: string; theme?: string }) => Promise<void>;
  loading?: boolean;
};

const CreateGroupModal: React.FC<Props> = ({ isOpen, onClose, onCreate, loading }) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('✨');
  const [theme, setTheme] = useState('indigo');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setIcon('✨');
      setTheme('indigo');
      setError(null);
    }
  }, [isOpen]);

  const validate = () => {
    if (!name.trim()) {
      setError('Group name is required');
      return false;
    }
    if (name.trim().length > 50) {
      setError('Group name must be at most 50 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!validate()) return;
    try {
      await onCreate({ name: name.trim(), icon, theme });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create group');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-slate-900 rounded-xl w-full max-w-md p-6 border border-slate-700">
        <h3 className="text-lg font-bold mb-2 text-slate-100">Create New Group</h3>
        <p className="text-sm text-slate-400 mb-4">Create a group to start challenges with friends.</p>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm">
            <span className="text-slate-300">Group name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Morning Runners"
              maxLength={50}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-slate-300">Icon</span>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="mt-1 block w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none"
                placeholder="Emoji or icon"
              />
            </label>

            <label className="text-sm">
              <span className="text-slate-300">Theme</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="mt-1 block w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none"
              >
                <option value="indigo">Indigo</option>
                <option value="purple">Purple</option>
                <option value="emerald">Emerald</option>
                <option value="rose">Rose</option>
              </select>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;

