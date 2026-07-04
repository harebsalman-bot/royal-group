/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useFirebaseState } from './FirestoreStateContext';
import { BedroomOption } from '../types';
import { 
  Bed, Layers, Grid, Sparkles, FolderOpen, Tv, Compass, Columns, Home, Lightbulb,
  ChevronLeft, ChevronRight, Check, CheckCircle2, Crown, Loader2, User, Phone, MapPin, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Sections definition for questionnaire
interface SectionDef {
  key: BedroomOption['section'];
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: SectionDef[] = [
  {
    key: 'bed',
    title: 'تصميم السرير ولونه',
    subtitle: 'اختر هيكل السرير الملكي الذي يمثل ركيزة الغرفة وأناقتها',
    icon: Bed
  },
  {
    key: 'headboard',
    title: 'خلفية السرير (الهيدبورد)',
    subtitle: 'تصميم خلفية جدار السرير بالخامات الفخمة والإنارة المدمجة',
    icon: Layers
  },
  {
    key: 'nightstand',
    title: 'الكومودينو (Nightstands)',
    subtitle: 'الطاولات الجانبية للسرير المتناسقة مع طابع التصميم العام',
    icon: Grid
  },
  {
    key: 'vanity',
    title: 'طاولة التسريحة (Vanity)',
    subtitle: 'منطقة التزين والتسريحة الراقية بلمسات الستانلس والرخام',
    icon: Sparkles
  },
  {
    key: 'wardrobe',
    title: 'خزانة الملابس / الدريسنج',
    subtitle: 'حلول التخزين الفخمة والدواليب الزجاجية ذات الإنارة المخفية',
    icon: FolderOpen
  },
  {
    key: 'tvUnit',
    title: 'ديكور التلفزيون (TV Unit)',
    subtitle: 'شاشة التلفزيون بخلفيات بدائل الرخام والشرائح الخشبية الدافئة',
    icon: Tv
  },
  {
    key: 'curtains',
    title: 'تصاميم الستائر',
    subtitle: 'ستائر التعتيم الفاخرة بأنسجة حريرية ومخملية متناغمة',
    icon: Columns
  },
  {
    key: 'flooring',
    title: 'الأرضيات الراقية',
    subtitle: 'أرضيات البورسلين اللامع أو الباركيه بنقوش فرنسية دافئة',
    icon: Home
  },
  {
    key: 'ceiling',
    title: 'ديكورات السقف والجبس',
    subtitle: 'الأسقف الجبسية المعلقة بمستويات إنارة غير مباشرة مبهرة',
    icon: Compass
  },
  {
    key: 'lighting',
    title: 'توزيع الإنارة والثريا',
    subtitle: 'توزيع الإنارة الجمالية الذكية واختيار ثريا الكريستال المركزية',
    icon: Lightbulb
  }
];

export const ColorLab: React.FC = () => {
  const { bedroomOptions, addBedroomSubmission } = useFirebaseState();
  const [activeStep, setActiveStep] = useState<number>(0);
  
  // Selections state
  const [selections, setSelections] = useState<Record<string, BedroomOption>>({});
  
  // Submission contact details
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Get current active section
  const currentSection = SECTIONS[activeStep];

  // Filter available options for the active section
  const currentOptions = useMemo(() => {
    return bedroomOptions.filter(opt => opt.section === currentSection.key);
  }, [bedroomOptions, currentSection.key]);

  // Handle selecting an option
  const handleSelectOption = (option: BedroomOption) => {
    setSelections(prev => ({
      ...prev,
      [currentSection.key]: option
    }));
  };

  // Move to next step
  const handleNext = () => {
    if (activeStep < SECTIONS.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  // Move to previous step
  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  // Reset questionnaire
  const handleReset = () => {
    setSelections({});
    setActiveStep(0);
    setSubmittedSuccess(false);
    setClientName('');
    setClientPhone('');
  };

  // Submit choices to Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!clientName.trim() || !clientPhone.trim()) {
      setFormError('الرجاء كتابة الاسم ورقم الهاتف للمتابعة.');
      return;
    }

    // Ensure they have selected at least 3 things to make it a valid selection
    const selectedKeys = Object.keys(selections);
    if (selectedKeys.length === 0) {
      setFormError('الرجاء اختيار خيار واحد على الأقل لتصميم غرفتك.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Map selections to schema shape
      const formattedSelections: Record<string, { optionId: string; name: string; image: string }> = {};
      selectedKeys.forEach(key => {
        formattedSelections[key] = {
          optionId: selections[key].id,
          name: selections[key].name,
          image: selections[key].image
        };
      });

      await addBedroomSubmission({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        selections: formattedSelections
      });

      setSubmitting(false);
      setSubmittedSuccess(true);
    } catch (err) {
      console.error(err);
      setFormError('حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.');
      setSubmitting(false);
    }
  };

  // Calculated percentage completion
  const completionPercentage = Math.round((Object.keys(selections).length / SECTIONS.length) * 100);

  return (
    <div className="bg-[#0f0f0e] text-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#d4af37] selection:text-black" dir="rtl">
      
      {/* Royal Luxury Accent Line */}
      <div className="max-w-7xl mx-auto mb-10 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#d4af37]" />
        
        {/* Decorative Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/35 bg-[#171714] text-[#d4af37] text-xs font-bold tracking-widest uppercase mt-6 mb-4">
          <Crown className="w-4 h-4" />
          <span>مجموعة رويال جروب للتصميم الداخلي</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white font-sans tracking-tight mb-3">
          مختبر التصميم <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa7c11]">الملكي لغرف النوم</span>
        </h1>
        <p className="text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
          قم ببناء وتشكيل غرفة نومك الفاخرة قطعة تلو قطعة. اختر من بين أرقى خامات الأخشاب، الرخام، الأسقف والإضاءة الملكية، وشاهد ملخص ذوقك الفني الرفيع في لوحة فورية.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Area: Questionnaire Step Wizard (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Progress and Wizard step tabs */}
          <div className="bg-[#171714] border border-[#d4af37]/15 rounded-3xl p-6 shadow-xl">
            {/* Step navigation dots / names (scrollable on mobile) */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#d4af37]/30">
              {SECTIONS.map((sec, idx) => {
                const IconComponent = sec.icon;
                const isCompleted = selections[sec.key] !== undefined;
                const isActive = idx === activeStep;

                return (
                  <button
                    key={sec.key}
                    onClick={() => setActiveStep(idx)}
                    className={`flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-gradient-to-b from-[#aa7c11] to-[#d4af37] text-[#0f0f0e] border-transparent shadow-md' 
                        : isCompleted 
                          ? 'bg-[#1e1e1a]/80 text-[#d4af37] border-[#d4af37]/30 hover:bg-[#1e1e1a]'
                          : 'bg-transparent text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{sec.title}</span>
                    {isCompleted && !isActive && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-4 pt-4 border-t border-gray-900 flex justify-between items-center text-xs">
              <span className="text-gray-400">إنجاز التصميم المخصص: <strong className="text-white">{completionPercentage}%</strong></span>
              <div className="w-1/2 bg-gray-900 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#aa7c11] to-[#d4af37] h-full transition-all duration-500 rounded-full" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Active section info */}
          <div className="text-right py-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                {React.createElement(currentSection.icon, { className: "w-5 h-5" })}
              </span>
              <span>{currentSection.title}</span>
            </h2>
            <p className="text-xs text-gray-400 mr-12">{currentSection.subtitle}</p>
          </div>

          {/* Section image options list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AnimatePresence mode="wait">
              {currentOptions.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full bg-[#171714] border border-dashed border-[#d4af37]/25 rounded-3xl p-16 text-center space-y-4"
                >
                  <Award className="w-12 h-12 text-[#d4af37]/40 mx-auto" />
                  <h4 className="text-sm font-black text-gray-200">لم يتم إدراج خيارات بعد</h4>
                  <p className="text-xs text-gray-400">يرجى تسجيل الدخول إلى لوحة المدير لإدراج ورفع صور فخمة لهذا القسم.</p>
                </motion.div>
              ) : (
                currentOptions.map((opt) => {
                  const isSelected = selections[currentSection.key]?.id === opt.id;

                  return (
                    <motion.div
                      key={opt.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => handleSelectOption(opt)}
                      className={`group bg-[#171714] border rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 relative flex flex-col justify-between ${
                        isSelected 
                          ? 'border-[#d4af37] ring-2 ring-[#d4af37]/15 shadow-2xl' 
                          : 'border-gray-900 hover:border-[#d4af37]/40 hover:shadow-lg'
                      }`}
                    >
                      {/* Selection Badge */}
                      {isSelected && (
                        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-gradient-to-r from-[#aa7c11] to-[#d4af37] text-black text-[10px] font-black rounded-full flex items-center gap-1.5 shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>خيارك المختار</span>
                        </div>
                      )}

                      {/* Image Frame */}
                      <div className="aspect-[4/3] w-full overflow-hidden relative bg-black/40">
                        <img 
                          src={opt.image} 
                          alt={opt.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#171714] via-transparent to-black/20" />
                      </div>

                      {/* Info Pane */}
                      <div className="p-5 space-y-1.5 text-right flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xs font-black text-white group-hover:text-[#d4af37] transition-colors">{opt.name}</h3>
                          {opt.description && (
                            <p className="text-[10px] text-gray-400 leading-relaxed mt-1">{opt.description}</p>
                          )}
                        </div>
                        
                        <div className="pt-3 border-t border-gray-900 mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-[#d4af37]/75 font-bold">مجموعة رويال للتصميم</span>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-colors ${
                            isSelected ? 'bg-[#d4af37] text-black' : 'bg-gray-900 text-gray-300 group-hover:text-[#d4af37]'
                          }`}>
                            {isSelected ? 'تم الاختيار' : 'انقر للتحديد'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6">
            <button
              onClick={handlePrev}
              disabled={activeStep === 0}
              className={`px-6 py-3 rounded-2xl border text-xs font-black transition-all flex items-center gap-2 ${
                activeStep === 0 
                  ? 'border-gray-900 text-gray-600 cursor-not-allowed bg-transparent' 
                  : 'border-[#d4af37]/35 text-[#d4af37] hover:bg-[#d4af37]/10'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
              <span>الخطوة السابقة</span>
            </button>

            <button
              onClick={handleNext}
              disabled={activeStep === SECTIONS.length - 1}
              className={`px-6 py-3 rounded-2xl border text-xs font-black transition-all flex items-center gap-2 ${
                activeStep === SECTIONS.length - 1 
                  ? 'border-gray-900 text-gray-600 cursor-not-allowed bg-transparent' 
                  : 'bg-gradient-to-r from-[#aa7c11] to-[#d4af37] text-black border-transparent hover:brightness-110 shadow-lg'
              }`}
            >
              <span>الخطوة التالية</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Right Area: Real-time Live Summary Panel (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#171714] border border-[#d4af37]/20 rounded-3xl p-6 shadow-2xl sticky top-8 text-right space-y-5">
            <div className="border-b border-gray-900 pb-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Crown className="w-4.5 h-4.5 text-[#d4af37]" />
                <span>ملخص خياراتك الفنية الفورية</span>
              </h3>
              <p className="text-[10px] text-gray-400 mt-1">تابع خيارات أثاث غرفتك وديكوراتها بشكل تفاعلي</p>
            </div>

            {/* Selection Checklist items with mini thumbnail */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800">
              {SECTIONS.map((sec) => {
                const selected = selections[sec.key];

                return (
                  <div 
                    key={sec.key} 
                    className={`flex items-center gap-3 p-2 rounded-2xl border transition-all ${
                      selected 
                        ? 'bg-[#1e1e1a] border-[#d4af37]/25' 
                        : 'bg-transparent border-gray-900/60 opacity-60'
                    }`}
                  >
                    {/* Mini Image Preview */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/50 border border-gray-800 shrink-0">
                      {selected ? (
                        <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          {React.createElement(sec.icon, { className: "w-5 h-5" })}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-black text-[#d4af37] block">{sec.title}</span>
                      <h4 className="text-[11px] font-bold text-gray-200 truncate">
                        {selected ? selected.name : 'لم يتم الاختيار بعد'}
                      </h4>
                    </div>

                    <div className="shrink-0 pl-2">
                      {selected ? (
                        <span className="p-1 rounded-full bg-[#d4af37]/15 text-[#d4af37] block">
                          <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                        </span>
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-gray-800 block mr-1.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selection Stats */}
            <div className="pt-3 border-t border-gray-900 flex justify-between items-center text-xs">
              <span className="text-gray-400">عدد العناصر المختارة:</span>
              <span className="font-bold text-white px-3 py-1 bg-gray-900 rounded-lg border border-gray-800">
                <strong className="text-[#d4af37]">{Object.keys(selections).length}</strong> / {SECTIONS.length}
              </span>
            </div>

            {/* Contact details and submit form */}
            {!submittedSuccess ? (
              <form onSubmit={handleSubmit} className="border-t border-gray-900 pt-4 space-y-3.5">
                <h4 className="text-xs font-black text-[#d4af37]">إرسال ذوقك الفني للمصممين</h4>
                <p className="text-[10px] text-gray-400">املأ بياناتك لنتواصل معك ونرسل لك رندر ثلاثي الأبعاد لخياراتك</p>
                
                <div className="space-y-3">
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-500 absolute top-3.5 right-3.5" />
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="اسمك الكامل الكريم"
                      className="w-full p-3 pr-10 text-xs bg-gray-900 text-white rounded-xl border border-gray-800 outline-none focus:border-[#d4af37] transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-500 absolute top-3.5 right-3.5" />
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="رقم الهاتف (واتساب متاح)"
                      className="w-full p-3 pr-10 text-xs bg-gray-900 text-white rounded-xl border border-gray-800 outline-none focus:border-[#d4af37] text-left font-mono"
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-[10px] text-red-400 font-bold bg-red-950/20 border border-red-900/40 p-2.5 rounded-xl">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-[#aa7c11] via-[#d4af37] to-[#aa7c11] text-black text-xs font-black rounded-xl hover:brightness-110 shadow-lg shadow-[#d4af37]/10 flex items-center justify-center gap-2 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>جاري إرسال ذوقك الملكي...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>إرسال التصميم لرويال جروب</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="bg-[#1e1e1a] border border-[#d4af37]/30 p-5 rounded-2xl text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-[#d4af37] mx-auto animate-bounce" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-white">تم استلام خياراتك بنجاح!</h4>
                  <p className="text-[10px] text-gray-400">لقد تم حفظ تفضيلات غرفة نومك المخصصة. سيتصل بك مصممونا قريباً لعرض الرندر مجاناً.</p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-900 text-gray-300 hover:text-white rounded-lg text-[10px] font-bold border border-gray-800 transition-all"
                >
                  بدء تصميم جديد
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
