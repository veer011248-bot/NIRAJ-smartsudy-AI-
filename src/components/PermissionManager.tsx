import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mic, Camera, AlertCircle, CheckCircle2, ChevronRight, X, Info, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PermissionStatus {
  microphone: PermissionState | 'prompt';
  camera: PermissionState | 'prompt';
}

export const PermissionManager: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [status, setStatus] = useState<PermissionStatus>({
    microphone: 'prompt',
    camera: 'prompt'
  });
  const [showGuide, setShowGuide] = useState<null | 'microphone' | 'camera'>(null);

  const checkPermissions = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const micResult = await navigator.permissions.query({ name: 'microphone' as any });
        const camResult = await navigator.permissions.query({ name: 'camera' as any });
        
        setStatus({
          microphone: micResult.state,
          camera: camResult.state
        });

        micResult.onchange = () => setStatus(prev => ({ ...prev, microphone: micResult.state }));
        camResult.onchange = () => setStatus(prev => ({ ...prev, camera: camResult.state }));
      }
    } catch (e) {
      console.error("Permission check failed", e);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const requestPermission = async (type: 'microphone' | 'camera') => {
    try {
      const constraints = type === 'microphone' ? { audio: true } : { video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop());
      checkPermissions();
    } catch (e) {
      console.error(`Permission request failed for ${type}`, e);
      setStatus(prev => ({ ...prev, [type]: 'denied' }));
    }
  };

  const PermissionItem = ({ type, icon: Icon, label }: { type: 'microphone' | 'camera', icon: any, label: string }) => {
    const state = status[type];
    const isGranted = state === 'granted';
    const isDenied = state === 'denied';

    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isGranted ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 
              isDenied ? 'bg-red-100 dark:bg-red-900/20 text-red-600' : 
              'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
            }`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">{label}</p>
              <p className={`text-[10px] font-black uppercase tracking-widest ${
                isGranted ? 'text-green-500' : isDenied ? 'text-red-500' : 'text-blue-500'
              }`}>
                {state === 'prompt' ? 'Not Requested' : state}
              </p>
            </div>
          </div>
          
          {isGranted ? (
            <CheckCircle2 className="text-green-500" size={20} />
          ) : (
            <button 
              onClick={() => requestPermission(type)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              Allow Now
            </button>
          )}
        </div>

        {isDenied && (
          <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100/50 dark:border-red-900/20 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                Aapne browser me Mike access block kar diya hai. App ise apne aap on nahi kar sakta. Kripya niche diye gaye steps follow karein.
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowGuide(type)}
                className="flex-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5 bg-white dark:bg-gray-800 px-3 py-2.5 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/20"
              >
                <Info size={12} /> Setup Guide
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-1.5 bg-blue-600 px-3 py-2.5 rounded-xl shadow-md"
              >
                <RefreshCw size={12} /> Refresh App
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20">
        <ShieldCheck size={24} />
        <div>
          <h3 className="font-black text-lg leading-tight">Permission Manager</h3>
          <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold">App Control Center</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <PermissionItem type="microphone" icon={Mic} label="Microphone Access" />
        <PermissionItem type="camera" icon={Camera} label="Camera Access" />
      </div>

      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
        <h4 className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
          <Info size={14} /> Quick Setup Guide
        </h4>
        <p className="text-[11px] text-blue-800/70 dark:text-blue-300/70 leading-relaxed">
          Agar permission block hai, toh browser ke address bar me <b>Lock Icon</b> 🔒 ya <b>Camera/Mic Icon</b> par click karke "Allow" karein.
        </p>
      </div>

      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative">
              <button 
                onClick={() => setShowGuide(null)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <SettingsIcon size={32} className="animate-spin-slow" />
                </div>
                <h3 className="text-xl font-black">How to Unblock {showGuide}</h3>
                
                <div className="space-y-4 text-left">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
                    <p className="text-sm">Chrome browser ke top right me <b>3 dots (⋮)</b> par click karein.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
                    <p className="text-sm"><b>Settings</b> ya <b>(i) Info icon</b> par jayein, phir <b>Site Settings</b> par click karein.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</div>
                    <p className="text-sm"><b>{showGuide === 'microphone' ? 'Microphone' : 'Camera'}</b> ko select karein aur is site ko <b>Allow</b> kar dein.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</div>
                    <p className="text-sm">App par wapas aakar page ko <b>Refresh</b> karein.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowGuide(null)}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20"
                >
                  Got it!
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
