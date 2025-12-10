import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Challenge, 
  ChallengeCategory, 
  DayTask,
  Group,
  GroupMember
} from './types';
import { getMotivation } from './services/geminiService';
import { 
  IconCheck, 
  IconPlus, 
  IconFlame, 
  IconCalendar, 
  IconSparkles, 
  IconTrash, 
  IconArrowLeft, 
  IconUsers, 
  IconLink, 
  IconEdit, 
  IconSettings, 
  IconLogOut, 
  IconShield, 
  IconCamera, 
  IconUpload, 
  IconClock, 
  IconLock, 
  IconChart, 
  IconGavel, 
  IconList,
  IconBell
} from './components/Icons';
import ProgressBar from './components/ProgressBar';

// Type definition for confetti (loaded via CDN)
declare global {
  interface Window {
    confetti: any;
  }
}

// --- Constants & Helpers ---
const GROUPS_STORAGE_KEY = 'habit_hero_groups_v2';
const SETTINGS_STORAGE_KEY = 'habit_hero_notification_settings';
const NOTIFICATION_HISTORY_KEY = 'habit_hero_notification_history';
const USER_ID_KEY = 'habit_hero_global_user_id';

// UPDATED: Darker, more serious category styles
const CATEGORY_STYLES: Record<string, { bg: string, text: string, border: string, bar: string, icon: string, themeColor: string }> = {
  [ChallengeCategory.FITNESS]: { bg: 'bg-emerald-900/40', text: 'text-emerald-400', border: 'border-emerald-800', bar: 'bg-emerald-500', icon: '🏃‍♂️', themeColor: 'bg-emerald-800' },
  [ChallengeCategory.LEARNING]: { bg: 'bg-blue-900/40', text: 'text-blue-400', border: 'border-blue-800', bar: 'bg-blue-500', icon: '📚', themeColor: 'bg-blue-800' },
  [ChallengeCategory.MINDFULNESS]: { bg: 'bg-violet-900/40', text: 'text-violet-400', border: 'border-violet-800', bar: 'bg-violet-500', icon: '🧘', themeColor: 'bg-violet-800' },
  [ChallengeCategory.PRODUCTIVITY]: { bg: 'bg-amber-900/40', text: 'text-amber-400', border: 'border-amber-800', bar: 'bg-amber-500', icon: '⚡', themeColor: 'bg-amber-700' },
  [ChallengeCategory.HEALTH]: { bg: 'bg-rose-900/40', text: 'text-rose-400', border: 'border-rose-800', bar: 'bg-rose-500', icon: '❤️', themeColor: 'bg-rose-800' },
  [ChallengeCategory.OTHER]: { bg: 'bg-slate-700/40', text: 'text-slate-300', border: 'border-slate-600', bar: 'bg-slate-400', icon: '✨', themeColor: 'bg-slate-700' },
};

// UPDATED: Darker group themes
const GROUP_THEMES: Record<string, { from: string, to: string, text: string, bg: string, border: string, shadow: string, iconBg: string, ring: string, light: string }> = {
  indigo: { from: 'from-indigo-900', to: 'to-slate-900', text: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-800', shadow: 'shadow-indigo-900/50', iconBg: 'bg-indigo-800', ring: 'ring-indigo-700', light: 'bg-indigo-600' },
  rose: { from: 'from-rose-900', to: 'to-slate-900', text: 'text-rose-400', bg: 'bg-rose-900/20', border: 'border-rose-800', shadow: 'shadow-rose-900/50', iconBg: 'bg-rose-800', ring: 'ring-rose-700', light: 'bg-rose-600' },
  emerald: { from: 'from-emerald-900', to: 'to-slate-900', text: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-800', shadow: 'shadow-emerald-900/50', iconBg: 'bg-emerald-800', ring: 'ring-emerald-700', light: 'bg-emerald-600' },
  amber: { from: 'from-amber-900', to: 'to-slate-900', text: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-800', shadow: 'shadow-amber-900/50', iconBg: 'bg-amber-800', ring: 'ring-amber-700', light: 'bg-amber-600' },
  sky: { from: 'from-sky-900', to: 'to-slate-900', text: 'text-sky-400', bg: 'bg-sky-900/20', border: 'border-sky-800', shadow: 'shadow-sky-900/50', iconBg: 'bg-sky-800', ring: 'ring-sky-700', light: 'bg-sky-600' },
  violet: { from: 'from-violet-900', to: 'to-slate-900', text: 'text-violet-400', bg: 'bg-violet-900/20', border: 'border-violet-800', shadow: 'shadow-violet-900/50', iconBg: 'bg-violet-800', ring: 'ring-violet-700', light: 'bg-violet-600' },
  slate: { from: 'from-slate-800', to: 'to-gray-950', text: 'text-slate-400', bg: 'bg-slate-800/50', border: 'border-slate-700', shadow: 'shadow-slate-900/50', iconBg: 'bg-slate-700', ring: 'ring-slate-600', light: 'bg-slate-500' },
};

const DEFAULT_GROUP_IMAGE = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=600&fit=crop';

const triggerConfetti = () => {
  if (window.confetti) {
    window.confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#ec4899', '#14b8a6']
    });
  }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const renderGroupIcon = (iconString: string, className: string = "w-full h-full object-cover") => {
  const isUrl = iconString.startsWith('http') || iconString.startsWith('data:image');
  if (isUrl) {
    return <img src={iconString} alt="Icon" className={className} />;
  }
  return <span>{iconString}</span>;
};

// --- Helpers for Date & Time Logic ---

const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTaskDate = (startDateStr: string, dayNumber: number): Date => {
  const startDate = new Date(startDateStr);
  const taskDate = new Date(startDate);
  taskDate.setDate(startDate.getDate() + (dayNumber - 1));
  taskDate.setHours(0, 0, 0, 0); 
  return taskDate;
};

const isTaskForToday = (startDateStr: string, dayNumber: number): boolean => {
  const taskDate = getTaskDate(startDateStr, dayNumber);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return taskDate.getTime() === today.getTime();
};

const isTaskInPast = (startDateStr: string, dayNumber: number): boolean => {
  const taskDate = getTaskDate(startDateStr, dayNumber);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return taskDate.getTime() < today.getTime();
};

const isDeadlinePassed = (deadlineTime: string | undefined): boolean => {
  if (!deadlineTime) return false;
  
  const now = new Date();
  const [deadlineHour, deadlineMinute] = deadlineTime.split(':').map(Number);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (currentHour > deadlineHour) return true;
  if (currentHour === deadlineHour && currentMinute >= deadlineMinute) return true;
  return false;
};

const formatFriendlyDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
};

// --- Modern Modal Component (Dark Themed) ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; maxWidth?: string }> = ({ isOpen, onClose, children, maxWidth = "max-w-lg" }) => {
  const [show, setShow] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
      setTimeout(() => setShow(false), 300);
    }
  }, [isOpen]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
      ></div>
      <div 
        className={`bg-slate-900 border border-slate-700 rounded-[2rem] w-full ${maxWidth} shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out text-slate-100 ${animate ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'}`}
      >
        {children}
      </div>
    </div>
  );
};

// --- Sub-Components ---

// 8. Activity Log Modal (Dark Timeline)
type ActivityItem = { 
  member: GroupMember; 
  challenge: Challenge; 
  task: DayTask; 
  date: Date; 
  dateString: string;
};

const ActivityLogModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}> = ({ isOpen, onClose, group }) => {
  const theme = GROUP_THEMES[group.theme || 'indigo'];
  
  // Filters State
  const [filterMember, setFilterMember] = useState('all');
  const [filterChallenge, setFilterChallenge] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Flatten and Sort
  const filteredActivities = useMemo<ActivityItem[]>(() => {
    let activities: ActivityItem[] = [];

    group.challenges.forEach(challenge => {
      challenge.tasks.forEach(task => {
        if (task.completedBy && task.completedBy.length > 0) {
           const date = getTaskDate(challenge.startDate, task.dayNumber);
           const dateString = getLocalDateString(date);
           
           task.completedBy.forEach(userId => {
             const member = group.members.find(m => m.userId === userId);
             if (member) {
               activities.push({ member, challenge, task, date, dateString });
             }
           });
        }
      });
    });

    // Apply Filters
    if (filterMember !== 'all') activities = activities.filter(a => a.member.userId === filterMember);
    if (filterChallenge !== 'all') activities = activities.filter(a => a.challenge.id === filterChallenge);
    if (filterDate) activities = activities.filter(a => a.dateString === filterDate);

    // Sort Descending
    return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [group, filterMember, filterChallenge, filterDate]);

  // Group by Date for Timeline
  const groupedActivities = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    filteredActivities.forEach(act => {
       const key = act.dateString;
       if (!groups[key]) groups[key] = [];
       groups[key].push(act);
    });
    return groups;
  }, [filteredActivities]);

  const clearFilters = () => {
    setFilterMember('all');
    setFilterChallenge('all');
    setFilterDate('');
  };

  const hasFilters = filterMember !== 'all' || filterChallenge !== 'all' || filterDate !== '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
        {/* Header with Dark Glass Effect */}
        <div className={`relative overflow-hidden shrink-0 bg-gradient-to-br ${theme.from} ${theme.to} border-b border-white/10`}>
           <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
              <IconList className="w-48 h-48 text-white" />
           </div>
           <div className="relative z-10 px-8 py-8 text-white">
              <h2 className="text-3xl font-black mb-1">Activity Log</h2>
              <p className="opacity-80 font-medium text-lg">Timeline of team achievements.</p>
              
              <div className="flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-wider bg-black/30 backdrop-blur-md inline-flex px-3 py-1.5 rounded-full border border-white/10">
                 <IconCheck className="w-4 h-4" /> {filteredActivities.length} Activities Found
              </div>
           </div>
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10">
             <IconPlus className="w-6 h-6 rotate-45" />
           </button>
        </div>

        {/* Filters Panel - Sticky & Dark */}
        <div className="px-6 py-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-700 flex flex-wrap gap-3 items-center sticky top-0 z-30 shadow-sm">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <IconUsers className="w-4 h-4" />
              </div>
              <select 
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 focus:ring-2 focus:ring-indigo-500/50 rounded-xl text-sm font-bold text-slate-200 outline-none transition-all cursor-pointer appearance-none min-w-[140px]"
              >
                <option value="all">Everyone</option>
                {group.members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.displayName}</option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <IconFlame className="w-4 h-4" />
              </div>
              <select 
                value={filterChallenge}
                onChange={(e) => setFilterChallenge(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 focus:ring-2 focus:ring-indigo-500/50 rounded-xl text-sm font-bold text-slate-200 outline-none transition-all cursor-pointer appearance-none max-w-[160px] truncate"
              >
                <option value="all">All Challenges</option>
                {group.challenges.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="relative group">
               <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-3 pr-2 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 focus:ring-2 focus:ring-indigo-500/50 rounded-xl text-sm font-bold text-slate-200 outline-none transition-all cursor-pointer [color-scheme:dark]"
              />
            </div>

            {hasFilters && (
              <button 
                onClick={clearFilters}
                className="ml-auto text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/20 px-3 py-2 rounded-xl transition-all border border-red-900/50 hover:border-red-500"
              >
                Clear
              </button>
            )}
        </div>

        {/* Timeline Content - Dark */}
        <div className="p-0 bg-slate-900 overflow-y-auto max-h-[60vh] scroll-smooth">
           {Object.keys(groupedActivities).length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
               <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-700">
                 <IconList className="w-10 h-10 text-slate-500" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">No activity found</h3>
               <p className="text-slate-400 max-w-xs mx-auto">It looks a bit quiet here. Adjust filters or complete a task to spark the timeline!</p>
             </div>
           ) : (
             <div className="pb-8">
                {Object.entries(groupedActivities).map(([dateStr, rawActivities]) => {
                  const activities = rawActivities as ActivityItem[];
                  // Safe local date parsing
                  const [y, m, d] = dateStr.split('-').map(Number);
                  const displayDate = new Date(y, m - 1, d);
                  
                  return (
                  <div key={dateStr} className="relative">
                    {/* Date Sticky Header */}
                    <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm px-8 py-3 border-b border-slate-700/50 flex items-center gap-4">
                       <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{formatFriendlyDate(displayDate)}</h3>
                       <div className="h-px bg-slate-800 flex-1"></div>
                    </div>

                    <div className="px-6 sm:px-8 py-4 space-y-4">
                       {activities.map((item, idx) => {
                          const style = CATEGORY_STYLES[item.challenge.category];
                          return (
                            <div key={idx} className="group relative flex items-start gap-4">
                               {/* Vertical Line Connector */}
                               {idx !== activities.length - 1 && (
                                 <div className="absolute left-[26px] top-12 bottom-[-20px] w-0.5 bg-slate-800 group-hover:bg-slate-700 transition-colors"></div>
                               )}
                               
                               {/* Avatar */}
                               <div className="relative z-10 w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 shadow-lg border border-slate-700 ring-1 ring-slate-700 shrink-0 mt-1">
                                  {renderGroupIcon(item.member.avatar)}
                               </div>

                               {/* Card */}
                               <div className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-md hover:shadow-lg transition-all duration-300 hover:border-slate-600 hover:translate-x-1">
                                  <div className="flex justify-between items-start mb-2">
                                     <div>
                                        <div className="flex flex-wrap items-baseline gap-1.5 text-base">
                                          <span className="font-bold text-white">{item.member.displayName}</span>
                                          <span className="text-slate-500 font-medium text-sm">completed</span>
                                          <span className={`font-bold ${style.text}`}>{item.challenge.title}</span>
                                        </div>
                                     </div>
                                     <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${style.bg} ${style.text}`}>
                                        <IconCheck className="w-5 h-5" />
                                     </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                     <span className="bg-slate-900 text-slate-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-700">
                                       Day {item.task.dayNumber}
                                     </span>
                                     <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                        <span>{style.icon} {item.challenge.category}</span>
                                     </div>
                                  </div>
                               </div>
                            </div>
                          );
                       })}
                    </div>
                  </div>
                )})}
             </div>
           )}
        </div>
    </Modal>
  );
};

const ChallengeResultsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  group: Group;
  currentUserId: string;
}> = ({ isOpen, onClose, challenge, group, currentUserId }) => {
  const style = CATEGORY_STYLES[challenge.category];
  const memberStats = group.members.map(member => {
    const completedCount = challenge.tasks.filter(t => t.completedBy?.includes(member.userId)).length;
    const taskCount = challenge.tasks.length;
    const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
    return { ...member, completedCount, total: taskCount, progress };
  }).sort((a, b) => b.completedCount - a.completedCount);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
       <div className={`px-8 py-8 ${style.bg} relative overflow-hidden border-b border-white/5`}>
           <div className="absolute top-0 right-0 p-6 opacity-10 text-9xl transform translate-x-10 -translate-y-10">
              {style.icon}
           </div>
           <div className="relative z-10">
              <h2 className="text-3xl font-black text-white mb-1">Challenge Results</h2>
              <p className="text-slate-300 font-medium">{challenge.title}</p>
           </div>
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
             <IconPlus className="w-6 h-6 rotate-45" />
           </button>
        </div>
        <div className="p-8 bg-slate-900 overflow-y-auto max-h-[70vh]">
           <div className="space-y-6">
              {memberStats.map((member, index) => {
                 const isTop = index === 0 && member.completedCount > 0;
                 return (
                   <div key={member.userId} className={`flex flex-col md:flex-row items-center gap-4 p-4 rounded-2xl border ${member.userId === currentUserId ? 'border-indigo-500/50 bg-indigo-900/10' : 'border-slate-700 bg-slate-800'} ${isTop ? 'shadow-lg shadow-amber-900/20 border-amber-500/30 bg-amber-900/10' : ''}`}>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                         <div className={`w-8 h-8 flex items-center justify-center font-black text-slate-500 ${isTop ? 'text-amber-400 text-xl' : ''}`}>{isTop ? '👑' : `#${index + 1}`}</div>
                         <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 shadow-sm shrink-0 border border-slate-600">{renderGroupIcon(member.avatar)}</div>
                         <div className="min-w-[120px]">
                            <h4 className="font-bold text-white">{member.displayName}</h4>
                            <span className="text-xs font-bold text-slate-400">{member.completedCount} / {member.total} Tasks</span>
                         </div>
                      </div>
                      <div className="flex-1 w-full">
                         <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider"><span>Progress</span><span>{member.progress}%</span></div>
                         <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${isTop ? 'bg-amber-400' : style.bar}`} style={{ width: `${member.progress}%` }}></div></div>
                         <div className="flex gap-1 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                            {challenge.tasks.slice(0, 14).map((task) => {
                               const isDone = task.completedBy?.includes(member.userId);
                               return <div key={task.dayNumber} className={`w-2 h-2 rounded-full shrink-0 ${isDone ? style.bar : 'bg-slate-700'}`} title={`Day ${task.dayNumber}: ${isDone ? 'Done' : 'Pending'}`}></div>
                            })}
                            {challenge.tasks.length > 14 && <span className="text-[10px] text-slate-500">+</span>}
                         </div>
                      </div>
                   </div>
                 )
              })}
           </div>
        </div>
    </Modal>
  );
};

const PenaltyModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onUpdateMember: (userId: string, updates: Partial<GroupMember>) => void;
}> = ({ isOpen, onClose, group, onUpdateMember }) => {
  const theme = GROUP_THEMES[group.theme || 'indigo'];
  const config = group.penaltyConfig || { threshold: 3, description: "Not Configured" };
  const isConfigured = !!group.penaltyConfig;
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
       <div className={`px-8 py-8 ${theme.bg} relative overflow-hidden border-b border-white/5`}>
           <div className="absolute top-0 right-0 p-6 opacity-10"><IconGavel className="w-40 h-40" /></div>
           <div className="relative z-10"><h2 className="text-3xl font-black text-white mb-1">Penalty Court</h2><p className="text-slate-300 font-medium">Keep each other accountable.</p></div>
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"><IconPlus className="w-6 h-6 rotate-45" /></button>
        </div>
        <div className="p-8 bg-slate-900 overflow-y-auto max-h-[70vh]">
           {!isConfigured ? (
             <div className="text-center py-10">
               <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4"><IconGavel className="w-10 h-10 text-slate-600" /></div>
               <h3 className="text-xl font-bold text-white mb-2">No Rules Yet</h3>
               <p className="text-slate-400 mb-6">Configure penalty rules in Group Settings first.</p>
               <button onClick={onClose} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200">Close</button>
             </div>
           ) : (
             <div className="space-y-8">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-700">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                   <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Current Rule</h4>
                   <div className="flex items-center gap-4">
                      <div className="text-center"><span className="block text-3xl font-black text-red-400">{config.threshold}</span><span className="text-[10px] uppercase font-bold text-slate-400">Strikes</span></div>
                      <div className="h-10 w-px bg-white/10"></div>
                      <div><span className="block text-2xl font-bold">{config.description}</span><span className="text-xs text-slate-400">Penalty</span></div>
                   </div>
                </div>
                <div className="space-y-4">
                  {group.members.map(member => {
                    const strikes = member.strikes || 0;
                    const paid = member.penaltiesPaid || 0;
                    const totalPenalties = Math.floor(strikes / config.threshold);
                    const pending = totalPenalties - paid;
                    return (
                      <div key={member.userId} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-800 rounded-2xl border border-slate-700 gap-4">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-700 shadow-sm border border-slate-600">{renderGroupIcon(member.avatar)}</div>
                            <div><h3 className="font-bold text-white text-lg">{member.displayName}</h3><div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide"><span>Total Strikes: {strikes}</span></div></div>
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="flex flex-col items-center"><span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Strikes</span>
                               <div className="flex items-center bg-slate-900 rounded-xl border border-slate-700 shadow-sm">
                                  <button onClick={() => onUpdateMember(member.userId, { strikes: Math.max(0, strikes - 1) })} className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 rounded-l-xl transition-colors text-slate-400">-</button>
                                  <span className="w-8 text-center font-black text-white">{strikes}</span>
                                  <button onClick={() => onUpdateMember(member.userId, { strikes: strikes + 1 })} className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 rounded-r-xl transition-colors text-red-400">+</button>
                               </div>
                            </div>
                            <div className="flex flex-col items-end min-w-[100px]"><span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Penalty Due</span>
                               {pending > 0 ? (
                                 <button onClick={() => { triggerConfetti(); onUpdateMember(member.userId, { penaltiesPaid: paid + 1 }); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-900/30 transition-all active:scale-95 flex items-center gap-2">Pay 1 ({pending} Left)</button>
                               ) : (<div className="px-4 py-2 bg-emerald-900/30 text-emerald-400 border border-emerald-800 text-sm font-bold rounded-xl flex items-center gap-1"><IconCheck className="w-4 h-4" /> All Good</div>)}
                            </div>
                         </div>
                      </div>
                    );
                  })}
                </div>
             </div>
           )}
        </div>
    </Modal>
  );
};

interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string;
  deadlineAlert: boolean;
}

const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; group: Group; currentUserId: string; onUpdateProfile: (name: string, avatar: string) => void; onUpdateGroup: (name: string, icon: string, theme: string, penaltyConfig?: { threshold: number, description: string }) => void; onVoteDeleteGroup: () => void; }> = ({ isOpen, onClose, group, currentUserId, onUpdateProfile, onUpdateGroup, onVoteDeleteGroup }) => {
  const currentUserMember = group.members.find(m => m.userId === currentUserId);
  const themeStyle = GROUP_THEMES[group.theme || 'indigo'];
  const [activeTab, setActiveTab] = useState<'profile' | 'group' | 'notifications'>('profile');
  
  // Profile State
  const [pName, setPName] = useState(''); 
  const [pAvatar, setPAvatar] = useState('');
  
  // Group State
  const [gName, setGName] = useState(''); 
  const [gIcon, setGIcon] = useState(''); 
  const [gTheme, setGTheme] = useState('');
  const [pThreshold, setPThreshold] = useState<string>('3'); 
  const [pDescription, setPDescription] = useState('');

  // Notification State
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    enabled: false,
    dailyReminder: false,
    reminderTime: '09:00',
    deadlineAlert: false
  });

  useEffect(() => {
    if (isOpen && currentUserMember) {
      // Load Profile & Group
      setPName(currentUserMember.displayName); setPAvatar(currentUserMember.avatar);
      setGName(group.name); setGIcon(group.icon); setGTheme(group.theme || 'indigo');
      if (group.penaltyConfig) { setPThreshold(group.penaltyConfig.threshold.toString()); setPDescription(group.penaltyConfig.description); } else { setPThreshold('3'); setPDescription(''); }
      
      // Load Notifications
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        setNotifSettings(JSON.parse(savedSettings));
      } else if (Notification.permission === 'granted') {
        setNotifSettings(prev => ({...prev, enabled: true}));
      }
    }
  }, [isOpen, group, currentUserMember]);

  const handlePFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setPAvatar(reader.result as string); reader.readAsDataURL(file); } };
  const handleGFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setGIcon(reader.result as string); reader.readAsDataURL(file); } };
  
  const saveProfile = () => { onUpdateProfile(pName, pAvatar); onClose(); };
  const saveGroup = () => { const thresholdVal = parseInt(pThreshold) || 3; const config = pDescription.trim() ? { threshold: thresholdVal, description: pDescription } : undefined; onUpdateGroup(gName, gIcon, gTheme, config); onClose(); };
  
  const handleEnableNotifications = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const newSettings = { ...notifSettings, enabled: true, dailyReminder: true, deadlineAlert: true };
      setNotifSettings(newSettings);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      new Notification('HabitHero', { body: 'Notifications enabled! We will remind you about your challenges.' });
    }
  };

  const updateNotifSetting = (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...notifSettings, [key]: value };
    setNotifSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  const deleteApprovals = group.deleteApprovals || []; const hasVotedDelete = deleteApprovals.includes(currentUserId); const votesNeeded = group.members.length; const currentVotes = deleteApprovals.length; const progress = (currentVotes / votesNeeded) * 100;
  const EMOJIS = ['👤', '🦁', '🦊', '🐼', '🐨', '🐯', '🦄', '🐲', '🌵', '🌻', '⚡', '🔥', '💧', '🚀', '⚽', '🎸', '🎨', '🎮'];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className="px-8 py-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20"><h2 className="text-2xl font-extrabold text-white tracking-tight">Settings</h2><button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-all"><IconPlus className="w-6 h-6 rotate-45" /></button></div>
        <div className="px-8 pt-6"><div className="flex p-1 bg-slate-800/80 rounded-2xl"><button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all shadow-sm ${activeTab === 'profile' ? 'bg-slate-700 text-white ring-1 ring-white/10' : 'text-slate-400 hover:text-slate-200 shadow-none'}`}>Profile</button><button onClick={() => setActiveTab('group')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all shadow-sm ${activeTab === 'group' ? 'bg-slate-700 text-white ring-1 ring-white/10' : 'text-slate-400 hover:text-slate-200 shadow-none'}`}>Group</button><button onClick={() => setActiveTab('notifications')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all shadow-sm ${activeTab === 'notifications' ? 'bg-slate-700 text-white ring-1 ring-white/10' : 'text-slate-400 hover:text-slate-200 shadow-none'}`}>Notify</button></div></div>
        <div className="flex-1 overflow-y-auto px-8 py-8">
           {activeTab === 'profile' ? (
             <div className="space-y-8 animate-fade-in-up">
                <div className="flex flex-col items-center"><div className="relative group cursor-pointer"><div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center overflow-hidden shadow-2xl shadow-indigo-900/20 border-4 border-slate-800 ring-2 ${themeStyle.ring} ring-offset-2 ring-offset-slate-900 mb-6 bg-slate-800 text-5xl transition-transform group-hover:scale-[1.02]`}>{renderGroupIcon(pAvatar, "w-full h-full object-cover")}</div><label className="absolute -bottom-2 -right-2 bg-white text-slate-900 p-3 rounded-2xl shadow-lg cursor-pointer hover:bg-slate-200 transition-all active:scale-95 z-10 border-4 border-slate-800"><IconCamera className="w-5 h-5" /><input type="file" accept="image/*" className="hidden" onChange={handlePFileUpload} /></label></div>
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 w-full"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Quick Select Avatar</p><div className="grid grid-cols-6 gap-2">{EMOJIS.map(e => (<button key={e} onClick={() => setPAvatar(e)} className={`aspect-square flex items-center justify-center rounded-xl hover:bg-slate-700 transition-all text-xl ${pAvatar === e ? `bg-slate-700 shadow-md ring-2 ${themeStyle.ring} scale-110 z-10` : 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:scale-105'}`}>{e}</button>))}</div></div></div>
                <div className="space-y-2"><label className="text-sm font-bold text-slate-300 ml-1">Display Name</label><input type="text" value={pName} onChange={(e) => setPName(e.target.value)} className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-900/50 focus:border-indigo-500 outline-none transition-all font-semibold text-lg text-white placeholder-slate-500" placeholder="Enter your name"/></div>
                <button onClick={saveProfile} disabled={!pName.trim()} className="w-full py-4 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-2xl shadow-xl shadow-white/5 transition-all active:scale-[0.98] text-lg">Save Changes</button>
             </div>
           ) : activeTab === 'group' ? (
             <div className="space-y-8 animate-fade-in-up">
                <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 flex items-center gap-6"><div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-2 border-slate-600">{renderGroupIcon(gIcon, "w-full h-full object-cover")}</div><div className="flex-1"><h4 className="font-bold text-white mb-1">Group Icon</h4><p className="text-xs text-slate-400 mb-3">Visible to all members</p><label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-600 shadow-sm rounded-xl font-bold text-sm text-slate-200 cursor-pointer hover:bg-slate-700 transition-colors"><IconUpload className="w-4 h-4" /> Upload New<input type="file" accept="image/*" className="hidden" onChange={handleGFileUpload} /></label></div></div>
                <div className="space-y-2"><label className="text-sm font-bold text-slate-300 ml-1">Group Name</label><input type="text" value={gName} onChange={(e) => setGName(e.target.value)} className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-900/50 focus:border-indigo-500 outline-none transition-all font-semibold text-lg text-white"/></div>
                <div className="space-y-3"><label className="text-sm font-bold text-slate-300 ml-1">Color Theme</label><div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">{Object.keys(GROUP_THEMES).map((key) => { const t = GROUP_THEMES[key]; return (<button key={key} onClick={() => setGTheme(key)} className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.from} ${t.to} transition-all duration-300 flex items-center justify-center shrink-0 ${gTheme === key ? 'ring-4 ring-offset-2 ring-slate-600 scale-110 shadow-lg' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}>{gTheme === key && <IconCheck className="w-6 h-6 text-white" />}</button>); })}</div></div>
                <div className="pt-4 border-t border-slate-700 space-y-4"><h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><IconGavel className="w-4 h-4" /> Penalty System</h3><div className="grid grid-cols-3 gap-4"><div className="col-span-1 space-y-1"><label className="text-xs font-bold text-slate-400">Threshold (Strikes)</label><input type="number" min="1" value={pThreshold} onChange={(e) => setPThreshold(e.target.value)} onBlur={() => { const val = parseInt(pThreshold); if (isNaN(val) || val < 1) setPThreshold('3'); }} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white"/></div><div className="col-span-2 space-y-1"><label className="text-xs font-bold text-slate-400">Penalty Description</label><input type="text" value={pDescription} onChange={(e) => setPDescription(e.target.value)} placeholder="e.g. Buy Coffee" className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white"/></div></div></div>
                <button onClick={saveGroup} disabled={!gName.trim()} className="w-full py-4 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-2xl shadow-xl shadow-white/5 transition-all active:scale-[0.98] text-lg">Update Group</button>
                <div className="pt-8 border-t border-slate-700"><div className="bg-red-900/10 rounded-3xl p-6 border border-red-900/30"><div className="flex items-start gap-4 mb-4"><div className="p-3 bg-red-900/20 text-red-500 rounded-xl"><IconTrash className="w-6 h-6" /></div><div><h4 className="font-bold text-red-400 text-lg">Delete Group</h4><p className="text-red-300/70 text-sm mt-1">Requires consensus from <strong>{votesNeeded} members</strong>. Currently <strong>{currentVotes}</strong> voted.</p></div></div><div className="mb-6"><div className="flex justify-between text-xs font-bold text-red-400 mb-2"><span>Consensus Progress</span><span>{Math.round(progress)}%</span></div><div className="w-full bg-red-900/30 rounded-full h-3"><div className="bg-red-600 h-3 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div><div className="flex items-center -space-x-2 mt-4 pl-2">{group.deleteApprovals?.map(uid => { const m = group.members.find(mem => mem.userId === uid); if (!m) return null; return (<div key={uid} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 overflow-hidden" title={m.displayName}>{renderGroupIcon(m.avatar)}</div>); })}{currentVotes === 0 && <span className="text-xs text-red-500 italic">No votes yet</span>}</div></div><button onClick={onVoteDeleteGroup} className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-2 ${hasVotedDelete ? 'bg-transparent border-red-500/50 text-red-400 hover:bg-red-900/20' : 'bg-red-600 border-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/40'}`}>{hasVotedDelete ? 'Withdraw Vote' : 'Vote to Delete'}</button></div></div>
             </div>
           ) : (
             <div className="space-y-8 animate-fade-in-up">
               {!notifSettings.enabled ? (
                 <div className="text-center py-10 bg-slate-800/50 rounded-3xl border border-slate-700">
                   <div className="w-20 h-20 bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400">
                     <IconBell className="w-10 h-10" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Enable Notifications</h3>
                   <p className="text-slate-400 max-w-xs mx-auto mb-8">Stay on top of your habits with timely reminders and deadline alerts.</p>
                   <button 
                     onClick={handleEnableNotifications}
                     className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-lg active:scale-95"
                   >
                     Enable Push Notifications
                   </button>
                 </div>
               ) : (
                 <>
                   <div className="flex items-center justify-between p-4 bg-slate-800 rounded-2xl border border-slate-700">
                      <div>
                        <h4 className="font-bold text-white text-lg">Daily Reminder</h4>
                        <p className="text-xs text-slate-400 mt-1">Get a nudge to complete your tasks</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={notifSettings.dailyReminder} onChange={(e) => updateNotifSetting('dailyReminder', e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                   </div>

                   {notifSettings.dailyReminder && (
                     <div className="flex items-center justify-between p-4 bg-slate-800 rounded-2xl border border-slate-700">
                        <div className="flex items-center gap-3">
                          <IconClock className="text-slate-400 w-5 h-5" />
                          <h4 className="font-bold text-white">Reminder Time</h4>
                        </div>
                        <input 
                          type="time" 
                          value={notifSettings.reminderTime} 
                          onChange={(e) => updateNotifSetting('reminderTime', e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                        />
                     </div>
                   )}

                   <div className="flex items-center justify-between p-4 bg-slate-800 rounded-2xl border border-slate-700">
                      <div>
                        <h4 className="font-bold text-white text-lg">Deadline Alerts</h4>
                        <p className="text-xs text-slate-400 mt-1">Notify 1 hour before task deadline</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={notifSettings.deadlineAlert} onChange={(e) => updateNotifSetting('deadlineAlert', e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                   </div>
                   
                   <p className="text-center text-xs text-slate-500 mt-8">
                     Notifications will only appear when your browser is open.
                   </p>
                 </>
               )}
             </div>
           )}
        </div>
    </Modal>
  );
};

const GroupProfileSetup: React.FC<{ groupName: string; onComplete: (name: string, avatar: string) => void; onCancel: () => void; initialName?: string; initialAvatar?: string; theme?: string; }> = ({ groupName, onComplete, onCancel, initialName = '', initialAvatar = '👤', theme = 'indigo' }) => {
  const [name, setName] = useState(initialName); const [avatar, setAvatar] = useState(initialAvatar); const themeStyle = GROUP_THEMES[theme] || GROUP_THEMES['indigo'];
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setAvatar(reader.result as string); reader.readAsDataURL(file); } };
  const EMOJIS = ['👤', '🦁', '🦊', '🐼', '🐨', '🐯', '🦄', '🐲', '🌵', '🌻', '⚡', '🔥', '💧', '🚀', '⚽', '🎸', '🎨', '🎮'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className={`absolute inset-0 bg-slate-950/80 backdrop-blur-xl transition-all`} onClick={onCancel}><div className={`absolute inset-0 bg-gradient-to-br ${themeStyle.from} ${themeStyle.to} opacity-20`}></div></div>
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 overflow-hidden flex flex-col animate-[fade-in-up_0.5s_cubic-bezier(0.16,1,0.3,1)]">
        <div className={`h-32 bg-gradient-to-br ${themeStyle.from} ${themeStyle.to} relative overflow-hidden`}><div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div><div className="absolute bottom-0 left-0 w-24 h-24 bg-black/20 rounded-full blur-2xl -ml-5 -mb-5"></div><button onClick={onCancel} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 rounded-full text-white transition-all backdrop-blur-md"><IconPlus className="w-6 h-6 rotate-45" /></button></div>
        <div className="px-8 pb-8 -mt-16 flex flex-col items-center">
            <div className="relative group mb-6"><div className={`w-32 h-32 rounded-full p-1.5 bg-slate-900 shadow-2xl shadow-slate-950 ring-4 ${themeStyle.ring} ring-opacity-20 transition-transform duration-300 group-hover:scale-105`}><div className="w-full h-full rounded-full overflow-hidden bg-slate-800 flex items-center justify-center text-5xl">{renderGroupIcon(avatar)}</div></div><label className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer m-1.5 backdrop-blur-sm z-10"><div className="flex flex-col items-center gap-1"><IconCamera className="w-6 h-6" /><span className="text-[10px] font-bold uppercase tracking-widest">Upload</span></div><input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} /></label></div>
            <h2 className="text-2xl font-black text-white mb-1 text-center">Join <span className={`text-transparent bg-clip-text bg-gradient-to-r ${themeStyle.from} ${themeStyle.to} brightness-150`}>{groupName}</span></h2><p className="text-slate-400 text-sm font-medium mb-8 text-center">Set up your profile to start tracking.</p>
            <div className="w-full mb-8 relative group"><div className={`absolute -inset-0.5 bg-gradient-to-r ${themeStyle.from} ${themeStyle.to} rounded-2xl opacity-0 group-focus-within:opacity-50 transition duration-500 blur`}></div><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" className="relative w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:outline-none font-bold text-center text-xl text-white placeholder:text-slate-600 shadow-sm transition-shadow focus:shadow-md" autoFocus/></div>
            <div className="w-full mb-8"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">Quick Avatar Selection</p><div className="flex flex-wrap justify-center gap-2">{EMOJIS.slice(0, 12).map(e => (<button key={e} onClick={() => setAvatar(e)} className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl transition-all duration-200 transform hover:scale-110 active:scale-95 ${avatar === e ? `bg-white text-slate-900 shadow-lg scale-110 ring-2 ring-offset-2 ring-offset-slate-900 ${themeStyle.ring}` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{e}</button>))}</div></div>
            <button onClick={() => onComplete(name, avatar)} disabled={!name.trim()} className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl shadow-slate-900/50 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none bg-gradient-to-r ${themeStyle.from} ${themeStyle.to}`}>Enter Dashboard <IconArrowLeft className="w-5 h-5 rotate-180" /></button>
        </div>
      </div>
    </div>
  );
};

const CreateGroupModal: React.FC<{ isOpen: boolean; onClose: () => void; onCreate: (name: string, icon: string, theme: string) => void; }> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState(''); const [icon, setIcon] = useState(DEFAULT_GROUP_IMAGE); const [theme, setTheme] = useState('indigo'); const activeTheme = GROUP_THEMES[theme];
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setIcon(reader.result as string); reader.readAsDataURL(file); } };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <div className={`relative px-8 py-12 bg-gradient-to-br ${activeTheme.from} ${activeTheme.to} text-white overflow-hidden shrink-0 transition-all duration-500`}><div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-3xl mix-blend-overlay"></div><div className="absolute top-20 -left-10 w-40 h-40 bg-black/10 rounded-full blur-3xl mix-blend-overlay"></div><div className="relative z-10 flex flex-col items-center"><div className="group relative"><div className="w-28 h-28 mx-auto bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white/20 mb-4 transition-transform hover:scale-105 duration-300 overflow-hidden">{renderGroupIcon(icon, "w-full h-full object-cover")}</div><label className="absolute -bottom-2 -right-2 bg-white text-slate-900 p-2.5 rounded-xl shadow-lg cursor-pointer hover:bg-slate-200 transition-colors"><IconUpload className="w-5 h-5" /><input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} /></label></div><h2 className="text-3xl font-extrabold tracking-tight mb-1 px-4 drop-shadow-sm text-center">{name || "Name Your Team"}</h2><div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-bold backdrop-blur-sm border border-white/10 text-white/90"><IconSparkles className="w-3 h-3" /> Live Preview</div><button onClick={onClose} className="absolute top-0 right-0 p-4 opacity-70 hover:opacity-100 transition-opacity"><IconPlus className="w-6 h-6 rotate-45" /></button></div></div>
        <div className="p-8 space-y-8 overflow-y-auto bg-slate-900"><div className="space-y-2"><label className="text-sm font-bold text-slate-300 ml-1">Team Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Go-Getters" className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-slate-700 outline-none font-bold text-white placeholder:text-slate-600 transition-all text-xl" autoFocus/></div><div className="space-y-3"><label className="text-sm font-bold text-slate-300 ml-1">Vibe & Theme</label><div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">{Object.keys(GROUP_THEMES).map((key) => { const t = GROUP_THEMES[key]; return (<button key={key} onClick={() => setTheme(key)} className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${t.from} ${t.to} transition-all duration-300 flex items-center justify-center shrink-0 ${theme === key ? 'ring-4 ring-offset-2 ring-slate-700 scale-110 shadow-xl' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}>{theme === key && <IconCheck className="w-6 h-6 text-white" />}</button>); })}</div></div></div>
        <div className="p-6 border-t border-slate-800 bg-slate-900"><button onClick={() => { onCreate(name, icon, theme); onClose(); setName(''); setIcon(DEFAULT_GROUP_IMAGE); }} disabled={!name.trim()} className={`w-full py-4 bg-gradient-to-r ${activeTheme.from} ${activeTheme.to} text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98] hover:shadow-2xl text-lg`}>Create Group <IconPlus className="w-6 h-6" /></button></div>
    </Modal>
  );
};

const CreateChallengeModalWrapper: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (challenge: Challenge) => void; editingChallenge?: Challenge | null; groupId: string; }> = ({ isOpen, onClose, onSave, editingChallenge, groupId }) => {
  const [manualTitle, setManualTitle] = useState(''); const [manualDesc, setManualDesc] = useState(''); const [manualCategory, setManualCategory] = useState<ChallengeCategory>(ChallengeCategory.OTHER); const [manualDeadline, setManualDeadline] = useState(''); const [frequency, setFrequency] = useState<'daily' | '2days' | '3days' | 'weekly' | 'weekdays' | 'custom'>('daily'); const [customFreqDays, setCustomFreqDays] = useState<number>(5);
  const [startDateStr, setStartDateStr] = useState(getLocalDateString()); const [endDateStr, setEndDateStr] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 6); return getLocalDateString(d); });

  useEffect(() => {
    if (editingChallenge) {
      setManualTitle(editingChallenge.title); setManualDesc(editingChallenge.description); setManualCategory(editingChallenge.category); setManualDeadline(editingChallenge.deadlineTime || ''); setFrequency(editingChallenge.frequency || 'daily');
      if (editingChallenge.frequency === 'custom' && editingChallenge.customFrequencyDays) { setCustomFreqDays(editingChallenge.customFrequencyDays); }
      const start = new Date(editingChallenge.startDate); setStartDateStr(getLocalDateString(start));
      const end = new Date(start.getTime() + (editingChallenge.durationDays - 1) * 86400000); setEndDateStr(getLocalDateString(end));
    } else {
      setManualTitle(''); setManualDesc(''); setManualCategory(ChallengeCategory.OTHER); setManualDeadline(''); setFrequency('daily'); setCustomFreqDays(5); setStartDateStr(getLocalDateString());
      const d = new Date(); d.setDate(d.getDate() + 6); setEndDateStr(getLocalDateString(d));
    }
  }, [editingChallenge, isOpen]);

  const handleManualSave = () => {
    if (!manualTitle.trim()) return;
    const [sY, sM, sD] = startDateStr.split('-').map(Number); const startLocal = new Date(sY, sM - 1, sD); 
    const [eY, eM, eD] = endDateStr.split('-').map(Number); const endLocal = new Date(eY, eM - 1, eD);
    if (endLocal < startLocal) { alert("End date must be after start date"); return; }
    const diffTime = Math.abs(endLocal.getTime() - startLocal.getTime()); const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const challengeData: any = { title: manualTitle, description: manualDesc, category: manualCategory, deleteApprovals: editingChallenge?.deleteApprovals || [], deadlineTime: manualDeadline || null, startDate: startLocal.toISOString(), durationDays: durationDays, frequency: frequency, customFrequencyDays: frequency === 'custom' ? customFreqDays : undefined };

    if (editingChallenge) {
      onSave({ ...editingChallenge, ...challengeData });
    } else {
      const tasks: DayTask[] = []; const startMs = startLocal.getTime();
      for (let i = 0; i < durationDays; i++) {
         const currentDate = new Date(startMs + i * 86400000); let shouldInclude = false;
         switch (frequency) { case 'daily': shouldInclude = true; break; case '2days': shouldInclude = (i % 2 === 0); break; case '3days': shouldInclude = (i % 3 === 0); break; case 'weekly': shouldInclude = (i % 7 === 0); break; case 'weekdays': const day = currentDate.getDay(); shouldInclude = (day !== 0 && day !== 6); break; case 'custom': shouldInclude = (i % customFreqDays === 0); break; default: shouldInclude = true; }
         if (shouldInclude) { tasks.push({ dayNumber: i + 1, title: `Day ${i + 1}`, description: 'Complete your daily goal.', isCompleted: false, completedBy: [] }); }
      }
      onSave({ id: Date.now().toString(), groupId, createdAt: Date.now(), color: 'blue', tasks, mode: 'solo', status: 'active', ...challengeData } as Challenge);
    }
    onClose();
  };
  const activeCategoryStyle = CATEGORY_STYLES[manualCategory];
  const calculateDisplayDuration = () => { const [sY, sM, sD] = startDateStr.split('-').map(Number); const s = new Date(sY, sM - 1, sD); const [eY, eM, eD] = endDateStr.split('-').map(Number); const e = new Date(eY, eM - 1, eD); if(isNaN(s.getTime()) || isNaN(e.getTime())) return 0; return Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1; }
  const FREQUENCIES = [ { id: 'daily', label: 'Every Day', desc: 'Consistency is key' }, { id: 'weekdays', label: 'Weekdays', desc: 'Mon - Fri only' }, { id: '2days', label: 'Every 2 Days', desc: 'Rest days included' }, { id: '3days', label: 'Every 3 Days', desc: 'Lighter pace' }, { id: 'weekly', label: 'Weekly', desc: 'Once a week' }, { id: 'custom', label: 'Custom', desc: 'Set your own interval' }, ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className={`relative overflow-hidden px-8 py-8 transition-colors duration-500 ${activeCategoryStyle.themeColor} text-white`}><div className="absolute top-0 right-0 p-10 opacity-10 transform translate-x-10 -translate-y-10 pointer-events-none"><span className="text-9xl">{activeCategoryStyle.icon}</span></div><div className="relative z-10"><h2 className="text-3xl font-extrabold tracking-tight mb-2">{editingChallenge ? 'Edit Challenge' : 'New Challenge'}</h2><p className="text-white/90 font-medium text-lg">What habit are we building today?</p></div><button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all backdrop-blur-sm"><IconPlus className="w-6 h-6 rotate-45" /></button></div>
      <div className="p-8 space-y-8 overflow-y-auto bg-slate-900 max-h-[70vh]">
         <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Challenge Name</label><input type="text" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="e.g. Early Morning Run" className="w-full text-3xl font-extrabold placeholder:text-slate-600 border-b-2 border-slate-700 py-3 focus:border-indigo-500 focus:outline-none transition-colors text-white bg-transparent" autoFocus={!editingChallenge}/></div>
         <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Category</label><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Object.values(ChallengeCategory).map(cat => { const style = CATEGORY_STYLES[cat]; const isSelected = manualCategory === cat; return (<button key={cat} onClick={() => setManualCategory(cat)} className={`relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2 group ${isSelected ? `${style.border} ${style.bg} ring-2 ring-offset-2 ring-slate-700` : 'border-slate-800 bg-slate-800 hover:bg-slate-700 hover:border-slate-600'}`}><span className={`text-3xl transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>{style.icon}</span><span className={`text-sm font-bold ${isSelected ? style.text : 'text-slate-500'}`}>{cat}</span></button>); })}</div></div>
         {!editingChallenge && (<div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Schedule Frequency</label><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">{FREQUENCIES.map(f => (<button key={f.id} onClick={() => setFrequency(f.id as any)} className={`text-left p-4 rounded-2xl border transition-all ${frequency === f.id ? 'border-indigo-500 bg-indigo-900/20 ring-1 ring-indigo-500' : 'border-slate-700 hover:bg-slate-800'}`}><span className={`block font-bold ${frequency === f.id ? 'text-indigo-400' : 'text-slate-200'}`}>{f.label}</span><span className="text-xs text-slate-500">{f.desc}</span></button>))}</div>{frequency === 'custom' && (<div className="animate-fade-in-up bg-indigo-900/20 p-4 rounded-2xl border border-indigo-500/30 flex items-center gap-4"><div className="p-3 bg-slate-800 rounded-xl text-indigo-400 shadow-sm"><IconClock className="w-6 h-6" /></div><div className="flex-1"><label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Repeat Every</label><div className="flex items-center gap-3"><input type="number" min="1" max="365" value={customFreqDays} onChange={(e) => setCustomFreqDays(Math.max(1, parseInt(e.target.value) || 1))} className="w-24 px-4 py-2 bg-slate-800 border border-indigo-500/50 rounded-xl font-black text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"/><span className="font-bold text-indigo-400">Days</span></div></div></div>)}</div>)}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-4"><div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Start Date</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><IconCalendar className="w-5 h-5" /></div><input type="date" value={startDateStr} onChange={(e) => setStartDateStr(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-slate-700 focus:border-slate-500 outline-none transition-all font-bold text-white [color-scheme:dark]"/></div></div><div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">End Date</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><IconCalendar className="w-5 h-5" /></div><input type="date" value={endDateStr} onChange={(e) => setEndDateStr(e.target.value)} min={startDateStr} className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-slate-700 focus:border-slate-500 outline-none transition-all font-bold text-white [color-scheme:dark]"/></div></div></div><div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Daily Deadline</label><div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><IconClock className="w-5 h-5" /></div><input type="time" value={manualDeadline} onChange={(e) => setManualDeadline(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-slate-700 focus:border-slate-500 outline-none transition-all font-bold text-white [color-scheme:dark]"/></div><p className="text-xs text-slate-500 mt-2 font-medium">Tasks lock after this time daily.</p><div className="mt-6 p-4 bg-indigo-900/20 rounded-2xl border border-indigo-500/30"><p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Total Duration</p><p className="text-2xl font-black text-indigo-400">{calculateDisplayDuration()} Days</p></div></div></div>
         <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Description & Rules</label><textarea value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} placeholder="Describe the rules, penalties, or rewards..." rows={3} className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-4 focus:ring-slate-700 focus:border-slate-500 outline-none transition-all font-medium text-white resize-none placeholder:text-slate-600"/></div>
      </div>
      <div className="p-6 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky bottom-0 z-20"><button onClick={handleManualSave} disabled={!manualTitle.trim()} className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${activeCategoryStyle.themeColor}`}>{editingChallenge ? 'Save Changes' : 'Launch Challenge'} <IconSparkles className="w-5 h-5" /></button></div>
    </Modal>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  
  // Notification State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: false,
    dailyReminder: false,
    reminderTime: '09:00',
    deadlineAlert: false
  });
  
  // Results Modal State
  const [resultsChallenge, setResultsChallenge] = useState<Challenge | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  // Force re-render to update timers
  const [, setTick] = useState(0);

  // Load User ID and Groups
  useEffect(() => {
    let uid = localStorage.getItem(USER_ID_KEY);
    if (!uid) {
      uid = generateId();
      localStorage.setItem(USER_ID_KEY, uid);
    }
    setCurrentUserId(uid);

    const savedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (savedGroups) {
      try {
        const parsed = JSON.parse(savedGroups);
        setGroups(parsed);
      } catch (e) {
        console.error("Failed to load groups", e);
      }
    }
    
    // Load Notification Settings
    const savedNotif = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedNotif) {
      setNotificationSettings(JSON.parse(savedNotif));
    }

    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Save Groups to Storage
  useEffect(() => {
    if (groups.length > 0 || localStorage.getItem(GROUPS_STORAGE_KEY)) {
       localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
    }
  }, [groups]);

  // Sync groups across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === GROUPS_STORAGE_KEY && e.newValue) {
        setGroups(JSON.parse(e.newValue));
      }
      if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
        setNotificationSettings(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // --- Notification Logic ---
  const sendNotification = (title: string, body: string, tag: string) => {
    if (!notificationSettings.enabled || Notification.permission !== 'granted') return;
    
    // Simple check to prevent spamming the same notification tag within the same day
    const historyKey = NOTIFICATION_HISTORY_KEY;
    const history = JSON.parse(localStorage.getItem(historyKey) || '{}');
    const today = new Date().toDateString();
    
    if (history[tag] === today) return;

    new Notification(title, { body, icon: '/favicon.ico' });
    
    history[tag] = today;
    localStorage.setItem(historyKey, JSON.stringify(history));
  };

  useEffect(() => {
    if (!notificationSettings.enabled || !groups.length) return;

    const checkNotifications = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM

      // 1. Daily Reminder
      if (notificationSettings.dailyReminder && currentTime === notificationSettings.reminderTime) {
        let hasPendingTasks = false;
        groups.forEach(g => {
          g.challenges.forEach(c => {
            const task = c.tasks.find(t => isTaskForToday(c.startDate, t.dayNumber));
            if (task && !task.completedBy?.includes(currentUserId)) {
              hasPendingTasks = true;
            }
          });
        });

        if (hasPendingTasks) {
          sendNotification('Daily Reminder', 'You have pending tasks for today. Keep your streak alive!', 'daily_reminder');
        }
      }

      // 2. Deadline Alerts (1 hour before deadline)
      if (notificationSettings.deadlineAlert) {
        groups.forEach(g => {
          g.challenges.forEach(c => {
            if (c.deadlineTime) {
              const task = c.tasks.find(t => isTaskForToday(c.startDate, t.dayNumber));
              if (task && !task.completedBy?.includes(currentUserId)) {
                const [h, m] = c.deadlineTime.split(':').map(Number);
                const deadlineDate = new Date();
                deadlineDate.setHours(h, m, 0, 0);
                
                // Calculate difference in minutes
                const diffMs = deadlineDate.getTime() - now.getTime();
                const diffMins = Math.round(diffMs / 60000);

                // Notify if between 55 and 65 minutes remaining (approx 1 hour)
                if (diffMins >= 55 && diffMins <= 65) {
                   sendNotification('Deadline Approaching', `1 hour left to complete "${c.title}"!`, `deadline_${c.id}_${task.dayNumber}`);
                }
              }
            }
          });
        });
      }
    };

    const timer = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [notificationSettings, groups, currentUserId]);


  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const currentUserMember = selectedGroup?.members.find(m => m.userId === currentUserId);

  const handleCreateGroup = (name: string, icon: string, theme: string) => {
    const newGroup: Group = {
      id: generateId(),
      name,
      icon,
      theme,
      members: [{
        userId: currentUserId,
        displayName: 'Admin',
        avatar: '👑',
        role: 'admin',
        joinedAt: Date.now()
      }],
      pendingRequests: [],
      challenges: [],
      createdAt: Date.now()
    };
    setGroups([...groups, newGroup]);
    triggerConfetti();
  };

  const handleUpdateProfile = (name: string, avatar: string) => {
    if (!selectedGroup) return;
    const updatedGroups = groups.map(g => {
      if (g.id === selectedGroup.id) {
        return {
          ...g,
          members: g.members.map(m => m.userId === currentUserId ? { ...m, displayName: name, avatar } : m)
        };
      }
      return g;
    });
    setGroups(updatedGroups);
  };

  const handleUpdateGroup = (name: string, icon: string, theme: string, penaltyConfig?: { threshold: number, description: string }) => {
    if (!selectedGroup) return;
    const updatedGroups = groups.map(g => {
      if (g.id === selectedGroup.id) {
        return { ...g, name, icon, theme, penaltyConfig };
      }
      return g;
    });
    setGroups(updatedGroups);
  };

  const handleVoteDeleteGroup = () => {
     if (!selectedGroup) return;
     const updatedGroups = groups.map(g => {
       if (g.id === selectedGroup.id) {
         const approvals = g.deleteApprovals || [];
         const hasVoted = approvals.includes(currentUserId);
         let newApprovals = hasVoted 
            ? approvals.filter(id => id !== currentUserId)
            : [...approvals, currentUserId];
         
         if (newApprovals.length >= g.members.length) {
            return null;
         }
         return { ...g, deleteApprovals: newApprovals };
       }
       return g;
     }).filter(Boolean) as Group[];
     
     setGroups(updatedGroups);
     if (updatedGroups.length === 0) setSelectedGroupId(null);
     else if (!updatedGroups.find(g => g.id === selectedGroupId)) setSelectedGroupId(null);
     
     setShowSettings(false);
  };

  const handleSaveChallenge = (challenge: Challenge) => {
    if (!selectedGroup) return;
    const updatedGroups = groups.map(g => {
       if (g.id === selectedGroup.id) {
         const existingIndex = g.challenges.findIndex(c => c.id === challenge.id);
         let newChallenges = [...g.challenges];
         if (existingIndex >= 0) {
           newChallenges[existingIndex] = challenge;
         } else {
           newChallenges.push(challenge);
         }
         return { ...g, challenges: newChallenges };
       }
       return g;
    });
    setGroups(updatedGroups);
  };

  const handleDeleteChallenge = (challengeId: string) => {
    if (!selectedGroup) return;
    const updatedGroups = groups.map(g => {
      if (g.id === selectedGroup.id) {
        return {
          ...g,
          challenges: g.challenges.filter(c => c.id !== challengeId)
        };
      }
      return g;
    });
    setGroups(updatedGroups);
  };

  const handleToggleTask = (challengeId: string, dayNumber: number) => {
     if (!selectedGroup) return;

     const group = selectedGroup;
     const challenge = group.challenges.find(c => c.id === challengeId);
     if (!challenge) return;

     if (!isTaskForToday(challenge.startDate, dayNumber)) {
        return; 
     }
     
     if (isDeadlinePassed(challenge.deadlineTime)) {
        return; 
     }

     const updatedGroups = groups.map(g => {
        if (g.id === selectedGroup.id) {
           return {
             ...g,
             challenges: g.challenges.map(c => {
               if (c.id === challengeId) {
                  const newTasks = c.tasks.map(t => {
                    if (t.dayNumber === dayNumber) {
                       const currentCompletions = t.completedBy || [];
                       const isAlreadyCompleted = currentCompletions.includes(currentUserId);
                       
                       let newCompletions;
                       if (isAlreadyCompleted) {
                           newCompletions = currentCompletions.filter(id => id !== currentUserId);
                       } else {
                           newCompletions = [...currentCompletions, currentUserId];
                           triggerConfetti();
                           const myCompletedCount = c.tasks.filter(x => x.completedBy?.includes(currentUserId)).length + 1;
                           const progress = Math.round(myCompletedCount / c.tasks.length * 100);
                           getMotivation(c.title, progress).then(quote => console.log(quote)).catch(console.error);
                       }
                       
                       return { ...t, completedBy: newCompletions, isCompleted: newCompletions.length > 0 };
                    }
                    return t;
                  });
                  return { ...c, tasks: newTasks };
               }
               return c;
             })
           };
        }
        return g;
     });
     setGroups(updatedGroups);
  };

  const handleUpdateMember = (userId: string, updates: Partial<GroupMember>) => {
      if (!selectedGroup) return;
      const updatedGroups = groups.map(g => {
          if (g.id === selectedGroup.id) {
              return {
                  ...g,
                  members: g.members.map(m => m.userId === userId ? { ...m, ...updates } : m)
              };
          }
          return g;
      });
      setGroups(updatedGroups);
  };

  const renderChallengeCard = (challenge: Challenge) => {
    const completedTasksCount = challenge.tasks.filter(t => t.completedBy?.includes(currentUserId)).length;
    const taskCount = challenge.tasks.length;
    const progress = taskCount > 0 ? (completedTasksCount / taskCount) * 100 : 0;
    const style = CATEGORY_STYLES[challenge.category] || CATEGORY_STYLES[ChallengeCategory.OTHER];

    const startDate = new Date(challenge.startDate);
    const now = new Date();
    now.setHours(0,0,0,0);
    
    const start = new Date(challenge.startDate);
    start.setHours(0,0,0,0);

    const end = new Date(start);
    end.setDate(start.getDate() + challenge.durationDays - 1); 

    let status = 'Active';
    let statusColor = 'bg-emerald-900/30 text-emerald-400 border border-emerald-800';
    let subText = '';

    const diffTime = now.getTime() - start.getTime();
    const currentDayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (now < start) {
        status = 'Upcoming';
        statusColor = 'bg-blue-900/30 text-blue-400 border border-blue-800';
        const daysToStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        subText = `Starts in ${daysToStart} days`;
    } else if (now > end) {
        status = 'Finished';
        statusColor = 'bg-slate-800 text-slate-400 border border-slate-700';
        subText = 'Challenge ended';
    } else {
        status = 'Active';
        statusColor = 'bg-rose-900/30 text-rose-400 border border-rose-800 animate-pulse';
        subText = `Day ${currentDayIndex} of ${challenge.durationDays}`;
    }

    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <div key={challenge.id} className="bg-slate-800 rounded-[2rem] p-6 shadow-lg border border-slate-700 hover:shadow-2xl hover:shadow-indigo-900/20 transition-all duration-300 group relative flex flex-col h-full overflow-hidden">
         <div className={`absolute top-0 right-0 w-32 h-32 ${style.bg} rounded-bl-[4rem] opacity-50 -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
         <div className="flex justify-between items-start mb-6 relative z-10">
            <div className={`w-12 h-12 rounded-2xl ${style.bg} flex items-center justify-center text-2xl shadow-sm ring-1 ring-white/10`}>
               {style.icon}
            </div>
             <div className="flex gap-1">
               <button onClick={() => { setResultsChallenge(challenge); setShowResultsModal(true); }} className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 rounded-xl transition-colors" title="View Leaderboard"><IconChart className="w-5 h-5" /></button>
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                 <button onClick={() => { setEditingChallenge(challenge); setShowCreateChallenge(true); }} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-900/30 rounded-xl transition-colors"><IconEdit className="w-5 h-5" /></button>
                 <button onClick={() => handleDeleteChallenge(challenge.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/30 rounded-xl transition-colors"><IconTrash className="w-5 h-5" /></button>
               </div>
            </div>
         </div>
         <div className="mb-6 relative z-10 flex-1">
             <div className="flex items-center gap-2 mb-2"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>{status}</span><span className="text-xs font-bold text-slate-400 flex items-center gap-1"><IconCalendar className="w-3 h-3" /> {formatDate(start)} - {formatDate(end)}</span></div>
             <h3 className="text-2xl font-black text-white leading-tight mb-1">{challenge.title}</h3>
             <div className="flex items-center gap-3 text-sm font-medium text-slate-400"><span>{subText}</span>{challenge.deadlineTime && (<span className="flex items-center gap-1 text-orange-400 bg-orange-900/20 border border-orange-900/50 px-2 py-0.5 rounded-md text-xs font-bold"><IconClock className="w-3 h-3" /> {challenge.deadlineTime}</span>)}</div>
         </div>
         <div className="mb-6 relative z-10"><div className="flex justify-between items-end mb-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Progress</span><span className={`text-lg font-black ${style.text}`}>{Math.round(progress)}%</span></div><ProgressBar progress={progress} color={style.bar} className="h-3" /></div>
         <div className="relative z-10">
            <div className="flex gap-2 overflow-x-auto pb-4 pt-1 scrollbar-hide -mx-2 px-2 mask-linear-fade">
               {challenge.tasks.map((task, i) => {
                  const dayNum = task.dayNumber;
                  const isToday = isTaskForToday(challenge.startDate, dayNum);
                  const isPast = isTaskInPast(challenge.startDate, dayNum);
                  const deadlinePassed = isToday && isDeadlinePassed(challenge.deadlineTime);
                  const isLocked = !isToday && !isPast; 
                  const taskDate = getTaskDate(challenge.startDate, dayNum);
                  const taskDateString = taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const isCompletedByMe = task.completedBy?.includes(currentUserId);
                  let bg = 'bg-slate-700/50'; let text = 'text-slate-500'; let border = 'border-transparent'; let content = <span className="text-sm font-bold">{dayNum}</span>;
                  if (isCompletedByMe) { bg = style.bg; text = style.text; content = <IconCheck className="w-5 h-5" />; } else if (isPast) { bg = 'bg-red-900/20'; text = 'text-red-400'; content = <IconLock className="w-4 h-4" />; } else if (isToday) { if (deadlinePassed) { bg = 'bg-slate-800'; text = 'text-slate-600'; content = <IconLock className="w-4 h-4" />; } else { bg = 'bg-white'; text = 'text-slate-900'; border = 'border-white shadow-lg shadow-white/10 scale-110'; } } else { content = <span className="text-xs font-bold opacity-50">{dayNum}</span> }
                  
                  const tooltipText = `${task.title}${task.description ? `\n${task.description}` : ''}\n\n${taskDateString} • ${isCompletedByMe ? 'Done' : (isPast ? 'Missed' : 'Pending')}`;

                  return (<button key={dayNum} onClick={() => handleToggleTask(challenge.id, dayNum)} disabled={isLocked || (isToday && deadlinePassed) || (isPast && !isCompletedByMe)} title={tooltipText} className={`relative flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${bg} ${text} border-2 ${border} ${(isToday && !deadlinePassed) ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}>{content}{isToday && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-current"></div>}</button>);
               })}
            </div>
         </div>
      </div>
    );
  };

  if (groups.length === 0) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
           <div className="max-w-md w-full text-center space-y-8">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-indigo-900/50 rotate-3 ring-1 ring-white/10">
                 <IconFlame className="w-12 h-12 text-white" />
              </div>
              <div>
                 <h1 className="text-4xl font-black text-white mb-2">Habit Hero</h1>
                 <p className="text-slate-400 text-lg">Build better habits together with friends.</p>
              </div>
              <button 
                onClick={() => setShowCreateGroup(true)}
                className="w-full py-4 bg-white text-slate-900 font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-lg"
              >
                 <IconPlus className="w-5 h-5" /> Create Your First Team
              </button>
              
              <CreateGroupModal 
                isOpen={showCreateGroup} 
                onClose={() => setShowCreateGroup(false)} 
                onCreate={handleCreateGroup} 
              />
           </div>
        </div>
      );
  }

  // --- DASHBOARD VIEW (Card List) ---
  if (!selectedGroupId) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 md:p-10 font-sans">
         <div className="max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
               <div className="text-center md:text-left">
                 <h1 className="text-4xl font-black text-white mb-2">My Teams</h1>
                 <p className="text-slate-400 font-medium text-lg">Select a team to view challenges.</p>
               </div>
               <button 
                 onClick={() => setShowCreateGroup(true)}
                 className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all shadow-xl shadow-white/5 hover:-translate-y-1"
               >
                 <IconPlus className="w-5 h-5" /> Create New Team
               </button>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {groups.map(g => {
                  const theme = GROUP_THEMES[g.theme || 'indigo'];
                  const memberCount = g.members.length;
                  const challengeCount = g.challenges.length;
                  const myProfile = g.members.find(m => m.userId === currentUserId);
                  
                  return (
                    <div 
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-lg hover:shadow-2xl hover:shadow-indigo-900/20 hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden"
                    >
                       <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${theme.from} ${theme.to}`}></div>
                       
                       <div className="flex justify-between items-start mb-6">
                          <div className={`w-20 h-20 rounded-3xl ${theme.bg} flex items-center justify-center text-4xl shadow-inner border-4 border-slate-800 ring-2 ${theme.ring} ring-opacity-20`}>
                             {renderGroupIcon(g.icon)}
                          </div>
                          {myProfile?.role === 'admin' && (
                             <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${theme.bg} ${theme.text} border ${theme.border}`}>Admin</span>
                          )}
                       </div>
                       
                       <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{g.name}</h2>
                       <p className="text-slate-500 text-sm font-medium mb-8">Created {new Date(g.createdAt).toLocaleDateString()}</p>
                       
                       <div className="flex items-center gap-6 pt-6 border-t border-slate-800">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                             <IconUsers className="w-5 h-5 text-slate-500" /> {memberCount}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                             <IconFlame className="w-5 h-5 text-slate-500" /> {challengeCount}
                          </div>
                          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
                             <span className={`flex items-center justify-center w-10 h-10 rounded-full ${theme.bg} ${theme.text}`}>
                                <IconArrowLeft className="w-5 h-5 rotate-180" />
                             </span>
                          </div>
                       </div>
                    </div>
                  )
               })}
            </div>
         </div>
         <CreateGroupModal 
           isOpen={showCreateGroup} 
           onClose={() => setShowCreateGroup(false)} 
           onCreate={handleCreateGroup} 
         />
      </div>
    );
  }

  // --- ACTIVE GROUP VIEW ---

  if (!selectedGroup) return null;

  const themeStyle = GROUP_THEMES[selectedGroup.theme || 'indigo'];

  if (!currentUserMember && selectedGroup) {
     return (
       <GroupProfileSetup 
         groupName={selectedGroup.name}
         theme={selectedGroup.theme}
         onComplete={(name, avatar) => {
            const newMember: GroupMember = {
               userId: currentUserId,
               displayName: name,
               avatar: avatar,
               role: 'member',
               joinedAt: Date.now()
            };
            const updatedGroups = groups.map(g => g.id === selectedGroup.id ? { ...g, members: [...g.members, newMember] } : g);
            setGroups(updatedGroups);
         }}
         onCancel={() => setSelectedGroupId(null)}
       />
     );
  }

  // --- Calculate Today's Tasks for Todo List ---
  const todaysTasks = selectedGroup.challenges.flatMap(challenge => {
      // Find tasks that match today's date
      return challenge.tasks
        .filter(t => isTaskForToday(challenge.startDate, t.dayNumber))
        .map(task => ({ challenge, task }));
  });

  const todayTotal = todaysTasks.length;
  const todayCompleted = todaysTasks.filter(item => item.task.completedBy?.includes(currentUserId)).length;
  const todayProgress = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
         
         <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
               {/* Back Button */}
               <button 
                 onClick={() => setSelectedGroupId(null)}
                 className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 shadow-sm transition-all"
               >
                 <IconArrowLeft className="w-6 h-6" />
               </button>

               <div>
                  <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-3xl md:text-4xl font-black text-white">{selectedGroup.name}</h1>
                  </div>
                  <p className="text-slate-400 font-medium flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${themeStyle.light}`}></span>
                      {selectedGroup.members.length} Members
                      <span className="text-slate-600">•</span>
                      {selectedGroup.challenges.length} Active Challenges
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-3">
               <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 border border-slate-700 shadow-sm mr-2" title="You">
                  {renderGroupIcon(currentUserMember?.avatar || '👤')}
               </div>

               <div className="flex -space-x-3 mr-4">
                  {selectedGroup.members.slice(0, 5).map(m => (
                     <div key={m.userId} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 overflow-hidden" title={m.displayName}>
                        {renderGroupIcon(m.avatar)}
                     </div>
                  ))}
                  <button onClick={() => setShowMembers(true)} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 hover:bg-slate-700 transition-colors">
                     <IconUsers className="w-4 h-4" />
                  </button>
               </div>
               
               <button onClick={() => setShowPenaltyModal(true)} className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-red-400 hover:border-red-900/50 transition-all shadow-sm" title="Penalties">
                  <IconGavel className="w-6 h-6" />
               </button>

               <button onClick={() => setShowActivityLog(true)} className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-indigo-400 hover:border-indigo-900/50 transition-all shadow-sm" title="Activity Log">
                  <IconList className="w-6 h-6" />
               </button>

               <button onClick={() => setShowSettings(true)} className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition-all shadow-sm">
                  <IconSettings className="w-6 h-6" />
               </button>
               
               <button 
                  onClick={() => { setEditingChallenge(null); setShowCreateChallenge(true); }}
                  className={`px-4 md:px-6 py-3 ${themeStyle.bg} ${themeStyle.text} rounded-xl font-bold transition-all hover:brightness-125 flex items-center gap-2 shadow-sm shrink-0`}
               >
                  <IconPlus className="w-5 h-5" /> 
                  <span className="hidden md:inline">New Challenge</span>
               </button>
            </div>
         </header>

         {/* Today's Focus Section */}
         {todaysTasks.length > 0 && (
            <div className="mb-10 bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-lg border border-slate-800 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-2 h-full ${themeStyle.bg}`}></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">
                            <IconCalendar className="w-4 h-4" /> {dateStr}
                        </div>
                        <h2 className="text-2xl font-black text-white">Today's Focus</h2>
                    </div>
                    <div className="w-full md:w-64">
                         <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                            <span>Daily Progress</span>
                            <span>{Math.round(todayProgress)}%</span>
                         </div>
                         <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${themeStyle.bg}`} 
                              style={{ width: `${todayProgress}%` }}
                            ></div>
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todaysTasks.map(({ challenge, task }) => {
                        const style = CATEGORY_STYLES[challenge.category];
                        const isCompleted = task.completedBy?.includes(currentUserId);
                        const deadlinePassed = isDeadlinePassed(challenge.deadlineTime);
                        const isDisabled = !isCompleted && deadlinePassed;

                        return (
                            <div 
                                key={`${challenge.id}-${task.dayNumber}`}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${isCompleted ? 'bg-slate-800/50 border-slate-800 opacity-60' : 'bg-slate-800 border-slate-700 shadow-md hover:shadow-lg hover:-translate-y-1'}`}
                            >
                                <button 
                                    onClick={() => handleToggleTask(challenge.id, task.dayNumber)}
                                    disabled={isDisabled}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${isCompleted ? `${style.bg} ${style.text}` : `bg-slate-700 text-slate-400 hover:bg-slate-600`} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isCompleted ? <IconCheck className="w-6 h-6" /> : (isDisabled ? <IconLock className="w-5 h-5" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-500"></div>)}
                                </button>
                                <div>
                                    <h4 className={`font-bold text-white ${isCompleted ? 'line-through text-slate-500' : ''}`}>{challenge.title}</h4>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-0.5">
                                        <span>{style.icon} {challenge.category}</span>
                                        {challenge.deadlineTime && (
                                            <span className="flex items-center gap-1 text-orange-400 bg-orange-900/20 px-1.5 rounded border border-orange-900/30">
                                                <IconClock className="w-3 h-3" /> {challenge.deadlineTime}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
         )}

         {selectedGroup.challenges.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
               {selectedGroup.challenges.map(renderChallengeCard)}
            </div>
         ) : (
            <div className="bg-slate-900 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-800 flex flex-col items-center">
               <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-600">
                  <IconFlame className="w-10 h-10" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">No challenges yet</h3>
               <p className="text-slate-400 max-w-md mb-8">Start a new challenge to get the team moving!</p>
               <button 
                  onClick={() => { setEditingChallenge(null); setShowCreateChallenge(true); }}
                  className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold shadow-xl hover:scale-105 transition-transform"
               >
                  Create Challenge
               </button>
            </div>
         )}
      </main>

      <CreateGroupModal 
         isOpen={showCreateGroup} 
         onClose={() => setShowCreateGroup(false)} 
         onCreate={handleCreateGroup} 
      />
      
      {showSettings && (
         <SettingsModal 
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            group={selectedGroup}
            currentUserId={currentUserId}
            onUpdateProfile={handleUpdateProfile}
            onUpdateGroup={handleUpdateGroup}
            onVoteDeleteGroup={handleVoteDeleteGroup}
         />
      )}

      {showPenaltyModal && (
         <PenaltyModal
            isOpen={showPenaltyModal}
            onClose={() => setShowPenaltyModal(false)}
            group={selectedGroup}
            onUpdateMember={handleUpdateMember}
         />
      )}

      {showActivityLog && (
        <ActivityLogModal
          isOpen={showActivityLog}
          onClose={() => setShowActivityLog(false)}
          group={selectedGroup}
        />
      )}

      {showCreateChallenge && (
         <CreateChallengeModalWrapper
            isOpen={showCreateChallenge}
            onClose={() => setShowCreateChallenge(false)}
            onSave={handleSaveChallenge}
            editingChallenge={editingChallenge}
            groupId={selectedGroup.id}
         />
      )}

      {showResultsModal && resultsChallenge && selectedGroup && (
         <ChallengeResultsModal 
            isOpen={showResultsModal}
            onClose={() => setShowResultsModal(false)}
            challenge={resultsChallenge}
            group={selectedGroup}
            currentUserId={currentUserId}
         />
      )}
    </div>
  );
};

export default App;