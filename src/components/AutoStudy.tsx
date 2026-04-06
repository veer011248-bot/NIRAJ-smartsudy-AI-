import React, { useState, useEffect } from 'react';
import { BrainCircuit, Sparkles, RefreshCw, BookOpen, Target, ArrowRight, Zap, WifiOff } from 'lucide-react';
import { Logo } from './Logo';
import { generateAutoStudyPlan } from '../lib/gemini';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export const AutoStudy: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const user = auth.currentUser;

  const fetchPlan = async () => {
    if (!user) return;
    if (!navigator.onLine) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Get some history to analyze
      const q = query(collection(db, 'quizResults'), where('userId', '==', user.uid), limit(5), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => doc.data());
      
      const res = await generateAutoStudyPlan(history);
      setPlan(res);
    } catch (err: any) {
      console.error(err);
      // If it's a quota error, we show a friendly message in the UI
      if (err.message?.includes("QUOTA_EXCEEDED")) {
        setPlan({
          topic: "AI Limit Reached",
          reason: "AI quota exhausted for today.",
          revisionNote: "Please try again later. AI is currently resting.",
          goal: "Revise your previous notes manually."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <Logo size="lg" className="w-20 h-20 animate-pulse" rounded="rounded-3xl" />
          <div className="absolute -inset-4 border-2 border-dashed border-purple-500/30 rounded-full animate-spin-slow" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">AI is analyzing your performance...</h3>
          <p className="text-gray-500 text-sm">Identifying weak topics and creating your daily path</p>
        </div>
      </div>
    );
  }

  if (!plan && !navigator.onLine) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-3xl flex items-center justify-center text-orange-600 dark:text-orange-400">
          <WifiOff size={40} />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">You are Offline</h3>
          <p className="text-gray-500 text-sm">Auto Study Mode requires an internet connection to analyze your performance.</p>
        </div>
        <button 
          onClick={fetchPlan}
          className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Your Smart Study Path</h2>
        <p className="text-gray-500 dark:text-gray-400">AI has decided your focus for today based on your history</p>
      </div>

      <div className="grid gap-6">
        {/* Main Topic Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-xl shadow-purple-500/5 relative overflow-hidden"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full">Today's Focus</span>
              <h3 className="text-3xl font-black">{plan.topic}</h3>
            </div>
            <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Target size={28} />
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">"Why this? {plan.reason}"</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <BookOpen size={18} /> Quick Revision Note
              </h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{plan.revisionNote}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold flex items-center gap-2 text-green-600 dark:text-green-400">
                <Zap size={18} /> Today's Practice Goal
              </h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{plan.goal}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link 
              to="/quiz" 
              className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all active:scale-95 shadow-lg shadow-purple-500/20"
            >
              Take Practice Quiz <ArrowRight size={18} />
            </Link>
            <button 
              onClick={fetchPlan}
              className="px-6 py-4 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
