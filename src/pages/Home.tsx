/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { Sparkles, ArrowLeft, Phone, ShieldCheck, Users, ClipboardCheck, MessageSquare, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setActiveTab }) => {
  const { projects, companySettings } = useFirebaseState();
  const featured = projects.filter(p => p.featured).slice(0, 3);

  const stats = [
    { value: "+120", label: "مشروع متكامل تم تسليمه" },
    { value: "+10", label: "سنوات من الخبرة والتميز" },
    { value: "100%", label: "نسبة رضا عملائنا" },
    { value: "+15", label: "مهندسين ومصممين مختصين" }
  ];

  const testimonials = [
    {
      name: "الأستاذ علي الخفاجي",
      role: "صاحب فيلا المنصور",
      comment: "تجربتي مع رويال جروب كانت استثنائية. من أول جلسة تصميم وحتى تسليم الفيلا بالمفتاح، الالتزام بالوقت ودقة التنفيذ ومطابقة العمل للمخططات ثلاثية الأبعاد كانت مذهلة فعلاً.",
      rating: 5
    },
    {
      name: "الدكتورة مريم الجبوري",
      role: "شقة الجادرية السكنية",
      comment: "التصميم كان مريحاً ومستغلاً لكل المساحات بشكل رائع. فريق الإشراف الهندسي كان متواجداً في الموقع بشكل يومي لمراقبة أدق التفاصيل وتجنب الأخطاء. أنصح بهم بشدة.",
      rating: 5
    },
    {
      name: "المهندس عمر الجنابي",
      role: "مكتب شركة تجارية",
      comment: "الذوق الرفيع والاحترافية العالية هما عنوان رويال جروب. اختيار الألوان والخامات كان مدروساً جداً، والتنفيذ تم بخامات إيطالية ممتازة وأيدي عاملة محترفة.",
      rating: 5
    }
  ];

  return (
    <div className="space-y-24 bg-[#faf9f6]" dir="rtl">
      {/* 1. Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-[#171714]">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1600')] bg-cover bg-center opacity-35 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#171714] via-[#171714]/70 to-transparent z-10"></div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-5xl mx-auto px-4 text-center space-y-8 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-2 bg-[#d4af37]/10 text-[#d4af37] px-4 py-1.5 rounded-full border border-[#d4af37]/20 text-xs font-bold uppercase tracking-widest"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>نصنع الفخامة في كل زاوية</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-white leading-tight font-sans tracking-tight"
          >
            رويال جروب للتصميم الداخلي والتنفيذ <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#d4af37] via-[#f3e5ab] to-[#d4af37]">فخامة التفاصيل الواقعية</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="text-gray-300 text-sm md:text-lg max-w-2xl leading-relaxed font-sans font-medium"
          >
            نحن شركة هندسية متخصصة في ابتكار وتصميم الفراغات السكنية والتجارية الفاخرة، وتنفيذها على أرض الواقع بدقة متناهية وتحت إشراف هندسي يومي كامل.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <button
              onClick={() => setActiveTab('request')}
              className="px-8 py-4 bg-[#d4af37] hover:bg-[#b8952b] text-[#171714] font-black text-base rounded-lg transition-all duration-300 shadow-xl shadow-[#d4af37]/15 flex items-center justify-center gap-2"
            >
              <span>طلب تصميم مخصص</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 font-bold text-base rounded-lg transition-all duration-300 flex items-center justify-center"
            >
              تصفح مشاريعنا الفاخرة
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. Introduction Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 relative">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b8952b] opacity-10 blur-xl"></div>
            <img 
              src={companySettings.aboutImage || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=800"} 
              alt="عن رويال جروب" 
              className="relative w-full rounded-2xl object-cover shadow-2xl border border-[#d4af37]/20 h-[450px]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="lg:col-span-7 space-y-6 text-right">
            <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold tracking-widest uppercase">
              <span className="w-6 h-[1px] bg-[#d4af37]"></span>
              <span>عن رويال جروب</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1e1e1a] leading-tight font-sans">
              حيث يلتقي الفن المعماري مع جودة التنفيذ الهندسي
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed text-justify font-sans font-medium">
              {companySettings.aboutText}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">ضمان الجودة الحقيقي</h4>
                  <p className="text-xs text-gray-500 mt-1">نستخدم أرقى الخامات الإيطالية والتركية لضمان عمر مديد وأناقة ممتدة.</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37] shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">إشراف هندسي يومي</h4>
                  <p className="text-xs text-gray-500 mt-1">طاقم هندسي متكامل لمتابعة تنفيذ أدق التفاصيل وتجنب أي انحرافات.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Services Summary Section */}
      <section className="bg-[#171714] text-white py-24 border-y border-[#d4af37]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[#d4af37] text-xs font-bold tracking-widest uppercase">خدماتنا الهندسية</span>
            <h2 className="text-3xl md:text-4xl font-black font-sans leading-tight">حلول هندسية متكاملة لبيتك ومكتبك</h2>
            <p className="text-gray-400 text-xs">نقدم لك حزمة متكاملة تبدأ من الفكرة الأولية وتستمر حتى تسليم المفتاح لتفادي عناء المتابعة.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                num: "01",
                title: "التصميم الداخلي",
                desc: "دراسة وتخطيط المساحات بشكل مريح وعملي ومدروس، واختيار الخامات بعناية تامة."
              },
              {
                num: "02",
                title: "التصميم ثلاثي الأبعاد 3D",
                desc: "رؤية الفراغ المعماري بصورة واقعية تماماً قبل بدء التنفيذ لتتخيل مساحتك مسبقاً."
              },
              {
                num: "03",
                title: "التنفيذ والتشطيب",
                desc: "فريق فني ومحترف يقوم بكافة أعمال الإنشاء والتشطيب والصباغة والنجارة بأعلى المعايير."
              },
              {
                num: "04",
                title: "الإشراف الهندسي",
                desc: "متابعة دقيقة ومستمرة لخطوات البناء لضمان الالتزام الكامل بالمخططات والمواصفات القياسية."
              }
            ].map((service, index) => (
              <div 
                key={index}
                className="p-8 bg-[#1e1e1a] rounded-xl border border-white/5 hover:border-[#d4af37]/30 transition-all duration-300 relative group"
              >
                <span className="text-3xl font-extrabold text-[#d4af37]/20 font-serif absolute top-4 left-6 group-hover:text-[#d4af37]/40 transition-colors">
                  {service.num}
                </span>
                <h3 className="text-lg font-bold text-white mt-4 font-sans">{service.title}</h3>
                <p className="text-xs text-gray-400 mt-2.5 leading-relaxed text-justify">{service.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => setActiveTab('services')}
              className="text-[#d4af37] border border-[#d4af37]/30 hover:border-[#d4af37] hover:bg-[#d4af37]/5 px-6 py-3 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-2"
            >
              <span>تفاصيل الخدمات الهندسية</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Featured Projects */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-3.5">
            <span className="text-[#d4af37] text-xs font-bold tracking-widest uppercase">معرض التميز</span>
            <h2 className="text-3xl md:text-4xl font-black text-[#1e1e1a] font-sans">مشاريعنا المميزة المنجزة في بغداد</h2>
            <p className="text-gray-500 text-xs">معرض حي يعكس جودة التنفيذ والذوق الرفيع لرويال جروب.</p>
          </div>
          <button
            onClick={() => setActiveTab('projects')}
            className="text-[#1e1e1a] border border-[#1e1e1a]/15 hover:border-[#d4af37] hover:bg-[#d4af37]/10 px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
          >
            عرض كافة المشاريع
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map((project) => (
            <div 
              key={project.id}
              onClick={() => setActiveTab('projects')}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-gray-100 transition-all duration-300"
            >
              <div className="h-64 relative overflow-hidden bg-[#232321]">
                <img 
                  src={project.coverImage} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 bg-[#171714]/90 backdrop-blur-sm border border-[#d4af37]/30 text-[#d4af37] text-[10px] font-bold px-2.5 py-1 rounded">
                  {project.category}
                </div>
              </div>
              <div className="p-6 space-y-3.5">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>المساحة: <strong className="text-gray-900">{project.area}</strong></span>
                  <span>المدينة: <strong className="text-gray-900">{project.city}</strong></span>
                </div>
                <h3 className="text-base font-black text-[#1e1e1a] group-hover:text-[#d4af37] transition-colors font-sans">
                  {project.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Statistics & Figures */}
      <section className="bg-gradient-to-r from-[#171714] to-[#1e1e1a] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 text-center">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="text-3xl md:text-5xl font-extrabold font-serif text-[#d4af37] tracking-tight">{stat.value}</h3>
                <p className="text-xs md:text-sm text-gray-400 font-sans font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[#d4af37] text-xs font-bold tracking-widest uppercase">ثقة عملائنا</span>
          <h2 className="text-3xl md:text-4xl font-black text-[#1e1e1a] font-sans">قالوا عن رويال جروب</h2>
          <p className="text-gray-500 text-xs">نحن نفخر برضا عملائنا ونبني علاقات ثقة مستدامة تمتد لسنوات.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, index) => (
            <div 
              key={index}
              className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex gap-1">
                  {[...Array(test.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" />
                  ))}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed text-justify italic">
                  "{test.comment}"
                </p>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 font-sans">{test.name}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">{test.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Call To Action Footer Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-[#171714] rounded-3xl p-10 md:p-16 text-center text-white border border-[#d4af37]/25 relative overflow-hidden space-y-6">
          <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000')] bg-cover bg-center opacity-10"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6 flex flex-col items-center">
            <h2 className="text-3xl md:text-4xl font-black font-sans leading-tight">ابدأ رحلة تصميم بيتك الفاخر اليوم</h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
              هل تبحث عن استغلال احترافي للمساحات وتشطيبات راقية تليق بك؟ تواصل معنا الآن واحصل على استشارة مع أحد مهندسينا المختصين.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-2">
              <a
                href="https://wa.me/07704679311"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>مراسلة عبر الواتساب</span>
              </a>
              <a
                href="tel:07704679311"
                className="px-6 py-3.5 rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 font-bold text-sm flex items-center gap-2 transition-all"
              >
                <Phone className="w-4 h-4 text-[#d4af37]" />
                <span>اتصال هاتفي مباشر</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
