import React from 'react';
import { GraduationCap, Target } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'normal' | 'large';
  showTagline?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "normal", showTagline = false }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className={`relative flex items-center justify-center ${size === 'large' ? 'w-16 h-16' : 'w-10 h-10'} bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none text-white transform rotate-3 transition-transform hover:rotate-0`}>
        <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
        <Target className={`absolute ${size === 'large' ? 'w-10 h-10' : 'w-6 h-6'} text-indigo-100 opacity-60`} />
        <GraduationCap className={`relative ${size === 'large' ? 'w-8 h-8' : 'w-5 h-5'} z-10 drop-shadow-md`} />
      </div>
      <div>
        <h1 className={`${size === 'large' ? 'text-3xl' : 'text-xl'} font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight`}>
          Aimers<span className="text-indigo-600 dark:text-indigo-400">.</span>
        </h1>
        {showTagline && <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">Hit Your Target</p>}
      </div>
    </div>
  );
};

export default Logo;