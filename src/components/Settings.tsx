import React, { useState } from 'react';
import { 
  Bell, 
  Globe, 
  Star, 
  Info, 
  Shield,
  ChevronRight,
  LogOut,
  X,
  Heart,
  Volume2,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PermissionManager } from './PermissionManager';
import { auth, logOut } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { checkApiKey } from '../lib/gemini';
import { useLanguage } from '../lib/LanguageContext';
import { Language } from '../lib/translations';

export const Settings: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const user = auth.currentUser;
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkStatus = async () => {
      const isValid = await checkApiKey();
      setApiStatus(isValid ? 'connected' : 'error');
    };
    checkStatus();
  }, []);

  const handleLogout = async () => {
    await logOut();
    navigate('/login');
  };

  const handleRate = () => {
    window.open('https://play.google.com/store/apps/details?id=com.niraj.smartstudy', '_blank');
  };

  const [customApiKey, setCustomApiKey] = useState(localStorage.getItem('custom_gemini_api_key') || '');
  const [isSavingKey, setIsSavingKey] = useState(false);

  const saveApiKey = async () => {
    setIsSavingKey(true);
    if (customApiKey.trim()) {
      localStorage.setItem('custom_gemini_api_key', customApiKey.trim());
    } else {
      localStorage.removeItem('custom_gemini_api_key');
    }
    
    // Test the key
    const isValid = await checkApiKey();
    setApiStatus(isValid ? 'connected' : 'error');
    setIsSavingKey(false);
    
    if (isValid) {
      alert("API Key saved and verified! App will now use your custom key.");
    } else if (customApiKey.trim()) {
      alert("Warning: The API key provided seems invalid. Please check and try again.");
    } else {
      alert("Custom API Key removed. Using default key.");
    }
  };

  const languages: Language[] = ['English', 'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Tamil', 'Gujarati', 'Urdu'];

  const sections = [
    {
      title: t('preferences'),
      items: [
        { name: t('notifications'), icon: Bell, type: 'toggle', value: notifications, action: () => setNotifications(!notifications) },
        { name: t('autoSpeak'), icon: Volume2, type: 'toggle', value: autoSpeak, action: () => {
          const newValue = !autoSpeak;
          setAutoSpeak(newValue);
          localStorage.setItem('autoSpeak', JSON.stringify(newValue));
        } },
        { name: t('language'), icon: Globe, type: 'select', value: language, action: () => setShowLanguage(true) },
        { name: t('appPermissions'), icon: ShieldCheck, type: 'link', action: () => setShowPermissions(true) },
      ]
    },
    {
      title: t('support'),
      items: [
        { name: t('rateUs'), icon: Star, type: 'link', action: handleRate },
        { name: t('aboutApp'), icon: Info, type: 'link', action: () => setShowAbout(true) },
        { name: t('privacyPolicy'), icon: Shield, type: 'link', action: () => setShowPrivacy(true) },
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="text-center">
        <h2 className="text-2xl font-black mb-2">{t('settings')}</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage your account and app preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
        <img 
          src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}`} 
          alt="Profile" 
          className="w-16 h-16 rounded-full border-2 border-blue-500 p-0.5"
        />
        <div className="flex-1">
          <h3 className="font-bold text-lg">{user?.displayName || t('guestStudent')}</h3>
          <p className="text-sm text-gray-500">{user?.email || 'guest@example.com'}</p>
        </div>
        <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* AI Status Card */}
      <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              apiStatus === 'connected' ? 'bg-green-100 text-green-600' : 
              apiStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <Zap size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('aiStatus')}</p>
              <h4 className="font-bold">
                {apiStatus === 'connected' ? t('connected') : 
                 apiStatus === 'error' ? t('error') : 'CHECKING...'}
              </h4>
            </div>
          </div>
          {apiStatus === 'error' && (
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white text-xs font-black rounded-lg uppercase tracking-widest"
            >
              Fix
            </button>
          )}
        </div>
        {apiStatus === 'error' && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 flex gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <p className="text-[10px] text-red-600 font-bold leading-tight">
              Default API key is not working. You can add your own key below.
            </p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2">Custom Gemini API Key</label>
          <div className="flex gap-2">
            <input 
              type="password"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              placeholder="Paste your API key here..."
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={saveApiKey}
              disabled={isSavingKey}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSavingKey ? '...' : 'Save'}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 px-2 leading-tight">
            Get your free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google AI Studio</a>.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {sections.map(section => (
          <div key={section.title} className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">{section.title}</h4>
            <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              {section.items.map((item, idx) => (
                <button
                  key={item.name}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    idx !== section.items.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
                      <item.icon size={20} />
                    </div>
                    <span className="font-bold">{item.name}</span>
                  </div>
                  
                  {item.type === 'toggle' && (
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${item.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.value ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  )}
                  
                  {item.type === 'select' && (
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      {item.value} <ChevronRight size={16} />
                    </span>
                  )}
                  
                  {item.type === 'link' && <ChevronRight size={16} className="text-gray-300" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={handleLogout}
        className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
      >
        <LogOut size={20} />
        {t('signOut')}
      </button>

      {/* Branding */}
      <div className="text-center p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl text-white shadow-xl">
        <h4 className="text-lg font-black mb-1">NIRAJ SmartStudy AI</h4>
        <p className="text-xs opacity-90 flex items-center justify-center gap-1">
          {t('madeBy')} <span className="font-black text-yellow-300">QUEEN'S COLLEGE STUDENT</span>
        </p>
        <div className="flex justify-center gap-1 mt-3">
          {[1,2,3,4,5].map(i => <Heart key={i} size={10} fill="currentColor" className="text-red-400" />)}
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs text-gray-400">{t('version')} 1.2.0 (Advanced AI)</p>
      </div>

      <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
        <div className="p-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/30 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10">
            <h4 className="text-2xl font-black mb-2 tracking-tighter">NIRAJ SmartStudy AI</h4>
            <div className="h-1 w-20 bg-yellow-400 mx-auto rounded-full mb-4 group-hover:w-32 transition-all duration-500" />
            <div className="space-y-2">
              <p className="text-sm font-bold opacity-90 flex items-center justify-center gap-2">
                Made with <Heart size={16} fill="white" className="text-red-400 animate-bounce" /> by 
                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md text-yellow-200 font-black">
                  QUEEN'S COLLEGE STUDENT
                </span>
              </p>
              <div className="pt-2">
                <p className="text-2xl font-black tracking-[0.2em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)] uppercase">
                  NIRAJ KUMAR KANNAUJIYA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAbout && (
          <Modal title={`About NIRAJ SmartStudy AI`} onClose={() => setShowAbout(false)}>
            <div className="space-y-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400 h-96 overflow-y-auto pr-2">
              <div className="p-4 bg-blue-600 rounded-2xl text-white mb-4">
                <h4 className="font-black text-lg mb-1">Meet the Creator</h4>
                <p className="text-xs opacity-90">NIRAJ KUMAR KANNAUJIYA</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-blue-600 uppercase tracking-tighter">About NIRAJ:</h4>
                <p>मुझे नीरज कुमार कन्नौजिया द्वारा डेवलप किया गया है। वे मिर्जापुर के ग्राम रामपुर से संबंध रखते हैं और वर्तमान में वाराणसी में निवास करते हैं। वे एक मेहनती और उत्साही छात्र हैं, जिन्होंने अपनी शिक्षा वाराणसी के प्रमुख विद्यालयों—सरन अकादमी, नगर निगम हायर सेकेंडरी स्कूल (स्मार्ट स्कूल) और पीएम श्री गवर्नमेंट क्वींस इंटर कॉलेज—से प्राप्त की है, तथा वर्तमान में पीएम श्री गवर्नमेंट क्वींस इंटर कॉलेज, वाराणसी में अपनी शिक्षा जारी रखे हुए हैं।</p>
                <p>निराज को तकनीक, आर्टिफिशियल इंटेलिजेंस और नए डिजिटल समाधान विकसित करने में गहरी रुचि है। यद्यपि उन्हें कोडिंग का अधिक अनुभव नहीं है, फिर भी वे अपनी रचनात्मकता, सीखने की इच्छा और नवाचार के माध्यम से अपने विचारों को वास्तविकता में बदलने का प्रयास करते हैं।</p>
                <p>वे कराटे में ब्लैक बेल्ट धारक हैं और ओपन नेशनल चैंपियनशिप में स्वर्ण पदक विजेता रह चुके हैं, जो उनके अनुशासन, परिश्रम और समर्पण को दर्शाता है।</p>
                <p>उनका मुख्य लक्ष्य आर्टिफिशियल इंटेलिजेंस और तकनीक के माध्यम से शिक्षा को अधिक स्मार्ट, सरल और सभी के लिए सुलभ बनाना है।</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-blue-600 uppercase tracking-tighter">🚀 App Features:</h4>
                <ul className="list-none space-y-1">
                  <li>📸 Photo se question solve (Scan & Answer)</li>
                  <li>🤖 AI Doubt Solver (Chat system)</li>
                  <li>📚 Notes Summarizer</li>
                  <li>🧪 Auto Quiz (Subject + Mixed + GK + Current Affairs)</li>
                  <li>📅 Smart Study Planner</li>
                  <li>📊 Progress Tracker</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-blue-600 uppercase tracking-tighter">🎯 Our Mission:</h4>
                <p>Hamari koshish hai ki students ko ek hi app me sab kuch mile jisse unki padhai easy, fast aur effective ho jaye.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-blue-600 uppercase tracking-tighter">💡 Why Choose This App?</h4>
                <ul className="list-none space-y-1">
                  <li>Simple aur fast interface</li>
                  <li>AI based smart learning</li>
                  <li>All-in-one study solution</li>
                  <li>Har type ke student ke liye useful</li>
                </ul>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="font-bold text-blue-700 dark:text-blue-400">📌 Special Feature:</p>
                <p className="text-xs">👉 Auto Smart Quiz – jisme app khud quiz generate karta hai (Mixed + GK + Mind + Current Affairs)</p>
              </div>
            </div>
          </Modal>
        )}

        {showPrivacy && (
          <Modal title={`Privacy Policy – NIRAJ AI Study App`} onClose={() => setShowPrivacy(false)}>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 h-96 overflow-y-auto pr-2">
              <p>NIRAJ AI Study App aapki privacy ko bahut mahatva deta hai. Yeh Privacy Policy batati hai ki hum kaun si jankari collect karte hain aur uska use kaise karte hain.</p>
              
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">📊 1. Information We Collect</h4>
                <p>Hum kuch basic information collect kar sakte hain:</p>
                <ul className="list-disc ml-5">
                  <li>Naam aur email (agar login use karte hain)</li>
                  <li>App usage data (kaun se features use ho rahe hain)</li>
                  <li>Device information (performance improve karne ke liye)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">📸 2. Camera & Storage Permissions</h4>
                <ul className="list-disc ml-5">
                  <li>Camera ka use sirf question scan karne ke liye hota hai</li>
                  <li>Storage ka use notes aur images save karne ke liye hota hai</li>
                </ul>
                <p className="font-bold text-blue-600">👉 Hum bina aapki permission ke koi data access nahi karte</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">🤖 3. AI Features</h4>
                <p>Aapke questions AI ke through process hote hain. Iska use sirf better answers aur experience dene ke liye hota hai. Aapka data misuse nahi kiya jata.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">🔒 4. Data Security</h4>
                <p>Hum aapke data safe aur secure rakhte hain. Kisi bhi unauthorized access se bachane ke liye measures use kiye jate hain.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">📢 5. Ads & Third-Party Services</h4>
                <p>App me ads ho sakte hain. Ads ke liye third-party services (jaise Ad Network) use ho sakti hain. Yeh services apni privacy policy follow karti hain.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">👶 6. Children’s Privacy</h4>
                <p>Yeh app students ke liye bana hai. Hum knowingly bachchon ka personal data collect nahi karte.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">🔄 7. Changes to Policy</h4>
                <p>Future me policy update ho sakti hai. Update hone par app me notify kiya jayega.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">📩 8. Contact Us</h4>
                <p>Agar aapko privacy se related koi doubt hai to app ke through contact kar sakte hain.</p>
              </div>
            </div>
          </Modal>
        )}

        {showLanguage && (
          <Modal title="Select Language" onClose={() => setShowLanguage(false)}>
            <div className="grid grid-cols-2 gap-3">
              {languages.map(lang => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLanguage(false); }}
                  className={`p-4 rounded-2xl border-2 font-bold transition-all ${
                    language === lang ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-gray-100 dark:border-gray-800'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </Modal>
        )}

        {showPermissions && (
          <Modal title="Permissions" onClose={() => setShowPermissions(false)}>
            <PermissionManager />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
    />
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl relative z-10"
    >
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="text-xl font-black">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  </div>
);
