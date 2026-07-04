/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, X, Database, Lock, Settings, PhoneCall } from 'lucide-react';
import { useFirebaseState } from './FirestoreStateContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSetup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenSetup }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isFirebaseConnected } = useFirebaseState();

  const navItems = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'about', label: 'من نحن' },
    { id: 'projects', label: 'المشاريع' },
    { id: 'before-after', label: 'قبل وبعد' },
    { id: 'color-lab', label: 'تجربة الألوان' },
    { id: 'services', label: 'الخدمات' },
    { id: 'request', label: 'طلب تصميم' },
    { id: 'track', label: 'تتبع طلبي' },
    { id: 'contact', label: 'تواصل معنا' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full" dir="rtl">
      {/* Main Bar */}
      <div className="bg-[#171714] border-b border-[#d4af37]/15 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="relative flex items-center justify-center w-11 h-11 rounded-lg border border-[#d4af37]/35 bg-gradient-to-b from-[#232320] to-[#141412] shadow-md shadow-[#d4af37]/5 group">
                <span className="text-[#d4af37] font-serif font-extrabold text-lg tracking-wider group-hover:scale-105 transition-transform">RG</span>
                <div className="absolute inset-0.5 rounded-md border border-[#d4af37]/10 pointer-events-none"></div>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-white font-black text-lg tracking-wide font-sans">ROYAL GROUP</span>
                <span className="text-[#d4af37] text-[10px] font-medium tracking-[0.2em] uppercase font-serif">Interior Design</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-1 xl:space-x-2 space-x-reverse">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 relative ${
                    activeTab === item.id
                      ? 'text-[#d4af37]'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                  {activeTab === item.id && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></span>
                  )}
                </button>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-4">
              <button 
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeTab === 'admin' || activeTab === 'admin-login' || activeTab === 'admin-dashboard'
                    ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]'
                    : 'border-white/10 hover:border-[#d4af37]/40 text-gray-400 hover:text-[#d4af37]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>لوحة التحكم</span>
              </button>

              <a 
                href="tel:07704679311"
                className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b8952b] text-[#171714] px-4.5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-[#d4af37]/10 transition-all duration-300"
              >
                <PhoneCall className="w-4 h-4 shrink-0" />
                <span>اتصل بنا</span>
              </a>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center gap-3">
              <button
                onClick={() => setActiveTab('admin')}
                className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white"
              >
                <Lock className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg border border-white/10 text-gray-300 hover:text-white focus:outline-none"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-white/5 bg-[#171714] px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`block w-full text-right px-4 py-3 rounded-lg text-base font-bold transition-all ${
                  activeTab === item.id
                    ? 'bg-[#d4af37]/10 text-[#d4af37] border-r-4 border-[#d4af37]'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
              {!isFirebaseConnected && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSetup();
                  }}
                  className="w-full text-center px-4 py-2.5 rounded-lg border border-[#d4af37]/40 text-[#d4af37] text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  <span>إعداد Firebase</span>
                </button>
              )}
              <a
                href="tel:07704679311"
                className="w-full text-center bg-[#d4af37] text-[#171714] px-4 py-3 rounded-lg text-base font-bold flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>اتصال هاتفي</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
