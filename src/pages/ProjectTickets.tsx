/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { 
  Plus, MessageSquare, Send, Paperclip, User, Shield, Users, Ticket as TicketIcon, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, ChevronLeft, Search, UserCheck, Check, LogOut, FileText, Bell, Trash2, Edit,
  CheckCheck, Eye, Download, Volume2, Sparkles, ExternalLink
} from 'lucide-react';
import { Ticket, Engineer, Message, TicketStatus, TicketNotification } from '../types';

export const ProjectTickets: React.FC = () => {
  const {
    isFirebaseConnected,
    tickets,
    engineers,
    messages,
    notifications,
    designRequests,
    bedroomSubmissions,
    addEngineer,
    updateEngineer,
    deleteEngineer,
    createTicket,
    updateTicketStatus,
    assignTicket,
    sendTicketMessage,
    markMessagesAsRead,
    markNotificationAsRead,
    findOrCreateTicketByTrackingOrPhone
  } = useFirebaseState();

  // Roles: 'client', 'engineer', 'admin'
  const [currentRole, setCurrentRole] = useState<'client' | 'engineer' | 'admin'>('client');
  
  // Client States
  const [clientSearchId, setClientSearchId] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [clientError, setClientError] = useState('');
  const [clientSuccess, setClientSuccess] = useState('');

  // Engineer States
  const [activeEngineerId, setActiveEngineerId] = useState<string | null>(null);

  // Admin States
  const [engName, setEngName] = useState('');
  const [engEmail, setEngEmail] = useState('');
  const [engSpecialty, setEngSpecialty] = useState('');
  const [engPhone, setEngPhone] = useState('');
  const [isAddingEng, setIsAddingEng] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | TicketStatus>('all');

  const [editingEngineerId, setEditingEngineerId] = useState<string | null>(null);
  const [editEngName, setEditEngName] = useState('');
  const [editEngEmail, setEditEngEmail] = useState('');
  const [editEngSpecialty, setEditEngSpecialty] = useState('');
  const [editEngPhone, setEditEngPhone] = useState('');
  const [editEngActive, setEditEngActive] = useState(true);
  const [engineerSearchQuery, setEngineerSearchQuery] = useState('');

  // Chat/Messaging States
  const [chatInput, setChatInput] = useState('');
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // WhatsApp Business additions
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgFileInputRef = useRef<HTMLInputElement>(null);

  const activeTicketMessages = messages.filter(m => m.ticketId === selectedTicketId);

  // Helper to play a soft, luxurious mechanical beep notification (HTML5 AudioContext, no external files)
  const playNotificationSound = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, context.currentTime); // D5 note
      gain.gain.setValueAtTime(0.12, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.15);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.15);
    } catch (e) {
      console.warn("AudioContext playback blocked or failed:", e);
    }
  };

  // Track messages length to play sound & show toast when new messages are received from others
  const prevMessagesCountRef = useRef(activeTicketMessages.length);

  useEffect(() => {
    if (activeTicketMessages.length > prevMessagesCountRef.current) {
      const lastMsg = activeTicketMessages[activeTicketMessages.length - 1];
      if (lastMsg) {
        const user = getCurrentUserInfo();
        // Determine if it was sent by someone else
        const isMe = 
          (user && lastMsg.senderRole === user.role && lastMsg.senderId === user.id) ||
          (user && lastMsg.senderRole === 'admin' && user.role === 'admin') ||
          (user && lastMsg.senderRole === 'client' && user.role === 'client') ||
          (user && lastMsg.senderRole === 'engineer' && lastMsg.senderId === activeEngineerId);

        if (!isMe && lastMsg.senderName && !lastMsg.senderName.includes('نظام')) {
          playNotificationSound();
          setActiveToast({
            id: lastMsg.id,
            title: `رسالة جديدة من ${lastMsg.senderName}`,
            message: lastMsg.content || 'أرسل مرفقاً جديداً'
          });
          // Auto dismiss toast
          setTimeout(() => {
            setActiveToast(current => current?.id === lastMsg.id ? null : current);
          }, 4500);
        }
      }
    }
    prevMessagesCountRef.current = activeTicketMessages.length;
  }, [activeTicketMessages, activeEngineerId, currentRole]);

  // Real-Time Read Receipts (Mark messages as read when looking at them)
  useEffect(() => {
    if (selectedTicketId && markMessagesAsRead) {
      markMessagesAsRead(selectedTicketId, currentRole);
    }
  }, [selectedTicketId, activeTicketMessages.length, currentRole]);

  // Auto Scroll Chat to Bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedTicketId]);

  // Load client ticket ID from localStorage on mount or tab change
  useEffect(() => {
    const savedTicketId = localStorage.getItem('active_client_ticket_id');
    const forceClient = localStorage.getItem('force_client_role');
    if (savedTicketId) {
      if (forceClient === 'true' || currentRole !== 'client') {
        setCurrentRole('client');
        localStorage.removeItem('force_client_role');
      }
      setSelectedTicketId(savedTicketId);
      // Clean up so it doesn't force it forever if they want to clear or switch roles
      localStorage.removeItem('active_client_ticket_id');
    }
  }, [currentRole]);

  // If role changes, reset ticket selection to prevent cross-leakage in test mode
  useEffect(() => {
    setSelectedTicketId(null);
    if (currentRole === 'engineer' && engineers.length > 0 && !activeEngineerId) {
      setActiveEngineerId(engineers[0].id);
    }
  }, [currentRole, engineers]);

  // Helpers for identifying current user info
  const getCurrentUserInfo = () => {
    if (currentRole === 'admin') {
      return { id: 'admin', name: 'المدير العام', role: 'admin' as const };
    }
    if (currentRole === 'engineer' && activeEngineerId) {
      const eng = engineers.find(e => e.id === activeEngineerId);
      return eng ? { id: eng.id, name: `م. ${eng.name}`, role: 'engineer' as const, email: eng.email } : null;
    }
    if (currentRole === 'client') {
      const activeTicket = tickets.find(t => t.id === selectedTicketId);
      return activeTicket ? { id: 'client', name: activeTicket.clientName, role: 'client' as const } : { id: 'client', name: 'العميل', role: 'client' as const };
    }
    return null;
  };

  // Filtered tickets based on active role and selections
  const getFilteredTickets = () => {
    if (currentRole === 'admin') {
      let result = tickets;
      if (adminStatusFilter !== 'all') {
        result = result.filter(t => t.status === adminStatusFilter);
      }
      if (adminSearchQuery.trim()) {
        const query = adminSearchQuery.toLowerCase();
        result = result.filter(t => 
          t.id.toLowerCase().includes(query) || 
          t.clientName.toLowerCase().includes(query) || 
          t.clientPhone.includes(query) ||
          (t.assignedEngineerName && t.assignedEngineerName.toLowerCase().includes(query))
        );
      }
      return result;
    }

    if (currentRole === 'engineer') {
      if (!activeEngineerId) return [];
      const eng = engineers.find(e => e.id === activeEngineerId);
      if (!eng) return [];
      return tickets.filter(t => t.assignedEngineerId === eng.id);
    }

    // Client sees the one they searched/selected
    if (selectedTicketId) {
      const t = tickets.find(ticket => ticket.id === selectedTicketId);
      if (t) {
        const req = designRequests.find(r => r.id === t.requestId || r.requestNumber === t.trackingId);
        const sub = bedroomSubmissions.find(s => s.id === t.requestId || s.requestNumber === t.trackingId);
        if ((req && req.status === 'pending') || (sub && sub.status === 'pending')) {
          return [];
        }
        return [t];
      }
      return [];
    }

    return [];
  };

  const activeTickets = getFilteredTickets();
  
  const selectedTicket = (() => {
    if (!selectedTicketId) return undefined;
    const t = tickets.find(x => x.id === selectedTicketId);
    if (!t) return undefined;
    if (currentRole === 'client') {
      const req = designRequests.find(r => r.id === t.requestId || r.requestNumber === t.trackingId);
      const sub = bedroomSubmissions.find(s => s.id === t.requestId || s.requestNumber === t.trackingId);
      if ((req && req.status === 'pending') || (sub && sub.status === 'pending')) {
        return undefined;
      }
    }
    return t;
  })();

  // Active user unread notifications count
  const getUserNotifications = () => {
    const user = getCurrentUserInfo();
    if (!user) return [];
    if (user.role === 'admin') {
      return notifications.filter(n => n.recipientId === 'admin');
    }
    if (user.role === 'engineer' && 'email' in user) {
      return notifications.filter(n => n.recipientId === user.email);
    }
    if (user.role === 'client' && selectedTicketId) {
      return notifications.filter(n => n.recipientId === 'client' && n.ticketId === selectedTicketId);
    }
    return [];
  };

  const userNotifications = getUserNotifications();
  const unreadNotifsCount = userNotifications.filter(n => !n.read).length;

  // Handlers
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId) return;
    if (!chatInput.trim() && chatFiles.length === 0) return;

    const user = getCurrentUserInfo();
    if (!user) {
      alert('يرجى اختيار هويتك أولاً للإرسال (من شريط الصلاحيات العلوي)');
      return;
    }

    setIsSendingMessage(true);
    try {
      const msgPayload = {
        ticketId: selectedTicketId,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        content: chatInput
      };

      await sendTicketMessage(msgPayload, chatFiles);
      setChatInput('');
      setChatFiles([]);
      if (msgFileInputRef.current) msgFileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleAddEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!engName.trim() || !engEmail.trim() || !engSpecialty.trim() || !engPhone.trim()) {
      alert('يرجى ملء كافة بيانات حساب المهندس');
      return;
    }

    setIsAddingEng(true);
    try {
      await addEngineer({
        name: engName,
        email: engEmail.toLowerCase().trim(),
        specialty: engSpecialty,
        phone: engPhone
      });
      setEngName('');
      setEngEmail('');
      setEngSpecialty('');
      setEngPhone('');
      setIsAddingEng(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingEng(false);
    }
  };

  const handleUpdateEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEngineerId) return;
    if (!editEngName.trim() || !editEngEmail.trim() || !editEngPhone.trim()) {
      alert('يرجى ملء الاسم والبريد الإلكتروني والهاتف للمهندس');
      return;
    }

    try {
      await updateEngineer(editingEngineerId, {
        name: editEngName,
        email: editEngEmail.toLowerCase().trim(),
        specialty: editEngSpecialty,
        phone: editEngPhone,
        active: editEngActive
      });
      setEditingEngineerId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!selectedTicketId) return;
    try {
      await updateTicketStatus(selectedTicketId, status);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignEngineer = async (engineerId: string) => {
    if (!selectedTicketId) return;
    if (!engineerId) return;
    const eng = engineers.find(e => e.id === engineerId);
    if (!eng) return;

    try {
      await assignTicket(selectedTicketId, eng.id, eng.name);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClientSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');
    setClientSuccess('');
    const targetId = clientSearchId.trim();
    if (!targetId) return;

    try {
      // Check if target matches a pending design request or bedroom submission
      const q = targetId.toUpperCase();
      const isPendingRequest = designRequests.some(r => r.status === 'pending' && (r.id.toUpperCase() === q || (r.requestNumber && r.requestNumber.toUpperCase() === q) || r.phone === targetId));
      const isPendingBedroom = bedroomSubmissions.some(s => s.status === 'pending' && (s.id.toUpperCase() === q || (s.requestNumber && s.requestNumber.toUpperCase() === q) || s.clientPhone === targetId));

      if (isPendingRequest || isPendingBedroom) {
        setClientError('طلبكم الملكي تم استلامه بنجاح وهو الآن بانتظار موافقة الإدارة واعتماد المهندس المشرف لتفعيل غرفة الدردشة والدعم المباشر. يرجى المتابعة لاحقاً.');
        setSelectedTicketId(null);
        return;
      }

      const ticket = await findOrCreateTicketByTrackingOrPhone(targetId);
      if (ticket) {
        setSelectedTicketId(ticket.id);
        setClientSuccess('تم العثور على التذكرة/الطلب بنجاح والدخول إلى الغرفة الخاصة.');
      } else {
        setClientError('لم نتمكن من العثور على تذكرة أو طلب بهذا الرقم أو رقم الهاتف. يرجى مراجعة المدخلات.');
        setSelectedTicketId(null);
      }
    } catch (err) {
      console.error(err);
      setClientError('حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.');
    }
  };

  // Status badges mapping
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            مفتوحة
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            قيد المعالجة
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <FileText className="w-3.5 h-3.5" />
            قيد المراجعة الفنية
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            مغلقة / مكتملة
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] py-8 sm:py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        {/* TOP BRAND HERO BLOCK */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#171714] text-[#d4af37] mb-4 border border-[#d4af37]/35 shadow-lg">
            <TicketIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">نظام تذاكر المشاريع والمتابعة الفنية</h1>
          <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto font-medium">
            تواصل مباشر وحي مع المهندسين المشرفين على تصميم وتنفيذ ديكوراتك الداخلية. إدارة الصلاحيات، متابعة العقود، وحوار تفاعلي على مدار الساعة.
          </p>
        </div>

        {/* INTERACTIVE SIMULATOR / ROLE CHANGER HEADER */}
        <div className="bg-[#171714] rounded-2xl p-4 sm:p-5 mb-8 border border-[#d4af37]/20 shadow-2xl text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#d4af37] shrink-0" />
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#d4af37]">جهاز محاكاة الأدوار والصلاحيات (Royal Simulator)</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">تبديل الأدوار لاختبار تجربة العميل والمهندس المصمم والمسؤول الإداري بمرونة تامة.</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentRole('client')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                  currentRole === 'client'
                    ? 'bg-[#d4af37] text-[#171714] shadow-md shadow-[#d4af37]/20'
                    : 'bg-[#2a2a26] text-gray-300 hover:text-white hover:bg-[#34342f]'
                }`}
              >
                <User className="w-4 h-4" />
                بوابة العميل
              </button>
              
              <button
                onClick={() => setCurrentRole('engineer')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                  currentRole === 'engineer'
                    ? 'bg-[#d4af37] text-[#171714] shadow-md shadow-[#d4af37]/20'
                    : 'bg-[#2a2a26] text-gray-300 hover:text-white hover:bg-[#34342f]'
                }`}
              >
                <Users className="w-4 h-4" />
                بوابة المهندس المصمم
              </button>
              
              <button
                onClick={() => setCurrentRole('admin')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                  currentRole === 'admin'
                    ? 'bg-[#d4af37] text-[#171714] shadow-md shadow-[#d4af37]/20'
                    : 'bg-[#2a2a26] text-gray-300 hover:text-white hover:bg-[#34342f]'
                }`}
              >
                <Shield className="w-4 h-4" />
                لوحة الإدارة والمشرفين
              </button>
            </div>
          </div>

          {/* ACTIVE IDENTITY CONTEXT INFO */}
          <div className="border-t border-[#d4af37]/10 mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-gray-300 font-medium">
              <span>الهوية النشطة الحالية:</span>
              <span className="bg-[#d4af37]/15 text-[#d4af37] px-2.5 py-1 rounded-md font-bold">
                {currentRole === 'admin' && 'المدير العام (إدارة كاملة للمهندسين والتذاكر)'}
                {currentRole === 'engineer' && (
                  <div className="flex items-center gap-2">
                    <span>مهندس مصمم:</span>
                    <select
                      value={activeEngineerId || ''}
                      onChange={(e) => setActiveEngineerId(e.target.value)}
                      className="bg-[#2a2a26] border border-[#d4af37]/30 text-white rounded px-1.5 py-0.5 text-xs font-bold outline-none focus:border-[#d4af37]"
                    >
                      {engineers.length === 0 ? (
                        <option value="">(لم يتم إنشاء مهندسين بعد)</option>
                      ) : (
                        engineers.map(eng => (
                          <option key={eng.id} value={eng.id}>{eng.name} ({eng.specialty})</option>
                        ))
                      )}
                    </select>
                  </div>
                )}
                {currentRole === 'client' && 'عميل / زائر (تتبع، فتح تذكرة دعم فني، دردشة مرفقة)'}
              </span>
            </div>

            {/* UNREAD NOTIFICATIONS ALERT */}
            {unreadNotifsCount > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-full font-bold text-[11px] animate-bounce">
                <Bell className="w-3.5 h-3.5" />
                <span>لديك {unreadNotifsCount} إشعارات غير مقروءة في هذا الدور</span>
              </div>
            )}
          </div>
        </div>

        {/* MAIN SPLIT GRID CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SIDEBAR COLUMNS (4 of 12) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* CLIENT SECTION: Create or Look up */}
            {currentRole === 'client' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5 space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                    <TicketIcon className="w-5 h-5 text-[#d4af37]" />
                    متابعة وتتبع طلبك
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">أدخل رقم تتبع طلبك (الرقم التلقائي RG-XXXXXX) أو رقم هاتفك للانضمام مباشرة لغرفة المتابعة والمحادثة الخاصة مع كادر المهندسين.</p>
                </div>

                <div className="space-y-3">
                  <form onSubmit={handleClientSearch} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">رقم تتبع الطلب أو رقم الهاتف الفعال:</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="مثال: RG-000001 أو 0770..."
                          value={clientSearchId}
                          onChange={(e) => setClientSearchId(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] outline-none text-right font-semibold"
                        />
                        <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full py-2 bg-[#d4af37] text-[#171714] rounded-xl text-xs font-bold hover:bg-[#b8952b] transition-all"
                    >
                      دخول لغرفة المتابعة الخاصة
                    </button>
                  </form>
                </div>

                {clientError && (
                  <div className="p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-100 text-xs font-semibold flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500 mt-0.5" />
                    <span>{clientError}</span>
                  </div>
                )}

                {clientSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs font-semibold flex items-start gap-2 leading-relaxed">
                    <CheckCircle2 className="w-4.5 h-4.5 shrink-0 text-emerald-600 mt-0.5" />
                    <span>{clientSuccess}</span>
                  </div>
                )}
              </div>
            )}

            {/* ENGINEER SECTION: Selected active profile overview */}
            {currentRole === 'engineer' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#d4af37]" />
                    ملف المهندس النشط
                  </h3>
                </div>
                {activeEngineerId ? (
                  (() => {
                    const eng = engineers.find(e => e.id === activeEngineerId);
                    if (!eng) return <p className="text-xs text-gray-400">يرجى إضافة حساب مهندس أولاً من لوحة الإدارة.</p>;
                    return (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs space-y-2.5 font-semibold text-gray-700">
                        <div className="flex justify-between border-b border-gray-200/50 pb-2">
                          <span className="text-gray-400">الاسم واللقب:</span>
                          <span className="text-gray-900">{eng.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/50 pb-2">
                          <span className="text-gray-400">البريد المهني:</span>
                          <span className="text-gray-900">{eng.email}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/50 pb-2">
                          <span className="text-gray-400">التخصص الفني:</span>
                          <span className="text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded font-bold">{eng.specialty}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">رقم الموبايل:</span>
                          <span className="text-gray-900">{eng.phone}</span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-xs text-rose-500 font-bold bg-rose-50 p-3 rounded-xl border border-rose-100">
                    لا يوجد مهندسون مسجلون في النظام حالياً. يرجى التبديل لتبويب "لوحة الإدارة" وإضافة حساب مهندس لمباشرة العمل.
                  </p>
                )}
              </div>
            )}

            {/* ADMIN SECTION: Add Engineers & Quick Ticket Management Stats */}
            {currentRole === 'admin' && (
              <div className="space-y-8">
                
                {/* SYSTEM STATS GRID */}
                <div className="bg-[#171714] border border-[#d4af37]/25 rounded-2xl shadow-xl p-5 space-y-4 text-white">
                  <h3 className="font-bold text-base text-[#d4af37]">إحصائيات النظام والتذاكر</h3>
                  <div className="grid grid-cols-2 gap-3 text-center text-xs">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
                      <span className="text-neutral-400 block font-bold mb-1">إجمالي التذاكر</span>
                      <span className="text-2xl font-black text-[#d4af37]">{tickets.length}</span>
                    </div>
                    <div className="bg-blue-950/40 border border-blue-900/30 rounded-xl p-3">
                      <span className="text-blue-400 block font-bold mb-1">تذاكر مفتوحة</span>
                      <span className="text-2xl font-black text-blue-300">{tickets.filter(t => t.status === 'open').length}</span>
                    </div>
                    <div className="bg-amber-950/40 border border-amber-900/30 rounded-xl p-3">
                      <span className="text-amber-400 block font-bold mb-1">قيد المعالجة</span>
                      <span className="text-2xl font-black text-amber-300">{tickets.filter(t => t.status === 'in_progress').length}</span>
                    </div>
                    <div className="bg-emerald-950/40 border border-emerald-900/30 rounded-xl p-3">
                      <span className="text-emerald-400 block font-bold mb-1">المغلقة والمنتهية</span>
                      <span className="text-2xl font-black text-emerald-300">{tickets.filter(t => t.status === 'closed').length}</span>
                    </div>
                  </div>
                </div>

                {/* COMPREHENSIVE ENGINEER MANAGEMENT SECTION */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                    <div>
                      <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#d4af37]" />
                        إدارة المهندسين المصممين
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">تسجيل، تعديل، تنشيط وتعطيل كادر المهندسين والاطلاع على إحصاءاتهم.</p>
                    </div>
                    
                    {/* ENGINEER QUICK STATS */}
                    <div className="flex gap-2 text-[10px] font-bold">
                      <div className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg">
                        إجمالي المهندسين: {engineers.length}
                      </div>
                      <div className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
                        النشطين: {engineers.filter(e => e.active !== false).length}
                      </div>
                    </div>
                  </div>

                  {/* EDIT OR CREATE FORM CONTAINER */}
                  {editingEngineerId ? (
                    /* EDIT ENGINEER FORM */
                    <div className="bg-[#d4af37]/5 border border-[#d4af37]/25 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-xs text-[#b8952b] flex items-center gap-1.5">
                          <Edit className="w-4 h-4" />
                          تعديل حساب المهندس: {editEngName}
                        </h4>
                        <button 
                          onClick={() => setEditingEngineerId(null)}
                          className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                        >
                          إلغاء التعديل
                        </button>
                      </div>

                      <form onSubmit={handleUpdateEngineer} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold">
                        <div>
                          <label className="block text-gray-700 mb-1">الاسم الكامل:</label>
                          <input
                            type="text"
                            required
                            value={editEngName}
                            onChange={(e) => setEditEngName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[#d4af37]"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 mb-1">البريد الإلكتروني:</label>
                          <input
                            type="email"
                            required
                            value={editEngEmail}
                            onChange={(e) => setEditEngEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[#d4af37] text-left"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 mb-1">التخصص الدقيق:</label>
                          <input
                            type="text"
                            required
                            value={editEngSpecialty}
                            onChange={(e) => setEditEngSpecialty(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 mb-1">رقم الهاتف:</label>
                          <input
                            type="text"
                            required
                            value={editEngPhone}
                            onChange={(e) => setEditEngPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[#d4af37] text-left"
                          />
                        </div>

                        <div className="md:col-span-2 flex items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            id="editEngActive"
                            checked={editEngActive}
                            onChange={(e) => setEditEngActive(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-[#d4af37] focus:ring-[#d4af37]"
                          />
                          <label htmlFor="editEngActive" className="text-gray-800 font-bold cursor-pointer">
                            حساب المهندس نشط ومتاح لاستلام المشاريع والتذاكر
                          </label>
                        </div>

                        <div className="md:col-span-2">
                          <button
                            type="submit"
                            className="w-full py-2 bg-[#171714] text-[#d4af37] font-bold border border-[#d4af37]/30 rounded-xl hover:bg-[#20201c] transition-all"
                          >
                            حفظ وتحديث بيانات المهندس
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* ADD NEW ENGINEER FORM */
                    <details className="bg-gray-50 border border-gray-100 rounded-xl p-4 group" open={engineers.length === 0}>
                      <summary className="font-bold text-xs text-gray-800 flex items-center justify-between cursor-pointer outline-none select-none">
                        <span className="flex items-center gap-1.5">
                          <Plus className="w-4 h-4 text-[#d4af37]" />
                          تسجيل وإضافة مهندس مصمم جديد
                        </span>
                        <span className="text-[10px] text-[#d4af37] group-open:hidden">+ اضغط للتوسيع</span>
                        <span className="text-[10px] text-gray-400 hidden group-open:inline">- اضغط للإغلاق</span>
                      </summary>

                      <form onSubmit={handleAddEngineer} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-semibold mt-4 pt-4 border-t border-gray-200/50">
                        <div>
                          <label className="block text-gray-700 mb-1">اسم المهندس الثنائي:</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: المهندس أحمد جاسم"
                            value={engName}
                            onChange={(e) => setEngName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[#d4af37]"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 mb-1">البريد الإلكتروني المهني:</label>
                          <input
                            type="email"
                            required
                            placeholder="ahmed@royalgroup.com"
                            value={engEmail}
                            onChange={(e) => setEngEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[#d4af37] text-left"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 mb-1">التخصص الدقيق:</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: ديكورات داخلية وتصميم ثنائي وثلاثي الأبعاد"
                            value={engSpecialty}
                            onChange={(e) => setEngSpecialty(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[#d4af37]"
                          />
                        </div>

                        <div>
                          <label className="block text-gray-700 mb-1">رقم الهاتف الفعال:</label>
                          <input
                            type="text"
                            required
                            placeholder="0770..."
                            value={engPhone}
                            onChange={(e) => setEngPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-1 focus:ring-[#d4af37] text-left"
                          />
                        </div>

                        <div className="md:col-span-2 pt-1">
                          <button
                            type="submit"
                            disabled={isAddingEng}
                            className="w-full py-2.5 bg-[#171714] text-[#d4af37] border border-[#d4af37]/35 rounded-xl text-xs font-bold hover:bg-[#20201c] transition-all disabled:opacity-50"
                          >
                            {isAddingEng ? 'جاري الحفظ والتسجيل...' : 'تسجيل المهندس واعتماده في النظام'}
                          </button>
                        </div>
                      </form>
                    </details>
                  )}

                  {/* ENGINEERS DIRECTORY WITH FILTER & STATUS */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-gray-800">قائمة كادر مهندسي رويال جروب:</h4>
                      
                      {/* SEARCH BOX FOR DIRECTORY */}
                      <div className="relative w-full sm:w-64">
                        <input
                          type="text"
                          placeholder="ابحث بالاسم أو التخصص..."
                          value={engineerSearchQuery}
                          onChange={(e) => setEngineerSearchQuery(e.target.value)}
                          className="w-full pr-8 pl-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white"
                        />
                        <Search className="absolute right-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>

                    {engineers.length === 0 ? (
                      <p className="text-[11px] text-gray-400 text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">لا يوجد مهندسون مسجلون حالياً في النظام.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {engineers
                          .filter(eng => {
                            const q = engineerSearchQuery.toLowerCase();
                            return eng.name.toLowerCase().includes(q) || (eng.specialty && eng.specialty.toLowerCase().includes(q));
                          })
                          .map(eng => {
                            const busyCount = tickets.filter(t => t.assignedEngineerId === eng.id && t.status !== 'closed').length;
                            const isActive = eng.active !== false;

                            return (
                              <div key={eng.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all text-xs ${isActive ? 'bg-white border-gray-100 hover:border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-200/60 opacity-75'}`}>
                                <div className="text-right space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">{eng.name}</span>
                                    
                                    {/* ACTIVE / DISABLED BADGE */}
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                      {isActive ? 'نشط' : 'معطل'}
                                    </span>

                                    {busyCount > 0 && (
                                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black">
                                        يعمل على {busyCount} مشروع
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-500 font-medium">
                                    {eng.email} • {eng.specialty || 'تصميم عام'} • {eng.phone}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-1.5">
                                  {/* TOGGLE STATUS BUTTON */}
                                  <button
                                    onClick={() => {
                                      updateEngineer(eng.id, { active: !isActive });
                                    }}
                                    title={isActive ? "تعطيل حساب المهندس" : "تنشيط حساب المهندس"}
                                    className={`p-1.5 rounded-lg border text-xs transition-colors font-bold ${isActive ? 'text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'}`}
                                  >
                                    {isActive ? 'تعطيل' : 'تنشيط'}
                                  </button>

                                  {/* EDIT BUTTON */}
                                  <button
                                    onClick={() => {
                                      setEditingEngineerId(eng.id);
                                      setEditEngName(eng.name);
                                      setEditEngEmail(eng.email);
                                      setEditEngSpecialty(eng.specialty || '');
                                      setEditEngPhone(eng.phone);
                                      setEditEngActive(eng.active !== false);
                                    }}
                                    title="تعديل حساب المهندس"
                                    className="p-1.5 text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 rounded-lg transition-all"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  {/* DELETE BUTTON */}
                                  <button
                                    onClick={() => {
                                      if (confirm(`هل أنت متأكد نهائياً من حذف حساب المهندس [${eng.name}]؟`)) {
                                        deleteEngineer(eng.id);
                                      }
                                    }}
                                    title="حذف حساب المهندس"
                                    className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 border border-red-100 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* LIST OF ACTIVE TICKETS (Shared view depending on role query) */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <TicketIcon className="w-5 h-5 text-[#d4af37]" />
                  {currentRole === 'admin' ? 'جميع تذاكر النظام' : 'التذاكر الفعالة المتاحة'}
                </h3>
                <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeTickets.length} تذكرة
                </span>
              </div>

              {/* ADMIN STATUS CONTROLS FOR TICKETS LIST */}
              {currentRole === 'admin' && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="البحث بالعميل، بالرقم، بالمهندس..."
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      className="w-full pr-4 pl-10 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#d4af37]"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                    <button
                      onClick={() => setAdminStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-lg border transition-all ${
                        adminStatusFilter === 'all'
                          ? 'bg-[#171714] text-[#d4af37] border-[#d4af37]/35'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      onClick={() => setAdminStatusFilter('open')}
                      className={`px-2.5 py-1 rounded-lg border transition-all ${
                        adminStatusFilter === 'open'
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      مفتوحة
                    </button>
                    <button
                      onClick={() => setAdminStatusFilter('in_progress')}
                      className={`px-2.5 py-1 rounded-lg border transition-all ${
                        adminStatusFilter === 'in_progress'
                          ? 'bg-[#d4af37] text-[#171714] border-[#d4af37]'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      قيد المعالجة
                    </button>
                    <button
                      onClick={() => setAdminStatusFilter('closed')}
                      className={`px-2.5 py-1 rounded-lg border transition-all ${
                        adminStatusFilter === 'closed'
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      مغلقة
                    </button>
                  </div>
                </div>
              )}

              {/* THE TICKET SCROLLABLE LIST */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {activeTickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    <AlertCircle className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    {currentRole === 'client' 
                      ? 'ابحث عن تذكرتك باستخدام الرقم أعلاه لبدء المتابعة والدردشة.'
                      : 'لا توجد تذاكر متطابقة حالياً.'}
                  </div>
                ) : (
                  activeTickets.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer text-right transition-all hover:shadow-md ${
                        selectedTicketId === t.id
                          ? 'bg-[#d4af37]/5 border-[#d4af37] shadow-sm'
                          : 'bg-gray-50 border-gray-100 hover:bg-gray-100/70'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono font-bold text-xs text-gray-900">{t.id}</span>
                        {getStatusBadge(t.status)}
                      </div>
                      
                      <h4 className="font-bold text-xs text-gray-800 mt-2 line-clamp-1">{t.subject}</h4>
                      
                      <div className="flex justify-between items-center text-[10px] text-gray-400 mt-3 border-t border-gray-200/50 pt-2 font-semibold">
                        <span>العميل: {t.clientName}</span>
                        <span>
                          {t.assignedEngineerName ? `م. ${t.assignedEngineerName}` : 'بانتظار تعيين مهندس'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* MAIN CHAT AND INTERACTION PANEL (8 of 12) */}
          <div className="lg:col-span-8">
            
            {selectedTicket ? (
              
              /* SCREEN 2: ACTIVE TICKET DETAIL AND CHAT ROOM CONTAINER */
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden flex flex-col h-[700px]">
                
                {/* CHAT HEADER */}
                <div className="bg-[#171714] text-white p-5 border-b border-[#d4af37]/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs text-[#d4af37] bg-[#d4af37]/15 px-2.5 py-1 rounded-md font-bold">
                          {selectedTicket.id}
                        </span>
                        <h2 className="font-black text-lg text-white">{selectedTicket.subject}</h2>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-gray-300 font-medium">
                        <span>العميل: {selectedTicket.clientName}</span>
                        <span>رقم هاتف العميل: {selectedTicket.clientPhone}</span>
                        {selectedTicket.relatedRequestNumber && (
                          <span className="text-[#d4af37] bg-white/5 px-2 py-0.5 rounded border border-white/10 font-mono">
                            مرتبط بالطلب: {selectedTicket.relatedRequestNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {getStatusBadge(selectedTicket.status)}

                      {/* Admin-only Engineer Assignment Dropdown */}
                      {currentRole === 'admin' && (
                        <div className="flex items-center gap-2 bg-white/5 border border-white/15 px-3 py-1 rounded-xl">
                          <span className="text-xs text-[#d4af37] font-black">تعيين مهندس:</span>
                          <select
                            value={selectedTicket.assignedEngineerId || ''}
                            onChange={(e) => handleAssignEngineer(e.target.value)}
                            className="bg-[#171714] text-xs border border-white/10 text-white rounded-lg px-2.5 py-1 font-bold outline-none focus:border-[#d4af37]"
                          >
                            <option value="">-- اختر مهندس --</option>
                            {engineers.map(eng => (
                              <option key={eng.id} value={eng.id}>{eng.name} ({eng.specialty})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Ticket Reopen / Close action based on role */}
                      {(currentRole === 'admin' || (currentRole === 'engineer' && selectedTicket.assignedEngineerId === activeEngineerId)) && (
                        <div className="flex gap-1">
                          {selectedTicket.status !== 'closed' ? (
                            <button
                              onClick={() => handleStatusChange('closed')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              إغلاق التذكرة
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange('open')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              إعادة فتح التذكرة
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* THE CHAT MESSAGES PANEL */}
                <div className="flex-grow overflow-y-auto p-5 space-y-4 bg-gray-50/50">
                  
                  {/* ORIGINAL DESCRIPTION PRE-INFO */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-right">
                    <p className="text-[10px] text-gray-400 font-bold mb-1">وصف الطلب الأساسي المقدم من العميل:</p>
                    <p className="text-xs text-gray-700 leading-relaxed font-semibold">{selectedTicket.description}</p>
                    
                    {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <span className="text-[10px] text-gray-400 block font-bold mb-2">المرفقات الهندسية المرفقة بالطلب:</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedTicket.attachments.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 hover:border-[#d4af37] text-gray-700 rounded-lg text-[10px] font-bold transition-all"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-[#d4af37]" />
                              مخطط مرفق #{i + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACTIVE CHAT THREAD MESSAGES */}
                  {activeTicketMessages.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-xs font-bold bg-[#faf9f6]/30 rounded-2xl border border-dashed border-gray-200">
                      <MessageSquare className="w-10 h-10 mx-auto text-gray-300 mb-2.5 animate-bounce" />
                      <span>لا توجد رسائل دردشة فنية في هذه الغرفة الخاصة بعد.</span>
                    </div>
                  ) : (
                    activeTicketMessages.map((msg) => {
                      const isSystem = (msg.senderId === 'admin' && msg.senderName.includes('نظام')) || msg.senderName.includes('تنبيه');
                      
                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-4">
                            <div className="bg-[#171714] border border-[#d4af37]/25 text-white text-[10px] sm:text-xs font-bold px-4 py-2 rounded-xl text-center max-w-md shadow-lg flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                              <span className="text-gray-200">{msg.content}</span>
                            </div>
                          </div>
                        );
                      }

                      // Check alignment
                      const isMe = 
                        (currentRole === 'admin' && msg.senderRole === 'admin') ||
                        (currentRole === 'engineer' && msg.senderId === activeEngineerId) ||
                        (currentRole === 'client' && msg.senderRole === 'client');

                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-start' : 'items-end'} mb-1`}>
                          
                          <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-sm text-right transition-all hover:shadow-md ${
                            isMe 
                              ? 'bg-[#171714] text-white rounded-bl-none border border-[#d4af37]/20' 
                              : 'bg-white border border-gray-100 text-gray-900 rounded-br-none'
                          }`}>
                            
                            {/* Sender Info Line */}
                            <p className={`text-[10px] font-black mb-1.5 flex items-center justify-between gap-2 ${isMe ? 'text-[#d4af37]' : 'text-gray-400'}`}>
                              <span>
                                {msg.senderName} ({
                                  msg.senderRole === 'admin' ? 'الإدارة' :
                                  msg.senderRole === 'engineer' ? 'المهندس المصمم' : 'العميل'
                                })
                              </span>
                            </p>

                            {/* Message content */}
                            {msg.content && (
                              <p className="text-xs sm:text-sm font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}

                            {/* Message Attachments: WhatsApp Style image & PDF rendering */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2.5 pt-2.5 border-t border-gray-100/10 space-y-2">
                                {msg.attachments.map((att, idx) => {
                                  // Determine file type
                                  const isImage = att.type?.includes('image') || 
                                                  att.url?.startsWith('data:image') ||
                                                  /\.(jpg|jpeg|png|gif|webp)/i.test(att.name || att.url || '');
                                                  
                                  const isPdf = att.type?.includes('pdf') || 
                                                /\.(pdf)/i.test(att.name || att.url || '');

                                  if (isImage) {
                                    return (
                                      <div key={idx} className="relative group overflow-hidden rounded-xl border border-[#d4af37]/25 max-w-full cursor-pointer bg-black/5 mt-2">
                                        <img 
                                          src={att.url} 
                                          alt={att.name || "صورة مرفقة"} 
                                          className="max-h-56 w-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                          <button
                                            type="button"
                                            onClick={() => setActivePreviewImage(att.url)}
                                            className="p-2 bg-[#171714] text-[#d4af37] border border-[#d4af37]/35 rounded-xl hover:bg-[#20201c] transition-colors"
                                            title="تكبير الصورة"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                          <a
                                            href={att.url}
                                            download={att.name || "royal_image.png"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 bg-[#171714] text-[#d4af37] border border-[#d4af37]/35 rounded-xl hover:bg-[#20201c] transition-colors"
                                            title="تحميل الصورة"
                                          >
                                            <Download className="w-4 h-4" />
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  }

                                  if (isPdf) {
                                    return (
                                      <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all mt-2 ${
                                        isMe 
                                          ? 'bg-neutral-900/80 border-[#d4af37]/30 text-white hover:bg-neutral-900' 
                                          : 'bg-[#faf9f6] border-gray-200 text-gray-800 hover:border-[#d4af37]/30'
                                      }`}>
                                        <div className="flex items-center gap-2.5">
                                          <div className="p-2.5 bg-red-600/10 text-red-500 rounded-lg">
                                            <FileText className="w-6 h-6 shrink-0" />
                                          </div>
                                          <div className="text-right">
                                            <p className="text-xs font-bold line-clamp-1 max-w-[150px] sm:max-w-[200px]">{att.name || 'مخطط PDF'}</p>
                                            <span className="text-[9px] text-gray-400 font-bold block mt-0.5">مستند PDF جاهز</span>
                                          </div>
                                        </div>
                                        <a
                                          href={att.url}
                                          download={att.name || "royal_document.pdf"}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-2 bg-[#d4af37]/15 text-[#d4af37] hover:bg-[#d4af37]/30 rounded-lg transition-colors"
                                          title="تحميل الملف"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </a>
                                      </div>
                                    );
                                  }

                                  // Generic fallback for other files
                                  return (
                                    <a
                                      key={idx}
                                      href={att.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`inline-flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border mt-2 ${
                                        isMe 
                                          ? 'bg-white/10 hover:bg-white/25 text-white border-white/10' 
                                          : 'bg-gray-50 border border-gray-100 text-gray-700 hover:border-[#d4af37]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Paperclip className="w-3.5 h-3.5 text-[#d4af37]" />
                                        <span className="line-clamp-1 max-w-[120px]">{att.name || `ملف مرفق ${idx + 1}`}</span>
                                      </div>
                                      <ExternalLink className="w-3 h-3 text-[#d4af37] mr-2" />
                                    </a>
                                  );
                                })}
                              </div>
                            )}

                            {/* Time & Read Status checkmarks integrated beautifully inside bubble bottom */}
                            <div className={`flex items-center justify-end gap-1.5 mt-2 text-[9px] font-bold ${
                              isMe ? 'text-gray-300' : 'text-gray-400'
                            }`}>
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                <span className="inline-flex items-center">
                                  {msg.read ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-[#d4af37]" title="قُرأت" />
                                  ) : (
                                    <CheckCheck className="w-3.5 h-3.5 text-gray-500" title="وُزعت" />
                                  )}
                                </span>
                              )}
                            </div>

                          </div>
                          
                        </div>
                      );
                    })
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* THE MESSAGE WRITER AND SENDING FOOTER */}
                <div className="p-4 bg-white border-t border-gray-100">
                  {selectedTicket.status === 'closed' ? (
                    <div className="bg-amber-50 text-amber-800 p-3.5 rounded-xl border border-amber-100 text-center text-xs font-bold flex items-center justify-center gap-2">
                      <AlertCircle className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                      <span>هذه التذكرة مغلقة حالياً. بإمكان مهندس التصميم أو المدير إعادة فتحها لمباشرة الحوار مجدداً.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSendChatMessage} className="space-y-3">
                      
                      {/* Typist text box */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => msgFileInputRef.current?.click()}
                          className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl border border-gray-200 transition-colors"
                          title="إرفاق ملف أو مخطط"
                        >
                          <Paperclip className="w-5 h-5" />
                        </button>
                        
                        <input
                          type="file"
                          ref={msgFileInputRef}
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              setChatFiles(Array.from(e.target.files));
                            }
                          }}
                        />

                        <input
                          type="text"
                          required
                          placeholder="اكتب رسالتك الفنية أو استفسارك هنا..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#d4af37] text-xs font-semibold text-gray-800"
                        />

                        <button
                          type="submit"
                          disabled={isSendingMessage}
                          className="p-3 bg-[#d4af37] text-[#171714] hover:bg-[#b8952b] rounded-xl transition-all shadow-md"
                        >
                          <Send className="w-5 h-5 shrink-0" />
                        </button>
                      </div>

                      {/* Chat Attachments list preview */}
                      {chatFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 text-[9px] font-bold">
                          {chatFiles.map((f, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#171714] text-white rounded-lg">
                              <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                              {f.name}
                              <button
                                type="button"
                                onClick={() => setChatFiles(prev => prev.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-600 font-bold pr-1 text-[11px]"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                    </form>
                  )}
                </div>

              </div>
            ) : (
              
              /* SCREEN 3: NO SELECTED TICKET WELCOME CARD */
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center flex flex-col items-center justify-center h-[500px]">
                <div className="w-20 h-20 rounded-full bg-[#faf9f6] flex items-center justify-center text-[#d4af37] border border-gray-100 mb-6">
                  <MessageSquare className="w-10 h-10" />
                </div>
                
                <h3 className="font-extrabold text-xl text-gray-900">مرحباً بك في نظام التذاكر والدردشة الفنية</h3>
                <p className="mt-3 text-sm text-gray-400 max-w-md mx-auto leading-relaxed font-semibold">
                  {currentRole === 'client' 
                    ? 'يتم إنشاء تذكرة وغرفة محادثة تلقائياً فور تقديم طلب تصميم أو نموذج غرفة النوم. يرجى إدخال رقم تتبع طلبك (RG-XXXXXX) أو رقم هاتفك في القائمة الجانبية للانضمام المباشر ومتابعة المهندس.'
                    : currentRole === 'engineer'
                    ? 'يرجى اختيار أحد التذاكر المسندة إليك من القائمة لمباشرة المحادثة مع العميل أو مراجعة المخططات الهندسية الخاصة به.'
                    : 'بصفتك مديراً، يرجى اختيار تذكرة من شريط التحكم لمشاهدة تفاصيل الدردشة وإدارتها وتعيين المهندسين.'}
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* WhatsApp style Fullscreen Image Lightbox Modal */}
      {activePreviewImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setActivePreviewImage(null)}
        >
          <div className="absolute top-4 left-4 flex items-center gap-3">
            <a
              href={activePreviewImage}
              download="royal_design.png"
              target="_blank"
              rel="noreferrer"
              className="p-3 bg-neutral-900 text-[#d4af37] border border-[#d4af37]/30 rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-2 text-xs font-bold"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-4 h-4" />
              <span>تحميل الصورة</span>
            </a>
            <button 
              onClick={() => setActivePreviewImage(null)}
              className="p-3 bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors text-xs font-bold"
            >
              إغلاق ×
            </button>
          </div>
          
          <img 
            src={activePreviewImage} 
            alt="Royal Group Design Zoomed" 
            className="max-h-[85vh] max-w-full object-contain rounded-2xl border border-[#d4af37]/45 shadow-2xl"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* In-app Instant WhatsApp Banner Notification Toast */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#171714] border-2 border-[#d4af37] text-white p-4 rounded-2xl shadow-2xl max-w-sm w-full flex items-start gap-3 text-right">
          <div className="p-2.5 bg-[#d4af37]/15 text-[#d4af37] rounded-xl shrink-0 mt-0.5">
            <Volume2 className="w-5 h-5" />
          </div>
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#d4af37] font-black tracking-widest uppercase">تنبيه فوري</span>
              <button 
                onClick={() => setActiveToast(null)}
                className="text-gray-400 hover:text-white font-extrabold text-xs"
              >
                ×
              </button>
            </div>
            <h4 className="text-xs font-bold text-white mt-1">{activeToast.title}</h4>
            <p className="text-[11px] text-gray-300 mt-1 line-clamp-2 leading-relaxed">{activeToast.message}</p>
          </div>
        </div>
      )}

    </div>
  );
};
