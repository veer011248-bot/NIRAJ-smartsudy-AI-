import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Sparkles, RefreshCw, Download, Info, X, Camera } from 'lucide-react';
import { generateImage } from '../lib/gemini';
import { useLanguage } from '../lib/LanguageContext';
import { ImagePicker } from './ImagePicker';
import { SmartMic } from './SmartMic';

export const VisualLearning: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setStatus(selectedImage ? 'Editing your image with AI...' : 'Generating your study diagram...');

    try {
      const url = await generateImage(prompt, selectedImage || undefined);
      setResult(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 text-center pr-10">
          <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Visual Learning AI</h2>
          <p className="text-gray-500 dark:text-gray-400">Create or edit study diagrams and images with AI</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
        <div className="space-y-4">
          <label className="block text-sm font-black uppercase tracking-widest text-gray-400">Step 1: Upload or Click Photo (Optional)</label>
          
          {!selectedImage ? (
            <ImagePicker onImageSelect={setSelectedImage} />
          ) : (
            <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500/30 group">
              <img src={selectedImage} alt="Selected" className="w-full h-48 object-cover" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white font-bold text-sm">Image Selected</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-black uppercase tracking-widest text-gray-400">
              {selectedImage ? 'Step 2: What should I do with this image?' : 'Step 2: What do you want to create?'}
            </label>
            <div className="flex items-center gap-2">
              {prompt && (
                <button 
                  onClick={() => setPrompt('')}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  title="Clear All"
                >
                  <X size={18} />
                </button>
              )}
              <SmartMic onResult={(text) => setPrompt(prev => prev + ' ' + text)} />
            </div>
          </div>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={selectedImage ? "e.g. Add labels to this diagram, or change the color of the heart..." : "e.g. A detailed diagram of a human heart with labels..."}
            className="w-full h-32 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
          />
        </div>

        <button 
          onClick={handleGenerate}
          disabled={!prompt.trim() || loading}
          className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50 bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-blue-500/20`}
        >
          {loading ? <RefreshCw size={24} className="animate-spin" /> : <Sparkles size={24} />}
          {loading ? 'Processing...' : (selectedImage ? 'Edit with AI' : 'Generate Image')}
        </button>

        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
          <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
            Images are generated or edited using Nano Banana 2. Perfect for study diagrams, flowcharts, and visual aids.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl space-y-6"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <Sparkles size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 animate-pulse" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">{status}</h3>
              <p className="text-gray-500 text-sm">AI is working hard for your education...</p>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg uppercase tracking-widest">Generated Result</h3>
              <a 
                href={result} 
                download={`study-image-${Date.now()}`}
                className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <Download size={20} />
              </a>
            </div>
            
            <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-black aspect-video flex items-center justify-center">
              <img src={result} alt="Generated study aid" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-3xl text-center"
          >
            <p className="text-red-600 dark:text-red-400 font-bold mb-2">Error: {error}</p>
            <button 
              onClick={handleGenerate}
              className="text-xs font-black uppercase tracking-widest text-blue-600 underline"
            >
              Try Again Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
