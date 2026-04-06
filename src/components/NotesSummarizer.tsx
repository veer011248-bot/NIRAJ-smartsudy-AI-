import React, { useState, useRef } from 'react';
import { FileText, Sparkles, Copy, Check, RefreshCw, AlertCircle, ArrowLeft, Camera, Image as ImageIcon, X, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { summarizeNotes, summarizeFromImage } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { SmartMic } from './SmartMic';

import { ImagePicker } from './ImagePicker';

export const NotesSummarizer: React.FC = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (base64: string) => {
    setImage(base64);
  };

  const handleSummarize = async () => {
    if (!input.trim() && !image) return;
    if (!navigator.onLine) {
      setError("You are offline. AI summarization requires an internet connection.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let res;
      if (image) {
        const base64 = image.split(',')[1];
        res = await summarizeFromImage(base64);
      } else {
        res = await summarizeNotes(input);
      }
      setSummary(res || "Could not generate summary.");
    } catch (err: any) {
      setError(err.message || "Failed to summarize notes. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToNotes = async () => {
    if (!summary || !auth.currentUser) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'notes'), {
        userId: auth.currentUser.uid,
        title: `Summary: ${input.substring(0, 20) || 'Image Summary'}...`,
        content: input || 'Summarized from image',
        summary: summary,
        createdAt: serverTimestamp(),
        subject: 'AI Summary',
        tags: ['Summary', 'AI']
      });
      alert("Note saved successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
          <h2 className="text-2xl font-bold mb-2">Notes Summarizer</h2>
          <p className="text-gray-500 dark:text-gray-400">Convert long notes into short, readable bullet points</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="mb-2">
          <ImagePicker onImageSelect={handleImageSelect} />
        </div>

        <AnimatePresence>
          {image && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative rounded-xl overflow-hidden border-2 border-orange-500"
            >
              <img src={image} alt="Selected" className="w-full h-48 object-cover" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!image && (
          <div className="relative space-y-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your long notes here..."
              className="w-full h-64 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                {input.length} characters
              </div>
              <SmartMic onResult={(text) => setInput(prev => prev + '\n' + text)} />
            </div>
          </div>
        )}

        <button
          onClick={handleSummarize}
          disabled={(!input.trim() && !image) || loading}
          className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          {loading ? <RefreshCw className="animate-spin" /> : <Sparkles size={20} />}
          {loading ? 'Summarizing...' : 'Summarize Now'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4 relative"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold">
              <FileText size={20} />
              <h3>AI Summary</h3>
            </div>
            <button 
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            </button>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
          <button
            onClick={handleSaveToNotes}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save to Smart Notes'}
          </button>
        </motion.div>
      )}
    </div>
  );
};
