import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  BrainCircuit, 
  FileText, 
  HelpCircle, 
  Calendar, 
  BarChart2, 
  ArrowRight,
  Zap,
  Award,
  Clock,
  Sparkles,
  Heart,
  Mic,
  Languages
} from 'lucide-react';
import { Logo } from './Logo';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { StudyNote, QuizResult } from '../types';
import { useLanguage } from '../lib/LanguageContext';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    streak: 5,
    points: 1250,
    notesCount: 0,
    quizzesCount: 0
  });
  const [recentNotes, setRecentNotes] = useState<StudyNote[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const notesQuery = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyNote));
      setRecentNotes(notes);
      setStats(prev => ({ ...prev, notesCount: snapshot.size }));
    });

    const quizQuery = query(
      collection(db, 'quizResults'),
      where('userId', '==', user.uid)
    );

    const unsubscribeQuizzes = onSnapshot(quizQuery, (snapshot) => {
      setStats(prev => ({ ...prev, quizzesCount: snapshot.size }));
    });

    return () => {
      unsubscribeNotes();
      unsubscribeQuizzes();
    };
  }, [user]);

  const features = [
    { name: t('ai'), path: '/voice-assistant', icon: Zap, color: 'bg-yellow-500', desc: 'Live Talk & Knowledge' },
    { name: t('scan'), path: '/scan', icon: Camera, color: 'bg-blue-500', desc: 'Solve with photo' },
    { name: t('ask'), path: '/doubt', icon: BrainCircuit, color: 'bg-purple-500', desc: 'AI Chat support' },
    { name: t('summarizer'), path: '/summarize', icon: FileText, color: 'bg-orange-500', desc: 'Shorten notes' },
    { name: t('handwriting'), path: '/handwriting', icon: FileText, color: 'bg-indigo-500', desc: 'Handwriting to Text' },
    { name: t('translator'), path: '/translator', icon: Languages, color: 'bg-red-500', desc: 'All language support' },
    { name: t('smartQuiz'), path: '/quiz', icon: HelpCircle, color: 'bg-green-500', desc: 'Practice MCQs' },
    { name: 'Visual AI', path: '/visual-learning', icon: Sparkles, color: 'bg-pink-500', desc: 'Image Study & Diagrams' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('welcomeBack')} {user?.displayName?.split(' ')[0] || t('guestStudent')}! 👋</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('readyToStudy')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full font-bold text-sm">
            <Zap size={16} fill="currentColor" />
            <span>{stats.streak} Day Streak</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full font-bold text-sm">
            <Award size={16} />
            <span>{stats.points} pts</span>
          </div>
        </div>
      </section>

      {/* Auto Smart Study Mode Card */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-purple-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <BrainCircuit size={24} className="text-purple-200" />
            <span className="text-xs font-black uppercase tracking-widest text-purple-100">Most Unique Feature</span>
          </div>
          <h3 className="text-2xl font-black mb-2">Auto Smart Study Mode</h3>
          <p className="text-purple-100 text-sm mb-4 max-w-md">Let AI decide your study path. It analyzes your weak topics and creates a custom plan for today.</p>
          <Link 
            to="/auto-study"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all active:scale-95"
          >
            Start Smart Study <Sparkles size={18} />
          </Link>
        </div>
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-8 -top-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />
      </section>

      {/* Quick Access AI Assistant */}
      <section className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 border-2 border-yellow-500/20 shadow-xl shadow-yellow-500/5 relative overflow-hidden group">
          <div className="relative z-10 flex flex-col justify-between h-full gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Logo size="sm" className="border-yellow-500 shadow-yellow-500/20" />
                <span className="text-xs font-black uppercase tracking-widest text-yellow-600 dark:text-yellow-400">Live AI Assistant</span>
              </div>
              <h3 className="text-2xl font-black mb-2">Talk to NIRAJ AI</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Experience a human-like conversation with our most powerful AI. It has world-wide knowledge.</p>
            </div>
            <Link 
              to="/voice-assistant"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-black shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all active:scale-95 group-hover:shadow-yellow-500/40"
            >
              Start Live Session <Mic size={20} />
            </Link>
          </div>
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-colors" />
        </div>
      </section>

      {/* Main Features Grid */}
      <section>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Zap size={20} className="text-yellow-500" />
          Quick Tools
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.name}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link 
                to={feature.path}
                className="block p-4 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all group"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center text-white mb-3 shadow-lg shadow-${feature.color.split('-')[1]}-500/20`}>
                  <feature.icon size={24} />
                </div>
                <h4 className="font-bold mb-1">{feature.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{feature.desc}</p>
                <div className="mt-3 flex items-center text-blue-600 dark:text-blue-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Open Tool <ArrowRight size={12} className="ml-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Activity & Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Clock size={20} className="text-blue-500" />
              {t('recentActivity')}
            </h3>
            <Link to="/notes" className="text-xs text-blue-600 dark:text-blue-400 font-bold">View All</Link>
          </div>
          <div className="space-y-3">
            {recentNotes.length > 0 ? (
              recentNotes.map(note => (
                <div key={note.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{note.title}</p>
                    <p className="text-[10px] text-gray-400">{new Date(note.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                    {note.subject}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4 italic">{t('noActivity')}</p>
            )}
          </div>
        </section>

        <section className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <BarChart2 size={20} />
            {t('progressTracker')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs text-blue-100 mb-1">Notes Saved</p>
              <p className="text-2xl font-bold">{stats.notesCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-xs text-blue-100 mb-1">Quizzes Taken</p>
              <p className="text-2xl font-bold">{stats.quizzesCount}</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs mb-1">
              <span>Daily Goal</span>
              <span>75%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white w-3/4" />
            </div>
          </div>
        </section>

        {/* Branding */}
        <div className="p-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/30 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10 flex flex-col items-center">
            <Logo size="lg" className="mb-4 shadow-2xl" />
            <h4 className="text-2xl font-black mb-2 tracking-tighter">NIRAJ SmartStudy AI</h4>
            <div className="h-1 w-20 bg-yellow-400 mx-auto rounded-full mb-4 group-hover:w-32 transition-all duration-500" />
            <div className="space-y-2">
              <p className="text-sm font-bold opacity-90 flex items-center justify-center gap-2">
                Made with <Heart size={16} fill="white" className="text-red-400 animate-bounce" /> by 
                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md text-yellow-200 font-black">
                  NIRAJ KUMAR KANNAUJIYA
                </span>
              </p>
              <div className="pt-2">
                <p className="text-xs font-bold text-blue-100 opacity-80 uppercase tracking-widest">
                  QUEEN'S COLLEGE STUDENT
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        </div>
      </div>
    </div>
  );
};
