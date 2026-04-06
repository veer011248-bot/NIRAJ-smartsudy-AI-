import React, { useState } from 'react';
import { Camera, X, Sparkles, RefreshCw, Brain, ArrowLeft, Save, Check } from 'lucide-react';
import { solveFromImage } from '../lib/gemini';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { ImagePicker } from './ImagePicker';

export const ScanQuestion: React.FC = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'hindi' | 'english' | 'hinglish'>('hinglish');

  const handleImageUpload = (base64: string) => {
    setImage(base64);
    setResult('');
  };

  const handleSolve = async () => {
    if (!image || loading) return;
    if (!navigator.onLine) {
      setError("You are offline. AI solving requires an internet connection.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const base64 = image.split(',')[1];
      const res = await solveFromImage(base64, lang);
      setResult(res);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "AI Teacher is currently busy. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveToNotes = async () => {
    if (!result || !auth.currentUser) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await addDoc(collection(db, 'notes'), {
        userId: auth.currentUser.uid,
        title: `Scanned Question: ${new Date().toLocaleDateString()}`,
        content: result,
        imageUrl: image,
        createdAt: serverTimestamp(),
        subject: 'Scanned Question',
        tags: ['Scan', 'AI']
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center pr-10">
          <h2 className="text-2xl font-black mb-2">Smart Scan + Auto Explain</h2>
          <p className="text-gray-500 dark:text-gray-400 italic">"Scan karo, seekho, test do – sab ek app me"</p>
        </div>
      </div>

      {!image ? (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-10 border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center">
            <Camera size={40} />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">Question ki photo kheecho</p>
            <p className="text-sm text-gray-400">Math, Science, English sabka answer</p>
          </div>
          <div className="w-full max-w-xs">
            <ImagePicker onImageSelect={handleImageUpload} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg">
            <img 
              src={image} 
              alt="Question" 
              referrerPolicy="no-referrer"
              className="w-full h-64 object-cover" 
            />
            <button 
              onClick={() => { setImage(null); setResult(''); setError(null); }}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full backdrop-blur-md hover:bg-black/70 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {!result ? (
            <div className="space-y-4">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5">
                {(['hindi', 'english', 'hinglish'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all uppercase tracking-widest ${
                      lang === l 
                        ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {l === 'hinglish' ? 'Mix (Hinglish)' : l}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleSolve}
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                {loading ? 'AI is solving...' : 'Solve with AI'}
              </button>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-center">
                  <p className="text-xs text-red-600 dark:text-red-400 font-bold mb-2">{error}</p>
                  <button 
                    onClick={handleSolve}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 underline"
                  >
                    Try Again Now
                  </button>
                </div>
              )}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6"
            >
              <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs">
                <Brain size={16} />
                AI Teacher Explanation
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <Markdown 
                  remarkPlugins={[remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {result}
                </Markdown>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                <button 
                  onClick={() => { setImage(null); setResult(''); }}
                  className="flex-1 py-3 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-500"
                >
                  Scan Another
                </button>
                <button 
                  onClick={handleSaveToNotes}
                  disabled={saving || saveSuccess}
                  className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                    saveSuccess 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                      : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  }`}
                >
                  {saving ? <RefreshCw size={18} className="animate-spin" /> : saveSuccess ? <Check size={18} className="text-green-500" /> : <Save size={18} />}
                  {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save to Notes'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};
