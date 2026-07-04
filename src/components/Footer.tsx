/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFirebaseState } from './FirestoreStateContext';
import { Phone, MessageSquare, MapPin, Sparkles, Instagram, Facebook, Youtube, Send } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const { companySettings, socialLinks } = useFirebaseState();

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="w-5 h-5" />;
      case 'facebook': return <Facebook className="w-5 h-5" />;
      case 'tiktok': return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.74-3.94-1.74-.22-.23-.42-.48-.6-.74v7.17c-.06 2.44-1.2 4.86-3.19 6.23-2.14 1.49-5.13 1.95-7.64 1.12-2.92-.96-5.11-3.89-4.99-7.01.12-3.48 2.92-6.57 6.4-6.84V12.2c-1.58.12-3.02 1.34-3.13 2.94-.14 1.93 1.4 3.73 3.32 3.84 1.73.09 3.37-1.15 3.55-2.87.03-1.02.01-2.04.02-3.06V0h.03z"/>
        </svg>
      );
      case 'youtube': return <Youtube className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <footer className="bg-[#0f0f0d] text-gray-400 pt-16 pb-12 border-t border-[#d4af37]/15" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Presentation */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-[#d4af37]/30 bg-[#171714]">
                <span className="text-[#d4af37] font-serif font-black text-base">RG</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-white font-extrabold text-base tracking-wide font-sans">ROYAL GROUP</span>
                <span className="text-[#d4af37] text-[9px] font-medium tracking-[0.2em] uppercase font-serif">Interior Design</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed text-justify">
              رويال جروب للتصميم الداخلي والتنفيذ. نصمم لك الفخامة والراحة التي تستحقها، بأعلى جودة وإشراف هندسي متكامل في بغداد وجميع مدن العراق.
            </p>
            {/* Social handles */}
            <div className="flex gap-3.5 pt-2">
              {Object.entries(socialLinks).map(([platform, url]) => {
                if (!url) return null;
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-[#1a1a17] text-gray-400 hover:text-[#d4af37] border border-white/5 hover:border-[#d4af37]/35 transition-all duration-300"
                    title={platform}
                  >
                    {getSocialIcon(platform)}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white tracking-widest border-r-2 border-[#d4af37] pr-3 font-sans">أقسام الموقع</h4>
            <ul className="space-y-2.5 text-xs text-right">
              <li>
                <button onClick={() => setActiveTab('home')} className="hover:text-[#d4af37] hover:pr-1 transition-all">الرئيسية</button>
              </li>
              <li>
                <button onClick={() => setActiveTab('about')} className="hover:text-[#d4af37] hover:pr-1 transition-all">من نحن</button>
              </li>
              <li>
                <button onClick={() => setActiveTab('projects')} className="hover:text-[#d4af37] hover:pr-1 transition-all">مشاريعنا</button>
              </li>
              <li>
                <button onClick={() => setActiveTab('before-after')} className="hover:text-[#d4af37] hover:pr-1 transition-all">قبل وبعد</button>
              </li>
              <li>
                <button onClick={() => setActiveTab('color-lab')} className="hover:text-[#d4af37] hover:pr-1 transition-all">مختبر تجربة الألوان</button>
              </li>
              <li>
                <button onClick={() => setActiveTab('services')} className="hover:text-[#d4af37] hover:pr-1 transition-all">الخدمات الهندسية</button>
              </li>
            </ul>
          </div>

          {/* Services Quicklist */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white tracking-widest border-r-2 border-[#d4af37] pr-3 font-sans">خدماتنا</h4>
            <ul className="space-y-2.5 text-xs text-gray-500">
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-[#d4af37]" />
                <span>التصميم الداخلي الفاخر</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-[#d4af37]" />
                <span>التصاميم المعمارية ثلاثية الأبعاد 3D</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-[#d4af37]" />
                <span>التنفيذ المتكامل وتسليم المفتاح</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-[#d4af37]" />
                <span>الإشراف الهندسي الدقيق على المواقع</span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white tracking-widest border-r-2 border-[#d4af37] pr-3 font-sans">معلومات الاتصال</h4>
            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3 text-right">
                <MapPin className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{companySettings.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a href={`tel:${companySettings.phone}`} className="hover:text-[#d4af37] tracking-wide">{companySettings.phone}</a>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-[#d4af37] shrink-0" />
                <a 
                  href={`https://wa.me/${companySettings.whatsapp.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-[#d4af37] tracking-wide"
                >
                  الواتساب: {companySettings.whatsapp}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Copyright & Branding */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <div>
            &copy; {new Date().getFullYear()} رويال جروب للتصميم الداخلي والتنفيذ. جميع الحقوق محفوظة.
          </div>
          <div className="flex items-center gap-1.5 text-[10px] tracking-wider uppercase text-gray-500 font-medium">
            <span>Designed with Luxury</span>
            <Sparkles className="w-3 h-3 text-[#d4af37] animate-pulse" />
            <span>by Royal Studio</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
