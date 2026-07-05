/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { Sparkles, Send, UploadCloud, CheckCircle, AlertCircle, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RequestDesignProps {
  setActiveTab?: (tab: string) => void;
}

export const RequestDesign: React.FC<RequestDesignProps> = ({ setActiveTab }) => {
  const { addDesignRequest, isFirebaseConnected } = useFirebaseState();

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('بغداد');
  const [projectType, setProjectType] = useState('غرف نوم');
  const [area, setArea] = useState('');
  const [budget, setBudget] = useState('');
  
  // File states
  const [planFiles, setPlanFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // UI Status
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Success tracking details
  const [successRequestNumber, setSuccessRequestNumber] = useState('');
  const [successPhone, setSuccessPhone] = useState('');
  const [copied, setCopied] = useState(false);

  const planInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !area.trim() || !budget.trim()) {
      setStatus('error');
      setErrorMessage('الرجاء ملء جميع الحقول المطلوبة الأساسية.');
      return;
    }

    try {
      setStatus('submitting');
      setErrorMessage('');

      const result = await addDesignRequest(
        {
          name,
          phone,
          city,
          projectType,
          area,
          budget
        },
        planFiles,
        imageFiles
      );

      if (result && result.ticketId) {
        localStorage.setItem('active_client_ticket_id', result.ticketId);
      }

      setSuccessRequestNumber(result?.requestNumber || '');
      setSuccessPhone(phone);
      setStatus('success');
      setCopied(false);

      if (setActiveTab) {
        setTimeout(() => {
          setActiveTab('tickets');
        }, 1500);
      }
      
      // Reset form fields
      setName('');
      setPhone('');
      setArea('');
      setBudget('');
      setPlanFiles([]);
      setImageFiles([]);
    } catch (err: any) {
      console.error("Form Submission Error:", err);
      
      let finalError = 'حدث خطأ أثناء إرسال طلبك. يرجى مراجعة إعدادات قاعدة البيانات أو المحاولة لاحقاً.';
      if (err && err.message) {
        try {
          // If it is a stringified JSON containing FirestoreErrorInfo
          const parsed = JSON.parse(err.message);
          if (parsed && parsed.error) {
            finalError = `فشل الإرسال بقاعدة البيانات: ${parsed.error}`;
          } else {
            finalError = `فشل الإرسال: ${err.message}`;
          }
        } catch (e) {
          finalError = `فشل الإرسال: ${err.message}`;
        }
      } else if (typeof err === 'string') {
        finalError = `فشل الإرسال: ${err}`;
      }

      setStatus('error');
      setErrorMessage(finalError);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(successRequestNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPlanFiles(Array.from(e.target.files));
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="bg-[#faf9f6] py-16" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-[#d4af37] text-xs font-bold tracking-widest uppercase flex justify-center items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            تخطيط وبناء المساحات
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-[#1e1e1a] font-sans tracking-tight">طلب تصميم مخصص</h1>
          <p className="text-gray-500 text-xs md:text-sm max-w-lg mx-auto font-sans leading-relaxed">
            املأ الاستمارة الفنية بالأسفل ليرتفع طلبك إلى فريقنا الهندسي لدراسة مشروعك والتواصل معك فوراً.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-[#d4af37]/15 p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-[#d4af37] via-[#f3e5ab] to-[#d4af37]" />

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-12 flex flex-col items-center text-center space-y-6"
              >
                <div className="p-4 rounded-full bg-green-50 text-green-500 border border-green-200">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900 font-sans">تم إرسال طلبك بنجاح!</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    نشكرك على اختيار رويال جروب. لقد تم تسجيل طلب التصميم الخاص بك بنجاح في نظام المتابعة لدينا، وسيقوم أحد مهندسينا بالتواصل معك عبر الهاتف أو الواتساب خلال 24 ساعة كحد أقصى.
                  </p>
                </div>

                {/* Tracking Details Box */}
                <div className="w-full max-w-md bg-gray-50 rounded-2xl border border-gray-150 p-6 space-y-4 text-right">
                  <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2">معلومات تتبع الطلب الملكي</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                      <button 
                        onClick={handleCopy}
                        className="px-3 py-1 bg-[#171714] hover:bg-[#b8952b] text-white hover:text-[#171714] text-[10px] font-bold rounded-lg transition-all"
                      >
                        {copied ? 'تم النسخ!' : 'نسخ الرمز'}
                      </button>
                      <div className="text-right">
                        <span className="block text-[10px] text-gray-400 font-medium">رمز تتبع الطلب الموحد</span>
                        <span className="text-xs font-black text-[#d4af37] font-mono select-all tracking-wider">{successRequestNumber || 'RG-PENDING'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                      <span className="text-xs font-mono font-bold text-gray-800" dir="ltr">{successPhone}</span>
                      <div className="text-right">
                        <span className="block text-[10px] text-gray-400 font-medium">رقم الهاتف المسجل للطلب</span>
                        <span className="text-xs font-bold text-gray-800">رقم الاتصال المباشر</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                  {setActiveTab && (
                    <button
                      onClick={() => setActiveTab('track')}
                      className="px-6 py-3 rounded-xl bg-[#d4af37] hover:bg-[#b8952b] text-[#171714] text-xs font-black tracking-wide transition-all shadow-lg shadow-[#d4af37]/10"
                    >
                      تتبع حالة الطلب الآن
                    </button>
                  )}
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-3 rounded-xl bg-[#171714] hover:bg-gray-800 text-white text-xs font-bold transition-all border border-transparent hover:border-[#d4af37]/20"
                  >
                    إرسال طلب تصميم آخر
                  </button>
                </div>

                {!isFirebaseConnected && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] max-w-md leading-relaxed">
                    💡 <strong>ملاحظة في الوضع التجريبي:</strong> تم تسجيل طلبك محلياً في الذاكرة بنجاح. يمكنك معاينة الطلب وإدارته بالذهاب إلى <strong>لوحة التحكم &gt; إدارة الطلبات</strong> لتجربة النظام بالكامل!
                  </div>
                )}
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 text-right">
                {/* 1. Personal details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5 font-sans">البيانات الشخصية وبيانات الاتصال</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">الاسم الكامل <strong className="text-red-500">*</strong></label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="الرجاء كتابة اسمك الثلاثي"
                        className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:bg-white outline-none transition-all text-gray-900"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">رقم الهاتف <strong className="text-red-500">*</strong></label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="مثال: 07704679311"
                        className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:bg-white outline-none transition-all text-gray-900 tracking-wide text-left dir-ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Project details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5 font-sans">مواصفات الفراغ المعماري المطلوب تصميمه</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">المدينة / المحافظة</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:bg-white outline-none transition-all text-gray-900 font-bold"
                      >
                        <option>بغداد</option>
                        <option>البصرة</option>
                        <option>النجف الأشرف</option>
                        <option>كربلاء المقدسة</option>
                        <option>أربيل</option>
                        <option>السليمانية</option>
                        <option>نينوى</option>
                        <option>محافظة أخرى</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">نوع المشروع</label>
                      <select
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:bg-white outline-none transition-all text-gray-900 font-bold"
                      >
                        <option>غرف نوم</option>
                        <option>مطابخ</option>
                        <option>غرف ملابس</option>
                        <option>ديكورات خشبية</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">المساحة الإجمالية المقدرة <strong className="text-red-500">*</strong></label>
                      <input
                        type="text"
                        required
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="مثال: 150 م²"
                        className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:bg-white outline-none transition-all text-gray-900"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">الميزانية التقريبية المرصودة <strong className="text-red-500">*</strong></label>
                      <input
                        type="text"
                        required
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="مثال: 15,000 $ أو ملايين"
                        className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:bg-white outline-none transition-all text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Uploads */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5 font-sans">مخططات وصور الفراغ الإيضاحية (اختياري)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Blueprints file selector */}
                    <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center text-center space-y-3 cursor-pointer hover:bg-gray-100 transition-all relative">
                      <UploadCloud className="w-8 h-8 text-[#d4af37]" />
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-800 block">رفع مخططات المساحة والخرائط</span>
                        <span className="text-[10px] text-gray-400 block">اضغط هنا لرفع المخططات الهندسية المعتمدة (PDF / صور)</span>
                      </div>
                      <input
                        type="file"
                        ref={planInputRef}
                        multiple
                        onChange={handlePlanFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {planFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-center z-10 pt-1.5">
                          {planFiles.map((file, idx) => (
                            <span key={idx} className="flex items-center gap-1 bg-[#171714] text-[#d4af37] text-[9px] font-bold px-2 py-0.5 rounded border border-[#d4af37]/30">
                              <FileText className="w-2.5 h-2.5" />
                              <span className="max-w-[70px] truncate">{file.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Image file selector */}
                    <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center text-center space-y-3 cursor-pointer hover:bg-gray-100 transition-all relative">
                      <UploadCloud className="w-8 h-8 text-[#d4af37]" />
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-800 block">رفع صور الفراغ الحالية (قبل البناء)</span>
                        <span className="text-[10px] text-gray-400 block">اضغط هنا لرفع صور فوتوغرافية لموقع البناء الحالي</span>
                      </div>
                      <input
                        type="file"
                        ref={imageInputRef}
                        multiple
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {imageFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 justify-center z-10 pt-1.5">
                          {imageFiles.map((file, idx) => (
                            <span key={idx} className="flex items-center gap-1 bg-[#171714] text-[#d4af37] text-[9px] font-bold px-2 py-0.5 rounded border border-[#d4af37]/30">
                              <ImageIcon className="w-2.5 h-2.5" />
                              <span className="max-w-[70px] truncate">{file.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {status === 'error' && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="px-10 py-4 bg-[#171714] text-white hover:text-[#d4af37] border border-transparent hover:border-[#d4af37]/30 text-sm font-black rounded-lg transition-all shadow-xl disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
                        <span>جاري رفع المرفقات وتسجيل طلبك...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-[#d4af37]" />
                        <span>إرسال استمارة طلب التصميم</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
