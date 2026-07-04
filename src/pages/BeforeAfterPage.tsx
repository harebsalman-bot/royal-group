/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { Sparkles, ArrowLeft, Sliders, CheckSquare, ShieldCheck } from 'lucide-react';

export const BeforeAfterPage: React.FC = () => {
  const { projects } = useFirebaseState();

  // Filter projects that have both before and after images configured
  const comparativeProjects = projects.filter(p => p.beforeImage && p.afterImage);

  // In case none is added yet, let's provide premium default interactive showcases
  const defaultShowcases = [
    {
      title: "تحول مطبخ المنصور الفاخر",
      desc: "تم هدم الجدار العازل بالكامل وتوسيع المساحة لتصبح مطبخاً أمريكياً مفتوحاً على صالة الجلوس، مع دمج الرخام الطبيعي وخشب الجوز المقاوم للرطوبة.",
      before: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=800", // Raw under construction
      after: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800" // Fully finished elegant kitchen
    },
    {
      title: "تأثيث وتكسية صالة استقبال الجادرية",
      desc: "تركيب أسقف جبسوم بورد بنظام إنارة ذكي مدمج، مع تكسية جدار التلفزيون بديل رخام وبديل خشب وتأثيث صالون ملكي متناسق الألوان.",
      before: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=800", // Empty room under renovation
      after: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800" // Finished luxurious living room
    }
  ];

  return (
    <div className="bg-[#faf9f6] py-16 space-y-20" dir="rtl">
      {/* 1. Header Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#171714] rounded-3xl p-12 md:p-20 text-center overflow-hidden border border-[#d4af37]/20">
          <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200')] bg-cover bg-center opacity-25"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#171714] via-[#171714]/80 to-transparent z-10"></div>
          
          <div className="relative z-20 space-y-4">
            <span className="text-[#d4af37] text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              مقارنة الجودة الهندسية واقعياً
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white font-sans tracking-tight">قـبـل وبـعـد الـتـنـفـيـذ</h1>
            <p className="text-gray-400 text-xs md:text-sm max-w-lg mx-auto font-sans leading-relaxed">
              شاهد كيف نغير الواقع. اسحب الشريط الذهبي لمقارنة غرف الطابوق والخرسانة والبيوت المتهالكة مع نتائج التسليم النهائي المذهلة.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Interactive Before-After Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Dynamic Firebase Comparisons if available */}
        {comparativeProjects.map((p, idx) => (
          <div key={p.id} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <BeforeAfterSlider 
                beforeImage={p.beforeImage!} 
                afterImage={p.afterImage!} 
                height="h-[380px] md:h-[450px]"
              />
            </div>
            <div className="lg:col-span-5 space-y-4 text-right">
              <span className="px-3.5 py-1 bg-[#d4af37]/10 text-[#d4af37] text-[10px] font-black rounded uppercase">
                مقارنة حية مضافة حديثاً
              </span>
              <h3 className="text-2xl font-black text-gray-900 font-sans">{p.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed text-justify">
                {p.description}
              </p>
              <div className="pt-2 text-xs text-gray-500 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>الموقع: {p.city} • المساحة: {p.area}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#d4af37]" />
                  <span>القسم المنجز: {p.category}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Default Showcases to guarantee breathtaking UI on launch */}
        {defaultShowcases.map((show, idx) => (
          <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center border-t border-[#d4af37]/10 pt-16">
            <div className="lg:col-span-7">
              <BeforeAfterSlider 
                beforeImage={show.before} 
                afterImage={show.after} 
                height="h-[380px] md:h-[450px]"
              />
            </div>
            <div className="lg:col-span-5 space-y-4 text-right">
              <span className="px-3.5 py-1 bg-[#d4af37]/10 text-[#d4af37] text-[10px] font-black rounded uppercase">
                نموذج تحول رئيسي للشركة
              </span>
              <h3 className="text-2xl font-black text-gray-900 font-sans">{show.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed text-justify">
                {show.desc}
              </p>
              <div className="pt-2 text-xs text-gray-500 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>إشراف هندسي يومي كامل لمطابقة الجودة.</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Customer Satisfaction Callout */}
      <section className="bg-gradient-to-r from-[#171714] to-[#1e1e1a] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl font-black font-sans text-white">هل ترغب بتحقيق نفس هذا التحول المذهل في منزلك؟</h2>
          <p className="text-gray-400 text-xs max-w-lg mx-auto leading-relaxed">
            تواصل مع فريقنا الفني الآن، لنناقش كيفية معالجة الجدران المتعبة واستغلال الفراغات الصعبة وتطبيق أرقى الديكورات المعمارية.
          </p>
          <div className="pt-2">
            <a 
              href="https://wa.me/07704679311"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#d4af37] hover:bg-[#b8952b] text-[#171714] font-black text-xs rounded-xl shadow-lg transition-all inline-flex items-center gap-1.5"
            >
              <span>احجز استشارة فنية مجانية الآن</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
