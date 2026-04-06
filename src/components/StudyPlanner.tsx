import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle2, Circle, Clock, Trash2, Sparkles, RefreshCw, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateAutoStudyPlan } from '../lib/gemini';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { SmartMic } from './SmartMic';

interface Task {
  id: string;
  title: string;
  subject: string;
  time: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export const StudyPlanner: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', subject: '', time: '', priority: 'medium' as const });
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
      setTasks(taskList);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleTask = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'tasks', id), {
        completed: !currentStatus
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      console.error(err);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTask.title.trim()) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        title: newTask.title,
        subject: newTask.subject || 'General',
        time: newTask.time || 'Anytime',
        completed: false,
        priority: newTask.priority,
        createdAt: serverTimestamp()
      });
      setNewTask({ title: '', subject: '', time: '', priority: 'medium' });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const generateAIPlan = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await generateAutoStudyPlan([]);
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        title: res.topic,
        subject: 'AI Recommendation',
        time: '11:00 AM',
        completed: false,
        priority: 'high',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Smart Study Planner</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">AI based timetable for you</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={generateAIPlan}
            disabled={loading}
            className="px-4 py-3 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all flex items-center gap-2 font-bold text-sm disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
            AI Generate Plan
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black">Add New Task</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={addTask} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400">Task Title</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required
                      value={newTask.title}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                      placeholder="e.g. Revise Physics Chapter 1"
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <SmartMic onResult={(text) => setNewTask(prev => ({...prev, title: prev.title + ' ' + text}))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Subject</label>
                    <input 
                      type="text" 
                      value={newTask.subject}
                      onChange={e => setNewTask({...newTask, subject: e.target.value})}
                      placeholder="Math, Science..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400">Time</label>
                    <input 
                      type="text" 
                      value={newTask.time}
                      onChange={e => setNewTask({...newTask, time: e.target.value})}
                      placeholder="10:00 AM"
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Save Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid gap-4">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                task.completed 
                  ? 'bg-gray-50 dark:bg-gray-900/20 border-transparent opacity-60' 
                  : 'bg-white dark:bg-[#1e1e1e] border-gray-100 dark:border-gray-800 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleTask(task.id, task.completed)}
                  className={`transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'}`}
                >
                  {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                <div>
                  <h4 className={`font-bold ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                      {task.subject}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>{task.time}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => deleteTask(task.id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
