import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Camera, 
  BarChart2, 
  Settings, 
  Menu, 
  X, 
  Moon, 
  Sun,
  LogOut,
  User,
  BrainCircuit,
  Calendar,
  FileText,
  HelpCircle,
  Volume2,
  Zap,
  Sparkles,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, logOut } from '../firebase';
import { Logo } from './Logo';
import { AdBanner } from './AdBanner';
import { AdsterraBanner } from './AdsterraBanner';
import { useLanguage } from '../lib/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  const location = useLocation();
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const navItems = [
    { name: t('home'), path: '/', icon: Home },
    { name: t('ai'), path: '/voice-assistant', icon: Zap },
    { name: t('scan'), path: '/scan', icon: Camera },
    { name: t('ask'), path: '/doubt', icon: BrainCircuit },
    { name: t('summarizer'), path: '/summarize', icon: FileText },
    { name: t('smartQuiz'), path: '/quiz', icon: HelpCircle },
    { name: t('autoStudy'), path: '/auto-study', icon: BrainCircuit },
    { name: t('voiceLearning'), path: '/voice', icon: Volume2 },
    { name: t('studyPlanner'), path: '/planner', icon: Calendar },
    { name: t('notes'), path: '/notes', icon: BookOpen },
    { name: t('progressTracker'), path: '/progress', icon: BarChart2 },
    { name: t('settings'), path: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white transition-colors duration-300">
      {/* Adsterra Top Banner */}
      <AdsterraBanner />

      {/* Offline Alert */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-orange-500 text-white text-center py-2 text-xs font-bold flex items-center justify-center gap-2"
          >
            <WifiOff size={14} />
            You are offline. Some AI features may not work.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="sticky top-0 left-0 right-0 h-16 bg-white dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-gray-800 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg lg:hidden"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Logo size="md" />
            <h1 className="font-black text-lg hidden sm:block tracking-tighter">NIRAJ SmartStudy AI</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {user && (
            <div className="flex items-center gap-2 ml-2">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700"
              />
            </div>
          )}
        </div>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-bold">SmartStudy AI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-8rem)]">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                location.pathname === item.path 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
          <AdBanner unitId="ca-app-pub-4406624365938213/5348106774" format="banner" />
          {children}
        </div>
      </main>
    </div>
  );
};
