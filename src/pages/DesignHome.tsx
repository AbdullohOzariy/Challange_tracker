import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { GROUP_THEMES, renderGroupIcon } from '../ui/theme';
import ActivityLogModal from '../components/ActivityLogModal';
import ProgressBar from '../components/ProgressBar';
import { IconUsers, IconPlus } from '../components/Icons';

const DesignHome: React.FC = () => {
  const { groups, setCurrentGroupId, currentGroupId } = useAppContext();
  const [activeActivityGroup, setActiveActivityGroup] = useState<any | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100">Your Groups</h1>
          <p className="text-slate-400">Elegant dark UI from the Frontend design pack</p>
        </div>
        <div>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg flex items-center gap-2">
            <IconPlus className="w-5 h-5" /> New Group
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20">
          <IconUsers className="w-20 h-20 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-200">No Groups Yet</h3>
          <p className="text-slate-400 mt-2">Create a group to start challenges with friends.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((g: any) => {
            const theme = GROUP_THEMES[g.theme || 'indigo'] || GROUP_THEMES['indigo'];
            return (
              <div key={g.id} className={`rounded-2xl p-6 border ${currentGroupId === g.id ? 'border-indigo-500' : 'border-slate-700'} bg-slate-800/50`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-4xl mb-3">{renderGroupIcon(g.icon || '✨')}</div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">{g.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>👥 {g.memberCount} members</span>
                      <span>🔥 {g.activeChallenges} active</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <button onClick={() => setCurrentGroupId(g.id)} className="text-indigo-300 text-sm">Open</button>
                    <button onClick={() => setActiveActivityGroup(g)} className="text-slate-300 text-sm">Activity</button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-slate-400 text-sm mb-2">Progress</div>
                  <ProgressBar progress={Math.min(100, (g.activeChallenges || 0) * 10)} color="bg-indigo-500" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeActivityGroup && (
        <ActivityLogModal isOpen={!!activeActivityGroup} onClose={() => setActiveActivityGroup(null)} group={activeActivityGroup} />
      )}
    </div>
  );
};

export default DesignHome;

