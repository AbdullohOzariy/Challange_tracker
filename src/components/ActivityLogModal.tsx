import React, { useMemo, useState } from 'react';
import Modal from './Modal';
import { IconList, IconCheck, IconUsers, IconFlame } from './Icons';
import { formatFriendlyDate, getLocalDateString, getTaskDate } from '../ui/theme';

const ActivityLogModal: React.FC<{ isOpen: boolean; onClose: () => void; group: any }> = ({ isOpen, onClose, group }) => {
  const [filterMember, setFilterMember] = useState('all');
  const [filterChallenge, setFilterChallenge] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  const filteredActivities = useMemo(() => {
    let activities: any[] = [];

    (group.challenges || []).forEach((challenge: any) => {
      (challenge.tasks || []).forEach((task: any) => {
        if (task.completedBy && task.completedBy.length > 0) {
          const date = getTaskDate(challenge.startDate, task.dayNumber);
          const dateString = getLocalDateString(date);
          task.completedBy.forEach((userId: string) => {
            const member = (group.members || []).find((m: any) => m.userId === userId);
            if (member) activities.push({ member, challenge, task, date, dateString });
          });
        }
      });
    });

    if (filterMember !== 'all') activities = activities.filter(a => a.member.userId === filterMember);
    if (filterChallenge !== 'all') activities = activities.filter(a => a.challenge.id === filterChallenge);
    if (filterDate) activities = activities.filter(a => a.dateString === filterDate);

    return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [group, filterMember, filterChallenge, filterDate]);

  const groupedActivities = useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredActivities.forEach(act => {
      const key = act.dateString;
      if (!map[key]) map[key] = [];
      map[key].push(act);
    });
    return map;
  }, [filteredActivities]);

  const clearFilters = () => { setFilterMember('all'); setFilterChallenge('all'); setFilterDate(''); };
  const hasFilters = filterMember !== 'all' || filterChallenge !== 'all' || !!filterDate;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="relative overflow-hidden shrink-0 bg-gradient-to-br from-indigo-900 to-slate-900 border-b border-white/10 px-8 py-6">
        <div className="relative z-10">
          <h2 className="text-2xl font-black">Activity Log</h2>
          <p className="text-slate-300">Timeline of team achievements.</p>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
          <IconList className="w-6 h-6 rotate-45" />
        </button>
      </div>

      <div className="px-6 py-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-700 flex flex-wrap gap-3 items-center sticky top-0 z-30">
        <div className="relative">
          <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} className="pl-3 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200">
            <option value="all">Everyone</option>
            {(group.members || []).map((m: any) => <option key={m.userId} value={m.userId}>{m.displayName}</option>)}
          </select>
        </div>
        <div className="relative">
          <select value={filterChallenge} onChange={(e) => setFilterChallenge(e.target.value)} className="pl-3 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200">
            <option value="all">All Challenges</option>
            {(group.challenges || []).map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="pl-3 pr-2 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200" />
        {hasFilters && <button onClick={clearFilters} className="ml-auto text-xs font-bold text-red-400 px-3 py-2 rounded-xl">Clear</button>}
      </div>

      <div className="p-0 bg-slate-900 overflow-y-auto max-h-[60vh]">
        {Object.keys(groupedActivities).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <IconList className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No activity found</h3>
            <p className="text-slate-400 max-w-xs mx-auto">It looks a bit quiet here. Adjust filters or complete a task to spark the timeline!</p>
          </div>
        ) : (
          <div className="pb-8">
            {Object.entries(groupedActivities).map(([dateStr, activities]) => {
              const [y, m, d] = dateStr.split('-').map(Number);
              const displayDate = new Date(y, m-1, d);
              return (
                <div key={dateStr} className="relative">
                  <div className="sticky top-0 z-10 bg-slate-900/95 px-8 py-3 border-b border-slate-700/50 flex items-center gap-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{formatFriendlyDate(displayDate)}</h3>
                    <div className="h-px bg-slate-800 flex-1" />
                  </div>

                  <div className="px-6 sm:px-8 py-4 space-y-4">
                    {activities.map((item: any, idx: number) => (
                      <div key={idx} className="group relative flex items-start gap-4">
                        {idx !== activities.length - 1 && <div className="absolute left-[26px] top-12 bottom-[-20px] w-0.5 bg-slate-800"></div>}
                        <div className="relative z-10 w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 p-1">
                          {item.member.avatar ? <img src={item.member.avatar} alt="avatar" className="w-full h-full object-cover rounded-md"/> : <div className="text-white text-center">{item.member.displayName}</div>}
                        </div>
                        <div className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-baseline gap-1.5 text-base"><span className="font-bold text-white">{item.member.displayName}</span> <span className="text-slate-500 font-medium text-sm">completed</span> <span className="font-bold text-amber-400">{item.challenge.title}</span></div>
                            </div>
                            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-amber-900 text-amber-300"><IconCheck className="w-5 h-5"/></div>
                          </div>
                          <div className="flex items-center gap-3"><span className="bg-slate-900 text-slate-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-700">Day {item.task.dayNumber}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ActivityLogModal;

