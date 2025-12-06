import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { 
  Home,
  CalendarDays,
  Timer,
  ClipboardCheck,
  NotebookPen,
  Bot,
  X,
  Zap,
  LogOut,
  Moon,
  Sun,
  User as UserIcon
} from 'lucide-react';

// Components
import Dashboard from './components/Dashboard';
import StudyTracker from './components/StudyTracker';
import MockTest from './components/MockTest';
import SmartNotes from './components/SmartNotes';
import AiTeacher from './components/AiTeacher';
import Profile from './components/Profile';
import Auth from './components/Auth';
import Logo from './components/Logo';
import { User } from './types';
import { getRemainingUsage } from './services/usageService';

// Navigation Item Interface
interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Routine & Focus', path: '/tracker', icon: Timer },
  { name: 'Mock Test', path: '/tests', icon: ClipboardCheck },
  { name: 'Smart Notes', path: '/notes', icon: NotebookPen },
  { name: 'Ask Aimers', path: '/ask-aimers', icon: Bot },
  { name: 'My Profile', path: '/profile', icon: UserIcon },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  user: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, user, onLogout, isDarkMode, toggleTheme }) => {
  const location = useLocation();
  const usage = getRemainingUsage();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar Content */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30 transform transition-transform duration-300 ease-in-out flex flex-col
        md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <Logo />
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 py-4">
           <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 mb-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase mb-1">Current Goal</p>
              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400 truncate">{user?.goal}</p>
           </div>
        </div>

        <nav className="p-4 space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                `}
              >
                <item.icon size={20} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
            <div className="flex justify-between items-center mb-2">
               <h4 className="font-semibold text-sm">Daily Actions</h4>
               <Zap size={14} className="text-yellow-300" fill="currentColor" />
            </div>
            <div className="w-full bg-black/20 rounded-full h-2 mb-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${(usage / 50) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs opacity-90">{usage} free actions left</p>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full px-2"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />} 
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors w-full px-2"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex justify-between items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none">
       {NAV_ITEMS.map((item) => {
         const isActive = location.pathname === item.path;
         return (
           <Link 
             key={item.path} 
             to={item.path} 
             className={`p-2 rounded-xl transition-all duration-200 ${isActive ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 dark:text-slate-500 active:bg-slate-50 dark:active:bg-slate-800'}`}
             title={item.name}
           >
             <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
           </Link>
         )
       })}
    </nav>
  );
};

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, isDarkMode, toggleTheme }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        user={user} 
        onLogout={onLogout} 
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen pb-20 md:pb-0">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 px-4 py-3 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center gap-3">
            <Logo className="md:hidden" size="normal" />
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.college} • Class {user?.classLevel}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold">
              {user?.name.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  
  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  useEffect(() => {
    const savedUser = localStorage.getItem('aimers_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Ensure existing users have IDs for security check
      if (!parsedUser.id) {
        parsedUser.id = Date.now().toString(); // Assign fallback ID
        localStorage.setItem('aimers_user', JSON.stringify(parsedUser));
      }
      setUser(parsedUser);
    }
  }, []);

  const handleLogin = (newUser: User) => {
    // SECURITY CHECK: Authorization validation
    // If a user is currently logged in, ensure the update is for the same user ID.
    // This simulates "if (userId !== req.user.id)" in a client-side context.
    if (user && user.id !== newUser.id) {
       console.error("Authorization Error: User ID mismatch during profile update.");
       alert("Security Alert: Unauthorized profile update attempt detected.");
       return;
    }

    setUser(newUser);
    localStorage.setItem('aimers_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('aimers_user');
  };

  if (!user) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <Auth onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout} isDarkMode={darkMode} toggleTheme={toggleTheme}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} onUpdateUser={handleLogin} isDarkMode={darkMode} />} />
          <Route path="/tracker" element={<StudyTracker />} />
          <Route path="/tests" element={<MockTest />} />
          <Route path="/notes" element={<SmartNotes />} />
          <Route path="/ask-aimers" element={<AiTeacher />} />
          <Route path="/profile" element={<Profile user={user} onUpdateUser={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;