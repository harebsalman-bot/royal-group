/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { Phone, MessageSquare, MapPin, Sparkles, Send, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Contact: React.FC = () => {
  const { companySettings } = useFirebaseState();
  const [visitorName, setVisitorName] = useState('');
  const [visitorMsg, setVisitorMsg] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorMsg.trim()) return;
    
    // In demo mode or connected mode, show successful feedback
    setIsSent(true);
    setVisitorName('');
    setVisitorMsg('');
    setTimeout(() => setIsSent(false), 5000);
  };

  return (
    <div className="bg-[#faf9f6] py-16 space-y-20" dir="rtl">
      {/* 1. Header Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-[#d4af37] text-xs font-bold tracking-widest uppercase flex justify-center items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          المكتب الرئيسي وقنوات التواصل
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-[#1e1e1a] font-sans tracking-tight">تـواصـل مـعـنـا</h1>
        <p className="text-gray-500 text-xs md:text-sm max-w-lg mx-auto font-sans leading-relaxed">
          تفضل بزيارة صالة عرضنا ومكتبنا الهندسي في بغداد، أو تواصل معنا عبر قنوات الاتصال المباشرة المفتوحة على مدار الساعة.
        </p>
      </section>

      {/* 2. Contact Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Phone Card */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center space-y-4 flex flex-col items-center">
            <div className="p-4 rounded-full bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 font-sans">الاتصال الهاتفي المباشر</h3>
            <p className="text-xs text-gray-500">متاحون للرد على استفساراتكم وحجز مواعيد الزيارات من الساعة 9:00 صباحاً وحتى 9:00 مساءً.</p>
            <a 
              href={`tel:${companySettings.phone}`} 
              className="text-base font-extrabold text-[#1e1e1a] hover:text-[#d4af37] transition-colors font-mono tracking-wide"
            >
              {companySettings.phone}
            </a>
          </div>

          {/* WhatsApp Card */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center space-y-4 flex flex-col items-center">
            <div className="p-4 rounded-full bg-green-50 text-green-600 border border-green-200">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 font-sans">مراسلة الواتساب الفورية</h3>
            <p className="text-xs text-gray-500">أرسل لنا تفاصيل مساحتك أو مخططاتك الهندسية ليرد عليك مهندس مختص بشكل فوري.</p>
            <a 
              href={`https://wa.me/${companySettings.whatsapp.replace(/\D/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold transition-all shadow-md shadow-green-600/10"
            >
              فتح محادثة واتساب
            </a>
          </div>

          {/* Address Card */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center space-y-4 flex flex-col items-center">
            <div className="p-4 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 font-sans">عنوان مكتبنا الرئيسي</h3>
            <p className="text-xs text-gray-500">يسعدنا استقبالكم في فرعنا لمناقشة تصاميم ومخططات منازلكم على فنجان قهوة دافئة.</p>
            <span className="text-xs font-bold text-gray-800 leading-relaxed max-w-[200px]">{companySettings.address}</span>
          </div>
        </div>
      </section>

      {/* 3. Map and Direct message (split screen) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Embedded Google Map (7 columns) */}
          <div className="lg:col-span-7 h-[400px] lg:h-auto min-h-[380px] rounded-3xl overflow-hidden shadow-lg border border-gray-200 relative">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13341.341517724395!2d44.36442653241513!3d33.28471835941913!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15577f15456fbd87%3A0xe54e6b568328766a!2zamFtaWEnIGFtdCBhbC10dWJ1bA!5e0!3m2!1sen!2siq!4v1719912000000!5m2!1sen!2siq" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="موقع رويال جروب في القادسية بغداد"
              className="absolute inset-0"
            />
          </div>

          {/* Quick Message Form (5 columns) */}
          <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-black text-gray-900 font-sans flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#d4af37]" />
                مراسلة سريعة للمكتب
              </h3>
              <p className="text-xs text-gray-500">دعنا نعرف من أنت، وسيتواصل معك مهندس علاقات العملاء في أقرب وقت.</p>
              
              <form onSubmit={handleSubmit} className="space-y-4 text-right pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600">الاسم الكريم</label>
                  <input 
                    type="text" 
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="اكتب اسمك الكريم"
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:border-[#d4af37] outline-none text-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600">رسالتك أو استفسارك</label>
                  <textarea 
                    rows={4}
                    required
                    value={visitorMsg}
                    onChange={(e) => setVisitorMsg(e.target.value)}
                    placeholder="اكتب تفاصيل استفسارك أو مساحة شقتك المطلوبة..."
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:border-[#d4af37] outline-none text-gray-900 resize-none"
                  />
                </div>
                
                <AnimatePresence>
                  {isSent && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3 bg-green-50 rounded-lg border border-green-200 text-green-800 text-[11px] flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
                      <span>تم استلام رسالتك! سيقوم مندوبنا بالتواصل معك.</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#171714] text-white hover:text-[#d4af37] text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>إرسال الرسالة</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
