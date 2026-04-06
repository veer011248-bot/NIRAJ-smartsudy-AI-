import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Languages, RefreshCw, X, Check, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateText } from '../lib/gemini';
import { PermissionManager } from './PermissionManager';

interface SmartMicProps {
  onResult: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export const SmartMic: React.FC<SmartMicProps> = ({ onResult, placeholder, className }) => {
  const [isListening, setIsListening] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [targetLang, setTargetLang] = useState('Hindi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'prompt'>('prompt');
  const [showPermissionManager, setShowPermissionManager] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'microphone' as any });
          setPermissionStatus(result.state);
          result.onchange = () => setPermissionStatus(result.state);
        }
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
      setError(null);
      return true;
    } catch (e) {
      setPermissionStatus('denied');
      setError("Mic permission denied. Please allow mic access in browser settings.");
      return false;
    }
  };

  const languages = [
    'Hindi', 'English', 'Sanskrit', 'French', 'German', 'Spanish', 'Japanese', 'Korean', 'Arabic', 'Russian'
  ];

  const silenceTimerRef = React.useRef<any>(null);
  const longSilenceTimerRef = React.useRef<any>(null);

  useEffect(() => {
    let recognition: any = null;

    if (isListening) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN';

        recognition.onstart = () => {
          // Smart Auto-Off: If nothing said for 10 seconds, turn off mic
          if (longSilenceTimerRef.current) clearTimeout(longSilenceTimerRef.current);
          longSilenceTimerRef.current = setTimeout(() => {
            if (isListening) setIsListening(false);
          }, 10000);
        };

        recognition.onresult = (event: any) => {
          let final = '';
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          
          if (final) {
            // Reset smart auto-off timer as user is speaking
            if (longSilenceTimerRef.current) clearTimeout(longSilenceTimerRef.current);
            longSilenceTimerRef.current = setTimeout(() => {
              stopMic();
            }, 10000);

            setTranscript(prev => {
              const newText = (prev + ' ' + final).trim();
              // Auto-send on silence (1.5s)
              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = setTimeout(() => {
                if (newText) {
                  onResult(newText);
                  setTranscript('');
                  stopMic();
                }
              }, 1500);
              return newText;
            });
          }
          setInterimTranscript(interim);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          if (event.error === 'not-allowed') {
            setError('Mic permission denied. Please click the "Allow" button in your browser or check settings.');
            setPermissionStatus('denied');
          } else if (event.error === 'no-speech') {
            // Ignore no-speech errors to keep listening
          } else {
            setError(`Error: ${event.error}`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        try {
          recognition.start();
          setError(null);
        } catch (e) {
          console.error("Failed to start recognition:", e);
          setError("Failed to start mic.");
          setIsListening(false);
        }
      } else {
        setError('Speech recognition not supported in this browser.');
        setIsListening(false);
      }
    }

    return () => {
      if (recognition) {
        recognition.onend = null;
        recognition.stop();
      }
    };
  }, [isListening]);

  const stopMic = () => {
    setIsListening(false);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (longSilenceTimerRef.current) clearTimeout(longSilenceTimerRef.current);
  };

  const handleTranslate = async () => {
    if (!transcript || isTranslating) return;
    setIsTranslating(true);
    try {
      const translated = await translateText(transcript, targetLang);
      setTranscript(translated || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleConfirm = () => {
    onResult(transcript);
    setTranscript('');
    setIsListening(false);
    setShowTranslate(false);
  };

  const toggleMic = async () => {
    if (isListening) {
      setIsListening(false);
    } else {
      const granted = await requestPermission();
      if (granted) {
        setIsListening(true);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleMic}
        className={`p-3 rounded-2xl transition-all shadow-lg ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        title="Smart Mic"
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      <AnimatePresence>
        {(isListening || transcript) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full mb-4 right-0 w-80 bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4 z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Smart Mic Active</span>
              <button onClick={() => { setIsListening(false); setTranscript(''); }} className="text-gray-400 hover:text-red-500">
                <X size={16} />
              </button>
            </div>

            <div className="min-h-[60px] p-3 bg-gray-50 dark:bg-gray-900 rounded-xl mb-3 text-sm font-medium relative">
              <div className="text-gray-800 dark:text-gray-200">
                {transcript}
                <span className="text-gray-400">{interimTranscript}</span>
              </div>
              {!transcript && !interimTranscript && (
                <div className="text-gray-400 italic">
                  {isListening ? 'Listening...' : 'Speak now...'}
                </div>
              )}
              {isListening && (
                <div className="absolute top-2 right-2 flex gap-0.5">
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-blue-500 rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="mb-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Mic Access Required</h4>
                    <p className="text-[10px] text-gray-400">Please enable microphone access</p>
                  </div>
                </div>
                
                {permissionStatus === 'denied' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={requestPermission}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10"
                    >
                      Grant Access
                    </button>
                    <button 
                      onClick={() => setShowPermissionManager(true)}
                      className="flex-1 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
                    >
                      How to Fix?
                    </button>
                  </div>
                )}
                {!permissionStatus || permissionStatus !== 'denied' && (
                  <p className="text-[10px] text-red-500 font-medium">{error}</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setShowTranslate(!showTranslate)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-bold hover:bg-gray-200 transition-all"
              >
                <Languages size={12} />
                Translate
              </button>
              {transcript && (
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-[10px] font-bold hover:bg-green-600 transition-all ml-auto"
                >
                  <Check size={12} />
                  Use Text
                </button>
              )}
            </div>

            <AnimatePresence>
              {showTranslate && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800"
                >
                  <div className="flex flex-wrap gap-1">
                    {languages.map(l => (
                      <button
                        key={l}
                        onClick={() => setTargetLang(l)}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all ${
                          targetLang === l ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating || !transcript}
                    className="w-full py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isTranslating ? <RefreshCw size={12} className="animate-spin" /> : <Languages size={12} />}
                    Translate to {targetLang}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

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
