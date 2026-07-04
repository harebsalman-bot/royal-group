/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { getAuthService, isFirebaseReady } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginProps {
  onLoginSuccess: (isSuccess: boolean) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const { isFirebaseConnected } = useFirebaseState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setStatus('error');
      setErrorMessage('الرجاء إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    try {
      setStatus('submitting');
      setErrorMessage('');

      if (isFirebaseConnected && isFirebaseReady()) {
        const auth = getAuthService();
        const normalizedEmail = email.trim().toLowerCase();
        
        // Standard admin credentials:
        // harebsalman@gmail.com / RoyalGroup@2026
        
        try {
          // Attempt real sign in with normalized email
          const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
          
          // Verify that the logged in email matches our expected admin email
          const loggedEmail = userCredential.user.email?.toLowerCase() || '';
          if (loggedEmail === 'harebsalman@gmail.com') {
            onLoginSuccess(true);
          } else {
            setStatus('error');
            setErrorMessage(`الحساب المتصل (${loggedEmail}) ليس لديه صلاحيات الإدارة للوحة التحكم.`);
          }
        } catch (authError: any) {
          console.error("Auth error during sign-in:", authError);
          
          // If account doesn't exist, bootstrap register it for them to prevent lockouts!
          if (
            normalizedEmail === 'harebsalman@gmail.com' && 
            password === 'RoyalGroup@2026' && 
            (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/invalid-email')
          ) {
            try {
              await createUserWithEmailAndPassword(auth, normalizedEmail, password);
              onLoginSuccess(true);
            } catch (regError: any) {
              console.error("Bootstrap register error:", regError);
              setStatus('error');
              if (regError.code === 'auth/email-already-in-use') {
                setErrorMessage('هذا الحساب (harebsalman@gmail.com) مسجل بالفعل في منصة Firebase ولكن بكلمة مرور مختلفة. الرجاء إدخال كلمة المرور الصحيحة التي عينتها لحسابك.');
              } else {
                setErrorMessage(`فشل إنشاء الحساب التلقائي: ${regError.message} (${regError.code})`);
              }
            }
          } else {
            setStatus('error');
            let friendlyMsg = 'بيانات الدخول غير صحيحة.';
            if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
              friendlyMsg = 'كلمة المرور المدخلة غير صحيحة، أو الحساب غير مسجل.';
            } else if (authError.code === 'auth/operation-not-allowed') {
              friendlyMsg = 'طريقة تسجيل الدخول بالبريد وكلمة المرور غير مفعلة في منصة Firebase.';
            }
            setErrorMessage(`${friendlyMsg} التفاصيل: ${authError.message} (${authError.code})`);
          }
        }
      } else {
        // High-Fidelity Demo Session Mode
        // We match exactly the specified credentials
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail === 'harebsalman@gmail.com' && password.trim() === 'RoyalGroup@2026') {
          onLoginSuccess(true);
        } else {
          setStatus('error');
          setErrorMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة للوحة التحكم.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage('حدث خطأ فني أثناء التحقق من الهوية.');
    }
  };

  return (
    <div className="bg-[#171714] min-h-[75vh] flex items-center justify-center py-16 px-4" dir="rtl">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1200')] bg-cover bg-center opacity-10 mix-blend-luminosity pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#1e1e1a] border border-[#d4af37]/30 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative Gold Header Ribbon */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-[#d4af37] via-[#f3e5ab] to-[#d4af37]" />

        {/* Brand Icon */}
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/35 flex items-center justify-center text-[#d4af37]">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-sans tracking-wide">تسجيل دخول الإدارة</h2>
            <p className="text-[11px] text-gray-400 mt-1">لوحة تحكم شركة Royal Group للتصميم الداخلي</p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-6 text-right">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">البريد الإلكتروني للأدمن</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full p-3 pr-10 text-xs bg-black/40 border border-[#3a3a30] focus:border-[#d4af37] rounded-xl outline-none text-white transition-all text-left dir-ltr font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">كلمة المرور الأمنية</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 pr-10 pl-10 text-xs bg-black/40 border border-[#3a3a30] focus:border-[#d4af37] rounded-xl outline-none text-white transition-all text-left dir-ltr font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 hover:text-[#d4af37]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Status Message */}
          {status === 'error' && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-3.5 bg-[#d4af37] hover:bg-[#b8952b] text-[#171714] font-black text-sm rounded-xl transition-all shadow-lg shadow-[#d4af37]/10 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التحقق والمصادقة...</span>
              </>
            ) : (
              <span>دخول آمن</span>
            )}
          </button>
        </form>

        {/* Non-configured helper banner */}
        {!isFirebaseConnected && (
          <div className="mt-6 p-3 bg-amber-950/20 rounded-xl border border-amber-500/15 text-center text-amber-300 text-[10px] leading-relaxed">
            💡 <strong>ملاحظة تجريبية:</strong> يمكنك تجربة لوحة التحكم بالكامل في وضع العرض التوضيحي الآمن باستخدام الحساب المعتمد.
          </div>
        )}
      </motion.div>
    </div>
  );
};
