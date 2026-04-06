import React, { useState, useRef, useEffect } from 'react';
import { Send, BrainCircuit, Sparkles, RefreshCw, User, GraduationCap, ArrowLeft, Camera, Image as ImageIcon, X, Save, Check, Volume2, VolumeX, ShieldCheck, Trash2, ChevronDown } from 'lucide-react';
import { NIRAJ_PHOTO_URL } from '../constants';
import { askDoubtTeacherStyle } from '../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { useLanguage } from '../lib/LanguageContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Logo } from './Logo';
import { SmartMic } from './SmartMic';
import { ImagePicker } from './ImagePicker';

export const DoubtChat: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  // Initial message based on language
  const getInitialMessage = () => {
    switch(language) {
      case 'Hindi': return "Namaste! Ji han, main NIRAJ AI hoon. Main aapka personal AI Teacher hoon. Aap mujhse koi bhi doubt pooch sakte hain, ya photo bhej kar bhi sawal pooch sakte hain. Main aapko ek teacher ki tarah simple language mein samjhaunga. 😊";
      case 'Bengali': return "নমস্কার! হ্যাঁ, আমি নিরাজ এআই। আমি আপনার ব্যক্তিগত এআই শিক্ষক। আপনি আমাকে যে কোনও সন্দেহ জিজ্ঞাসা করতে পারেন, বা ফটো পাঠিয়েও প্রশ্ন জিজ্ঞাসা করতে পারেন। আমি আপনাকে একজন শিক্ষকের মতো সহজ ভাষায় বুঝিয়ে দেব। 😊";
      case 'Marathi': return "नमस्ते! जी हो, मी नीरज एआय आहे. मी तुमचा वैयक्तिक एआय शिक्षक आहे. तुम्ही मला कोणतीही शंका विचारू शकता, किंवा फोटो पाठवूनही प्रश्न विचारू शकता. मी तुम्हाला एका शिक्षकाप्रमाणे सोप्या भाषेत समजावून सांगेन. 😊";
      case 'Telugu': return "నమస్తే! అవును, నేను నీరజ్ AI. నేను మీ వ్యక్తిగత AI టీచర్. మీరు నన్ను ఏవైనా సందేహాలు అడగవచ్చు లేదా ఫోటో పంపడం ద్వారా కూడా ప్రశ్నలు అడగవచ్చు. నేను మీకు టీచర్ లాగా సాధారణ భాషలో వివరిస్తాను. 😊";
      case 'Tamil': return "வணக்கம்! ஆம், நான் நீரஜ் AI. நான் உங்கள் தனிப்பட்ட AI ஆசிரியர். நீங்கள் என்னிடம் ஏதேனும் சந்தேகங்களைக் கேட்கலாம் அல்லது புகைப்படம் அனுப்புவதன் மூலமும் கேள்விகளைக் கேட்கலாம். நான் உங்களுக்கு ஒரு ஆசிரியரைப் போல எளிய மொழியில் விளக்குவேன். 😊";
      case 'Gujarati': return "નમસ્તે! જી હા, હું નીરજ AI છું. હું તમારો પર્સનલ AI શિક્ષક છું. તમે મને કોઈ પણ શંકા પૂછી શકો છો, અથવા ફોટો મોકલીને પણ પ્રશ્ન પૂછી શકો છો. હું તમને એક શિક્ષકની જેમ સરળ ભાષામાં સમજાવીશ. 😊";
      case 'Urdu': return "نمستے! جی ہاں، میں نیرج AI ہوں۔ میں آپ کا پرسنل AI ٹیچر ہوں۔ آپ مجھ سے کوئی بھی شک پوچھ سکتے ہیں، یا فوٹو بھیج کر بھی سوال پوچھ سکتے ہیں۔ میں آپ کو ایک ٹیچر کی طرح سادہ زبان میں سمجھاؤں گا۔ 😊";
      default: return "Hello! Yes, I am NIRAJ AI. I am your personal AI Teacher. You can ask me any doubt, or send a photo to ask a question. I will explain it to you in simple language like a teacher. 😊";
    }
  };

  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string, image?: string, isError?: boolean }[]>([
    { role: 'ai', text: getInitialMessage() }
  ]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [lang, setLang] = useState<'hindi' | 'english'>('hindi');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(() => JSON.parse(localStorage.getItem('autoSpeak') || 'false'));
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch (e) {}
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    // Update initial message if language changes and no messages yet (or just the first one)
    if (messages.length === 1 && messages[0].role === 'ai') {
      setMessages([{ role: 'ai', text: getInitialMessage() }]);
    }
  }, [language]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100);
      }
    };
    const current = scrollRef.current;
    current?.addEventListener('scroll', handleScroll);
    return () => current?.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const clearChat = () => {
    if (window.confirm(t('clearChatConfirm'))) {
      setMessages([{ role: 'ai', text: getInitialMessage() }]);
    }
  };

  useEffect(() => {
    if (scrollRef.current && !showScrollBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showScrollBottom]);

  const [cameraPermission, setCameraPermission] = useState<PermissionState | 'prompt'>('prompt');

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as any });
        setCameraPermission(result.state);
        result.onchange = () => setCameraPermission(result.state);
      } catch (e) {
        console.error("Camera permission check failed", e);
      }
    };
    checkPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      return true;
    } catch (e) {
      setCameraPermission('denied');
      return false;
    }
  };

  const handleImageSelect = (base64: string) => {
    setImage(base64);
  };

  const handleSend = async () => {
    if ((!input.trim() && !image) || loading) return;
    if (!navigator.onLine) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: `⚠️ **${t('offlineError')}**`,
        isError: true 
      }]);
      return;
    }
    const userMsg = { role: 'user' as const, text: input, image: image || undefined };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setImage(null);
    setLoading(true);
    try {
      const base64 = userMsg.image ? userMsg.image.split(',')[1] : undefined;
      const res = await askDoubtTeacherStyle(userMsg.text, base64, lang);
      
      // Start TTS generation in parallel with UI update for better sync
      let speechPromise: Promise<string | null> | null = null;
      if (autoSpeak) {
        const { generateSpeech } = await import('../lib/gemini');
        speechPromise = generateSpeech(res, 'Puck');
      }

      setMessages(prev => [...prev, { role: 'ai', text: res }]);
      
      if (speechPromise) {
        const base64Audio = await speechPromise;
        // Small delay to ensure text is rendered before audio starts
        setTimeout(() => {
          if (base64Audio) {
            handleSpeak(res, base64Audio);
          } else {
            handleSpeak(res); 
          }
        }, 300);
      }
      
      // Automatic save to notes
      if (auth.currentUser) {
        await addDoc(collection(db, 'notes'), {
          userId: auth.currentUser.uid,
          title: `AI Teacher: ${userMsg.text.substring(0, 20) || 'Doubt'}...`,
          content: res,
          createdAt: serverTimestamp(),
          tags: ['AI Teacher', 'Auto-Saved']
        });
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || t('errorOccurred');
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: `⚠️ **Error:** ${errorMessage}\n\n[${t('retryNow')}]`,
        isError: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const retryLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => prev.filter((m, i) => i !== prev.length - 1)); // Remove error message
      setInput(lastUserMsg.text);
      setImage(lastUserMsg.image || null);
      setMessages(prev => prev.filter((m, i) => i !== prev.length - 1)); // Remove last user message (it will be re-added)
      handleSend();
    }
  };

  const toggleAutoSpeak = () => {
    const newState = !autoSpeak;
    setAutoSpeak(newState);
    localStorage.setItem('autoSpeak', JSON.stringify(newState));
    if (!newState) {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch (e) {}
        audioSourceRef.current = null;
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
  };

  const handleSpeak = async (t_text: string, preGeneratedAudio?: string) => {
    if (!t_text) return;
    
    // Stop any currently playing audio
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (e) {}
      audioSourceRef.current = null;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(true);
    try {
      // Use 'Puck' or 'Charon' for a Male Indian feel in Gemini TTS
      const voice = 'Puck'; 
      const { generateSpeech } = await import('../lib/gemini');
      const base64Audio = preGeneratedAudio || await generateSpeech(t_text, voice);
      
      if (!base64Audio) {
        // Fallback to browser TTS if API fails
        const utterance = new SpeechSynthesisUtterance(t_text.replace(/[#*`_]/g, ''));
        utterance.lang = lang === 'hindi' ? 'hi-IN' : 'en-US';
        utterance.rate = 1.0; // Normal speed
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        return;
      }

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const audioContext = audioContextRef.current;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const binaryString = window.atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

      const pcmData = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) float32Data[i] = pcmData[i] / 32768.0;

      const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setIsSpeaking(false);
        audioSourceRef.current = null;
      };

      audioSourceRef.current = source;
      source.start(0);
    } catch (err) {
      console.error("Playback failed:", err);
      setIsSpeaking(false);
    }
  };

  const saveToNotes = async (text: string, index: number) => {
    if (!auth.currentUser) return;
    setSaving(index);
    try {
      await addDoc(collection(db, 'notes'), {
        userId: auth.currentUser.uid,
        title: `AI Doubt: ${text.substring(0, 20)}...`,
        content: text,
        createdAt: serverTimestamp(),
        tags: ['AI Doubt', 'Study']
      });
      setTimeout(() => setSaving(null), 2000);
    } catch (err) {
      console.error(err);
      setSaving(null);
    }
  };

  return (
    <div className="h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] flex flex-col bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
      <div className="p-3 bg-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
            <GraduationCap size={20} />
          </div>
          <div>
            <h3 className="font-black text-xs uppercase tracking-widest">{t('ask')}</h3>
            <p className="text-[8px] text-blue-100 opacity-80">{t('explainLikeTeacher')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleAutoSpeak}
            className={`p-2 rounded-xl transition-all ${
              autoSpeak 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-blue-100 hover:text-white hover:bg-white/10'
            }`}
            title={autoSpeak ? "Auto-Speak ON" : "Auto-Speak OFF"}
          >
            {autoSpeak ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button 
            onClick={clearChat}
            className="p-2 text-blue-100 hover:text-white transition-colors"
            title={t('clearChat')}
          >
            <Trash2 size={20} />
          </button>
          <div className="flex bg-white/10 p-1 rounded-xl backdrop-blur-md">
          {(['hindi', 'english'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${
                lang === l 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold bg-white/10 px-3 py-1 rounded-full">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          {t('online')}
        </div>
      </div>
    </div>

    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth relative">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-3 rounded-xl shadow-sm relative group ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-50 dark:bg-gray-900/50 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-800'
              }`}>
                <div className="flex items-center gap-2 mb-1.5 opacity-50 text-[8px] font-black uppercase tracking-widest">
                  {msg.role === 'user' ? (
                    <User size={10} />
                  ) : (
                    <Logo size="sm" className="w-3 h-3" rounded="rounded-full" />
                  )}
                  {msg.role === 'user' ? t('you') : 'NIRAJ AI'}
                </div>
                {msg.image && (
                  <img 
                    src={msg.image} 
                    alt="User upload" 
                    referrerPolicy="no-referrer"
                    className="w-full h-32 object-cover rounded-lg mb-2 border border-gray-100 dark:border-gray-800" 
                  />
                )}
                <div className="prose prose-xs dark:prose-invert max-w-none">
                  <Markdown 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.text}
                  </Markdown>
                </div>
                {msg.role === 'ai' && msg.isError && (
                  <button 
                    onClick={retryLastMessage}
                    className="mt-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 underline"
                  >
                    {t('retryNow')}
                  </button>
                )}
                {msg.role === 'ai' && idx > 0 && !msg.isError && (
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button 
                      onClick={() => handleSpeak(msg.text)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        isSpeaking 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-blue-500'
                      }`}
                      title={t('listen')}
                    >
                      {isSpeaking ? <Volume2 size={14} className="animate-pulse" /> : <Volume2 size={14} />}
                      {isSpeaking ? 'Speaking...' : 'Listen'}
                    </button>
                    <button 
                      onClick={() => saveToNotes(msg.text, idx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                      title={t('saveToNotes')}
                    >
                      {saving === idx ? <Check size={14} className="text-green-500" /> : <Save size={14} />}
                      {saving === idx ? 'Saved' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 w-10 h-10 bg-white dark:bg-gray-800 text-blue-600 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center z-10"
            >
              <ChevronDown size={20} />
            </motion.button>
          )}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin text-blue-600" />
              <span className="text-xs font-bold text-gray-400">{t('aiThinking')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 space-y-3">
        <AnimatePresence>
          {image && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-500"
            >
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={() => setImage(null)}
                className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full"
              >
                <X size={10} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <ImagePicker onImageSelect={handleImageSelect} className="mb-1" />
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('askDoubt')}
                className="flex-1 px-4 py-3 bg-white dark:bg-[#1e1e1e] border-2 border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm text-sm"
              />
              <SmartMic onResult={(text) => setInput(prev => prev + ' ' + text)} />
            </div>
          </div>
          <button 
            onClick={handleSend}
            disabled={(!input.trim() && !image) || loading}
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
              loading 
                ? 'bg-gray-100 dark:bg-gray-800 text-blue-600' 
                : 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-blue-500/20 hover:scale-105'
            }`}
          >
            {loading ? <RefreshCw size={20} className="animate-spin" /> : <div className="flex flex-col items-center"><Send size={16} /><span className="text-[7px] font-black uppercase">{t('send')}</span></div>}
          </button>
        </div>
      </div>
    </div>
  );
};
