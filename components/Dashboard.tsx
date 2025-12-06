import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie 
} from 'recharts';
import { Clock, TrendingUp, BookOpen, Calendar, Target, Zap, Award, CheckCircle2, Pencil, X, Save, User as UserIcon, Bell, Sun } from 'lucide-react';
import { StudySession, MockTestResult, Routine, User, Goal, RoutineItem } from '../types';
import { getRemainingUsage } from '../services/usageService';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
  isDarkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, isDarkMode }) => {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [mockResults, setMockResults] = useState<MockTestResult[]>([]);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [usageLeft, setUsageLeft] = useState(50);
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  // Daily Routine Modal State
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [todaysTasks, setTodaysTasks] = useState<RoutineItem[]>([]);

  useEffect(() => {
    const savedSessions = localStorage.getItem('studySessions');
    if (savedSessions) {
      const allSessions: StudySession[] = JSON.parse(savedSessions);
      // Security Check: Filter data by userId
      setStudySessions(allSessions.filter(s => s.userId === user?.id));
    }

    const savedResults = localStorage.getItem('mockResults');
    if (savedResults) {
      const allResults: MockTestResult[] = JSON.parse(savedResults);
      // Security Check: Filter data by userId
      setMockResults(allResults.filter(r => r.userId === user?.id));
    }

    const savedRoutine = localStorage.getItem('myRoutine');
    let currentRoutine: Routine | null = null;
    if (savedRoutine) {
      currentRoutine = JSON.parse(savedRoutine);
      setRoutine(currentRoutine);
    }

    setUsageLeft(getRemainingUsage(user?.id));

    // --- Daily Reminder Logic ---
    const checkDailyReminder = () => {
      if (!currentRoutine || !currentRoutine.items.length) return;

      const todayStr = new Date().toISOString().split('T')[0];
      const lastReminded = localStorage.getItem('last_daily_reminder');

      // Check if we already showed it today
      if (lastReminded === todayStr) return;

      // Filter tasks for today
      const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }); // e.g., "Monday"
      
      // We look for tasks that match today's name OR if it's a generic "Day 1" style routine (fallback to first few items)
      let todayItems = currentRoutine.items.filter(item => 
        item.day.toLowerCase().includes(todayName.toLowerCase())
      );

      // Fallback: If no day matches (e.g., routine is "Day 1, Day 2"), and it's a daily cycle, maybe show the first 3
      if (todayItems.length === 0 && currentRoutine.items.length > 0) {
         // Simple fallback logic: Show items but don't force it if specific days are mapped
         // Only fallback if the routine looks sequential "Day 1" not "Monday"
         if (currentRoutine.items[0].day.includes('Day')) {
            todayItems = currentRoutine.items.slice(0, 4); // Just show first few as "Daily Focus"
         }
      }

      if (todayItems.length > 0) {
        setTodaysTasks(todayItems);
        setShowDailyModal(true);
        localStorage.setItem('last_daily_reminder', todayStr);
        triggerSystemNotification(todayItems.length, user?.name || "Aimer");
      }
    };

    // Small delay to ensure UI is ready
    const timer = setTimeout(checkDailyReminder, 1000);
    return () => clearTimeout(timer);

  }, [user]);

  const triggerSystemNotification = (taskCount: number, userName: string) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification("Good Morning, Aimer! ☀️", {
        body: `You have ${taskCount} tasks scheduled for today. Let's hit that goal!`,
        icon: '/favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification("Good Morning, Aimer! ☀️", {
            body: `You have ${taskCount} tasks scheduled for today. Let's hit that goal!`,
            icon: '/favicon.ico'
          });
        }
      });
    }
  };

  // Calculate stats
  const totalStudyMinutes = studySessions.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalHours = (totalStudyMinutes / 60).toFixed(1);
  
  const subjectData = studySessions.reduce((acc: any, curr) => {
    acc[curr.subject] = (acc[curr.subject] || 0) + curr.durationMinutes / 60;
    return acc;
  }, {});

  const chartData = Object.keys(subjectData).map(subj => ({
    name: subj,
    hours: parseFloat(subjectData[subj].toFixed(1))
  }));

  const avgScore = mockResults.length > 0 
    ? (mockResults.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) / mockResults.length).toFixed(0)
    : "0";

  // Progress Calculation
  const TARGET_HOURS = 100;
  const studyProgressRaw = (totalStudyMinutes / 60) / TARGET_HOURS * 100;
  const studyScore = Math.min(studyProgressRaw, 100);

  const mockScoreNum = parseFloat(avgScore);

  let weightedProgress = 0;
  if (mockResults.length > 0) {
    weightedProgress = (studyScore * 0.4) + (mockScoreNum * 0.6);
  } else {
    weightedProgress = studyScore;
  }
  const finalProgress = Math.round(weightedProgress);

  const progressData = [
    { name: 'Progress', value: finalProgress },
    { name: 'Remaining', value: 100 - finalProgress }
  ];
  const progressColors = ['#4f46e5', isDarkMode ? '#1e293b' : '#f1f5f9'];

  const upcomingTasks = routine?.items.slice(0, 4) || [];

  const openEditModal = () => {
    if (user) {
      setEditForm({ ...user });
      setIsEditing(true);
    }
  };

  const handleSaveProfile = () => {
    if (user && editForm) {
      const updatedUser = { ...user, ...editForm } as User;
      onUpdateUser(updatedUser);
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Daily Routine Modal */}
      {showDailyModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-indigo-100 dark:border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative">
               <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Sun size={100} />
               </div>
               <div className="relative z-10">
                 <h2 className="text-2xl font-bold flex items-center gap-2">
                    Good Morning, {user?.name.split(' ')[0]}! ☀️
                 </h2>
                 <p className="text-indigo-100 mt-1">Here is your study plan for today.</p>
               </div>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
               <div className="space-y-3">
                 {todaysTasks.map((task, idx) => (
                   <div key={idx} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 items-start">
                      <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-700 border border-indigo-100 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                         {task.timeSlot.split(' ')[0]}
                      </div>
                      <div>
                         <h4 className="font-bold text-slate-800 dark:text-slate-100">{task.subject}</h4>
                         <p className="text-sm text-slate-600 dark:text-slate-400">{task.activity}</p>
                         <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                            <Clock size={12} /> {task.timeSlot}
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex gap-3">
               <button 
                 onClick={() => setShowDailyModal(false)}
                 className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
               >
                 Let's Start Studying
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl dark:border dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <UserIcon size={20} className="text-indigo-600 dark:text-indigo-400" /> Edit Profile
               </h3>
               <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                 <X size={24} />
               </button>
            </div>
            
            <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                 <input 
                   type="text" 
                   className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   value={editForm.name || ''}
                   onChange={e => setEditForm({...editForm, name: e.target.value})}
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">College</label>
                 <input 
                   type="text" 
                   className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   value={editForm.college || ''}
                   onChange={e => setEditForm({...editForm, college: e.target.value})}
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class</label>
                    <select 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editForm.classLevel || '12'}
                      onChange={e => setEditForm({...editForm, classLevel: e.target.value as '11' | '12'})}
                    >
                      <option value="11">Class 11</option>
                      <option value="12">Class 12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Goal</label>
                    <select 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs truncate focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={editForm.goal || Goal.GPA_5}
                      onChange={e => setEditForm({...editForm, goal: e.target.value as Goal})}
                    >
                      <option value={Goal.GPA_5}>GPA 5</option>
                      <option value={Goal.MEDICAL}>Medical</option>
                      <option value={Goal.ENGINEERING}>Engineering</option>
                    </select>
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-400 mb-1">Email / Phone (Read Only)</label>
                 <input 
                   type="text" 
                   disabled
                   className="w-full px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 cursor-not-allowed"
                   value={editForm.emailOrPhone || ''}
                 />
               </div>

               <button 
                 onClick={handleSaveProfile}
                 className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-4 shadow-lg shadow-indigo-200 dark:shadow-none"
               >
                 <Save size={18} /> Save Changes
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome & Goal Header */}
      <div className="bg-indigo-600 dark:bg-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-200 dark:shadow-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Hello, {user?.name || "Aimer"}! 👋</h1>
              <button 
                onClick={openEditModal}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-indigo-100 hover:text-white transition-colors"
                title="Edit Profile"
              >
                <Pencil size={16} />
              </button>
            </div>
            <p className="text-indigo-100 flex items-center gap-2">
              <Target size={18} />
              Goal: <span className="font-semibold bg-white/20 px-2 py-0.5 rounded text-sm">{user?.goal}</span>
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
            <div className="text-right">
              <p className="text-xs text-indigo-200 uppercase font-semibold">Daily Usage</p>
              <p className="text-xl font-bold">{usageLeft} / 50</p>
            </div>
            <div className="h-10 w-10 bg-white text-indigo-600 dark:text-indigo-700 rounded-full flex items-center justify-center">
              <Zap size={20} fill="currentColor" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1: Study Time */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md dark:hover:shadow-slate-800 transition-shadow">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Clock size={24} />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Study</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{totalHours} <span className="text-lg font-normal text-slate-500 dark:text-slate-400">hrs</span></h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Recorded this month</p>
          </div>
        </div>

        {/* Card 2: Performance */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md dark:hover:shadow-slate-800 transition-shadow">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Score</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{avgScore}%</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Based on Mock Tests</p>
          </div>
        </div>

        {/* Card 3: Sessions */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between hover:shadow-md dark:hover:shadow-slate-800 transition-shadow">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
              <BookOpen size={24} />
            </div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sessions</span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{studySessions.length}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Learning sessions logged</p>
          </div>
        </div>

        {/* Card 4: Goal Progress Summary */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:shadow-md dark:hover:shadow-slate-800 transition-shadow relative overflow-hidden">
           <div className="z-10">
              <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <Award size={20} />
                 </div>
                 <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Goal Progress</span>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{finalProgress}%</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[100px] leading-tight">Overall probability of success</p>
           </div>
           <div className="h-24 w-24 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={40}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {progressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={progressColors[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{finalProgress}%</span>
              </div>
           </div>
        </div>
      </div>

      {/* Goal Breakdown Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
           <CheckCircle2 size={18} className="text-indigo-600 dark:text-indigo-400" />
           Your Path to {user?.goal}
        </h3>
        <div className="space-y-6">
          {/* Progress Bar 1: Study Volume */}
          <div>
            <div className="flex justify-between text-sm mb-2">
               <span className="font-medium text-slate-700 dark:text-slate-300">Syllabus Coverage (Study Time)</span>
               <span className="font-bold text-indigo-600 dark:text-indigo-400">{Math.min(studyProgressRaw, 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
               <div className="bg-indigo-600 dark:bg-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(studyProgressRaw, 100)}%` }}></div>
            </div>
            <div className="flex justify-between mt-1">
               <p className="text-xs text-slate-400 dark:text-slate-500">Based on {totalHours} / {TARGET_HOURS} target study hours</p>
               <p className="text-xs text-slate-400 dark:text-slate-500">Target: {TARGET_HOURS} hrs</p>
            </div>
          </div>

          {/* Progress Bar 2: Mock Performance */}
          <div>
            <div className="flex justify-between text-sm mb-2">
               <span className="font-medium text-slate-700 dark:text-slate-300">Exam Readiness (Mock Scores)</span>
               <span className="font-bold text-emerald-500 dark:text-emerald-400">{avgScore}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
               <div className="bg-emerald-500 dark:bg-emerald-400 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${avgScore}%` }}></div>
            </div>
             <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Average score across {mockResults.length} tests</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-80">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-6">Study Distribution</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: isDarkMode ? '#1e293b' : '#f8fafc'}}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    color: isDarkMode ? '#f1f5f9' : '#0f172a'
                  }} 
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#10b981'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              No study data recorded yet.
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-80 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Next Up</h3>
            <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Routine</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
             {upcomingTasks.length > 0 ? (
               upcomingTasks.map((task, idx) => (
                 <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex gap-4 items-center hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all group">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center font-bold text-xs shrink-0">
                      {task.subject.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{task.activity}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar size={10} /> {task.day} • {task.timeSlot}
                      </p>
                    </div>
                 </div>
               ))
             ) : (
               <div className="text-center pt-10 text-slate-400">
                 <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                 <p className="text-sm">No routine generated yet.</p>
                 <Link to="/tracker" className="text-xs mt-1 text-indigo-600 dark:text-indigo-400 hover:underline">Go to "Routine & Focus" to create one.</Link>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;