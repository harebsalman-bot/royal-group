/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Paintbrush, Hammer, CheckSquare, Sparkles, Layout, Compass, Shield } from 'lucide-react';

export const Services: React.FC = () => {
  const serviceDetails = [
    {
      icon: <Paintbrush className="w-8 h-8 text-[#d4af37]" />,
      title: "التصميم الداخلي (Interior Design)",
      subtitle: "صناعة الفراغات الذكية والأنيقة",
      desc: "نحن نصمم مساحاتك الداخلية بفهم عميق ومدروس لكيفية دمج المظهر الملوكي والراحة العملية. يركز عملنا على إيجاد مخططات مريحة وتوزيع منسق للأثاث، وإضاءة طبيعية واصطناعية متكاملة وموفرة، ومواكبة لأحدث صيحات الطرز المعمارية العالمية.",
      deliverables: [
        "مخطط توزيع الأثاث الكامل ثنائي الأبعاد (2D Furniture Layout).",
        "لوحات المودبورد (Moodboard) لتحديد الألوان والاتجاه البصري العام.",
        "دراسة الممرات، الفراغات، والنسب الحركية لضمان راحة الاستخدام اليومي.",
        "تنسيق واختيار الأقمشة والستائر والإكسسوارات الفاخرة."
      ],
      tag: "تصميم"
    },
    {
      icon: <Layers className="w-8 h-8 text-[#d4af37]" />,
      title: "التصميم ثلاثي الأبعاد (3D Visualization)",
      subtitle: "شاهد بيتك الحالم كأنه واقع ملموس",
      desc: "نترجم الفكرة المعمارية إلى صور ورندر ثلاثي الأبعاد فائق الواقعية ومطابق للخامات المختارة. يتيح ذلك للعميل فحص الفراغات، ومطابقة الألوان، وتعديل أي تفاصيل في الإنارة والسقف قبل شراء المواد أو وضع طابوقة واحدة في الموقع، مما يمنع الهدر المالي بالكامل.",
      deliverables: [
        "صور رندر (3D Renderings) عالية الجودة من زوايا متعددة.",
        "فيديوهات جولة افتراضية للمشروع (Virtual Walkthrough) عند الطلب.",
        "توضيح تفصيلي لتوزيع الإنارة المخفية والسبوتلايت والمصادر الأساسية.",
        "تطابق كامل بين التصميم والمواد التي سيتم شراؤها واقعياً."
      ],
      tag: "رندر واقعي"
    },
    {
      icon: <Hammer className="w-8 h-8 text-[#d4af37]" />,
      title: "التنفيذ المتكامل وتشطيب المفتاح (Turnkey Execution)",
      subtitle: "حرفة البناء ورقي المهارات اليدوية",
      desc: "نمتلك أطقماً فنية محترفة ومدربة من الصباغين والنجارين والكهربائيين والمبلطين الذين يعملون تحت توجيه وإرشاد هندسي مستمر. نقوم بكافة أعمال الجبس الفاخر، تكسية الجدران ببديل الرخام والخشب الإيطالي، تمديدات الكهرباء الذكية والصباغة الفاخرة بدقة متناهية.",
      deliverables: [
        "أعمال الجبسوم بورد والأسقف الثانوية الكلاسيك والمودرن المعقدة.",
        "تركيب الرخام الإيطالي الطبيعي والبورسلان والباركيه عالي المتانة.",
        "نجارة وتفصيل الأبواب، الخزائن، والمطابخ بأخشاب السنديان والجوز الطبيعي.",
        "تنفيذ أصباغ الجدران الفاخرة المقاومة للرطوبة والماء."
      ],
      tag: "تنفيذ واقعي"
    },
    {
      icon: <CheckSquare className="w-8 h-8 text-[#d4af37]" />,
      title: "الإشراف الهندسي (Engineering Supervision)",
      subtitle: "الالتزام التام والضمير المهني الصارم",
      desc: "تفادي الأخطاء الإنشائية والتنفيذية يحتاج إلى عين خبيرة وواعية. فريق الإشراف الهندسي في رويال جروب يتواجد بشكل دوري أو يومي في الموقع لضبط جودة العمل، ومراقبة تمديدات السباكة والكهرباء، واختبار ضغط الخرسانة وعزل الحمامات المائي لمنع المشاكل المستقبلية.",
      deliverables: [
        "استلام الأعمال الفنية والتشطيبات خطوة بخطوة ومطابقتها للمواصفات.",
        "اختبار عزل الرطوبة والمياه في الحمامات والمطابخ لضمان سلامتها.",
        "التنسيق الكامل واليومي بين الفنيين والمقاولين في موقع العمل.",
        "تسليم العميل تقارير أسبوعية مصورة عن حجم التقدم وجودة الإنجاز."
      ],
      tag: "إشراف هندسي"
    }
  ];

  return (
    <div className="bg-[#faf9f6] py-16 space-y-24" dir="rtl">
      {/* 1. Header Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#171714] rounded-3xl p-12 md:p-20 text-center overflow-hidden border border-[#d4af37]/20">
          <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200')] bg-cover bg-center opacity-25"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#171714] via-[#171714]/80 to-transparent z-10"></div>
          
          <div className="relative z-20 space-y-4">
            <span className="text-[#d4af37] text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              خدمات هندسية متكاملة
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white font-sans tracking-tight">الخدمات والمواصفات الفنية</h1>
            <p className="text-gray-400 text-xs md:text-sm max-w-lg mx-auto font-sans leading-relaxed">
              رويال جروب ترافقك خطوة بخطوة من الفكرة والمخطط وحتى تدوير المفتاح واستلام مساحتك الفاخرة متكاملة وجاهزة للسكن.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Detailed Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {serviceDetails.map((serv, index) => (
          <div 
            key={index}
            className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-start p-8 md:p-12 rounded-3xl border border-[#d4af37]/10 bg-white shadow-sm ${
              index % 2 !== 0 ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* Left Info Column (7 Cols) */}
            <div className={`lg:col-span-7 space-y-6 text-right ${index % 2 !== 0 ? 'lg:order-2' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="px-3.5 py-1.5 bg-[#d4af37]/10 text-[#d4af37] text-[10px] font-black tracking-wider rounded uppercase">
                  {serv.tag}
                </span>
                <span className="text-2xl font-black font-serif text-gray-200">0{index + 1}</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-gray-900 font-sans">{serv.title}</h2>
                <p className="text-sm font-semibold text-[#d4af37] font-sans">{serv.subtitle}</p>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed text-justify font-sans">
                {serv.desc}
              </p>
              
              {/* Deliverables */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-900">مخرجات الخدمة والخرائط المسلمة:</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-500">
                  {serv.deliverables.map((del, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2 text-right">
                      <span className="w-2 h-2 rounded-full bg-[#d4af37] mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{del}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Graphic/Icon Column (5 Cols) */}
            <div className={`lg:col-span-5 flex items-center justify-center p-8 bg-[#171714] rounded-2xl border border-white/5 h-64 md:h-80 relative overflow-hidden ${
              index % 2 !== 0 ? 'lg:order-1' : ''
            }`}>
              <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08),transparent_70%)]"></div>
              <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                <div className="p-5 bg-white/5 rounded-2xl border border-[#d4af37]/30 text-[#d4af37] shadow-lg">
                  {serv.icon}
                </div>
                <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest font-mono">
                  ROYAL ENGINEERING STANDARD
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Assurance and Certifications */}
      <section className="bg-gradient-to-r from-[#171714] to-[#1e1e1a] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h3 className="text-2xl font-black text-white font-sans leading-tight">معايير الجودة الصارمة في رويال جروب</h3>
            <p className="text-gray-400 text-xs leading-relaxed text-justify md:text-center">
              نلتزم التزاماً كاملاً بتقديم خدمات خالية من العيوب الهندسية والجمالية. يتم اختبار ضغط الأنابيب والمياه قبل دفن الجدران، ويتم وزن الجبس والأبواب بالليزر لضمان الاستواء والزوايا الدقيقة (90 درجة). كما أننا لا نستخدم إلا خامات ومواد ممتازة ومقاومة لدرجات الحرارة العالية والرطوبة الشديدة في العراق.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-right">
              <div className="p-5 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
                <Shield className="w-5 h-5 text-[#d4af37]" />
                <h4 className="text-sm font-bold text-white">ضمان ضد العيوب الخفية</h4>
                <p className="text-[11px] text-gray-400">نمنح المالك ضماناً حقيقياً على تمديدات السباكة، الكهرباء، والأسقف الثانوية.</p>
              </div>
              <div className="p-5 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
                <Compass className="w-5 h-5 text-[#d4af37]" />
                <h4 className="text-sm font-bold text-white">مطابقة التصميم للتنفيذ</h4>
                <p className="text-[11px] text-gray-400">نلتزم بالدقة البالغة بحيث يأتي المشروع الواقعي مطابقاً تماماً للرندر 3D.</p>
              </div>
              <div className="p-5 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
                <Layout className="w-5 h-5 text-[#d4af37]" />
                <h4 className="text-sm font-bold text-white">تسليم مفتاح Turnkey</h4>
                <p className="text-[11px] text-gray-400">نهتم بكافة تفاصيل التنظيف الفني والتعقيم للمنزل قبل حضور المالك للاستلام.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
