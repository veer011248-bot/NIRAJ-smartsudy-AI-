import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause, SkipBack, SkipForward, BookOpen, Music, Sparkles, RefreshCw, Languages, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateVoiceExplanation, generateSpeech } from '../lib/gemini';
import { useNavigate } from 'react-router-dom';
import { SmartMic } from './SmartMic';

export const VoiceLearning: React.FC = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNote, setCurrentNote] = useState(0);
  const [topicInput, setTopicInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'hindi' | 'english'>('hindi');

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

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

  const [notes, setNotes] = useState([
    { title: "Photosynthesis (Hindi)", content: "प्रकाश संश्लेषण वह प्रक्रिया है जिसके द्वारा हरे पौधे सूर्य के प्रकाश का उपयोग करके कार्बन डाइऑक्साइड और पानी से भोजन बनाते हैं। यह पृथ्वी पर जीवन के लिए बहुत महत्वपूर्ण है।" },
    { title: "Newton's Laws (English)", content: "Newton's First Law states that an object will remain at rest or in uniform motion in a straight line unless acted upon by an external force." },
    { title: "Cell Structure (Hindi)", content: "कोशिका जीवन की सबसे छोटी और बुनियादी इकाई है। सभी जीवित प्राणी कोशिकाओं से बने होते हैं। कोशिका के अंदर केंद्रक, माइटोकॉन्ड्रिया और अन्य अंग होते हैं।" },
    { title: "Global Warming (English)", content: "Global warming is the long-term heating of Earth's climate system observed since the pre-industrial period due to human activities, primarily fossil fuel burning." },
    { title: "Indian History (Hindi)", content: "भारत का इतिहास बहुत प्राचीन और समृद्ध है। सिंधु घाटी सभ्यता से लेकर आधुनिक भारत तक, इसमें कई महान राजाओं और स्वतंत्रता सेनानियों का योगदान रहा है।" }
  ]);

  const stripMarkdown = (text: string) => {
    return text.replace(/[*#_~`>]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
  };

  const togglePlay = async (text?: string) => {
    const contentToSpeak = text || notes[currentNote].content;
    const cleanText = stripMarkdown(contentToSpeak);
    
    if (!isPlaying) {
      // Stop any currently playing audio (TTS API)
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (e) {
          // Source might already be stopped
        }
        audioSourceRef.current = null;
      }

      // Stop any currently playing speech (Browser Speech API)
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      setIsPlaying(true);
      try {
        // Use 'Puck' for a Male Indian feel
        const voice = 'Puck';
        const base64Audio = await generateSpeech(cleanText, voice);
        
        if (!base64Audio) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = voiceLang === 'hindi' ? 'hi-IN' : 'en-US';
          utterance.rate = 1.0; // Normal speed
          utterance.onend = () => setIsPlaying(false);
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
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const pcmData = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
          float32Data[i] = pcmData[i] / 32768.0;
        }

        const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000);
        audioBuffer.getChannelData(0).set(float32Data);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          setIsPlaying(false);
          audioSourceRef.current = null;
        };

        audioSourceRef.current = source;
        source.start(0);
      } catch (err) {
        console.error("Playback failed:", err);
        setIsPlaying(false);
      }
    } else {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const [error, setError] = useState<string | null>(null);

  const handleExplainTopic = async () => {
    if (!topicInput.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const explanation = await generateVoiceExplanation(topicInput, voiceLang);
      const newNote = { title: topicInput, content: explanation };
      setNotes(prev => [newNote, ...prev]);
      setCurrentNote(0);
      setTopicInput('');
      // Automatically play the new explanation
      togglePlay(explanation);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate explanation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="text-3xl font-black mb-2">Voice Learning Mode</h2>
          <p className="text-gray-500 dark:text-gray-400">Walking ya sone se pehle padhai (Listen to your notes)</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-[32px] border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={16} className="text-purple-500" /> Explain Any Topic
          </h4>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button 
              onClick={() => setVoiceLang('hindi')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${voiceLang === 'hindi' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400'}`}
            >
              HINDI
            </button>
            <button 
              onClick={() => setVoiceLang('english')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${voiceLang === 'english' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-400'}`}
            >
              ENGLISH
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleExplainTopic()}
            placeholder="Enter topic (e.g. Gravity, Cell, History...)"
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <SmartMic onResult={(text) => setTopicInput(prev => prev + ' ' + text)} />
          <button 
            onClick={handleExplainTopic}
            disabled={!topicInput.trim() || loading}
            className="px-6 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
            {loading ? '...' : 'Explain'}
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-center"
          >
            <p className="text-xs text-red-600 dark:text-red-400 font-bold mb-2">{error}</p>
            <button 
              onClick={handleExplainTopic}
              className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 underline"
            >
              Try Again Now
            </button>
          </motion.div>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
            <Music size={40} className="animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black">{notes[currentNote].title}</h3>
            <p className="text-blue-100 text-sm opacity-80">Playing your smart notes...</p>
          </div>

          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              animate={{ x: isPlaying ? ['0%', '100%'] : '0%' }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-1/3 h-full bg-white"
            />
          </div>

          <div className="flex items-center gap-8">
            <button 
              onClick={() => setCurrentNote(prev => (prev > 0 ? prev - 1 : prev))}
              className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"
            >
              <SkipBack size={24} />
            </button>
            <button 
              onClick={() => togglePlay()}
              className="w-20 h-20 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all active:scale-95"
            >
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
            <button 
              onClick={() => setCurrentNote(prev => (prev < notes.length - 1 ? prev + 1 : prev))}
              className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"
            >
              <SkipForward size={24} />
            </button>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      <div className="space-y-4">
        <h4 className="font-black text-lg flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" /> Your Playlist
        </h4>
        <div className="grid gap-3">
          {notes.map((note, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentNote(idx); window.speechSynthesis.cancel(); setIsPlaying(false); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                currentNote === idx ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-gray-100 dark:border-gray-800'
              }`}
            >
              <span className="font-bold">{note.title}</span>
              {currentNote === idx && isPlaying && <Volume2 size={18} className="animate-pulse" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
