import React, { useState } from 'react';
import { Brain, HelpCircle, CheckCircle, XCircle, ArrowRight, BookOpen, Globe, Sparkles, Award, Trophy, ArrowLeft } from 'lucide-react';
import { generateQuiz, generateMixedQuiz } from '../lib/gemini';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { SmartMic } from './SmartMic';

import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QuizMode: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [quizType, setQuizType] = useState<'subject' | 'current_affairs' | 'mind' | 'mixed'>('mixed');
  const [studentClass, setStudentClass] = useState('');
  const [classGroup, setClassGroup] = useState<'1-5' | '6-8' | '9-10' | '11-12' | 'college' | null>(null);
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleStartQuiz = async () => {
    if (!navigator.onLine) {
      setError("AI Quiz generation requires an internet connection.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let res;
      if (quizType === 'subject' && topic.trim()) {
        res = await generateQuiz(topic, 5, studentClass);
      } else {
        res = await generateMixedQuiz(quizType, studentClass);
      }
      setQuestions(res);
      setCurrentIndex(0);
      setScore(0);
      setQuizFinished(false);
      setSelectedOption(null);
      setShowFeedback(false);
      setStep(3); // Go to quiz screen
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (idx: number) => {
    if (showFeedback) return;
    setSelectedOption(idx);
    setShowFeedback(true);
    if (idx === questions[currentIndex].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleFinishQuiz = async () => {
    setQuizFinished(true);
    if (auth.currentUser) {
      try {
        await addDoc(collection(db, 'quizResults'), {
          userId: auth.currentUser.uid,
          subject: quizType === 'subject' ? topic : quizType,
          score: score,
          total: questions.length,
          timestamp: serverTimestamp(),
          class: studentClass
        });
      } catch (err) {
        console.error("Error saving quiz result:", err);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      handleFinishQuiz();
    }
  };

  const classGroups = [
    { id: '1-5', name: 'Class 1 to 5', desc: 'Primary School' },
    { id: '6-8', name: 'Class 6 to 8', desc: 'Middle School' },
    { id: '9-10', name: 'Class 9 to 10', desc: 'High School' },
    { id: '11-12', name: 'Class 11 to 12', desc: 'Intermediate' },
    { id: 'college', name: 'College/Other', desc: 'Higher Education' },
  ];

  const getSubjectsForGroup = (group: string) => {
    switch (group) {
      case '1-5': return ['Math', 'English', 'Hindi', 'EVS', 'GK', 'Art'];
      case '6-8': return ['Math', 'Science', 'Social Science', 'English', 'Hindi', 'Sanskrit', 'Computer'];
      case '9-10': return ['Math', 'Science', 'Social Science', 'English', 'Hindi', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Civics', 'Economics'];
      case '11-12': return ['Physics', 'Chemistry', 'Math', 'Biology', 'English', 'Hindi', 'Accountancy', 'Business Studies', 'Economics', 'History', 'Geography', 'Political Science', 'Sociology', 'Computer Science'];
      default: return ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'History', 'Geography', 'Civics', 'Economics', 'Computer Science'];
    }
  };

  const quizTypes = [
    { id: 'subject', name: 'Subject Quiz', icon: BookOpen, color: 'bg-blue-500', desc: 'Focus on one subject' },
    { id: 'current_affairs', name: 'Current Affairs', icon: Globe, color: 'bg-orange-500', desc: 'Recent events' },
    { id: 'mind', name: 'Mind Quiz', icon: Brain, color: 'bg-purple-500', desc: 'IQ & Logic' },
    { id: 'mixed', name: 'Mixed Quiz', icon: Sparkles, color: 'bg-green-500', desc: 'All-in-one exam mode' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold animate-pulse">AI is generating your quiz...</p>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 text-center pr-10">
            <h2 className="text-3xl font-black mb-2">Select Your Level</h2>
            <p className="text-gray-500 dark:text-gray-400">Step 1: Choose your school level</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {classGroups.map(group => (
            <button
              key={group.id}
              onClick={() => { setClassGroup(group.id as any); setStep(2); }}
              className={`p-6 rounded-3xl border-2 transition-all text-left ${
                classGroup === group.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-blue-500'
              }`}
            >
              <h4 className="font-black text-lg mb-1">{group.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{group.desc}</p>
            </button>
          ))}
        </div>
        <button 
          onClick={() => { setClassGroup('college'); setStep(2); }}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
        >
          Continue
        </button>
      </div>
    );
  }

  if (step === 2) {
    const subjects = getSubjectsForGroup(classGroup || 'college');
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setStep(1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 text-center pr-10">
            <h2 className="text-3xl font-black mb-2">Quiz Type</h2>
            <p className="text-gray-500 dark:text-gray-400">Step 2: Choose how you want to practice</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {quizTypes.map(type => (
            <button
              key={type.id}
              onClick={() => { setQuizType(type.id as any); if (type.id !== 'subject') handleStartQuiz(); }}
              className={`p-6 rounded-3xl border-2 transition-all text-left group ${
                quizType === type.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-800 hover:border-blue-500'
              }`}
            >
              <div className={`w-12 h-12 ${type.color} rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-${type.color.split('-')[1]}-500/20 group-hover:scale-110 transition-transform`}>
                <type.icon size={24} />
              </div>
              <h4 className="font-black text-lg mb-1">{type.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{type.desc}</p>
            </button>
          ))}
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-800 rounded-3xl text-center space-y-4"
          >
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={24} />
            </div>
            <div>
              <h4 className="font-black text-red-600 dark:text-red-400">AI_ERROR: Kuch galat ho gaya</h4>
              <p className="text-xs text-red-500 dark:text-red-400/70 mt-1">{error}</p>
            </div>
            <button 
              onClick={handleStartQuiz}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all"
            >
              Retry Now
            </button>
          </motion.div>
        )}

        {quizType === 'subject' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap gap-2">
              {subjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => setTopic(sub)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                    topic === sub ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-100 dark:border-gray-800 text-gray-500'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Or type any subject name..."
                  className="flex-1 px-6 py-4 bg-white dark:bg-[#1e1e1e] border-2 border-gray-200 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <SmartMic onResult={(text) => setTopic(prev => prev + ' ' + text)} />
              </div>
              <button 
                onClick={handleStartQuiz}
                disabled={!topic.trim() || loading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                Start Subject Quiz
              </button>
            </div>
          </motion.div>
        )}
        
        <button 
          onClick={() => setStep(1)}
          className="w-full py-3 text-gray-500 font-bold hover:text-blue-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (questions.length > 0 && !quizFinished) {
    const q = questions[currentIndex];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to quit the quiz?")) {
                setStep(2);
                setQuestions([]);
              }
            }}
            className="flex items-center gap-2 text-gray-500 font-bold hover:text-red-500 transition-colors"
          >
            <ArrowLeft size={20} /> Quit
          </button>
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <Brain size={20} />
            <span>Question {currentIndex + 1}/{questions.length}</span>
          </div>
        </div>

        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            className="h-full bg-blue-600"
          />
        </div>

        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
          <h3 className="text-xl font-bold leading-tight">{q.question}</h3>
          
          <div className="grid gap-3">
            {q.options.map((opt, idx) => {
              let statusClass = "border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500";
              if (showFeedback) {
                if (idx === q.correctIndex) statusClass = "border-green-500 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400";
                else if (idx === selectedOption) statusClass = "border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400";
                else statusClass = "opacity-50 border-gray-200 dark:border-gray-800";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={showFeedback}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 text-left font-medium transition-all ${statusClass}`}
                >
                  <span>{opt}</span>
                  {showFeedback && idx === q.correctIndex && <CheckCircle size={18} className="text-green-500" />}
                  {showFeedback && idx === selectedOption && idx !== q.correctIndex && <XCircle size={18} className="text-red-500" />}
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">💡 Explanation: {q.explanation}</p>
              </div>
              <button
                onClick={handleNext}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (quizFinished) {
    return (
      <div className="text-center space-y-6 py-10">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award size={48} />
        </div>
        <h2 className="text-3xl font-black">Quiz Completed!</h2>
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="text-2xl font-black text-blue-600">{score}/{questions.length}</div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-orange-600">+{score * 10}</div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Points</div>
          </div>
        </div>
        <div className="pt-6 space-y-3">
          <button 
            onClick={() => { setStep(2); setQuizFinished(false); setQuestions([]); }}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20"
          >
            Try Another Quiz
          </button>
          <button 
            onClick={() => window.history.back()}
            className="w-full py-4 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-gray-500"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};
