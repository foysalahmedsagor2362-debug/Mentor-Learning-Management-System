import React, { useState, useEffect } from 'react';
import { generateRoutine } from '../services/geminiService';
import { Routine, RoutineItem } from '../types';
import { Loader2, Sparkles, Save, Trash2, Calendar, Clock, BookOpen } from 'lucide-react';
import { incrementUsage, hasUsageRemaining } from '../services/usageService';

const RoutineGenerator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [topics, setTopics] = useState('');
  const [hours, setHours] = useState(6);
  const [duration, setDuration] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('myRoutine');
    if (saved) {
      setCurrentRoutine(JSON.parse(saved));
    }
  }, []);

  const handleGenerate = async () => {
    if (!profile) return;
    
    if (!hasUsageRemaining()) {
        alert("Daily limit reached! Please upgrade.");
        return;
    }

    setLoading(true);
    try {
      incrementUsage();
      const userStr = localStorage.getItem('aimers_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userGoal = user?.goal || "HSC Preparation";

      const result = await generateRoutine(profile, weaknesses, hours, userGoal, duration, topics);
      const newRoutine = {
        generatedAt: new Date().toISOString(),
        items: result.routine || [],
        goal: result.advice || ''
      };
      setCurrentRoutine(newRoutine);
      localStorage.setItem('myRoutine', JSON.stringify(newRoutine));
    } catch (error) {
      console.error("Failed to generate routine", error);
      alert("Failed to generate routine. Please check your internet or API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCurrentRoutine(null);
    localStorage.removeItem('myRoutine');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="text-indigo-500" /> AI Routine Generator
        </h2>
        <p className="text-slate-500">Create a personalized Daily, Weekly, or Monthly study plan.</p>
      </div>

      {!currentRoutine ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             {/* Left Column */}
             <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Focus / Goal</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. Aiming for DMC, need to finish Biology Syllabus"
                        value={profile}
                        onChange={e => setProfile(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Specific Topics to Cover</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. Organic Chemistry, Integration, Vector Physics"
                        value={topics}
                        onChange={e => setTopics(e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1">What chapters or subjects do you need to finish in this routine?</p>
                </div>
             </div>

             {/* Right Column */}
             <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                    <select
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        value={duration}
                        onChange={e => setDuration(e.target.value as any)}
                    >
                        <option value="Daily">Daily Plan (1 Day Breakdown)</option>
                        <option value="Weekly">Weekly Plan (7 Days)</option>
                        <option value="Monthly">Monthly Plan (4 Weeks Overview)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Weaknesses</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g. Memorizing Biology terms"
                        value={weaknesses}
                        onChange={e => setWeaknesses(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Study Hours / Day</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="range" 
                            min="1" 
                            max="16" 
                            value={hours} 
                            onChange={e => setHours(parseInt(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <span className="font-bold text-indigo-600 w-12 text-center">{hours}h</span>
                    </div>
                </div>
             </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !profile}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
            Generate {duration} Routine
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-start">
            <div>
                 <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2"><Sparkles size={16}/> AI Advice</h3>
                 <p className="text-indigo-700 text-sm leading-relaxed">{currentRoutine.goal}</p>
            </div>
            <button 
              onClick={handleClear}
              className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 px-4 py-2 bg-white rounded-lg border border-red-100 hover:bg-red-50 transition-colors shadow-sm shrink-0"
            >
              <Trash2 size={16} /> Create New
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentRoutine.items.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        <Calendar size={14} />
                     </div>
                     <span className="text-sm font-bold text-slate-700">{item.day}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 text-slate-500 text-xs rounded-md font-medium border border-slate-100">
                     <Clock size={12} />
                     {item.timeSlot}
                  </div>
                </div>
                <h4 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
                    <BookOpen size={16} className="text-indigo-500"/>
                    {item.subject}
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed pl-6 border-l-2 border-slate-100">{item.activity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineGenerator;