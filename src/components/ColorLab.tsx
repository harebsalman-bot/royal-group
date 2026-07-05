/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useFirebaseState } from './FirestoreStateContext';
import { BedroomOption, ColorVariant } from '../types';
import { mockColorVariants } from '../data/mockData';
import { 
  Bed, Layers, Grid, Sparkles, FolderOpen, Tv, Compass, Columns, Home, Lightbulb,
  ChevronLeft, ChevronRight, Check, CheckCircle2, Crown, Loader2, User, Phone, MapPin, Award,
  Palette, Paintbrush, RefreshCw, MessageSquare
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

interface ColorLabProps {
  setActiveTab?: (tab: string) => void;
}

export const ColorLab: React.FC<ColorLabProps> = ({ setActiveTab }) => {
  const { 
    bedroomOptions, 
    addBedroomSubmission, 
    colorVariants, 
    addDesignRequest 
  } = useFirebaseState();

  // Mode state: 'color' (Interactive Color Experience) or 'bedroom' (Bedroom Design Lab)
  const [currentLabMode, setCurrentLabMode] = useState<'color' | 'bedroom'>('color');

  // ==========================================
  // STATE & LOGIC: INTERACTIVE COLOR EXPERIENCE
  // ==========================================
  const [activeColors, setActiveColors] = useState<Record<'wood' | 'marble' | 'wall' | 'flooring', string>>({
    wood: '',
    marble: '',
    wall: '',
    flooring: ''
  });

  const [activeDisplayImage, setActiveDisplayImage] = useState<string>('');

  // Contact details for color customizer
  const [colorClientName, setColorClientName] = useState('');
  const [colorClientPhone, setColorClientPhone] = useState('');
  const [colorSubmitting, setColorSubmitting] = useState(false);
  const [colorSubmittedSuccess, setColorSubmittedSuccess] = useState(false);
  const [colorFormError, setColorFormError] = useState('');
  const [colorSuccessRequestNumber, setColorSuccessRequestNumber] = useState('');
  const [colorSuccessPhone, setColorSuccessPhone] = useState('');
  const [colorCopied, setColorCopied] = useState(false);

  // Group and memoize materials/colors (with fallbacks to mock data)
  const woods = useMemo(() => {
    const list = colorVariants.filter(v => v.type === 'wood');
    return list.length > 0 ? list : mockColorVariants.filter(v => v.type === 'wood');
  }, [colorVariants]);

  const marbles = useMemo(() => {
    const list = colorVariants.filter(v => v.type === 'marble');
    return list.length > 0 ? list : mockColorVariants.filter(v => v.type === 'marble');
  }, [colorVariants]);

  const walls = useMemo(() => {
    const list = colorVariants.filter(v => v.type === 'wall');
    return list.length > 0 ? list : mockColorVariants.filter(v => v.type === 'wall');
  }, [colorVariants]);

  const floorings = useMemo(() => {
    const list = colorVariants.filter(v => v.type === 'flooring');
    return list.length > 0 ? list : mockColorVariants.filter(v => v.type === 'flooring');
  }, [colorVariants]);

  // Set default active colors and default image on mount / data load
  useEffect(() => {
    if (woods.length > 0 && !activeColors.wood) {
      setActiveColors({
        wood: woods[0].id,
        marble: marbles[0]?.id || '',
        wall: walls[0]?.id || '',
        flooring: floorings[0]?.id || ''
      });
      setActiveDisplayImage(woods[0].image);
    }
  }, [woods, marbles, walls, floorings]);

  // Current selected variant helpers
  const selectedWood = useMemo(() => woods.find(w => w.id === activeColors.wood) || woods[0], [woods, activeColors.wood]);
  const selectedMarble = useMemo(() => marbles.find(m => m.id === activeColors.marble) || marbles[0], [marbles, activeColors.marble]);
  const selectedWall = useMemo(() => walls.find(l => l.id === activeColors.wall) || walls[0], [walls, activeColors.wall]);
  const selectedFlooring = useMemo(() => floorings.find(f => f.id === activeColors.flooring) || floorings[0], [floorings, activeColors.flooring]);

  // Handle color option click
  const handleSelectColorVariant = (variant: ColorVariant) => {
    setActiveColors(prev => ({
      ...prev,
      [variant.type]: variant.id
    }));
    setActiveDisplayImage(variant.image);
  };

  const handleColorCopy = () => {
    navigator.clipboard.writeText(colorSuccessRequestNumber);
    setColorCopied(true);
    setTimeout(() => setColorCopied(false), 2000);
  };

  // Submit Interactive Color selection as a real Design Request
  const handleColorExperienceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setColorFormError('');

    if (!colorClientName.trim() || !colorClientPhone.trim()) {
      setColorFormError('الرجاء كتابة الاسم الكريم ورقم هاتف التواصل للمتابعة.');
      return;
    }

    try {
      setColorSubmitting(true);

      const selectionsText = `طلب تنفيذ لوحة ألوان مخصصة:
- نوع الخشب: ${selectedWood?.name || 'غير محدد'}
- نوع الرخام: ${selectedMarble?.name || 'غير محدد'}
- طلاء الجدران: ${selectedWall?.name || 'غير محدد'}
- خامة الأرضيات: ${selectedFlooring?.name || 'غير محدد'}`;

      // Automatically create a DesignRequest (which creates a Ticket + Chat Room + Assigns Engineer in our auto-workflow)
      const res = await addDesignRequest({
        name: colorClientName.trim(),
        phone: colorClientPhone.trim(),
        city: 'بغداد',
        projectType: 'لوحة الألوان الملكية',
        area: 'غير محدد',
        budget: 'غير محدد',
        status: 'New',
        adminNotes: selectionsText,
        imageUrl: [
          selectedWood?.image,
          selectedMarble?.image,
          selectedWall?.image,
          selectedFlooring?.image
        ].filter(Boolean) as string[]
      });

      if (res && res.ticketId) {
        localStorage.setItem('active_client_ticket_id', res.ticketId);
      }

      setColorSuccessRequestNumber(res?.requestNumber || 'RG-' + Math.floor(1000 + Math.random() * 9000));
      setColorSuccessPhone(colorClientPhone.trim());
      setColorSubmittedSuccess(true);

      if (setActiveTab) {
        setTimeout(() => {
          setActiveTab('tickets');
        }, 1500);
      }
    } catch (err: any) {
      console.error("Color lab submit error:", err);
      setColorFormError('حدث خطأ أثناء إرسال طلب الألوان. يرجى المحاولة لاحقاً.');
    } finally {
      setColorSubmitting(false);
    }
  };

  const handleResetColorLab = () => {
    setColorSubmittedSuccess(false);
    setColorClientName('');
    setColorClientPhone('');
    if (woods.length > 0) {
      setActiveColors({
        wood: woods[0].id,
        marble: marbles[0]?.id || '',
        wall: walls[0]?.id || '',
        flooring: floorings[0]?.id || ''
      });
      setActiveDisplayImage(woods[0].image);
    }
  };

  // ==========================================
  // STATE & LOGIC: BEDROOM DESIGN LAB (Existing)
  // ==========================================
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selections, setSelections] = useState<Record<string, BedroomOption>>({});
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [successRequestNumber, setSuccessRequestNumber] = useState('');
  const [successPhone, setSuccessPhone] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(successRequestNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentSection = SECTIONS[activeStep];

  const currentOptions = useMemo(() => {
    return bedroomOptions.filter(opt => opt.section === currentSection.key);
  }, [bedroomOptions, currentSection.key]);

  const handleSelectOption = (option: BedroomOption) => {
    setSelections(prev => ({
      ...prev,
      [currentSection.key]: option
    }));
  };

  const handleNext = () => {
    if (activeStep < SECTIONS.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setSelections({});
    setActiveStep(0);
    setSubmittedSuccess(false);
    setClientName('');
    setClientPhone('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!clientName.trim() || !clientPhone.trim()) {
      setFormError('الرجاء كتابة الاسم ورقم الهاتف للمتابعة.');
      return;
    }

    const selectedKeys = Object.keys(selections);
    if (selectedKeys.length === 0) {
      setFormError('الرجاء اختيار خيار واحد على الأقل لتصميم غرفتك.');
      return;
    }

    try {
      setSubmitting(true);
      
      const formattedSelections: Record<string, { optionId: string; name: string; image: string }> = {};
      selectedKeys.forEach(key => {
        formattedSelections[key] = {
          optionId: selections[key].id,
          name: selections[key].name,
          image: selections[key].image
        };
      });

      const result = await addBedroomSubmission({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        selections: formattedSelections
      });

      if (result && result.ticketId) {
        localStorage.setItem('active_client_ticket_id', result.ticketId);
      }

      setSuccessRequestNumber(result?.requestNumber || '');
      setSuccessPhone(clientPhone.trim());
      setSubmitting(false);
      setSubmittedSuccess(true);
      setCopied(false);

      if (setActiveTab) {
        setTimeout(() => {
          setActiveTab('tickets');
        }, 1500);
      }
    } catch (err: any) {
      console.error("Bedroom Submission Error:", err);
      setFormError('حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.');
      setSubmitting(false);
    }
  };

  const completionPercentage = Math.round((Object.keys(selections).length / SECTIONS.length) * 100);

  return (
    <div className="bg-[#0f0f0e] text-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#d4af37] selection:text-black" dir="rtl">
      
      {/* Royal Luxury Accent Line */}
      <div className="max-w-7xl mx-auto mb-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#d4af37]" />
        
        {/* Decorative Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/35 bg-[#171714] text-[#d4af37] text-xs font-bold tracking-widest uppercase mt-6 mb-4">
          <Crown className="w-4 h-4" />
          <span>مجموعة رويال جروب للتصميم الداخلي</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white font-sans tracking-tight mb-3">
          مختبر التصميم والألوان <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa7c11]">الملكي الفاخر</span>
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
          انغمس في تجربة تصميم تفاعلية فريدة من نوعها. صمم غرفتك الفاخرة أو نسق لوحة الخامات الملكية الخاصة بك بشكل فوري.
        </p>
      </div>

      {/* MODE TAB SELECTOR */}
      <div className="max-w-7xl mx-auto mb-10 flex justify-center">
        <div className="bg-[#171714] border border-[#d4af37]/15 p-1.5 rounded-2xl flex gap-2 w-full max-w-md shadow-lg">
          <button
            onClick={() => setCurrentLabMode('color')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all ${
              currentLabMode === 'color'
                ? 'bg-gradient-to-r from-[#aa7c11] to-[#d4af37] text-black shadow-md'
                : 'text-gray-400 hover:text-white bg-transparent'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>تجربة الألوان التفاعلية</span>
          </button>
          <button
            onClick={() => setCurrentLabMode('bedroom')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all ${
              currentLabMode === 'bedroom'
                ? 'bg-gradient-to-r from-[#aa7c11] to-[#d4af37] text-black shadow-md'
                : 'text-gray-400 hover:text-white bg-transparent'
            }`}
          >
            <Bed className="w-4 h-4" />
            <span>مختبر غرف النوم</span>
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* RENDER MODE: INTERACTIVE COLOR EXPERIENCE          */}
      {/* ================================================== */}
      {currentLabMode === 'color' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left / Main Showcase Area (8 columns) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Live Interactive Rendering Image */}
            <div className="bg-[#171714] border border-[#d4af37]/20 rounded-3xl overflow-hidden p-3 shadow-2xl relative">
              <div className="aspect-[16/10] w-full bg-black/40 rounded-2xl overflow-hidden relative group">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={activeDisplayImage}
                    src={activeDisplayImage || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200"}
                    alt="تصميم رويال جروب التفاعلي"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                  />
                </AnimatePresence>
                
                {/* Visual Glassmorphic Accent Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0e] via-transparent to-black/30 pointer-events-none" />
                
                {/* Active Variant Label */}
                <div className="absolute bottom-6 right-6 z-10 bg-black/80 backdrop-blur-md border border-[#d4af37]/30 px-5 py-3 rounded-2xl max-w-sm">
                  <span className="text-[#d4af37] text-[10px] font-black tracking-widest uppercase block mb-0.5">الخامة المحددة حالياً في العرض</span>
                  <h3 className="text-sm font-bold text-white truncate">
                    {colorVariants.find(v => v.image === activeDisplayImage)?.name || "رندر رويال الافتراضي"}
                  </h3>
                </div>

                {/* Aesthetic Top Ribbon */}
                <div className="absolute top-6 left-6 z-10 bg-[#d4af37] text-black text-[9px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Interactive Real-time Rendering</span>
                </div>
              </div>
            </div>

            {/* Selected Materials Board / Palette Summary */}
            <div className="bg-[#171714] border border-gray-900 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-black text-[#d4af37] tracking-wider uppercase border-r-2 border-[#d4af37] pr-2.5">لوحة الخامات والألوان المحددة لمشروعك</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Wood */}
                <div className="bg-[#121210] border border-gray-800 p-3.5 rounded-2xl flex flex-col justify-between h-24">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">الخشب الرئيسي</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow" style={{ backgroundColor: selectedWood?.colorValue || '#C4A482' }} />
                      <span className="text-[11px] font-black text-white truncate">{selectedWood?.name || 'سنديان طبيعي'}</span>
                    </div>
                    <span className="text-[9px] bg-[#d4af37]/10 text-[#d4af37] font-semibold px-2 py-0.5 rounded-md uppercase">Wood</span>
                  </div>
                </div>

                {/* Marble */}
                <div className="bg-[#121210] border border-gray-800 p-3.5 rounded-2xl flex flex-col justify-between h-24">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">الرخام / الكوارتز</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow" style={{ backgroundColor: selectedMarble?.colorValue || '#EAEAEA' }} />
                      <span className="text-[11px] font-black text-white truncate">{selectedMarble?.name || 'كرارا الإيطالي'}</span>
                    </div>
                    <span className="text-[9px] bg-[#d4af37]/10 text-[#d4af37] font-semibold px-2 py-0.5 rounded-md uppercase">Marble</span>
                  </div>
                </div>

                {/* Wall Coating */}
                <div className="bg-[#121210] border border-gray-800 p-3.5 rounded-2xl flex flex-col justify-between h-24">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">طلاء الجدران</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow" style={{ backgroundColor: selectedWall?.colorValue || '#B1A796' }} />
                      <span className="text-[11px] font-black text-white truncate">{selectedWall?.name || 'غريج ملكي'}</span>
                    </div>
                    <span className="text-[9px] bg-[#d4af37]/10 text-[#d4af37] font-semibold px-2 py-0.5 rounded-md uppercase">Wall paint</span>
                  </div>
                </div>

                {/* Flooring */}
                <div className="bg-[#121210] border border-gray-800 p-3.5 rounded-2xl flex flex-col justify-between h-24">
                  <span className="text-[10px] text-gray-400 font-bold block mb-1">الأرضية الراقية</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20 shadow" style={{ backgroundColor: selectedFlooring?.colorValue || '#B8860B' }} />
                      <span className="text-[11px] font-black text-white truncate">{selectedFlooring?.name || 'باركيه طبيعي'}</span>
                    </div>
                    <span className="text-[9px] bg-[#d4af37]/10 text-[#d4af37] font-semibold px-2 py-0.5 rounded-md uppercase">Flooring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Selector & Form Sidebar (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#171714] border border-[#d4af37]/20 rounded-3xl p-6 shadow-2xl space-y-6 text-right">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Paintbrush className="w-4.5 h-4.5 text-[#d4af37]" />
                  <span>تنسيق الألوان والخامات</span>
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">انقر على الخامات لتجربتها وتحديث التصميم فوراً</p>
              </div>

              {/* 1. Wood Selector */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-[#d4af37] block">خشب الديكور الرئيسي (Wood)</span>
                <div className="grid grid-cols-2 gap-2">
                  {woods.map(w => {
                    const isActive = activeColors.wood === w.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => handleSelectColorVariant(w)}
                        className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2.5 ${
                          isActive 
                            ? 'bg-[#1e1e1a] border-[#d4af37] text-white' 
                            : 'bg-[#121210] border-gray-900 text-gray-400 hover:border-gray-800'
                        }`}
                      >
                        <span className="w-4.5 h-4.5 rounded-full shrink-0 border border-white/10 shadow-sm" style={{ backgroundColor: w.colorValue }} />
                        <span className="text-[10px] font-bold truncate">{w.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Marble Selector */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-[#d4af37] block">الرخام والبدائل (Marble)</span>
                <div className="grid grid-cols-2 gap-2">
                  {marbles.map(m => {
                    const isActive = activeColors.marble === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleSelectColorVariant(m)}
                        className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2.5 ${
                          isActive 
                            ? 'bg-[#1e1e1a] border-[#d4af37] text-white' 
                            : 'bg-[#121210] border-gray-900 text-gray-400 hover:border-gray-800'
                        }`}
                      >
                        <span className="w-4.5 h-4.5 rounded-full shrink-0 border border-white/10 shadow-sm" style={{ backgroundColor: m.colorValue }} />
                        <span className="text-[10px] font-bold truncate">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Wall Paints */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-[#d4af37] block">طلاء الجدران الأساسية (Wall)</span>
                <div className="grid grid-cols-2 gap-2">
                  {walls.map(l => {
                    const isActive = activeColors.wall === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => handleSelectColorVariant(l)}
                        className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2.5 ${
                          isActive 
                            ? 'bg-[#1e1e1a] border-[#d4af37] text-white' 
                            : 'bg-[#121210] border-gray-900 text-gray-400 hover:border-gray-800'
                        }`}
                      >
                        <span className="w-4.5 h-4.5 rounded-full shrink-0 border border-white/10 shadow-sm" style={{ backgroundColor: l.colorValue }} />
                        <span className="text-[10px] font-bold truncate">{l.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Floorings */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black text-[#d4af37] block">نوع الأرضية الفاخرة (Flooring)</span>
                <div className="grid grid-cols-2 gap-2">
                  {floorings.map(f => {
                    const isActive = activeColors.flooring === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => handleSelectColorVariant(f)}
                        className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2.5 ${
                          isActive 
                            ? 'bg-[#1e1e1a] border-[#d4af37] text-white' 
                            : 'bg-[#121210] border-gray-900 text-gray-400 hover:border-gray-800'
                        }`}
                      >
                        <span className="w-4.5 h-4.5 rounded-full shrink-0 border border-white/10 shadow-sm" style={{ backgroundColor: f.colorValue }} />
                        <span className="text-[10px] font-bold truncate">{f.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Form or Success message */}
              {!colorSubmittedSuccess ? (
                <form onSubmit={handleColorExperienceSubmit} className="border-t border-gray-900 pt-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-[#d4af37]">تنفيذ هذا التنسيق التفاعلي</h4>
                    <p className="text-[10px] text-gray-400 mt-1">احفظ خيارات خاماتك وسيتم فتح غرفة محادثة مخصصة لمشروعك مع مهندس رويال المسؤول.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-500 absolute top-3.5 right-3.5" />
                      <input
                        type="text"
                        required
                        value={colorClientName}
                        onChange={(e) => setColorClientName(e.target.value)}
                        placeholder="اسمك الكامل الكريم"
                        className="w-full p-3 pr-10 text-xs bg-gray-900 text-white rounded-xl border border-gray-800 outline-none focus:border-[#d4af37] transition-all"
                      />
                    </div>

                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-500 absolute top-3.5 right-3.5" />
                      <input
                        type="tel"
                        required
                        value={colorClientPhone}
                        onChange={(e) => setColorClientPhone(e.target.value)}
                        placeholder="رقم الهاتف (واتساب متاح)"
                        className="w-full p-3 pr-10 text-xs bg-gray-900 text-white rounded-xl border border-gray-800 outline-none focus:border-[#d4af37] text-left font-mono"
                      />
                    </div>
                  </div>

                  {colorFormError && (
                    <p className="text-[10px] text-red-400 font-bold bg-red-950/20 border border-red-900/40 p-2.5 rounded-xl">
                      {colorFormError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={colorSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-[#aa7c11] via-[#d4af37] to-[#aa7c11] text-black text-xs font-black rounded-xl hover:brightness-110 shadow-lg shadow-[#d4af37]/10 flex items-center justify-center gap-2 transition-all"
                  >
                    {colorSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>جاري تقديم تنسيق الألوان الملكية...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-black" />
                        <span>طلب رندر ثلاثي الأبعاد بالألوان المحددة</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="bg-[#1e1e1a] border border-[#d4af37]/30 p-5 rounded-3xl text-center space-y-4">
                  <div className="p-3 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 rounded-full w-fit mx-auto">
                    <CheckCircle2 className="w-8 h-8 animate-pulse" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white font-sans">تم إرسال لوحة الألوان الملكية!</h4>
                    <p className="text-[10px] text-gray-400">تم حجز طلب التنسيق الخاص بك بنجاح، وتوليد تذكرة متابعة فورية.</p>
                  </div>

                  {/* Compact dark code panel */}
                  <div className="bg-black/40 rounded-2xl border border-gray-900 p-3 space-y-3.5 text-right">
                    <div className="flex items-center justify-between bg-[#171714] border border-[#d4af37]/15 p-2.5 rounded-xl">
                      <button 
                        onClick={handleColorCopy}
                        className="px-2.5 py-1 bg-[#d4af37] hover:bg-[#b8952b] text-black text-[9px] font-black rounded-lg transition-all"
                      >
                        {colorCopied ? 'تم!' : 'نسخ'}
                      </button>
                      <div className="text-right">
                        <span className="block text-[9px] text-gray-500">رمز تتبع المشروع</span>
                        <span className="text-xs font-black text-[#d4af37] font-mono select-all tracking-wider">{colorSuccessRequestNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    {setActiveTab && (
                      <button
                        onClick={() => setActiveTab('tickets')}
                        className="w-full py-2.5 bg-[#d4af37] hover:bg-[#b8952b] text-black text-xs font-black rounded-xl transition-all shadow-lg shadow-[#d4af37]/5 flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>دخول غرف المحادثة الآن</span>
                      </button>
                    )}
                    <button
                      onClick={handleResetColorLab}
                      className="w-full py-2.5 bg-[#171714] hover:bg-[#232320] text-gray-300 hover:text-white rounded-xl text-xs font-bold border border-gray-800 transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>بدء تجربة جديدة</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ================================================== */}
      {/* RENDER MODE: BEDROOM DESIGN LAB (Existing)         */}
      {/* ================================================== */}
      {currentLabMode === 'bedroom' && (
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
                      {isCompleted && !isActive && <Check className="w-3.5 h-3.5 animate-bounce" />}
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
                <div className="bg-[#1e1e1a] border border-[#d4af37]/30 p-6 rounded-3xl text-center space-y-5">
                  <div className="p-3 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 rounded-full w-fit mx-auto">
                    <CheckCircle2 className="w-10 h-10 animate-pulse" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-white font-sans">تم استلام خياراتك الملكية بنجاح!</h4>
                    <p className="text-[10px] text-gray-400">لقد تم حفظ تفضيلات غرفة نومك وتوليد رمز تتبع مخصص لمشروعك.</p>
                  </div>

                  {/* Compact Dark Tracking Box */}
                  <div className="bg-black/40 rounded-2xl border border-gray-900 p-4 space-y-3.5 text-right">
                    <div className="flex items-center justify-between bg-[#171714] border border-[#d4af37]/15 p-2.5 rounded-xl">
                      <button 
                        onClick={handleCopy}
                        className="px-2.5 py-1 bg-[#d4af37] hover:bg-[#b8952b] text-black text-[9px] font-black rounded-lg transition-all"
                      >
                        {copied ? 'تم النسخ!' : 'نسخ الرمز'}
                      </button>
                      <div className="text-right">
                        <span className="block text-[9px] text-gray-500 font-medium">رمز تتبع المشروع</span>
                        <span className="text-xs font-black text-[#d4af37] font-mono select-all tracking-wider">{successRequestNumber || 'RG-PENDING'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-[#171714] border border-gray-900 p-2.5 rounded-xl">
                      <span className="text-xs font-mono font-bold text-gray-300" dir="ltr">{successPhone}</span>
                      <div className="text-right">
                        <span className="block text-[9px] text-gray-500 font-medium">رقم الهاتف للطلب</span>
                        <span className="text-xs font-bold text-gray-300">رقم التواصل</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1.5">
                    {setActiveTab && (
                      <button
                        onClick={() => setActiveTab('tickets')}
                        className="w-full py-2.5 bg-[#d4af37] hover:bg-[#b8952b] text-black text-xs font-black rounded-xl transition-all shadow-lg shadow-[#d4af37]/5 flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>دخول غرف المحادثة الآن</span>
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      className="w-full py-2.5 bg-[#171714] hover:bg-[#232320] text-gray-300 hover:text-white rounded-xl text-xs font-bold border border-gray-800 transition-all"
                    >
                      بدء تصميم جديد
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
