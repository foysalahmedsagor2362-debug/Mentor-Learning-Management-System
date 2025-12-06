import React, { useState, useEffect } from 'react';
import { User, Goal } from '../types';
import { User as UserIcon, Mail, BookOpen, GraduationCap, Target, Save, X, Pencil, KeyRound, Trash2 } from 'lucide-react';

interface ProfileProps {
  user: User | null;
  onUpdateUser: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [formData, setFormData] = useState<User>(user || {
    id: '',
    name: '',
    emailOrPhone: '',
    classLevel: '12',
    college: '',
    goal: Goal.GPA_5,
    joinedAt: new Date().toISOString()
  });

  useEffect(() => {
    // Check if user has a custom key saved
    if (localStorage.getItem('aimers_api_key')) {
      setHasCustomKey(true);
    }
  }, []);

  if (!user) return null;

  const handleSave = () => {
    onUpdateUser(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(user);
    setIsEditing(false);
  };

  const handleRemoveApiKey = () => {
    if (window.confirm("Are you sure you want to remove your saved API Key? You will need to enter it again to use AI features.")) {
      localStorage.removeItem('aimers_api_key');
      setHasCustomKey(false);
      window.location.reload(); // Reload to trigger the API key prompt again
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <UserIcon className="text-indigo-600 dark:text-indigo-400" /> My Profile
      </h2>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6">
        <div className="h-24 w-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border-4 border-white dark:border-slate-800 flex items-center justify-center text-3xl font-bold text-indigo-700 dark:text-indigo-400 shadow-md">
          {user.name.charAt(0)}
        </div>
        <div className="text-center md:text-left flex-1">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h3>
          <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center md:justify-start gap-2 mt-1">
             <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold uppercase tracking-wider">Student</span>
             <span>•</span>
             <span>Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
          </p>
        </div>
        <div>
           {!isEditing ? (
             <button 
               onClick={() => setIsEditing(true)}
               className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
             >
               <Pencil size={16} /> Edit Profile
             </button>
           ) : (
             <div className="flex gap-2">
               <button 
                 onClick={handleCancel}
                 className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-colors font-medium"
               >
                 <X size={16} /> Cancel
               </button>
               <button 
                 onClick={handleSave}
                 className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-md shadow-indigo-200 dark:shadow-none"
               >
                 <Save size={16} /> Save Changes
               </button>
             </div>
           )}
        </div>
      </div>

      {/* Details Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {/* Name */}
            <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <UserIcon size={16} className="text-indigo-500" /> Full Name
               </label>
               {isEditing ? (
                 <input 
                   type="text" 
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                 />
               ) : (
                 <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-800 dark:text-slate-200 border border-transparent">
                   {user.name}
                 </div>
               )}
            </div>

            {/* Email/Phone */}
            <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Mail size={16} className="text-indigo-500" /> Email / Phone
               </label>
               <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 cursor-not-allowed flex justify-between items-center">
                   {user.emailOrPhone}
                   <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">Read-only</span>
               </div>
            </div>

            {/* College */}
            <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <GraduationCap size={16} className="text-indigo-500" /> College
               </label>
               {isEditing ? (
                 <input 
                   type="text" 
                   value={formData.college}
                   onChange={e => setFormData({...formData, college: e.target.value})}
                   className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                 />
               ) : (
                 <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-800 dark:text-slate-200 border border-transparent">
                   {user.college}
                 </div>
               )}
            </div>

            {/* Class */}
            <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-500" /> Class Level
               </label>
               {isEditing ? (
                 <select 
                   value={formData.classLevel}
                   onChange={e => setFormData({...formData, classLevel: e.target.value as '11' | '12'})}
                   className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                 >
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                 </select>
               ) : (
                 <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-800 dark:text-slate-200 border border-transparent">
                   Class {user.classLevel}
                 </div>
               )}
            </div>

            {/* Goal */}
            <div className="space-y-2 md:col-span-2">
               <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Target size={16} className="text-indigo-500" /> Current Goal
               </label>
               {isEditing ? (
                 <select 
                   value={formData.goal}
                   onChange={e => setFormData({...formData, goal: e.target.value as Goal})}
                   className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                 >
                      <option value={Goal.GPA_5}>GPA 5 in HSC</option>
                      <option value={Goal.MEDICAL}>HSC + Medical Admission</option>
                      <option value={Goal.ENGINEERING}>HSC + Engineering (BUET) Admission</option>
                 </select>
               ) : (
                 <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-800 dark:text-slate-200 border border-transparent">
                   {user.goal}
                 </div>
               )}
               <p className="text-xs text-slate-400 dark:text-slate-500 ml-1">
                 Changing your goal will adjust the AI's recommendations for routine and mock tests.
               </p>
            </div>
        </div>
      </div>

      {/* API Key Settings */}
      {hasCustomKey && (
         <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
           <div className="flex justify-between items-center">
             <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                   <KeyRound size={18} className="text-indigo-600 dark:text-indigo-400" /> AI Access Key
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                   You have manually saved an API Key for AI features.
                </p>
             </div>
             <button 
               onClick={handleRemoveApiKey}
               className="px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
             >
               <Trash2 size={16} /> Remove Key
             </button>
           </div>
         </div>
      )}
    </div>
  );
};

export default Profile;