/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { 
  Plus, MessageSquare, Send, Paperclip, User, Shield, Users, Ticket as TicketIcon, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, ChevronLeft, Search, UserCheck, Check, LogOut, FileText, Bell, Trash2
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
    deleteEngineer,
    createTicket,
    updateTicketStatus,
    assignTicket,
    sendTicketMessage,
    markNotificationAsRead
  } = useFirebaseState();

  // Roles: 'client', 'engineer', 'admin'
  const [currentRole, setCurrentRole] = useState<'client' | 'engineer' | 'admin'>('client');
  
  // Client States
  const [clientSearchId, setClientSearchId] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isOpeningNewTicket, setIsOpeningNewTicket] = useState(false);
  const [newTicketName, setNewTicketName] = useState('');
  const [newTicketPhone, setNewTicketPhone] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketRequestNum, setNewTicketRequestNum] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [newTicketFiles, setNewTicketFiles] = useState<File[]>([]);
  const [isCreating, setIsCreating] = useState(false);
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

  // Chat/Messaging States
  const [chatInput, setChatInput] = useState('');
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgFileInputRef = useRef<HTMLInputElement>(null);

  // Auto Scroll Chat to Bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedTicketId]);

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
      return t ? [t] : [];
    }

    return [];
  };

  const activeTickets = getFilteredTickets();
  const selectedTicket = tickets.find(t => t.id === selectedTicketId);
  const activeTicketMessages = messages.filter(m => m.ticketId === selectedTicketId);

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
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');
    setClientSuccess('');

    if (!newTicketName.trim() || !newTicketPhone.trim() || !newTicketSubject.trim() || !newTicketDescription.trim()) {
      setClientError('يرجى ملء جميع الحقول الإجبارية الفعالة.');
      return;
    }

    setIsCreating(true);
    try {
      const ticketPayload = {
        clientName: newTicketName,
        clientPhone: newTicketPhone,
        subject: newTicketSubject,
        description: newTicketDescription,
        relatedRequestNumber: newTicketRequestNum.trim() || undefined
      };

      const created = await createTicket(ticketPayload, newTicketFiles);
      setClientSuccess(`تم إنشاء تذكرتك الفنية بنجاح برقم: ${created.id}. احتفظ بهذا الرقم لتتبع التحديثات والدردشة مع مهندس التصميم.`);
      
      // Reset form
      setNewTicketName('');
      setNewTicketPhone('');
      setNewTicketSubject('');
      setNewTicketRequestNum('');
      setNewTicketDescription('');
      setNewTicketFiles([]);
      setIsOpeningNewTicket(false);
      
      // Auto-select and load the newly created ticket chat room
      setSelectedTicketId(created.id);
    } catch (err: any) {
      setClientError('حدث خطأ أثناء تقديم التذكرة. يرجى المحاولة لاحقاً.');
    } finally {
      setIsCreating(false);
    }
  };

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

  const handleClientSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');
    const targetId = clientSearchId.trim().toUpperCase();
    if (!targetId) return;

    const found = tickets.find(t => t.id === targetId || t.clientPhone === targetId);
    if (found) {
      setSelectedTicketId(found.id);
      setClientSuccess('');
    } else {
      setClientError('لم نتمكن من العثور على تذكرة بهذا الرقم أو رقم الهاتف. يرجى مراجعة المدخلات.');
      setSelectedTicketId(null);
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
                    خيارات تذاكر العميل
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">ابدأ بفتح تذكرة فنية جديدة لمشروعك أو تتبع حالة تذكرة قيد المعالجة.</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setIsOpeningNewTicket(true);
                      setSelectedTicketId(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#171714] text-[#d4af37] border border-[#d4af37]/30 rounded-xl text-sm font-bold hover:bg-[#20201c] hover:text-white transition-all duration-300"
                  >
                    <Plus className="w-4 h-4" />
                    فتح تذكرة فنية ومتابعة جديدة
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-100"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-[11px] font-bold">أو تتبع تذكرة سابقة</span>
                    <div className="flex-grow border-t border-gray-100"></div>
                  </div>

                  <form onSubmit={handleClientSearch} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">رقم التذكرة أو رقم الهاتف الفعال:</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="مثال: RG-TKT-1001 أو 0770..."
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
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5 space-y-4">
                  <h3 className="font-bold text-base text-gray-900">إحصائيات التذاكر الفنية</h3>
                  <div className="grid grid-cols-2 gap-3 text-center text-xs">
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                      <span className="text-gray-400 block font-bold mb-1">إجمالي التذاكر</span>
                      <span className="text-2xl font-black text-gray-900">{tickets.length}</span>
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                      <span className="text-blue-500 block font-bold mb-1">المفتوحة</span>
                      <span className="text-2xl font-black text-blue-700">{tickets.filter(t => t.status === 'open').length}</span>
                    </div>
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
                      <span className="text-[#d4af37] block font-bold mb-1">قيد المعالجة</span>
                      <span className="text-2xl font-black text-[#b8952b]">{tickets.filter(t => t.status === 'in_progress').length}</span>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                      <span className="text-emerald-500 block font-bold mb-1">المغلقة</span>
                      <span className="text-2xl font-black text-emerald-700">{tickets.filter(t => t.status === 'closed').length}</span>
                    </div>
                  </div>
                </div>

                {/* CREATE ENGINEER ACCOUNT FORM */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-[#d4af37]" />
                      إنشاء حساب مهندس مصمم
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1">توليد حسابات للمهندسين ليتمكنوا من متابعة وإسناد تذاكر العملاء.</p>
                  </div>

                  <form onSubmit={handleAddEngineer} className="space-y-3 text-xs font-semibold">
                    <div>
                      <label className="block text-gray-700 mb-1">اسم المهندس الثنائي:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: المهندس علي الكناني"
                        value={engName}
                        onChange={(e) => setEngName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-1">البريد الإلكتروني المهني:</label>
                      <input
                        type="email"
                        required
                        placeholder="ali@royalgroup.com"
                        value={engEmail}
                        onChange={(e) => setEngEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] text-left"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-1">التخصص الدقيق:</label>
                      <input
                        type="text"
                        required
                        placeholder="ديكورات داخلية، تصميم ثلاثي الأبعاد، إلخ"
                        value={engSpecialty}
                        onChange={(e) => setEngSpecialty(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37]"
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
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#d4af37] focus:border-[#d4af37] text-left"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAddingEng}
                      className="w-full py-2.5 bg-[#171714] text-[#d4af37] border border-[#d4af37]/35 rounded-xl text-xs font-bold hover:bg-[#20201c] transition-all disabled:opacity-50"
                    >
                      {isAddingEng ? 'جاري الحفظ والتسجيل...' : 'تسجيل المهندس واعتماده'}
                    </button>
                  </form>

                  {/* ACTIVE ENGINEERS LIST */}
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <h4 className="font-bold text-xs text-gray-800 mb-2.5">قائمة كادر مهندسي رويال:</h4>
                    {engineers.length === 0 ? (
                      <p className="text-[11px] text-gray-400 text-center">لا يوجد مهندسون نشطون حالياً.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {engineers.map(eng => (
                          <div key={eng.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{eng.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{eng.email} • {eng.specialty}</p>
                            </div>
                            <button
                              onClick={() => {
                                if (confirm('هل أنت متأكد من تعطيل وحذف حساب هذا المهندس؟')) {
                                  deleteEngineer(eng.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* LIST OF ACTIVE TICKETS (Shared view depending on role query) */}
            {!isOpeningNewTicket && (
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
            )}

          </div>

          {/* MAIN CHAT AND INTERACTION PANEL (8 of 12) */}
          <div className="lg:col-span-8">
            
            {/* SCREEN 1: CLIENT OPENING NEW TICKET */}
            {currentRole === 'client' && isOpeningNewTicket ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="font-black text-xl text-gray-900">فتح تذكرة دعم فني ومشروع جديدة</h2>
                    <p className="text-xs text-gray-400 mt-1">يرجى تعبئة كافة الحقول ليقوم كادر المهندسين بالاطلاع والتجاوب السريع.</p>
                  </div>
                  <button
                    onClick={() => setIsOpeningNewTicket(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    رجوع
                  </button>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-1.5">اسم العميل بالكامل <span className="text-rose-500">*</span>:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: صالح العراقي"
                        value={newTicketName}
                        onChange={(e) => setNewTicketName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#d4af37]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-1.5">رقم هاتف الواتساب الفعال <span className="text-rose-500">*</span>:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: 07704679311"
                        value={newTicketPhone}
                        onChange={(e) => setNewTicketPhone(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#d4af37] text-left"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-1.5">عنوان المشكلة / عنوان التذكرة <span className="text-rose-500">*</span>:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: تعديل أبعاد الصالة الرئيسية"
                        value={newTicketSubject}
                        onChange={(e) => setNewTicketSubject(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#d4af37]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-1.5">رقم طلب التصميم المرتبط (إن وجد):</label>
                      <select
                        value={newTicketRequestNum}
                        onChange={(e) => setNewTicketRequestNum(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#d4af37]"
                      >
                        <option value="">لا يوجد طلب تصميم سابق (تذكرة حرة)</option>
                        {designRequests.map(r => (
                          <option key={r.id} value={r.requestNumber}>
                            طلب معتمد: {r.requestNumber} ({r.projectType} - {r.name})
                          </option>
                        ))}
                        {bedroomSubmissions.map(b => (
                          <option key={b.id} value={b.requestNumber}>
                            نموذج غرف نوم: {b.requestNumber} (العميل: {b.clientName})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1.5">تفاصيل وشرح الملاحظات الفنية للمهندس المصمم <span className="text-rose-500">*</span>:</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="صف لنا بالتفصيل التعديلات، الاستفسار، أو المشكلة التي ترغب بمتابعتها مع مهندس رويال المختص..."
                      value={newTicketDescription}
                      onChange={(e) => setNewTicketDescription(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#d4af37] leading-relaxed resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1.5">إرفاق مخططات هندسية أو ملفات صور داعمة (اختياري):</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 hover:border-[#d4af37]/40 rounded-2xl p-5 text-center cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-all"
                    >
                      <Paperclip className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <span className="text-xs text-gray-500 block">اسحب وأفلت الملفات هنا، أو انقر للتصفح من جهازك</span>
                      <span className="text-[10px] text-gray-400 block mt-1">الملفات المدعومة: الصور والمخططات الهندسية PDF</span>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            setNewTicketFiles(Array.from(e.target.files));
                          }
                        }}
                      />
                    </div>

                    {newTicketFiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {newTicketFiles.map((file, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#171714] text-white rounded-lg text-[10px]">
                            <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                            {file.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="bg-[#d4af37] text-[#171714] font-black px-6 py-3 rounded-xl hover:bg-[#b8952b] transition-all flex items-center gap-2 shadow-lg shadow-[#d4af37]/10 disabled:opacity-50"
                    >
                      {isCreating ? 'جاري تقديم التذكرة لرويال...' : 'تقديم تذكرة المشروع والبدء'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpeningNewTicket(false)}
                      className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                    >
                      إلغاء الأمر
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedTicket ? (
              
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

                  {/* ADMIN ONLY: ASSIGN TICKET TO ENGINEERS DIRECTLY IN HEADER */}
                  {currentRole === 'admin' && (
                    <div className="border-t border-[#d4af37]/10 mt-4 pt-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-gray-300 font-bold">إسناد وتكليف المهندسين:</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedTicket.assignedEngineerId || ''}
                          onChange={(e) => handleAssignEngineer(e.target.value)}
                          className="bg-[#2a2a26] border border-[#d4af37]/35 text-white rounded-xl px-3 py-1.5 font-semibold text-xs outline-none focus:border-[#d4af37]"
                        >
                          <option value="">-- اختر مهندس للتصميم والمتابعة --</option>
                          {engineers.map(eng => (
                            <option key={eng.id} value={eng.id}>{eng.name} ({eng.specialty})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
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
                    <div className="text-center py-6 text-gray-400 text-xs">لا توجد رسائل دردشة فنية في هذه الغرفة الخاصة بعد.</div>
                  ) : (
                    activeTicketMessages.map((msg) => {
                      const isSystem = msg.senderId === 'admin' && msg.senderName.includes('نظام');
                      
                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-2">
                            <span className="bg-[#171714]/5 text-gray-500 text-[10px] font-bold px-3 py-1.5 rounded-full border border-gray-200/50 text-center max-w-md">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

                      // Check alignment
                      const isMe = 
                        (currentRole === 'admin' && msg.senderRole === 'admin') ||
                        (currentRole === 'engineer' && msg.senderId === activeEngineerId) ||
                        (currentRole === 'client' && msg.senderRole === 'client');

                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}>
                          
                          <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm text-right ${
                            isMe 
                              ? 'bg-[#171714] text-white rounded-bl-none' 
                              : 'bg-white border border-gray-100 text-gray-900 rounded-br-none'
                          }`}>
                            
                            {/* Sender Info Line */}
                            <p className={`text-[10px] font-black mb-1.5 ${isMe ? 'text-[#d4af37]' : 'text-gray-400'}`}>
                              {msg.senderName} ({
                                msg.senderRole === 'admin' ? 'الإدارة' :
                                msg.senderRole === 'engineer' ? 'المهندس المصمم' : 'العميل'
                              })
                            </p>

                            {/* Message content */}
                            <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                            {/* Message Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-3 border-t border-gray-100/20 pt-2.5 space-y-1.5">
                                {msg.attachments.map((att, idx) => (
                                  <a
                                    key={idx}
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                      isMe 
                                        ? 'bg-white/10 hover:bg-white/20 text-white' 
                                        : 'bg-gray-50 border border-gray-100 text-gray-700 hover:border-[#d4af37]'
                                    }`}
                                  >
                                    <Paperclip className="w-3 h-3 text-[#d4af37]" />
                                    <span>{att.name || `ملف مرفق ${idx + 1}`}</span>
                                  </a>
                                ))}
                              </div>
                            )}

                          </div>

                          {/* Time label */}
                          <span className="text-[9px] text-gray-400 mt-1 mx-1.5 font-semibold">
                            {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
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
                    ? 'يرجى فتح تذكرة فنية جديدة لمشروعك، أو إدخال رقم تذكرة سابقة في الشريط الجانبي الأيمن للانضمام لغرفة المحادثة الخاصة مع مهندس التصميم.'
                    : currentRole === 'engineer'
                    ? 'يرجى اختيار أحد التذاكر المسندة إليك من القائمة لمباشرة المحادثة مع العميل أو مراجعة المخططات الهندسية الخاصة به.'
                    : 'بصفتك مديراً، يرجى اختيار تذكرة من شريط التحكم لمشاهدة تفاصيل الدردشة وإدارتها وتعيين المهندسين.'}
                </p>

                {currentRole === 'client' && (
                  <button
                    onClick={() => setIsOpeningNewTicket(true)}
                    className="mt-6 px-6 py-3 bg-[#d4af37] text-[#171714] rounded-xl text-sm font-black hover:bg-[#b8952b] transition-all shadow-lg shadow-[#d4af37]/10 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    ابدأ بفتح تذكرة جديدة الآن
                  </button>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
