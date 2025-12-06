import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, History, Clock, Sparkles, Loader2, Calendar, BookOpen, Trash2, ArrowRight } from 'lucide-react';
import { SUBJECTS_LIST } from '../constants';
import { StudySession, Routine, User } from '../types';
import { generateRoutine } from '../services/geminiService';
import { incrementUsage, hasUsageRemaining } from '../services/usageService';

const StudyTracker: React.FC<{user: User | null}> = ({ user }) => {
  // Timer State
  const [isActive, setIsActive] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS_LIST[0]);
  const [topic, setTopic] = useState('');
  const [sessions, setSessions] = useState<StudySession[]>([]);
  
  // Routine Generator State
  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  
  // Generator Inputs
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [topics, setTopics] = useState('');
  const [hours, setHours] = useState(6);
  const [duration, setDuration] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const savedSessions = localStorage.getItem('studySessions');
    if (savedSessions) {
      const allSessions: StudySession[] = JSON.parse(savedSessions);
      // Security: Filter sessions by user ID
      setSessions(allSessions.filter(s => s.userId === user?.id));
    }

    const savedRoutine = localStorage.getItem('myRoutine');
    if (savedRoutine) setCurrentRoutine(JSON.parse(savedRoutine));
    else setShowGenerator(true);
  }, [user]);

  // --- Timer Functions ---
  const startTimer = () => {
    if (!topic.trim()) {
      alert("Please enter a topic before starting (e.g., 'Integration Chapter 10')");
      return;
    }
    setIsActive(true);
    timerRef.current = window.setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const stopTimer = () => {
    if (!user) {
      alert("You must be logged in to save sessions.");
      return;
    }
    if (seconds > 60) { // Only save if > 1 minute
      const newSession: StudySession = {
        id: Date.now().toString(),
        userId: user.id, // Attach user ID
        subject: selectedSubject,
        topic: topic,
        durationMinutes: Math.floor(seconds / 60),
        date: new Date().toISOString()
      };
      
      // Load current full list to append (in case state is filtered)
      const allSaved = JSON.parse(localStorage.getItem('studySessions') || '[]');
      const updatedAll = [newSession, ...allSaved];
      localStorage.setItem('studySessions', JSON.stringify(updatedAll));
      
      // Update local view
      setSessions(prev => [newSession, ...prev]);
    }
    setSeconds(0);
    setIsActive(false);
    setTopic('');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Routine Functions ---
  const handleGenerateRoutine = async () => {
    if (!profile) return;
    
    if (!hasUsageRemaining(user?.id)) {
        alert("Daily limit reached! Please upgrade.");
        return;
    }

    setLoading(true);
    try {
      incrementUsage(user?.id);
      const userGoal = user?.goal || "HSC Preparation";

      const result = await generateRoutine(profile, weaknesses, hours, userGoal, duration, topics);
      const newRoutine = {
        generatedAt: new Date().toISOString(),
        items: result.routine || [],
        goal: result.advice || ''
      };
      setCurrentRoutine(newRoutine);
      localStorage.setItem('myRoutine', JSON.stringify(newRoutine));
      setShowGenerator(false);
    } catch (error) {
      console.error("Failed to generate routine", error);
      alert("Failed to generate routine. Please check your internet or API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearRoutine = () => {
    if (window.confirm("Are you sure you want to delete your routine?")) {
      setCurrentRoutine(null);
      localStorage.removeItem('myRoutine');
      setShowGenerator(true);
    }
  };

  const startSessionFromRoutine = (item: any) => {
    // Attempt to match subject
    const matchedSubject = SUBJECTS_LIST.find(s => item.subject.includes(s)) || SUBJECTS_LIST[0];
    setSelectedSubject(matchedSubject);
    setTopic(item.activity);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* 1. Focus Timer Section (Hero) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 p-8 text-center relative overflow-hidden">
        {isActive && (
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
                <div className="h-full bg-indigo-500 animate-pulse w-full"></div>
            </div>
        )}
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-400 font-bold text-xl">
              <Clock className="text-indigo-500" /> Focus Timer
           </div>
           {isActive && <span className="animate-pulse text-red-500 text-sm font-bold">● Recording</span>}
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <select 
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isActive}
            >
              {SUBJECTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input 
              type="text"
              placeholder="What are you studying?"
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-80 placeholder-slate-400 dark:placeholder-slate-500"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isActive}
            />
          </div>
        </div>

        <div className="text-7xl md:text-8xl font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider mb-8 tabular-nums">
          {formatTime(seconds)}
        </div>

        <div className="flex justify-center gap-4">
          {!isActive ? (
            <button 
              onClick={startTimer}
              className="h-16 w-16 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-transform hover:scale-105 shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              <Play fill="currentColor" size={24} className="ml-1" />
            </button>
          ) : (
            <button 
              onClick={pauseTimer}
              className="h-16 w-16 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600 transition-transform hover:scale-105 shadow-lg shadow-amber-200 dark:shadow-none"
            >
              <Pause fill="currentColor" size={24} />
            </button>
          )}
          
          <button 
            onClick={stopTimer}
            disabled={seconds === 0}
            className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-700 transition-transform hover:scale-105 disabled:opacity-50"
          >
            <Square fill="currentColor" size={20} />
          </button>
        </div>
      </div>

      {/* 2. Routine Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="text-indigo-500" /> My Routine
          </h2>
          {currentRoutine && (
             <button 
               onClick={handleClearRoutine}
               className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
             >
               <Trash2 size={16} /> Delete
             </button>
          )}
        </div>

        {!currentRoutine || showGenerator ? (
           <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-2 mb-6">
                <Sparkles className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Generate New Routine</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
               <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Goal / Focus</label>
                      <input 
                          type="text" 
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g. Aiming for DMC, finish Biology"
                          value={profile}
                          onChange={e => setProfile(e.target.value)}
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Weak Topics</label>
                      <input 
                          type="text" 
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g. Organic Chemistry"
                          value={weaknesses}
                          onChange={e => setWeaknesses(e.target.value)}
                      />
                  </div>
               </div>
               <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration</label>
                      <select
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={duration}
                          onChange={e => setDuration(e.target.value as any)}
                      >
                          <option value="Daily">Daily Plan (1 Day)</option>
                          <option value="Weekly">Weekly Plan (7 Days)</option>
                          <option value="Monthly">Monthly Plan</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Study Hours/Day: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{hours}h</span></label>
                      <input 
                          type="range" 
                          min="1" 
                          max="16" 
                          value={hours} 
                          onChange={e => setHours(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                  </div>
               </div>
             </div>
             <button
                onClick={handleGenerateRoutine}
                disabled={loading || !profile}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-100 dark:shadow-none"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                Generate Smart Routine
              </button>
              {currentRoutine && (
                <button onClick={() => setShowGenerator(false)} className="w-full mt-2 py-2 text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
              )}
           </div>
        ) : (
          <div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-xl mb-4 text-sm text-indigo-800 dark:text-indigo-300">
               <span className="font-bold">💡 AI Advice:</span> {currentRoutine.goal}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentRoutine.items.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md dark:hover:shadow-slate-800 transition-shadow group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-300 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">{item.day}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                         <Clock size={12} />
                         {item.timeSlot}
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{item.subject}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{item.activity}</p>
                  </div>
                  
                  <button 
                    onClick={() => startSessionFromRoutine(item)}
                    className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1 group-hover:bg-indigo-600 group-hover:text-white"
                  >
                    Start Session <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-6">
              <button 
                onClick={() => setShowGenerator(true)}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline text-sm"
              >
                Regenerate Routine
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Recent History Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <History size={20} /> Recent Sessions
        </h3>
        <div className="space-y-3">
          {sessions.length === 0 && <p className="text-slate-400 italic">No sessions recorded yet.</p>}
          {sessions.slice(0, 5).map(session => (
            <div key={session.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">{session.subject}</h4>
                  {session.topic && <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{session.topic}</p>}
                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(session.date).toLocaleDateString()} at {new Date(session.date).toLocaleTimeString()}</p>
                </div>
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-300">{session.durationMinutes} min</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudyTracker;