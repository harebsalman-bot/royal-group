/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FirebaseStateProvider, useFirebaseState } from './components/FirestoreStateContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SetupWizard } from './components/SetupWizard';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Projects } from './pages/Projects';
import { BeforeAfterPage } from './pages/BeforeAfterPage';
import { ColorLab } from './components/ColorLab';
import { Services } from './pages/Services';
import { RequestDesign } from './pages/RequestDesign';
import { Contact } from './pages/Contact';
import { TrackRequest } from './pages/TrackRequest';
import { AIDesignAdvisor } from './pages/AIDesignAdvisor';
import { ProjectTickets } from './pages/ProjectTickets';
import { AdminLogin } from './pages/AdminLogin';
import { EngineerLogin } from './pages/EngineerLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { MessageSquare, Phone, Loader2 } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('royal_active_tab') || 'home';
  });
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  const { loading, currentUserRole, refreshUserSession, logout } = useFirebaseState();

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem('royal_active_tab', activeTab);
  }, [activeTab]);

  // Auto Scroll to Top on Page navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Handle automatic route redirects based on current user role safely
  useEffect(() => {
    if (!loading) {
      if (activeTab === 'admin-dashboard' && currentUserRole !== 'admin') {
        setActiveTab('admin-login');
      } else if (activeTab === 'admin-login' && currentUserRole === 'admin') {
        setActiveTab('admin-dashboard');
      } else if (activeTab === 'engineer-login' && currentUserRole === 'engineer') {
        setActiveTab('tickets');
      } else if (activeTab === 'tickets' && currentUserRole !== 'engineer' && currentUserRole !== 'admin') {
        setActiveTab('engineer-login');
      }
    }
  }, [loading, currentUserRole, activeTab]);

  // Full-screen luxury brand loader
  if (loading) {
    return (
      <div className="min-h-screen bg-[#141411] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl border border-[#d4af37]/25 bg-gradient-to-b from-[#232320] to-[#141412] shadow-2xl mb-6">
          <span className="text-[#d4af37] font-serif font-extrabold text-2xl tracking-wider animate-pulse">RG</span>
        </div>
        <div className="flex items-center gap-2.5 text-[#d4af37]/80 text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-[#d4af37]" />
          <span>جاري تحميل الجلسة والتحقق من الصلاحيات الآمنة...</span>
        </div>
      </div>
    );
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return <Home setActiveTab={setActiveTab} />;
      case 'about':
        return <About />;
      case 'projects':
        return <Projects />;
      case 'before-after':
        return <BeforeAfterPage />;
      case 'color-lab':
        return <ColorLab setActiveTab={setActiveTab} />;
      case 'services':
        return <Services />;
      case 'ai-advisor':
        return <AIDesignAdvisor setActiveTab={setActiveTab} />;
      case 'request':
        return <RequestDesign setActiveTab={setActiveTab} />;
      case 'track':
        return <TrackRequest setActiveTab={setActiveTab} />;
      case 'tickets':
        return <ProjectTickets />;
      case 'contact':
        return <Contact />;
      case 'admin':
      case 'admin-login':
        if (currentUserRole === 'admin') {
          setActiveTab('admin-dashboard');
          return null;
        } else if (currentUserRole === 'engineer') {
          setActiveTab('tickets');
          return null;
        }
        return (
          <AdminLogin 
            onLoginSuccess={(role) => {
              localStorage.setItem('royal_user_role', role);
              localStorage.setItem('royal_logged_in_user', JSON.stringify({ id: 'admin', name: 'المدير العام', email: 'harebsalman@gmail.com', role: 'admin' }));
              if (refreshUserSession) refreshUserSession();
              setActiveTab('admin-dashboard');
            }} 
          />
        );
      case 'engineer-login':
        if (currentUserRole === 'engineer') {
          setActiveTab('tickets');
          return null;
        } else if (currentUserRole === 'admin') {
          setActiveTab('admin-dashboard');
          return null;
        }
        return (
          <EngineerLogin 
            onLoginSuccess={(role, userObj) => {
              localStorage.setItem('royal_user_role', role);
              localStorage.setItem('royal_logged_in_user', JSON.stringify(userObj));
              if (refreshUserSession) refreshUserSession();
              setActiveTab('tickets');
            }} 
          />
        );
      case 'admin-dashboard':
        if (currentUserRole !== 'admin') {
          setActiveTab('admin-login');
          return null;
        }
        return (
          <AdminDashboard 
            onLogout={() => {
              logout();
            }} 
          />
        );
      default:
        return <Home setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans select-none antialiased selection:bg-[#d4af37]/30 selection:text-[#171714]">
      {/* Connection & General Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenSetup={() => setIsSetupOpen(true)} 
        isAdminLoggedIn={currentUserRole === 'admin'}
        userRole={currentUserRole}
      />

      {/* Dynamic Route Content */}
      <main className="flex-grow">
        {renderActivePage()}
      </main>

      {/* Brand Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Dynamic Firebase Connection Wizard */}
      <SetupWizard 
        isOpen={isSetupOpen} 
        onClose={() => setIsSetupOpen(false)} 
      />

      {/* Persistent Floating Quick Action Ring (Hidden on Admin screens for clean UI layout) */}
      {activeTab !== 'admin-dashboard' && activeTab !== 'admin-login' && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3.5" dir="rtl">
          {/* WhatsApp Floating button */}
          <a
            href="https://wa.me/07704679311"
            target="_blank"
            rel="noopener noreferrer"
            className="w-13 h-13 rounded-full bg-green-600 text-white flex items-center justify-center shadow-xl hover:bg-green-700 transition-all duration-300 hover:scale-105 active:scale-95 group relative border border-white/10"
            title="مراسلة سريعة عبر الواتساب"
          >
            <MessageSquare className="w-6 h-6 animate-pulse" />
            {/* Tooltip bubble */}
            <span className="absolute right-15 opacity-0 group-hover:opacity-100 bg-[#171714] text-white text-[10px] font-bold py-1.5 px-3 rounded-lg border border-[#d4af37]/30 shadow-2xl transition-opacity whitespace-nowrap pointer-events-none">
              مراسلة الواتساب الفورية
            </span>
          </a>

          {/* Direct Phone Call button */}
          <a
            href="tel:07704679311"
            className="w-13 h-13 rounded-full bg-[#171714] text-[#d4af37] flex items-center justify-center shadow-xl hover:bg-[#1e1e1a] hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 group relative border border-[#d4af37]/30"
            title="اتصال هاتفي مباشر"
          >
            <Phone className="w-5 h-5" />
            {/* Tooltip bubble */}
            <span className="absolute right-15 opacity-0 group-hover:opacity-100 bg-[#171714] text-white text-[10px] font-bold py-1.5 px-3 rounded-lg border border-[#d4af37]/30 shadow-2xl transition-opacity whitespace-nowrap pointer-events-none">
              اتصال هاتفي مباشر
            </span>
          </a>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <FirebaseStateProvider>
      <AppContent />
    </FirebaseStateProvider>
  );
}
