/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { getAuthService, isFirebaseReady, getDb } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, UserCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Engineer } from '../types';

interface EngineerLoginProps {
  onLoginSuccess: (role: 'engineer', userObj: any) => void;
}

export const EngineerLogin: React.FC<EngineerLoginProps> = ({ onLoginSuccess }) => {
  const { isFirebaseConnected, engineers } = useFirebaseState();
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

      const normalizedEmail = email.trim().toLowerCase();

      if (isFirebaseConnected && isFirebaseReady()) {
        const auth = getAuthService();
        const matchingEngineer = engineers.find(eng => eng.email.toLowerCase() === normalizedEmail);
        
        if (normalizedEmail === 'harebsalman@gmail.com') {
          setStatus('error');
          setErrorMessage('البريد الإلكتروني هذا ينتمي للمسؤول العام. يرجى تسجيل الدخول من لوحة تحكم الإدارة الخاصة.');
          return;
        }

        if (engineers.length > 0 && !matchingEngineer) {
          setStatus('error');
          setErrorMessage('هذا البريد الإلكتروني غير مسجل كمهندس معتمد في النظام.');
          return;
        }

        if (matchingEngineer && (matchingEngineer.active === false || matchingEngineer.status === 'disabled')) {
          setStatus('error');
          setErrorMessage('عذراً، هذا الحساب معطل حالياً من قبل الإدارة.');
          return;
        }

        try {
          // Attempt real sign in with normalized email
          const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
          
          // Double check after login
          const loggedEmail = userCredential.user.email?.toLowerCase() || '';
          let eng = engineers.find(e => e.email.toLowerCase() === loggedEmail);
          
          if (!eng) {
            try {
              const { doc, getDoc } = await import('firebase/firestore');
              const db = getDb();
              const docSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
              if (docSnap.exists()) {
                const d = docSnap.data();
                if (d.role === 'engineer') {
                  eng = {
                    id: userCredential.user.uid,
                    name: d.name || '',
                    email: d.email || '',
                    phone: d.phone || '',
                    specialty: d.specialty || d.specialization || '',
                    specialization: d.specialization || d.specialty || '',
                    active: d.active !== false && d.status !== 'disabled',
                    status: d.status || (d.active !== false ? 'active' : 'disabled'),
                    role: 'engineer',
                    createdAt: d.createdAt || 0,
                    currentTickets: d.currentTickets || 0,
                    currentProjects: d.currentProjects || 0,
                  } as Engineer;
                }
              }
            } catch (fetchErr) {
              console.error("Direct engineer document fetch failed:", fetchErr);
            }
          }

          if (eng) {
            if (eng.active === false || eng.status === 'disabled') {
              const { signOut } = await import('firebase/auth');
              await signOut(auth);
              setStatus('error');
              setErrorMessage('عذراً، هذا الحساب معطل حالياً من قبل الإدارة.');
              return;
            }
            onLoginSuccess('engineer', eng);
          } else {
            // Check if it's the bootstrap case or if they actually have a valid credential
            if (password === 'RoyalGroup@2026') {
              // Create a fallback engineer profile for bootstrap login
              const fallbackEng: Engineer = {
                id: userCredential.user.uid,
                name: normalizedEmail.split('@')[0],
                email: normalizedEmail,
                phone: '',
                specialty: 'تصميم داخلي',
                specialization: 'تصميم داخلي',
                active: true,
                status: 'active',
                role: 'engineer',
                createdAt: Date.now(),
                currentTickets: 0,
                currentProjects: 0
              };
              onLoginSuccess('engineer', fallbackEng);
            } else {
              const { signOut } = await import('firebase/auth');
              await signOut(auth);
              setStatus('error');
              setErrorMessage('الحساب المتصل ليس لديه صلاحية مهندس.');
            }
          }
        } catch (authError: any) {
          console.error("Auth error during sign-in:", authError);
          
          // Setup bootstrap credentials check
          if (
            (matchingEngineer || engineers.length === 0) && 
            password === 'RoyalGroup@2026' && 
            (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/invalid-email')
          ) {
            try {
              await createUserWithEmailAndPassword(auth, normalizedEmail, password);
              onLoginSuccess('engineer', matchingEngineer);
            } catch (regError: any) {
              console.error("Bootstrap register error:", regError);
              setStatus('error');
              if (regError.code === 'auth/email-already-in-use') {
                setErrorMessage('هذا الحساب مسجل بالفعل في منصة Firebase ولكن بكلمة مرور مختلفة. الرجاء إدخال كلمة المرور الصحيحة التي عينتها لحسابك.');
              } else {
                setErrorMessage(`فشل إنشاء الحساب التلقائي: ${regError.message}`);
              }
            }
          } else {
            setStatus('error');
            let friendlyMsg = 'بيانات الدخول غير صحيحة.';
            if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
              friendlyMsg = 'كلمة المرور المدخلة غير صحيحة.';
            }
            setErrorMessage(`${friendlyMsg}`);
          }
        }
      } else {
        // High-Fidelity Demo Session Mode
        const matchingEngineer = engineers.find(eng => eng.email.toLowerCase() === normalizedEmail);

        if (normalizedEmail === 'harebsalman@gmail.com') {
          setStatus('error');
          setErrorMessage('البريد الإلكتروني هذا ينتمي للمسؤول العام. يرجى تسجيل الدخول من لوحة تحكم الإدارة الخاصة.');
          return;
        }

        if (matchingEngineer && password.trim() === 'RoyalGroup@2026') {
          if (matchingEngineer.active === false || matchingEngineer.status === 'disabled') {
            setStatus('error');
            setErrorMessage('عذراً، هذا الحساب معطل حالياً من قبل الإدارة.');
            return;
          }
          onLoginSuccess('engineer', matchingEngineer);
        } else {
          setStatus('error');
          setErrorMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة لبوابة المهندسين.');
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
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200')] bg-cover bg-center opacity-10 mix-blend-luminosity pointer-events-none"></div>

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
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-sans tracking-wide">تسجيل دخول المهندسين</h2>
            <p className="text-[11px] text-gray-400 mt-1">بوابة المهندس المصمم لشركة Royal Group</p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-6 text-right">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">البريد الإلكتروني للمهندس</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@example.com"
                className="w-full p-3 pr-10 text-xs bg-black/40 border border-[#3a3a30] focus:border-[#d4af37] rounded-xl outline-none text-white transition-all text-left dir-ltr font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">كلمة المرور الخاصة بك</label>
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
                <span>جاري التحقق من الصلاحيات...</span>
              </>
            ) : (
              <span>دخول للبوابة</span>
            )}
          </button>
        </form>

        {/* Demo info */}
        {!isFirebaseConnected && (
          <div className="mt-6 p-3 bg-amber-950/20 rounded-xl border border-amber-500/15 text-center text-amber-300 text-[10px] leading-relaxed">
            💡 <strong>ملاحظة تجريبية:</strong> استخدم البريد الإلكتروني للمهندس مع كلمة المرور الافتراضية للدخول المباشر.
          </div>
        )}
      </motion.div>
    </div>
  );
};
