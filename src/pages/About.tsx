/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { Award, Compass, Shield, Eye, Users2, Sparkles } from 'lucide-react';

export const About: React.FC = () => {
  const { companySettings } = useFirebaseState();

  const values = [
    {
      icon: <Award className="w-6 h-6 text-[#d4af37]" />,
      title: "الإتقان الهندسي الفائق",
      desc: "نحن لا نرضى بالحلول الوسط. كل تفصيل، من الأساسات إلى الفرش النهائي، يتم تنفيذه بأعلى معايير الإتقان والجودة العالمية."
    },
    {
      icon: <Compass className="w-6 h-6 text-[#d4af37]" />,
      title: "التصميم الإبداعي المدروس",
      desc: "ندمج بين الإبداع البصري والحلول العملية. ندرس الإضاءة والحركة واستغلال المساحات قبل وضع أي تلوين أو تصميم."
    },
    {
      icon: <Shield className="w-6 h-6 text-[#d4af37]" />,
      title: "الالتزام والشفافية",
      desc: "نلتزم التزاماً كاملاً بجدول الميزانية والتسليم الزمني المعتمد. تقاريرنا للمالك أسبوعية وشفافة بكل وضوح."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "الاستشارة الفنية وفهم المتطلبات",
      desc: "نجلس معك لنفهم تطلعاتك، ميزانيتك، ونوع التصميم المفضل لديك (كلاسيك، نيوكلاسيك، مودرن)."
    },
    {
      num: "02",
      title: "رفع القياسات والمخططات الأولية",
      desc: "يقوم فريقنا الهندسي بزيارة موقع العمل ورفع القياسات الدقيقة بالليزر لتهيئة مخططات توزيع الأثاث."
    },
    {
      num: "03",
      title: "التصميم ثلاثي الأبعاد 3D Renders",
      desc: "نقوم بتصميم الفراغات وتلوينها وعرضها بصور واقعية لتعاين مساحتك بشكل ملموس وتعديل ما يلزم."
    },
    {
      num: "04",
      title: "تهيئة المخططات التنفيذية والخرائط",
      desc: "نعد خرائط تفصيلية للإنارة، السقوف الثانوية، الكهرباء، والسباكة، بجانب تفاصيل النجارة والرخام."
    },
    {
      num: "05",
      title: "التنفيذ الواقعي والإشراف الهندسي",
      desc: "تبدأ أعمال التشطيبات والتركيبات تحت إشراف مهندس موقع مختص لضمان مطابقة التنفيذ للتصميم 100%."
    }
  ];

  return (
    <div className="bg-[#faf9f6] py-16 space-y-24" dir="rtl">
      {/* Page Header Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#171714] rounded-3xl p-12 md:p-20 text-center overflow-hidden border border-[#d4af37]/20">
          <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?q=80&w=1200')] bg-cover bg-center opacity-25"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#171714] via-[#171714]/80 to-transparent z-10"></div>
          
          <div className="relative z-20 space-y-4">
            <span className="text-[#d4af37] text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              رويال جروب للتصميم الداخلي
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white font-sans tracking-tight">مـن نـحـن</h1>
            <p className="text-gray-400 text-xs md:text-sm max-w-lg mx-auto font-sans leading-relaxed">
              قصة شغف بالجمال والإتقان الهندسي، نصوغ بها جدران ومساحات منازلكم لتتحول إلى تحف فنية تنبض بالحياة.
            </p>
          </div>
        </div>
      </section>

      {/* Corporate Summary & Image Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-[#d4af37] tracking-widest uppercase flex items-center gap-2">
              <span className="w-5 h-[1px] bg-[#d4af37]"></span>
              ريادة التصميم الداخلي في بغداد
            </span>
            <h2 className="text-3xl font-black text-[#1e1e1a] font-sans leading-tight">شريكك الموثوق لتنفيذ فكرة بيتك الحالم</h2>
            <div className="text-gray-600 text-sm leading-relaxed space-y-4 text-justify font-sans">
              <p>
                {companySettings.aboutText}
              </p>
              <p>
                نحن في رويال جروب لا نقوم فقط بتوزيع الأثاث وصبغ الجدران، بل ندرس السلوك اليومي للعميل داخل المنزل لتوزيع الفراغات بطريقة تمنح العائلة الراحة النفسية التامة والمظهر الملوكي الأنيق.
              </p>
              <p>
                خبرتنا الممتدة في السوق العراقي تجعلنا على دراية كاملة بأفضل الموردين وأحدث التقنيات والحلول الهندسية التي تناسب الأجواء والبيئة العراقية، لضمان استدامة وسلامة المواد لسنوات طويلة.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#d4af37] to-[#b8952b] opacity-10 blur-2xl"></div>
            <img 
              src={companySettings.aboutImage || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1200"} 
              alt="رويال جروب فخامة العمل" 
              className="relative rounded-2xl w-full h-[400px] object-cover shadow-2xl border border-[#d4af37]/20"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-[#171714] text-white py-24 border-y border-[#d4af37]/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[#d4af37] text-xs font-bold tracking-widest uppercase">مبادئنا الراسخة</span>
            <h2 className="text-3xl font-black font-sans leading-tight">القيم التي نلتزم بها في كل مشروع</h2>
            <p className="text-gray-400 text-xs">قواعد مهنية وأخلاقية صارمة تحكم عملنا وتبني ثقة متبادلة مع عملائنا.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {values.map((value, idx) => (
              <div key={idx} className="p-8 bg-[#1e1e1a] rounded-xl border border-white/5 space-y-4 text-right">
                <div className="p-3 bg-white/5 inline-block rounded-xl border border-[#d4af37]/15">
                  {value.icon}
                </div>
                <h3 className="text-lg font-bold text-white font-sans">{value.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed text-justify">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Map (Our Workflow) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[#d4af37] text-xs font-bold tracking-widest uppercase">خريطة الطريق</span>
          <h2 className="text-3xl font-black text-[#1e1e1a] font-sans">خطوات العمل المنظمة لدينا</h2>
          <p className="text-gray-500 text-xs">من الفكرة إلى التسليم، نسير على خطوات مدروسة لضمان تنفيذ احترافي سلس.</p>
        </div>

        <div className="relative border-r border-gray-200 mr-4 md:mr-8 space-y-12">
          {steps.map((step, index) => (
            <div key={index} className="relative pr-8 md:pr-12 group">
              {/* Timeline Marker */}
              <div className="absolute top-1 right-[-17px] w-8 h-8 rounded-full bg-white border-2 border-[#d4af37] flex items-center justify-center text-xs font-serif font-black text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-[#171714] transition-all">
                {step.num}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#1e1e1a] font-sans group-hover:text-[#d4af37] transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-3xl text-justify">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
