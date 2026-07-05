/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { useAuth } from '../context/AuthContext'; // تم إضافة استيراد نظام المصادقة
import { 
  Plus, MessageSquare, Send, Paperclip, Shield, Users, Ticket as TicketIcon, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, Search, UserCheck, Check, FileText, Bell, Trash2, Edit,
  CheckCheck, Eye, Download, Volume2, ExternalLink
} from 'lucide-react';
import { TicketStatus } from '../types';

export const ProjectTickets: React.FC = () => {
  // 4. استبدال currentRole ببيانات المستخدم المصادق عليه
  const { user } = useAuth(); 
  const role = user?.role; // 'client' | 'engineer' | 'admin'

  const {
    tickets,
    engineers,
    messages,
    notifications,
    designRequests,
    bedroomSubmissions,
    addEngineer,
    updateEngineer,
    deleteEngineer,
    updateTicketStatus,
    assignTicket,
    sendTicketMessage,
    markMessagesAsRead,
    findOrCreateTicketByTrackingOrPhone
  } = useFirebaseState();

  // Client States
  const [clientSearchId, setClientSearchId] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [clientError, setClientError] = useState('');
  const [clientSuccess, setClientSuccess] = useState('');
  const [searchedRequest, setSearchedRequest] = useState<{
    id: string;
    requestNumber: string;
    status: string;
    type: string;
    assignedEngineerName?: string | null;
    ticketId?: string | null;
    createdAt?: number;
  } | null>(null);

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

  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; message: string } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const msgFileInputRef = useRef<HTMLInputElement>(null);

  const activeTicketMessages = messages.filter(m => m.ticketId === selectedTicketId);

  // 11. تصفية التذاكر بناءً على الدور
  const activeTickets = useMemo(() => {
    if (role === 'admin') {
      let result = tickets;
      if (adminStatusFilter !== 'all') result = result.filter(t => t.status === adminStatusFilter);
      if (adminSearchQuery.trim()) {
        const q = adminSearchQuery.toLowerCase();
        result = result.filter(t => t.clientName.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
      }
      return result;
    }

    if (role === 'engineer') {
      // المهندس يرى فقط التذاكر المسندة إليه
      return tickets.filter(t => t.assignedEngineerId === user?.id);
    }

    if (role === 'client') {
      // 5 & 6. العميل يرى فقط تذكرته المعتمدة الخاصة به
      if (selectedTicketId) {
        return tickets.filter(t => t.id === selectedTicketId && t.clientPhone === user?.phone);
      }
      return [];
    }

    return [];
  }, [tickets, role, user, adminStatusFilter, adminSearchQuery, selectedTicketId]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Handlers
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !user) return;
    if (!chatInput.trim() && chatFiles.length === 0) return;

    setIsSendingMessage(true);
    try {
      await sendTicketMessage({
        ticketId: selectedTicketId,
        senderId: user.id,
        senderName: user.name,
        senderRole: role as any,
        content: chatInput
      }, chatFiles);
      setChatInput('');
      setChatFiles([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // 8. قيود الإدارة فقط
  const handleStatusChange = async (status: TicketStatus) => {
    if (role !== 'admin' || !selectedTicketId) return;
    await updateTicketStatus(selectedTicketId, status);
  };

  const handleAssignEngineer = async (engineerId: string) => {
    if (role !== 'admin' || !selectedTicketId) return;
    const eng = engineers.find(e => e.id === engineerId);
    if (eng) await assignTicket(selectedTicketId, eng.id, eng.name);
  };

  const handleClientSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError('');
    const targetId = clientSearchId.trim();
    if (!targetId) return;

    try {
      const ticket = await findOrCreateTicketByTrackingOrPhone(targetId);
      if (ticket) {
        // التحقق من أن التذكرة تخص العميل الحالي فقط
        if (role === 'client' && ticket.clientPhone !== user?.phone) {
          setClientError('غير مصرح لك بالوصول لهذه التذكرة.');
          return;
        }
        setSelectedTicketId(ticket.id);
        setClientSuccess('تم العثور على التذكرة بنجاح.');
      } else {
        setClientError('لم يتم العثور على تذكرة بهذا الرقم.');
      }
    } catch (err) {
      setClientError('خطأ في البحث.');
    }
  };

  // Status badges mapping
  const getStatusBadge = (status: TicketStatus) => {
    const configs = {
      open: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'مفتوحة', icon: Clock },
      in_progress: { color: 'text-[#d4af37]', bg: 'bg-[#d4af37]/10', label: 'قيد المعالجة', icon: RefreshCw },
      under_review: { color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'مراجعة فنية', icon: FileText },
      closed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'مغلقة', icon: CheckCircle2 }
    };
    const config = configs[status] || configs.open;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color} border border-current/20`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#171714] text-[#d4af37] mb-4 border border-[#d4af37]/35 shadow-lg">
            <TicketIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">نظام تذاكر المشاريع</h1>
          <p className="text-sm text-gray-500 mt-2">مرحباً بك، {user?.name} ({role === 'admin' ? 'مدير النظام' : role === 'engineer' ? 'مهندس' : 'عميل'})</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Client Search */}
            {role === 'client' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#d4af37]" /> تتبع طلبك
                </h3>
                <form onSubmit={handleClientSearch} className="space-y-3">
                  <input
                    type="text"
                    placeholder="رقم التتبع RG-XXXXXX"
                    value={clientSearchId}
                    onChange={(e) => setClientSearchId(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-gray-50 border rounded-xl outline-none focus:ring-1 focus:ring-[#d4af37]"
                  />
                  <button type="submit" className="w-full py-2 bg-[#d4af37] text-[#171714] rounded-xl text-xs font-bold hover:bg-[#b8952b] transition-all">
                    فتح المحادثة
                  </button>
                </form>
                {clientError && <p className="mt-2 text-xs text-red-600 font-bold">{clientError}</p>}
              </div>
            )}

            {/* Admin: Engineer Management */}
            {role === 'admin' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#d4af37]" /> إدارة المهندسين
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {engineers.map(eng => (
                    <div key={eng.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border text-xs">
                      <span>{eng.name}</span>
                      <button onClick={() => { if(confirm('حذف؟')) deleteEngineer(eng.id) }} className="text-red-500 hover:bg-red-50 p-1 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {engineers.length === 0 && <p className="text-center text-gray-400 text-[10px]">لا يوجد مهندسين</p>}
                </div>
              </div>
            )}

            {/* Tickets List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TicketIcon className="w-5 h-5 text-[#d4af37]" /> {role === 'admin' ? 'كل التذاكر' : 'تذاكرك'}
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {activeTickets.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedTicketId === t.id ? 'bg-[#d4af37]/5 border-[#d4af37]' : 'bg-gray-50 border-gray-100'}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-[10px] font-bold">{t.id}</span>
                      {getStatusBadge(t.status)}
                    </div>
                    <p className="text-xs font-bold text-gray-800 truncate">{t.subject}</p>
                    <p className="text-[10px] text-gray-400 mt-1">العميل: {t.clientName}</p>
                  </div>
                ))}
                {activeTickets.length === 0 && <p className="text-center text-gray-400 text-xs py-4">لا توجد تذاكر حالياً.</p>}
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-8">
            {selectedTicket ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden flex flex-col h-[700px]">
                {/* Header */}
                <div className="bg-[#171714] text-white p-5 border-b border-[#d4af37]/20 flex justify-between items-center">
                  <div>
                    <h2 className="font-black text-lg">{selectedTicket.subject}</h2>
                    <p className="text-xs text-gray-400">العميل: {selectedTicket.clientName}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* 8 & 9. فقط الأدمن يعين المهندس */}
                    {role === 'admin' && (
                      <select
                        value={selectedTicket.assignedEngineerId || ''}
                        onChange={(e) => handleAssignEngineer(e.target.value)}
                        className="bg-white/10 text-xs border border-white/20 text-white rounded-lg px-2 py-1 outline-none"
                      >
                        <option value="">-- تعيين مهندس --</option>
                        {engineers.map(eng => <option key={eng.id} value={eng.id}>{eng.name}</option>)}
                      </select>
                    )}

                    {/* 7 & 8. فقط الأدمن يغلق أو يفتح التذكرة */}
                    {role === 'admin' && (
                      <button
                        onClick={() => handleStatusChange(selectedTicket.status === 'closed' ? 'open' : 'closed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${selectedTicket.status === 'closed' ? 'bg-blue-600' : 'bg-emerald-600'}`}
                      >
                        {selectedTicket.status === 'closed' ? <RefreshCw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        {selectedTicket.status === 'closed' ? 'إعادة فتح' : 'إغلاق التذكرة'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-grow overflow-y-auto p-5 space-y-4 bg-gray-50/50">
                  {activeTicketMessages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-semibold ${isMe ? 'bg-[#171714] text-white rounded-bl-none' : 'bg-white border text-gray-900 rounded-br-none'}`}>
                          <p className="text-[9px] opacity-60 mb-1">{msg.senderName}</p>
                          <p>{msg.content}</p>
                          <div className="text-[8px] mt-1 opacity-50 text-left">
                            {new Date(msg.createdAt).toLocaleTimeString('ar-EG')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t">
                  {selectedTicket.status === 'closed' ? (
                    <p className="text-center text-xs font-bold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">التذكرة مغلقة. لا يمكن إرسال رسائل.</p>
                  ) : (
                    <form onSubmit={handleSendChatMessage} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="اكتب رسالتك..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-grow px-4 py-2.5 bg-gray-50 border rounded-xl outline-none text-xs"
                      />
                      <button type="submit" disabled={isSendingMessage} className="p-2.5 bg-[#d4af37] text-[#171714] rounded-xl hover:bg-[#b8952b]">
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border shadow-xl p-8 text-center flex flex-col items-center justify-center h-[500px]">
                <MessageSquare className="w-12 h-12 text-gray-200 mb-4" />
                <h3 className="text-lg font-bold text-gray-400">يرجى اختيار تذكرة لبدء المتابعة</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};