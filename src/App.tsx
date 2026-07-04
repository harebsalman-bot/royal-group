/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FirebaseStateProvider } from './components/FirestoreStateContext';
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
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { MessageSquare, Phone, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Auto Scroll to Top on Page navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

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
      case 'request':
        return <RequestDesign setActiveTab={setActiveTab} />;
      case 'track':
        return <TrackRequest />;
      case 'contact':
        return <Contact />;
      case 'admin':
      case 'admin-login':
        if (isAdminLoggedIn) {
          setActiveTab('admin-dashboard');
          return null;
        }
        return (
          <AdminLogin 
            onLoginSuccess={(success) => {
              if (success) {
                setIsAdminLoggedIn(true);
                setActiveTab('admin-dashboard');
              }
            }} 
          />
        );
      case 'admin-dashboard':
        if (!isAdminLoggedIn) {
          setActiveTab('admin-login');
          return null;
        }
        return (
          <AdminDashboard 
            onLogout={() => {
              setIsAdminLoggedIn(false);
              setActiveTab('home');
            }} 
          />
        );
      default:
        return <Home setActiveTab={setActiveTab} />;
    }
  };

  return (
    <FirebaseStateProvider>
      <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans select-none antialiased selection:bg-[#d4af37]/30 selection:text-[#171714]">
        {/* Connection & General Navbar */}
        <Navbar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenSetup={() => setIsSetupOpen(true)} 
          isAdminLoggedIn={isAdminLoggedIn}
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
    </FirebaseStateProvider>
  );
}
