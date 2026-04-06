import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  useNavigate
} from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signIn } from './firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ScanQuestion } from './components/ScanQuestion';
import { DoubtChat } from './components/DoubtChat';
import { NotesSummarizer } from './components/NotesSummarizer';
import { QuizMode } from './components/QuizMode';
import { VoiceAssistant } from './components/VoiceAssistant';
import { Translator } from './components/Translator';
import { StudyPlanner } from './components/StudyPlanner';
import { NotesStorage } from './components/NotesStorage';
import { ProgressTracker } from './components/ProgressTracker';
import { Settings } from './components/Settings';
import { AutoStudy } from './components/AutoStudy';
import { VoiceLearning } from './components/VoiceLearning';
import { VisualLearning } from './components/VisualLearning';
import { HandwritingOCR } from './components/HandwritingOCR';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, GraduationCap, Sparkles } from 'lucide-react';

// --- Splash Screen ---
const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [mascotUrl, setMascotUrl] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(onComplete, 500); // Reduced from 1000 for instant feel
    
    // In a real app, we would use the user's photo. 
    // Here we generate a similar mascot pointing to the logo.
    import('./lib/mascot').then(({ generateMascot }) => {
      generateMascot().then(url => setMascotUrl(url));
    });

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#121212] flex items-center justify-center z-[100] overflow-hidden">
      {/* Mascot Container */}
      <AnimatePresence>
        {mascotUrl && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute left-0 bottom-0 w-[40%] h-[80%] z-10 hidden md:block"
          >
            <img 
              src={mascotUrl || undefined} 
              alt="Mascot" 
              className="w-full h-full object-contain object-bottom filter drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              style={{ mixBlendMode: 'lighten' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center justify-center relative z-20">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/40">
            <GraduationCap size={48} />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border-2 border-dashed border-blue-500/30 rounded-full"
          />
        </motion.div>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-3xl font-black text-white tracking-tight"
        >
          NIRAJ SmartStudy AI
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-center space-y-2"
        >
          <p className="text-blue-400 font-medium tracking-widest uppercase text-[10px]">
            Made by QUEEN'S COLLEGE STUDENT
          </p>
          <p className="text-white font-black tracking-[0.2em] uppercase text-sm">
            NIRAJ KUMAR KANNAUJIYA
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// --- Login Screen ---
const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6">
            <GraduationCap size={40} />
          </div>
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to sync your notes and progress</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-4 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-center gap-3 font-bold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-center"
            >
              <p className="text-xs text-red-600 dark:text-red-400 font-bold mb-2">{error}</p>
              <button 
                onClick={handleLogin}
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 underline"
              >
                Try Again
              </button>
            </motion.div>
          )}
          
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 text-gray-500 dark:text-gray-400 font-medium hover:text-blue-600 transition-colors"
          >
            Continue as Guest
          </button>
        </div>

        <div className="pt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Sparkles size={14} className="text-blue-500" />
          <span>Powered by Google Gemini AI</span>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginScreen />} />
        
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/scan" element={<Layout><ScanQuestion /></Layout>} />
        <Route path="/doubt" element={<Layout><DoubtChat /></Layout>} />
        <Route path="/summarize" element={<Layout><NotesSummarizer /></Layout>} />
        <Route path="/quiz" element={<Layout><QuizMode /></Layout>} />
        <Route path="/translator" element={<Layout><Translator /></Layout>} />
        <Route path="/voice-assistant" element={<Layout><VoiceAssistant /></Layout>} />
        <Route path="/planner" element={<Layout><StudyPlanner /></Layout>} />
        <Route path="/notes" element={<Layout><NotesStorage /></Layout>} />
        <Route path="/progress" element={<Layout><ProgressTracker /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/auto-study" element={<Layout><AutoStudy /></Layout>} />
        <Route path="/voice" element={<Layout><VoiceLearning /></Layout>} />
        <Route path="/visual-learning" element={<Layout><VisualLearning /></Layout>} />
        <Route path="/handwriting" element={<Layout><HandwritingOCR /></Layout>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
