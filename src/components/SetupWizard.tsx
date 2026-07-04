/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useFirebaseState } from './FirestoreStateContext';
import { Sparkles, Database, Check, AlertTriangle, X, Sliders, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { testFirebaseConnection } from '../firebase';
import firebaseConfigRaw from '../firebase-applet-config.json';

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ isOpen, onClose }) => {
  const { isFirebaseConnected, saveFirebaseConfig } = useFirebaseState();
  const [inputMode, setInputMode] = useState<'fields' | 'json'>('fields');
  
  // 6 Custom fields for Firebase Config
  const [apiKey, setApiKey] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [projectId, setProjectId] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');
  
  const [configText, setConfigText] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Prefill existing settings from environment variables or fallback config
  useEffect(() => {
    if (isOpen) {
      try {
        const envConfig = {
          apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || '',
          authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || '',
          projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || '',
          storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || '',
          messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
          appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || '',
        };

        const isEnvConfigValid = 
          envConfig.apiKey && 
          envConfig.apiKey.trim() !== "" && 
          envConfig.projectId && 
          envConfig.projectId.trim() !== "";

        // Dynamically get the config object (no localStorage)
        const config = isEnvConfigValid ? envConfig : {
          apiKey: firebaseConfigRaw.apiKey || "",
          authDomain: firebaseConfigRaw.authDomain || "",
          projectId: firebaseConfigRaw.projectId || "",
          storageBucket: firebaseConfigRaw.storageBucket || "",
          messagingSenderId: firebaseConfigRaw.messagingSenderId || "",
          appId: firebaseConfigRaw.appId || ""
        };
        
        setApiKey(config.apiKey || '');
        setAuthDomain(config.authDomain || '');
        setProjectId(config.projectId || '');
        setStorageBucket(config.storageBucket || '');
        setMessagingSenderId(config.messagingSenderId || '');
        setAppId(config.appId || '');
        setConfigText(JSON.stringify(config, null, 2));
      } catch (e) {
        console.error("Failed to load prefill config:", e);
      }
    }
  }, [isOpen]);

  const handleConnect = async () => {
    let parsedConfig: any = null;

    if (inputMode === 'fields') {
      if (!apiKey.trim()) {
        setStatus('error');
        setErrorMessage('الرجاء إدخال الـ apiKey الخاص بك.');
        return;
      }
      if (!projectId.trim()) {
        setStatus('error');
        setErrorMessage('الرجاء إدخال الـ projectId الخاص بك.');
        return;
      }
      
      parsedConfig = {
        apiKey: apiKey.trim(),
        authDomain: authDomain.trim(),
        projectId: projectId.trim(),
        storageBucket: storageBucket.trim(),
        messagingSenderId: messagingSenderId.trim(),
        appId: appId.trim()
      };
    } else {
      if (!configText.trim()) {
        setStatus('error');
        setErrorMessage('الرجاء إدخال كود الإعدادات.');
        return;
      }

      try {
        let cleanText = configText;
        if (configText.includes('const firebaseConfig =')) {
          const start = configText.indexOf('{');
          const end = configText.lastIndexOf('}');
          cleanText = configText.substring(start, end + 1);
        }
        
        try {
          parsedConfig = JSON.parse(cleanText);
        } catch {
          const keys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'];
          const extracted: any = {};
          keys.forEach(key => {
            const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"|'${key}'\\s*:\\s*'([^']+)'|${key}\\s*:\\s*["']([^"']+)["']`);
            const match = configText.match(regex);
            if (match) {
              extracted[key] = match[1] || match[2] || match[3];
            }
          });
          if (extracted.apiKey && extracted.projectId) {
            parsedConfig = extracted;
          } else {
            throw new Error("لم نتمكن من تحليل كود الإعدادات. يرجى إدخال تنسيق JSON صحيح.");
          }
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'كود الـ JSON غير صالح أو منسق بشكل خاطئ.');
        return;
      }
    }

    if (!parsedConfig || !parsedConfig.apiKey || !parsedConfig.projectId) {
      setStatus('error');
      setErrorMessage('كود الإعدادات لا يحتوي على الحقول المطلوبة الأساسية (apiKey و projectId).');
      return;
    }

    try {
      setStatus('testing');
      setErrorMessage('');

      // Test connection using custom dynamic test function
      const testResult = await testFirebaseConnection(parsedConfig);
      
      if (testResult.success) {
        // Save and initialize inside context
        const connected = await saveFirebaseConfig(parsedConfig);
        if (connected) {
          setStatus('success');
          setTimeout(() => {
            onClose();
            // Reset state
            setStatus('idle');
          }, 2500);
        } else {
          throw new Error("فشلت عملية تهيئة Firebase بعد نجاح الاختبار.");
        }
      } else {
        throw new Error(testResult.error || "فشل الاتصال بـ Firebase. تأكد من صحة المفاتيح واتصال الإنترنت.");
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'فشل الاتصال بقاعدة البيانات. الرجاء التأكد من صحة الكود المدخل ومطابقته لمنصة Firebase.');
    }
  };

  const loadSample = () => {
    const sample = {
      apiKey: "AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P",
      authDomain: "royal-group-iraq.firebaseapp.com",
      projectId: "royal-group-iraq",
      storageBucket: "royal-group-iraq.appspot.com",
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:abcdef1234567890"
    };
    
    if (inputMode === 'fields') {
      setApiKey(sample.apiKey);
      setAuthDomain(sample.authDomain);
      setProjectId(sample.projectId);
      setStorageBucket(sample.storageBucket);
      setMessagingSenderId(sample.messagingSenderId);
      setAppId(sample.appId);
    } else {
      setConfigText(JSON.stringify(sample, null, 2));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-[#1e1e1a] border border-[#d4af37]/30 shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#3a3a30] flex items-center justify-between bg-gradient-to-r from-[#171714] to-[#1e1e1a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#d4af37]/10 text-[#d4af37]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-sans">إعداد وإرساء Firebase الحقيقي</h3>
              <p className="text-xs text-gray-400 mt-1">اربط موقعك بقاعدة بيانات حقيقية ومصادقة مستخدمين وملفات سحابية بشكل دائم</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-gray-200">
          <div className="bg-[#2d2d25] rounded-xl p-4 border-r-4 border-[#d4af37] space-y-2">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              كيفية الربط بـ Firebase الخاصة بك:
            </h4>
            <ol className="list-decimal list-inside text-xs text-gray-300 space-y-1.5 leading-relaxed">
              <li>افتح <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] underline font-medium">منصة Firebase Console</a> وأنشئ تطبيق ويب جديد.</li>
              <li>قم بتفعيل <strong>Firestore Database</strong> و <strong>Authentication</strong> (بتمكين تسجيل الدخول المفضل) و <strong>Firebase Storage</strong>.</li>
              <li>انسخ القيم وألصقها هنا في الحقول المخصصة أو الصق كود الـ JSON بالكامل لتأكيد الاتصال الفوري.</li>
            </ol>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-black/30 p-1 rounded-xl border border-[#3a3a30] gap-1">
            <button
              onClick={() => setInputMode('fields')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                inputMode === 'fields' 
                  ? 'bg-[#d4af37] text-[#171714]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              تعبئة الحقول بشكل منفرد
            </button>
            <button
              onClick={() => setInputMode('json')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                inputMode === 'json' 
                  ? 'bg-[#d4af37] text-[#171714]' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code className="w-4 h-4" />
              لصق كود JSON كامل
            </button>
          </div>

          {/* Form Inputs / Fields Mode */}
          {inputMode === 'fields' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">apiKey <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#3a3a30] focus:border-[#d4af37] text-gray-100 font-mono text-xs outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">projectId <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="my-firebase-project"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#3a3a30] focus:border-[#d4af37] text-gray-100 font-mono text-xs outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">authDomain</label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="my-firebase-project.firebaseapp.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#3a3a30] focus:border-[#d4af37] text-gray-100 font-mono text-xs outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">storageBucket</label>
                <input
                  type="text"
                  value={storageBucket}
                  onChange={(e) => setStorageBucket(e.target.value)}
                  placeholder="my-firebase-project.appspot.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#3a3a30] focus:border-[#d4af37] text-gray-100 font-mono text-xs outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">messagingSenderId</label>
                <input
                  type="text"
                  value={messagingSenderId}
                  onChange={(e) => setMessagingSenderId(e.target.value)}
                  placeholder="123456789012"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#3a3a30] focus:border-[#d4af37] text-gray-100 font-mono text-xs outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 block">appId</label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:123456:web:abcd123"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-[#3a3a30] focus:border-[#d4af37] text-gray-100 font-mono text-xs outline-none transition-all"
                />
              </div>
            </div>
          ) : (
            /* JSON Paste Mode */
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-white">ألصق كود الإعدادات بتنسيق JSON الحقيقي هنا:</label>
                <button 
                  type="button" 
                  onClick={loadSample}
                  className="text-xs text-[#d4af37] hover:underline"
                >
                  تحميل مثال توضيحي
                </button>
              </div>
              <textarea
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
                placeholder={`{\n  "apiKey": "...",\n  "authDomain": "...",\n  "projectId": "...",\n  "storageBucket": "...",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                rows={8}
                className="w-full p-4 rounded-xl bg-black/40 border border-[#3a3a30] focus:border-[#d4af37] text-gray-100 font-mono text-xs focus:ring-1 focus:ring-[#d4af37] outline-none transition-all placeholder-gray-600 resize-none"
              />
            </div>
          )}

          {/* Load Demo/Sample Button for helper */}
          {inputMode === 'fields' && (
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={loadSample}
                className="text-xs text-[#d4af37] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                تحميل قيم توضيحية تجريبية
              </button>
            </div>
          )}

          {/* Status Message */}
          <AnimatePresence mode="wait">
            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">فشل الاتصال:</span>
                  <p className="mt-1 text-xs opacity-90 leading-relaxed">{errorMessage}</p>
                </div>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl bg-green-950/50 border border-green-500/40 text-green-300 text-sm flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-green-500 text-black rounded-full">
                    <Check className="w-4 h-4 font-black" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-base">تم ربط المشروع واجتياز اختبار الاتصال الفعلي بنجاح!</span>
                    <p className="text-xs text-gray-300 mt-1">الموقع متصل الآن بحساب Firebase الخاص بك ويقوم بحفظ وعرض البيانات لحظياً.</p>
                  </div>
                </div>
                <div className="mt-2 p-3 bg-black/40 rounded-lg text-center font-mono text-sm md:text-base font-black tracking-widest text-green-400 border border-green-500/20">
                  Firebase Connected Successfully
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#3a3a30] bg-[#171714] flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {isFirebaseConnected ? (
              <span className="text-green-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block animate-pulse"></span>
                قاعدة البيانات متصلة بنجاح
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                أنت تعمل في الوضع التجريبي الآمن
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              إغلاق
            </button>
            <button
              onClick={handleConnect}
              disabled={status === 'testing' || status === 'success'}
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-[#171714] bg-[#d4af37] hover:bg-[#b8952b] transition-all duration-300 shadow-md shadow-[#d4af37]/10 disabled:opacity-50 flex items-center gap-2"
            >
              {status === 'testing' ? 'جاري التحقق والاتصال...' : 'حفظ واختبار الربط'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
