import React, { useState } from 'react';
import { Camera, X, Sparkles, RefreshCw, ArrowLeft, Save, Check, FileText, Copy } from 'lucide-react';
import { recognizeHandwriting } from '../lib/gemini';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ImagePicker } from './ImagePicker';

export const HandwritingOCR: React.FC = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleImageUpload = (base64: string) => {
    setImage(base64);
    setResult('');
    setError(null);
  };

  const handleRecognize = async () => {
    if (!image || loading) return;
    setLoading(true);
    setError(null);
    try {
      const base64 = image.split(',')[1];
      const res = await recognizeHandwriting(base64);
      setResult(res || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to recognize handwriting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToNotes = async () => {
    if (!result || !auth.currentUser) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await addDoc(collection(db, 'notes'), {
        userId: auth.currentUser.uid,
        title: `Handwritten Note: ${new Date().toLocaleDateString()}`,
        content: result,
        imageUrl: image,
        createdAt: serverTimestamp(),
        subject: 'Handwritten Notes',
        tags: ['Handwriting', 'OCR']
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

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
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
          <h2 className="text-2xl font-black mb-2">Handwriting to Text</h2>
          <p className="text-gray-500 dark:text-gray-400 italic">"Apne haath se likhe notes ko digital banayein"</p>
        </div>
      </div>

      {!image ? (
        <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-10 border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-full flex items-center justify-center">
            <FileText size={40} />
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">Notes ki photo upload karein</p>
            <p className="text-sm text-gray-400">Handwritten notes ko editable text mein badlein</p>
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
              alt="Handwritten Notes" 
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
              <button 
                onClick={handleRecognize}
                disabled={loading}
                className="w-full py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                {loading ? 'Recognizing...' : 'Convert to Text'}
              </button>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-center">
                  <p className="text-xs text-red-600 dark:text-red-400 font-bold mb-2">{error}</p>
                  <button 
                    onClick={handleRecognize}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 underline"
                  >
                    Try Again
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-600 font-black uppercase tracking-widest text-xs">
                  <FileText size={16} />
                  Digital Text
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 flex items-center gap-1 text-xs font-bold"
                >
                  {copySuccess ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
              
              <textarea
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none resize-none font-sans text-sm leading-relaxed"
                placeholder="Digital text will appear here..."
              />

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
                      : 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  }`}
                >
                  {saving ? <RefreshCw size={18} className="animate-spin" /> : saveSuccess ? <Check size={18} /> : <Save size={18} />}
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
