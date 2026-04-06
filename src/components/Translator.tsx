import React, { useState } from 'react';
import { Languages, Mic, Volume2, Copy, RefreshCw, ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react';
import { translateText } from '../lib/gemini';
import { SmartMic } from './SmartMic';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export const Translator: React.FC = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetLang, setTargetLang] = useState('Hindi');
  const [sourceLang, setSourceLang] = useState('Auto Detect');

  const languages = [
    'Hindi', 'English', 'Sanskrit', 'French', 'German', 'Spanish', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Bengali', 'Marathi', 'Telugu', 'Tamil', 'Gujarati'
  ];

  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await translateText(text, targetLang);
      setTranslatedText(res || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (t: string, lang: string) => {
    if (!t) return;
    const utterance = new SpeechSynthesisUtterance(t);
    if (lang.toLowerCase().includes('hindi')) utterance.lang = 'hi-IN';
    else if (lang.toLowerCase().includes('english')) utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (t: string) => {
    navigator.clipboard.writeText(t);
    alert("Copied to clipboard!");
  };

  const swapLanguages = () => {
    if (sourceLang === 'Auto Detect') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setText(translatedText);
    setTranslatedText(text);
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
          <h2 className="text-2xl font-black mb-1">Smart Translator</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">NIRAJ SmartStudy AI</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        {/* Language Selector */}
        <div className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-900 p-2 rounded-2xl">
          <select 
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="flex-1 bg-transparent text-sm font-bold focus:outline-none p-2"
          >
            <option>Auto Detect</option>
            {languages.map(l => <option key={l}>{l}</option>)}
          </select>
          
          <button 
            onClick={swapLanguages}
            className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:rotate-180 transition-all duration-500"
          >
            <RefreshCw size={18} className="text-blue-600" />
          </button>

          <select 
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="flex-1 bg-transparent text-sm font-bold focus:outline-none p-2 text-right"
          >
            {languages.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text here..."
              className="w-full h-32 p-4 bg-transparent border-2 border-gray-100 dark:border-gray-800 rounded-2xl focus:border-blue-500 focus:outline-none transition-all resize-none font-medium"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              {text && (
                <button 
                  onClick={() => setText('')}
                  className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                  title="Clear All"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="absolute bottom-4 right-4">
              <SmartMic onResult={(t) => setText(prev => prev + ' ' + t)} />
            </div>
          </div>

          <button
            onClick={handleTranslate}
            disabled={!text.trim() || loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <Sparkles size={20} />}
            {loading ? 'Translating...' : 'Translate Now'}
          </button>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-center"
            >
              <p className="text-xs text-red-600 dark:text-red-400 font-bold mb-2">{error}</p>
              <button 
                onClick={handleTranslate}
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 underline"
              >
                Try Again Now
              </button>
            </motion.div>
          )}
        </div>

        {/* Output Area */}
        <AnimatePresence>
          {translatedText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Translated Result</span>
                <div className="flex gap-2">
                  <button onClick={() => setTranslatedText('')} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500" title="Clear Result">
                    <X size={18} />
                  </button>
                  <button onClick={() => handleSpeak(translatedText, targetLang)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors text-blue-600">
                    <Volume2 size={18} />
                  </button>
                  <button onClick={() => handleCopy(translatedText)} className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors text-blue-600">
                    <Copy size={18} />
                  </button>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200 leading-relaxed">
                {translatedText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl text-white">
        <h4 className="font-black mb-2 flex items-center gap-2">
          <Languages size={20} />
          Voice Translation Mode
        </h4>
        <p className="text-xs opacity-90 leading-relaxed">
          Use the Smart Mic button above to speak in any language. You can translate your voice in real-time and play the output.
        </p>
      </div>
    </div>
  );
};
