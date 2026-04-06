import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { askVoiceAssistant, generateSpeech, liveModel } from '../lib/gemini';
import { NIRAJ_PHOTO_URL } from '../constants';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Logo } from './Logo';
import { PermissionManager } from './PermissionManager';
import { useLanguage } from '../lib/LanguageContext';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Brain, ArrowLeft, RefreshCw, Send, User, Bot, Zap, ShieldCheck, X } from 'lucide-react';

export const VoiceAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isLiveConnecting, setIsLiveConnecting] = useState(false);
  
  // Initial message based on language
  const getInitialMessage = () => {
    switch(language) {
      case 'Hindi': return "Namaste! Main NIRAJ AI hoon. Main aapka powerful AI Assistant hoon. Aap mujhse live baat kar sakte hain. Main duniya bhar ka knowledge rakhta hoon. Poochiye, main aapki kaise madad kar sakta hoon?";
      case 'Bengali': return "নমস্কার! আমি নিরাজ এআই। আমি আপনার শক্তিশালী এআই অ্যাসিস্ট্যান্ট। আপনি আমার সাথে সরাসরি কথা বলতে পারেন। আমার কাছে সারা বিশ্বের জ্ঞান আছে। জিজ্ঞাসা করুন, আমি আপনাকে কীভাবে সাহায্য করতে পারি?";
      case 'Marathi': return "नमस्ते! मी नीरज एआय आहे. मी तुमचा शक्तिशाली एआय असिस्टंट आहे. तुम्ही माझ्याशी थेट बोलू शकता. माझ्याकडे जगातील सर्व ज्ञान आहे. विचारा, मी तुम्हाला कशी मदत करू शकतो?";
      case 'Telugu': return "నమస్తే! నేను నీరజ్ AI. నేను మీ శక్తివంతమైన AI అసిస్టెంట్. మీరు నాతో ప్రత్యక్షంగా మాట్లాడవచ్చు. నా దగ్గర ప్రపంచవ్యాప్త జ్ఞానం ఉంది. అడગండి, నేను మీకు ఎలా సహాయం చేయగలను?";
      case 'Tamil': return "வணக்கம்! நான் நீரஜ் AI. நான் உங்கள் சக்திவாய்ந்த AI உதவியாளர். நீங்கள் என்னுடன் நேரடியாகப் பேசலாம். என்னிடம் உலகளாவிய அறிவு உள்ளது. கேளுங்கள், நான் உங்களுக்கு எப்படி உதவ முடியும்?";
      case 'Gujarati': return "નમસ્તે! હું નીરજ AI છું. હું તમારો શક્તિશાળી AI આસિસ્ટન્ટ છું. તમે મારી સાથે લાઈવ વાત કરી શકો છો. મારી પાસે વિશ્વભરનું જ્ઞાન છે. પૂછો, હું તમને કેવી રીતે મદદ કરી શકું?";
      case 'Urdu': return "نمستے! میں نیرج AI ہوں۔ میں آپ کا طاقتور AI اسسٹنٹ ہوں۔ آپ مجھ سے لائیو بات کر سکتے ہیں۔ میرے پاس دنیا بھر کا علم ہے۔ پوچھیں، میں آپ کی کیسے مدد کر سکتا ہوں؟";
      default: return "Hello! I am NIRAJ AI. I am your powerful AI Assistant. You can talk to me live. I have worldwide knowledge. Ask me anything, how can I help you today?";
    }
  };

  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: getInitialMessage() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPermissionManager, setShowPermissionManager] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const liveSessionRef = useRef<any>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'prompt'>('prompt');

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopLiveSession();
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
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as any });
        setPermissionStatus(result.state);
        result.onchange = () => setPermissionStatus(result.state);
      } catch (e) {
        console.error("Permission check failed", e);
      }
    };
    checkPermission();
  }, []);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
      return true;
    } catch (e) {
      setPermissionStatus('denied');
      return false;
    }
  };

  useEffect(() => {
    // Update initial message if language changes and no messages yet (or just the first one)
    if (messages.length === 1 && messages[0].role === 'ai') {
      setMessages([{ role: 'ai', text: getInitialMessage() }]);
    }
  }, [language]);

  const longSilenceTimerRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Continuous listening
      recognitionRef.current.interimResults = true;
      
      const getLangCode = () => {
        switch(language) {
          case 'Hindi': return 'hi-IN';
          case 'Bengali': return 'bn-IN';
          case 'Marathi': return 'mr-IN';
          case 'Telugu': return 'te-IN';
          case 'Tamil': return 'ta-IN';
          case 'Gujarati': return 'gu-IN';
          case 'Urdu': return 'ur-PK';
          default: return 'en-US';
        }
      };
      recognitionRef.current.lang = getLangCode();

      recognitionRef.current.onstart = () => {
        // Smart Auto-Off: If nothing said for 10 seconds, turn off mic
        if (longSilenceTimerRef.current) clearTimeout(longSilenceTimerRef.current);
        longSilenceTimerRef.current = setTimeout(() => {
          if (isListening) {
            recognitionRef.current?.stop();
          }
        }, 10000);
      };

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        
        setInput(transcript);

        // Reset smart auto-off timer as user is speaking
        if (longSilenceTimerRef.current) clearTimeout(longSilenceTimerRef.current);
        longSilenceTimerRef.current = setTimeout(() => {
          if (isListening) recognitionRef.current?.stop();
        }, 10000);

        // Silence detection: If user stops for 1.5 seconds, send automatically
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (transcript.trim()) {
            handleSend(transcript);
            recognitionRef.current?.stop();
          }
        }, 1500);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') setPermissionStatus('denied');
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (longSilenceTimerRef.current) clearTimeout(longSilenceTimerRef.current);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      };
    }
  }, [language, isListening]);

  const stopLiveSession = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setIsLive(false);
    setIsLiveConnecting(false);
  };

  const startLiveSession = async () => {
    if (isLiveConnecting) return;
    setIsLiveConnecting(true);
    
    try {
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setIsLiveConnecting(false);
          return;
        }
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey || "" });
      
      const session = await ai.live.connect({
        model: liveModel,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are NIRAJ AI, a smart study assistant created by NIRAJ KUMAR KANNAUJIYA. 
          Talk naturally and help the student with their queries. Keep responses concise. 
          Language: ${language}.`,
        },
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setIsLiveConnecting(false);
            startAudioCapture();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              playLiveAudio(message.serverContent.modelTurn.parts[0].inlineData.data);
            }
            if (message.serverContent?.interrupted) {
              stopLiveAudio();
            }
          },
          onclose: () => stopLiveSession(),
          onerror: (err) => {
            console.error("Live API Error:", err);
            stopLiveSession();
          }
        }
      });

      liveSessionRef.current = session;
    } catch (err) {
      console.error("Failed to connect to Live API:", err);
      setIsLiveConnecting(false);
    }
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!liveSessionRef.current) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        liveSessionRef.current.sendRealtimeInput({
          audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
    } catch (err) {
      console.error("Audio capture failed:", err);
      stopLiveSession();
    }
  };

  const playLiveAudio = (base64Data: string) => {
    if (!audioContextRef.current) return;
    
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    
    const pcmData = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) float32Data[i] = pcmData[i] / 32768.0;
    
    const buffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start(0);
  };

  const stopLiveAudio = () => {
    // Logic to stop current playback if interrupted
  };

  const toggleListening = async () => {
    if (isLive) {
      stopLiveSession();
    } else {
      await startLiveSession();
    }
  };

  useEffect(() => {
    return () => stopLiveSession();
  }, []);

  const speak = async (text: string, preGeneratedAudio?: string) => {
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

    setIsSpeaking(true);
    try {
      // Use 'Puck' for a Male Indian feel
      const voice = 'Puck';
      const base64Audio = preGeneratedAudio || await generateSpeech(text, voice);
      
      if (!base64Audio) {
        const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`_]/g, ''));
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

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    
    const userMsg = { role: 'user' as const, text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const aiText = await askVoiceAssistant(text);
      
      // Start TTS generation in parallel with UI update for better sync
      const { generateSpeech } = await import('../lib/gemini');
      const speechPromise = generateSpeech(aiText, 'Puck');

      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      
      const base64Audio = await speechPromise;
      // Small delay to ensure text is rendered before audio starts
      setTimeout(() => {
        if (base64Audio) {
          speak(aiText, base64Audio);
        } else {
          speak(aiText); // Fallback
        }
      }, 300);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: t('errorOccurred') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => navigate('/')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black flex items-center gap-2">
            <Zap size={18} className="text-yellow-500" /> {t('ai')}
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-gray-500 text-[10px]">{t('liveTalk')}</p>
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase rounded-full border border-blue-200 dark:border-blue-800">
              Gemini 3.1
            </span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 p-3 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-inner relative">
        {isLive && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse border border-red-500/20">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            {t('liveSession')}
          </div>
        )}
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-3 rounded-xl flex gap-2 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700'
              }`}>
                <div className="mt-0.5">
                  {msg.role === 'user' ? (
                    <User size={14} />
                  ) : (
                    <Logo size="sm" className="w-4 h-4" rounded="rounded-full" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  {msg.role === 'ai' && idx > 0 && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button 
                        onClick={() => speak(msg.text)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          isSpeaking 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-blue-500'
                        }`}
                      >
                        {isSpeaking ? <Volume2 size={12} className="animate-pulse" /> : <Volume2 size={12} />}
                        {isSpeaking ? 'Speaking...' : 'Listen'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin text-blue-500" />
              <span className="text-xs font-bold text-gray-400">{t('aiThinking')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        {isLive && (
          <div className="flex items-end gap-1 h-8 mb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <motion.div
                key={i}
                animate={{ height: [8, 32, 8] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.05 }}
                className="w-1.5 bg-blue-500 rounded-full"
              />
            ))}
          </div>
        )}
        {permissionStatus === 'denied' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#1e1e1e] border border-blue-100 dark:border-blue-900/20 p-3 rounded-2xl shadow-lg flex flex-col items-center text-center gap-2 mb-2 w-full relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
            <div className="flex items-center gap-3 w-full px-2">
              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="text-left">
                <h4 className="font-black text-xs">{t('micAccessRequired')}</h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {t('enableMic')}
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <button 
                onClick={requestPermission}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-all active:scale-95"
              >
                {t('grantAccess')}
              </button>
              <button 
                onClick={() => setShowPermissionManager(true)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
              >
                {t('howToFix')}
              </button>
            </div>
          </motion.div>
        )}
        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
              placeholder={t('askAnything')}
              className="w-full px-4 py-3 bg-white dark:bg-[#1e1e1e] border-2 border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-md text-sm"
            />
          </div>
          
          <button 
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 active:scale-95"
          >
            <Send size={20} />
          </button>

          <button 
            onClick={toggleListening}
            disabled={isLiveConnecting}
            className={`p-3 rounded-xl shadow-md transition-all active:scale-90 ${
              isLive 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLiveConnecting ? <RefreshCw size={20} className="animate-spin" /> : (isLive ? <MicOff size={20} /> : <Mic size={20} />)}
          </button>
        </div>
        
        {isSpeaking && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest"
          >
            <Volume2 size={16} className="animate-bounce" />
            {t('aiSpeaking')}
          </motion.div>
        )}
      </div>

      {/* Permission Manager Modal */}
      <AnimatePresence>
        {showPermissionManager && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPermissionManager(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-[32px] p-6 shadow-2xl relative z-10"
            >
              <PermissionManager onClose={() => setShowPermissionManager(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
