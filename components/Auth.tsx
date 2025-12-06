import React, { useState } from 'react';
import { User, Goal } from '../types';
import { ArrowRight, BookOpen, HeartPulse, Calculator, AlertCircle } from 'lucide-react';
import Logo from './Logo';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    emailOrPhone: '',
    classLevel: '12',
    college: '',
    goal: Goal.GPA_5
  });

  const isValidEmailOrPhone = (input: string) => {
    // Simple regex for email or phone (Bangladeshi phone format loose check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(\+88)?01[3-9]\d{8}$/;
    return emailRegex.test(input) || phoneRegex.test(input.replace(/[-\s]/g, ''));
  };

  const handleNext = () => {
    setError('');
    if (!formData.name || !formData.emailOrPhone || !formData.college) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!isValidEmailOrPhone(formData.emailOrPhone)) {
      setError('Please enter a valid email address or phone number');
      return;
    }

    setStep(2);
  };

  const handleFinish = () => {
    const user: User = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      ...formData,
      classLevel: formData.classLevel as '11' | '12',
      joinedAt: new Date().toISOString()
    };
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="mb-8 text-center flex flex-col items-center">
        <Logo size="large" showTagline />
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-800">
        {step === 1 ? (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Student Profile</h2>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg flex items-center gap-2 animate-pulse border border-red-100 dark:border-red-900/30">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Adnan Sami"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email or Phone</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 01700000000 or email@example.com"
                value={formData.emailOrPhone}
                onChange={e => setFormData({...formData, emailOrPhone: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Class</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.classLevel}
                  onChange={e => setFormData({...formData, classLevel: e.target.value})}
                >
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">College Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. NDC"
                  value={formData.college}
                  onChange={e => setFormData({...formData, college: e.target.value})}
                />
              </div>
            </div>

            <button 
              onClick={handleNext}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4 shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Choose Your Goal</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">We will personalize your routine and questions based on this.</p>

            <div className="space-y-3">
              <button
                onClick={() => setFormData({...formData, goal: Goal.GPA_5})}
                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${formData.goal === Goal.GPA_5 ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
              >
                <div className={`p-3 rounded-full ${formData.goal === Goal.GPA_5 ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">GPA 5 in HSC</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Solidify your board exam preparation</p>
                </div>
              </button>

              <button
                onClick={() => setFormData({...formData, goal: Goal.MEDICAL})}
                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${formData.goal === Goal.MEDICAL ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
              >
                <div className={`p-3 rounded-full ${formData.goal === Goal.MEDICAL ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  <HeartPulse size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">HSC + Medical</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Biology & Chemistry focused prep</p>
                </div>
              </button>

              <button
                onClick={() => setFormData({...formData, goal: Goal.ENGINEERING})}
                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${formData.goal === Goal.ENGINEERING ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
              >
                <div className={`p-3 rounded-full ${formData.goal === Goal.ENGINEERING ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">HSC + Engineering</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Advanced Math & Physics focus</p>
                </div>
              </button>
            </div>

            <button 
              onClick={handleFinish}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              Start My Journey <ArrowRight size={18} />
            </button>
            
            <button onClick={() => setStep(1)} className="w-full text-center text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 mt-2">
              Back to Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;