/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, X, Database, Lock, Settings, PhoneCall, ClipboardCheck, UserCheck } from 'lucide-react';
import { useFirebaseState } from './FirestoreStateContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSetup: () => void;
  isAdminLoggedIn?: boolean;
  userRole?: 'admin' | 'engineer' | 'client';
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenSetup, isAdminLoggedIn, userRole = 'client' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isFirebaseConnected, designRequests, bedroomSubmissions, tickets, engineers, logout } = useFirebaseState();

  // Real-time suspension check for logged-in engineers
  React.useEffect(() => {
    if (userRole === 'engineer' && engineers && engineers.length > 0) {
      const savedUserJson = localStorage.getItem('royal_logged_in_user');
      if (savedUserJson) {
        try {
          const loggedUser = JSON.parse(savedUserJson);
          if (loggedUser && loggedUser.email) {
            const currentEng = engineers.find(e => e.email.toLowerCase() === loggedUser.email.toLowerCase());
            if (currentEng && (currentEng.active === false || currentEng.status === 'disabled')) {
              console.warn("Account has been disabled by Admin. Signing out.");
              logout();
            }
          }
        } catch (e) {
          console.error("Error reading logged-in user for status check:", e);
        }
      }
    }
  }, [engineers, userRole, logout]);

  const navItems = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'about', label: 'من نحن' },
    { id: 'projects', label: 'المشاريع' },
    { id: 'before-after', label: 'قبل وبعد' },
    { id: 'color-lab', label: 'تجربة الألوان' },
    { id: 'ai-advisor', label: 'مستشار التصميم' },
    { id: 'services', label: 'الخدمات' },
    { id: 'request', label: 'طلب تصميم' },
    { id: 'track', label: 'تتبع طلبي' },
    { id: 'contact', label: 'تواصل معنا' }
  ];

  // Dynamically calculate active client request and status
  const getActiveRequestInfo = () => {
    const activeReqId = localStorage.getItem('active_client_request_id');
    const activeReqNum = localStorage.getItem('active_client_request_num');
    if (!activeReqId) return null;

    // Find the request in our database state
    const req = designRequests.find(r => r.id === activeReqId) || 
                bedroomSubmissions.find(s => s.id === activeReqId);

    // Find if there is an associated ticket in our database state
    const ticket = tickets.find(t => t.requestId === activeReqId || t.trackingId === activeReqNum);

    if (ticket) {
      if (ticket.status === 'closed') {
        return {
          status: 'completed',
          label: 'مكتمل',
          colorClass: 'bg-green-500/20 text-green-400 border border-green-500/30',
          targetTab: 'tickets',
          ticketId: ticket.id
        };
      }
      if (ticket.status === 'in_progress' || ticket.status === 'under_review') {
        return {
          status: 'in_progress',
          label: 'قيد التنفيذ',
          colorClass: 'bg-amber-500/20 text-[#d4af37] border border-[#d4af37]/30 animate-pulse',
          targetTab: 'tickets',
          ticketId: ticket.id
        };
      }
      return {
        status: 'approved',
        label: 'مقبول',
        colorClass: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        targetTab: 'tickets',
        ticketId: ticket.id
      };
    }

    if (req) {
      const s = req.status.toLowerCase();
      if (s === 'rejected') {
        return {
          status: 'rejected',
          label: 'مرفوض',
          colorClass: 'bg-red-500/20 text-red-400 border border-red-500/30',
          targetTab: 'track',
          ticketId: null
        };
      }
      if (s === 'approved' || s === 'completed') {
        return {
          status: 'approved',
          label: 'مقبول',
          colorClass: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
          targetTab: 'tickets',
          ticketId: null
        };
      }
      if (s === 'in progress' || s === 'in_progress') {
        return {
          status: 'in_progress',
          label: 'قيد التنفيذ',
          colorClass: 'bg-amber-500/20 text-[#d4af37] border border-[#d4af37]/30 animate-pulse',
          targetTab: 'tickets',
          ticketId: null
        };
      }
    }

    // Default to pending
    return {
      status: 'pending',
      label: 'قيد الانتظار',
      colorClass: 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30',
      targetTab: 'track',
      ticketId: null
    };
  };

  const activeRequestInfo = getActiveRequestInfo();

  const handleActiveRequestClick = (info: any) => {
    if (info.ticketId) {
      localStorage.setItem('active_client_ticket_id', info.ticketId);
      localStorage.setItem('force_client_role', 'true');
    }
    setActiveTab(info.targetTab);
  };

  const handleLogout = () => {
    logout();
  };

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
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 space-x-reverse">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 relative ${
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

              {activeRequestInfo && (
                <button
                  onClick={() => handleActiveRequestClick(activeRequestInfo)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border border-[#d4af37]/30 hover:border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37] hover:bg-[#d4af37]/15 cursor-pointer mr-2"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>طلبي الحالي</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${activeRequestInfo.colorClass}`}>
                    {activeRequestInfo.label}
                  </span>
                </button>
              )}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Admin Button */}
              {userRole !== 'engineer' && (
                <button 
                  onClick={() => {
                    if (userRole === 'admin') {
                      setActiveTab('admin-dashboard');
                    } else {
                      setActiveTab('admin-login');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    activeTab === 'admin-login' || activeTab === 'admin-dashboard'
                      ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]'
                      : 'border-white/10 hover:border-[#d4af37]/40 text-gray-400 hover:text-[#d4af37]'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>لوحة الإدارة</span>
                </button>
              )}

              {/* Engineer Button */}
              {userRole !== 'admin' && (
                <button 
                  onClick={() => {
                    if (userRole === 'engineer') {
                      setActiveTab('tickets');
                    } else {
                      setActiveTab('engineer-login');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    activeTab === 'engineer-login' || (activeTab === 'tickets' && userRole === 'engineer')
                      ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]'
                      : 'border-white/10 hover:border-[#d4af37]/40 text-gray-400 hover:text-[#d4af37]'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>بوابة المهندسين</span>
                </button>
              )}

              {userRole !== 'client' && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-red-500/20 hover:border-red-500 bg-red-500/10 text-red-400 hover:text-white transition-all cursor-pointer"
                  title="تسجيل الخروج"
                >
                  <span>خروج</span>
                </button>
              )}

              <a 
                href="tel:07704679311"
                className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b8952b] text-[#171714] px-4.5 py-2 rounded-lg text-sm font-bold shadow-lg shadow-[#d4af37]/10 transition-all duration-300"
              >
                <PhoneCall className="w-4 h-4 shrink-0" />
                <span>اتصل بنا</span>
              </a>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center gap-2">
              {userRole !== 'engineer' && (
                <button
                  onClick={() => {
                    if (userRole === 'admin') {
                      setActiveTab('admin-dashboard');
                    } else {
                      setActiveTab('admin-login');
                    }
                  }}
                  className={`p-2 rounded-lg border transition-all ${
                    activeTab === 'admin-login' || activeTab === 'admin-dashboard'
                      ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                      : 'border-white/10 text-gray-400'
                  }`}
                  title="لوحة الإدارة"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}

              {userRole !== 'admin' && (
                <button
                  onClick={() => {
                    if (userRole === 'engineer') {
                      setActiveTab('tickets');
                    } else {
                      setActiveTab('engineer-login');
                    }
                  }}
                  className={`p-2 rounded-lg border transition-all ${
                    activeTab === 'engineer-login' || (activeTab === 'tickets' && userRole === 'engineer')
                      ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10'
                      : 'border-white/10 text-gray-400'
                  }`}
                  title="بوابة المهندسين"
                >
                  <UserCheck className="w-4 h-4" />
                </button>
              )}

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

            {activeRequestInfo && (
              <button
                onClick={() => {
                  handleActiveRequestClick(activeRequestInfo);
                  setIsOpen(false);
                }}
                className="flex items-center justify-between w-full text-right px-4 py-3.5 rounded-xl text-base font-black border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37] transition-all"
              >
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#d4af37]" />
                  <span>طلبي الحالي</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${activeRequestInfo.colorClass}`}>
                  {activeRequestInfo.label}
                </span>
              </button>
            )}

            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
              {userRole !== 'client' && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-center px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <span>تسجيل الخروج من الحساب</span>
                </button>
              )}

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
