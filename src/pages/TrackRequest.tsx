/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { Search, Calendar, Phone, Clock, AlertTriangle, FileText, CheckCircle, RefreshCw, Star, XCircle, ArrowLeft, Loader2, Crown, MessageSquare, Sparkles } from 'lucide-react';
import { RequestStatus, RejectionReason } from '../types';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { getDb, isFirebaseReady } from '../firebase';

export interface TrackRequestProps {
  setActiveTab?: (tab: string) => void;
}

export const TrackRequest: React.FC<TrackRequestProps> = ({ setActiveTab }) => {
  const { designRequests, bedroomSubmissions, tickets, currentUserRole, currentUserId } = useFirebaseState();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFreshSubmission, setIsFreshSubmission] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  const unsubscribersRef = useRef<(() => void)[]>([]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
    };
  }, []);

  // Check for saved request in localStorage on mount to auto-track
  useEffect(() => {
    const savedReqId = localStorage.getItem('active_client_request_id');
    const savedReqNum = localStorage.getItem('active_client_request_num');
    const fresh = localStorage.getItem('active_client_request_fresh');

    if (fresh === 'true') {
      setIsFreshSubmission(true);
      localStorage.removeItem('active_client_request_fresh');
    }

    const queryStr = savedReqNum || savedReqId;
    if (queryStr) {
      setSearchQuery(queryStr);
      performTrackingSearch(queryStr);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryStr = searchQuery.trim();
    if (!queryStr) return;
    performTrackingSearch(queryStr);
  };

  const performTrackingSearch = (queryStr: string) => {
    const q = queryStr.trim();
    if (!q) return;

    // Clear previous real-time listeners
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    setSearched(true);
    setLoading(true);
    setIsUnauthorized(false);

    if (isFirebaseReady()) {
      try {
        const db = getDb();
        
        let localRequests: any[] = [];
        let localBedrooms: any[] = [];
        let unauthorizedReqs = new Set<string>();
        let unauthorizedBeds = new Set<string>();

        const updateResults = () => {
          // Combine and map
          const mappedRequests = localRequests.map(req => ({
            id: req.id,
            requestNumber: req.requestNumber || 'RG-PENDING',
            clientName: req.name,
            clientPhone: req.phone,
            projectType: req.projectType,
            date: req.createdAt,
            status: req.status,
            adminNotes: req.adminNotes,
            rejectionReason: req.rejectionReason,
            rejectionNotes: req.rejectionNotes,
            type: 'standard',
            details: req
          }));

          const mappedBedrooms = localBedrooms.map(sub => ({
            id: sub.id,
            requestNumber: sub.requestNumber || 'RG-PENDING',
            clientName: sub.clientName,
            clientPhone: sub.clientPhone,
            projectType: 'غرف نوم ملكية مخصصة',
            date: sub.createdAt,
            status: sub.status,
            adminNotes: sub.adminNotes,
            rejectionReason: sub.rejectionReason,
            rejectionNotes: sub.rejectionNotes,
            type: 'bedroom',
            details: sub
          }));

          // Sort by date descending and unique check by id
          const combined = [...mappedRequests, ...mappedBedrooms].sort((a, b) => b.date - a.date);
          const uniqueResultsMap = new Map<string, any>();
          combined.forEach(item => uniqueResultsMap.set(item.id, item));
          
          const finalResults = Array.from(uniqueResultsMap.values());
          setResults(finalResults);

          // If we found some matching records but they are all unauthorized for the current client,
          // flag isUnauthorized(true) and clear cached states.
          if (finalResults.length === 0 && (unauthorizedReqs.size > 0 || unauthorizedBeds.size > 0)) {
            setIsUnauthorized(true);
            localStorage.removeItem('active_client_request_id');
            localStorage.removeItem('active_client_request_num');
          } else {
            setIsUnauthorized(false);
          }

          setLoading(false);
        };

        const reqColl = collection(db, 'designRequests');
        const bedColl = collection(db, 'bedroomSubmissions');

        // We run 4 query listeners in parallel for robust real-time tracking:
        
        // 1. designRequests by Request Number
        const q1 = query(reqColl, where('requestNumber', '==', q), limit(20));
        const unsub1 = onSnapshot(q1, (snap) => {
          localRequests = localRequests.filter(r => r.requestNumber !== q);
          snap.forEach(docSnap => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const clientId = data.clientId;
            const isOwner = currentUserRole === 'admin' || (clientId && clientId === currentUserId);

            if (isOwner) {
              localRequests.push({ id: docId, ...data });
              unauthorizedReqs.delete(docId);
            } else {
              unauthorizedReqs.add(docId);
            }
          });
          updateResults();
        }, (err) => {
          console.error("Tracking listener error 1:", err);
          setLoading(false);
        });
        unsubscribersRef.current.push(unsub1);

        // 2. designRequests by Phone Number
        const q2 = query(reqColl, where('phone', '==', q), limit(20));
        const unsub2 = onSnapshot(q2, (snap) => {
          localRequests = localRequests.filter(r => r.phone !== q);
          snap.forEach(docSnap => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const clientId = data.clientId;
            const isOwner = currentUserRole === 'admin' || (clientId && clientId === currentUserId);

            if (isOwner) {
              localRequests.push({ id: docId, ...data });
              unauthorizedReqs.delete(docId);
            } else {
              unauthorizedReqs.add(docId);
            }
          });
          updateResults();
        }, (err) => {
          console.error("Tracking listener error 2:", err);
          setLoading(false);
        });
        unsubscribersRef.current.push(unsub2);

        // 3. bedroomSubmissions by Request Number
        const q3 = query(bedColl, where('requestNumber', '==', q), limit(20));
        const unsub3 = onSnapshot(q3, (snap) => {
          localBedrooms = localBedrooms.filter(b => b.requestNumber !== q);
          snap.forEach(docSnap => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const clientId = data.clientId;
            const isOwner = currentUserRole === 'admin' || (clientId && clientId === currentUserId);

            if (isOwner) {
              localBedrooms.push({ id: docId, ...data });
              unauthorizedBeds.delete(docId);
            } else {
              unauthorizedBeds.add(docId);
            }
          });
          updateResults();
        }, (err) => {
          console.error("Tracking listener error 3:", err);
          setLoading(false);
        });
        unsubscribersRef.current.push(unsub3);

        // 4. bedroomSubmissions by Phone Number
        const q4 = query(bedColl, where('clientPhone', '==', q), limit(20));
        const unsub4 = onSnapshot(q4, (snap) => {
          localBedrooms = localBedrooms.filter(b => b.clientPhone !== q);
          snap.forEach(docSnap => {
            const data = docSnap.data();
            const docId = docSnap.id;
            const clientId = data.clientId;
            const isOwner = currentUserRole === 'admin' || (clientId && clientId === currentUserId);

            if (isOwner) {
              localBedrooms.push({ id: docId, ...data });
              unauthorizedBeds.delete(docId);
            } else {
              unauthorizedBeds.add(docId);
            }
          });
          updateResults();
        }, (err) => {
          console.error("Tracking listener error 4:", err);
          setLoading(false);
        });
        unsubscribersRef.current.push(unsub4);

        // Fail-safe limit for loader
        setTimeout(() => {
          setLoading(false);
        }, 1500);

      } catch (err) {
        console.error("Failed to query live database:", err);
        setLoading(false);
      }
    } else {
      // Fallback/Demo mode check
      const queryLower = q.toLowerCase();
      const matchedRequests = designRequests.filter(req => {
        const numMatch = req.requestNumber?.toLowerCase().includes(queryLower);
        const phoneMatch = req.phone?.replace(/\s+/g, '').includes(queryLower.replace(/\s+/g, ''));
        const idMatch = req.id?.toLowerCase().includes(queryLower);
        return numMatch || phoneMatch || idMatch;
      });

      const matchedBedrooms = bedroomSubmissions.filter(sub => {
        const numMatch = sub.requestNumber?.toLowerCase().includes(queryLower);
        const phoneMatch = sub.clientPhone?.replace(/\s+/g, '').includes(queryLower.replace(/\s+/g, ''));
        const idMatch = sub.id?.toLowerCase().includes(queryLower);
        return numMatch || phoneMatch || idMatch;
      });

      let unauthorizedFound = false;

      const filteredRequests = matchedRequests.filter(req => {
        const isOwner = currentUserRole === 'admin' || (req.clientId && req.clientId === currentUserId);
        if (!isOwner) {
          unauthorizedFound = true;
          return false;
        }
        return true;
      });

      const filteredBedrooms = matchedBedrooms.filter(sub => {
        const isOwner = currentUserRole === 'admin' || (sub.clientId && sub.clientId === currentUserId);
        if (!isOwner) {
          unauthorizedFound = true;
          return false;
        }
        return true;
      });

      const mappedRequests = filteredRequests.map(req => ({
        id: req.id,
        requestNumber: req.requestNumber || 'RG-PENDING',
        clientName: req.name,
        clientPhone: req.phone,
        projectType: req.projectType,
        date: req.createdAt,
        status: req.status,
        adminNotes: req.adminNotes,
        rejectionReason: req.rejectionReason,
        rejectionNotes: req.rejectionNotes,
        type: 'standard',
        details: req
      }));

      const mappedBedrooms = filteredBedrooms.map(sub => ({
        id: sub.id,
        requestNumber: sub.requestNumber || 'RG-PENDING',
        clientName: sub.clientName,
        clientPhone: sub.clientPhone,
        projectType: 'غرف نوم ملكية مخصصة',
        date: sub.createdAt,
        status: sub.status,
        adminNotes: sub.adminNotes,
        rejectionReason: sub.rejectionReason,
        rejectionNotes: sub.rejectionNotes,
        type: 'bedroom',
        details: sub
      }));

      const combined = [...mappedRequests, ...mappedBedrooms].sort((a, b) => b.date - a.date);
      setResults(combined);

      if (combined.length === 0 && unauthorizedFound) {
        setIsUnauthorized(true);
        localStorage.removeItem('active_client_request_id');
        localStorage.removeItem('active_client_request_num');
      } else {
        setIsUnauthorized(false);
      }

      setLoading(false);
    }
  };

  const handleClearSavedRequest = () => {
    localStorage.removeItem('active_client_request_id');
    localStorage.removeItem('active_client_request_num');
    localStorage.removeItem('active_client_request_fresh');
    setSearchQuery('');
    setResults([]);
    setSearched(false);
    setIsFreshSubmission(false);
    setIsUnauthorized(false);
  };

  const getStatusText = (status: RequestStatus) => {
    switch (status) {
      case 'New':
      case 'pending':
        return 'جديد / بانتظار المراجعة';
      case 'Under Review':
      case 'reviewed':
        return 'قيد المراجعة الفنية';
      case 'Contacted':
        return 'تم التواصل مع الزبون';
      case 'Approved':
        return 'تمت الموافقة والاعتماد';
      case 'In Progress':
        return 'قيد التنفيذ والتركيب';
      case 'Completed':
        return 'مكتمل ومنجز بالكامل';
      case 'Rejected':
        return 'مرفوض';
      default:
        return status;
    }
  };

  const getStatusBadgeStyles = (status: RequestStatus) => {
    switch (status) {
      case 'New':
      case 'pending':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Under Review':
      case 'reviewed':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Contacted':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'In Progress':
        return 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/25 animate-pulse';
      case 'Completed':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  const getRejectionReasonArabic = (reason?: RejectionReason) => {
    switch (reason) {
      case 'Outside our scope':
        return 'خارج نطاق تخصصنا الفني والمكاني';
      case 'Missing project information':
        return 'نقص في تفاصيل أو قياسات المشروع البدئية';
      case 'Schedule fully booked':
        return 'جدول أعمال مهندسينا ممتلئ حالياً';
      case 'Budget mismatch':
        return 'الميزانية المقترحة لا تطابق معايير التنفيذ الملكي';
      case 'Other':
        return 'أسباب فنية وإدارية أخرى';
      default:
        return 'غير محدد';
    }
  };

  const getProjectTypeArabic = (type: string) => {
    const lowType = type.toLowerCase();
    if (lowType.includes('bedroom') || lowType.includes('غرف نوم')) return 'غرف نوم فاخرة';
    if (lowType.includes('kitchen') || lowType.includes('مطابخ')) return 'مطابخ مجهزة بالكامل';
    if (lowType.includes('dressing') || lowType.includes('ملابس')) return 'غرف ملابس ودريسنج';
    if (lowType.includes('wood') || lowType.includes('خشب')) return 'ديكورات وزخارف خشبية فاخرة';
    return type;
  };

  // Status timeline helper
  const renderTimeline = (currentStatus: RequestStatus) => {
    const steps: { key: RequestStatus; label: string }[] = [
      { key: 'New', label: 'الطلب جديد' },
      { key: 'Under Review', label: 'المراجعة والتدقيق' },
      { key: 'Contacted', label: 'الاتصال بالزبون' },
      { key: 'Approved', label: 'الموافقة المبدئية' },
      { key: 'In Progress', label: 'قيد التنفيذ الفعلي' },
      { key: 'Completed', label: 'التسليم النهائي' }
    ];

    if (currentStatus === 'Rejected') {
      return (
        <div className="bg-red-950/20 border border-red-900/45 p-4 rounded-2xl flex items-start gap-3 mt-4 text-right">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-black text-red-400">تم رفض هذا الطلب الملكي</h5>
            <p className="text-[11px] text-gray-300">نعتذر جداً لعدم تمكننا من المضي قدماً في طلبكم لهذا السبب.</p>
          </div>
        </div>
      );
    }

    // Determine current index to light up the path
    let currentIndex = steps.findIndex(s => s.key === currentStatus);
    if (currentIndex === -1) {
      if (currentStatus === 'pending') currentIndex = 0;
      else if (currentStatus === 'reviewed') currentIndex = 1;
      else currentIndex = 0;
    }

    return (
      <div className="pt-6 pb-2" dir="rtl">
        <h5 className="text-xs font-black text-white mb-4 text-right flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>مخطط تقدم مراحل طلبكم</span>
        </h5>
        
        {/* Desktop Step bar */}
        <div className="hidden md:grid grid-cols-6 gap-2 relative">
          <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#232320]" />
          <div 
            className="absolute top-4 right-4 h-0.5 bg-[#d4af37] transition-all duration-500" 
            style={{ width: `${(currentIndex / 5) * 100}%`, right: '16px' }}
          />
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCurrent 
                    ? 'bg-[#d4af37] border-[#d4af37] text-[#171714] shadow-lg shadow-[#d4af37]/20 scale-105'
                    : isCompleted
                      ? 'bg-[#171714] border-[#d4af37] text-[#d4af37]'
                      : 'bg-[#1c1c19] border-[#2d2d27] text-gray-600'
                }`}>
                  <span className="text-[11px] font-black">{idx + 1}</span>
                </div>
                <span className={`text-[10px] font-bold mt-2 transition-colors ${
                  isCurrent ? 'text-[#d4af37]' : isCompleted ? 'text-gray-300' : 'text-gray-500'
                }`}>{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Mobile Vertical bar */}
        <div className="md:hidden space-y-4 relative pr-4">
          <div className="absolute top-2 bottom-2 right-6 w-0.5 bg-[#232320]" />
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={step.key} className="flex items-center gap-4 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCurrent 
                    ? 'bg-[#d4af37] border-[#d4af37] text-[#171714] shadow shadow-[#d4af37]/25'
                    : isCompleted
                      ? 'bg-[#171714] border-[#d4af37] text-[#d4af37]'
                      : 'bg-[#1c1c19] border-[#2d2d27] text-gray-600'
                }`}>
                  <span className="text-[10px] font-black">{idx + 1}</span>
                </div>
                <span className={`text-xs font-bold transition-colors ${
                  isCurrent ? 'text-[#d4af37]' : isCompleted ? 'text-gray-300' : 'text-gray-500'
                }`}>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#141412] min-h-screen text-white pt-24 pb-16 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Fresh Submission Success Banner */}
        {isFreshSubmission && (
          <div className="bg-gradient-to-r from-emerald-950/40 to-[#171714] border-2 border-emerald-500/30 p-6 rounded-3xl flex items-start gap-4 text-right shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="absolute -left-6 -bottom-6 w-24 h-24 text-emerald-500/5 pointer-events-none">
              <Crown className="w-full h-full" />
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full shrink-0">
              <CheckCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>تم إرسال طلبك الفني الفاخر بنجاح!</span>
                <Sparkles className="w-4 h-4 text-[#d4af37] animate-pulse" />
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed max-w-2xl font-medium">
                لقد تم حفظ تفضيلاتك بنجاح في قاعدة بيانات رويال جروب، وجاري تحويلها مباشرة إلى نظام المراجعة لمهندسي الديكور. يمكنك البقاء في هذه الصفحة لمتابعة تحديث الحالة أو العودة إليها لاحقاً على نفس المتصفح.
              </p>
            </div>
          </div>
        )}

        {/* Decorative Header */}
        <div className="text-center space-y-3 relative">
          <div className="absolute inset-0 bg-radial-gradient from-[#d4af37]/10 to-transparent blur-3xl -z-10 h-44" />
          <span className="text-[#d4af37] font-serif font-extrabold tracking-wider text-xs border border-[#d4af37]/25 px-3 py-1 rounded-full uppercase">
            مكتب الاستفسار وتتبع الطلبات المباشرة
          </span>
          <h1 className="text-3xl md:text-4xl font-black font-sans tracking-tight text-white mt-1">
            تتبع حالة مشروعك الملكي
          </h1>
          <p className="text-xs text-gray-400 max-w-lg mx-auto leading-relaxed">
            أدخل رمز الاستمارة (مثال: RG-000001) أو رقم هاتفكم المحمول للاستعلام عن التحديثات المباشرة لطلبك من قبل مهندسي رويال جروب.
          </p>
        </div>

        {/* Search Engine Card */}
        <div className="bg-[#171714] rounded-3xl p-6 md:p-8 border border-[#d4af37]/15 shadow-2xl space-y-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <input
                type="text"
                required
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="أدخل رمز الطلب الفاخر (مثال: RG-000002) أو رقم هاتفك..."
                className="w-full bg-[#1c1c19] border border-[#d4af37]/25 hover:border-[#d4af37]/50 focus:border-[#d4af37] rounded-2xl py-4.5 pr-12 pl-4 text-xs font-bold text-white outline-none transition-all placeholder:text-gray-600 text-right shadow-inner"
              />
              <Search className="w-5 h-5 text-[#d4af37] absolute top-1/2 -translate-y-1/2 right-4 pointer-events-none" />
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="submit"
                className="px-8 py-4 bg-[#d4af37] hover:bg-[#b8952b] text-[#171714] rounded-2xl text-xs font-black tracking-wider transition-all shadow-lg shadow-[#d4af37]/10 shrink-0 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                بحث واستعلام
              </button>
              {searched && (
                <button
                  type="button"
                  onClick={handleClearSavedRequest}
                  className="px-4 py-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                  title="البحث عن طلب آخر"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Results Stream */}
        {searched && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#d4af37] border-r-2 border-[#d4af37] pr-2.5 mr-1 font-sans">
                نتائج الاستفسار {!loading && `(${results.length})`}
              </h3>
              {results.length > 0 && (
                <button
                  onClick={handleClearSavedRequest}
                  className="text-[10px] font-black text-gray-400 hover:text-[#d4af37] border border-gray-800 hover:border-[#d4af37]/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  تصفية النتائج والبحث مجدداً
                </button>
              )}
            </div>

            {loading ? (
              <div className="bg-[#171714] border border-[#d4af37]/10 rounded-3xl p-16 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-[#d4af37] mx-auto animate-spin" />
                <p className="text-xs text-gray-400">جاري البحث ومزامنة البيانات في الوقت الفعلي...</p>
              </div>
            ) : isUnauthorized ? (
              <div className="bg-gradient-to-br from-[#1c1212] to-[#171714] border-2 border-red-500/30 rounded-3xl p-12 text-center space-y-4 relative overflow-hidden">
                <div className="absolute -left-6 -bottom-6 w-24 h-24 text-red-500/5 pointer-events-none">
                  <XCircle className="w-full h-full" />
                </div>
                <XCircle className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-red-400">غير مصرح بالوصول لهذا الطلب</h4>
                  <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                    عذراً، هذا الطلب الملكي مسجل لعميل آخر. لا يمكنك استعراض بيانات تتبع هذا الطلب إلا باستخدام الحساب الأصلي الذي أرسل الاستمارة.
                  </p>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="bg-[#171714] border border-[#d4af37]/10 rounded-3xl p-12 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-[#d4af37]/50 mx-auto animate-bounce" />
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">عذراً، لم نجد أي تطابقات!</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                    تأكد من كتابة رمز تتبع الطلب بشكل صحيح (على صيغة RG-000001) أو رقم هاتفكم بدون مسافات أو رموز دولية زائدة.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {results.map((res) => {
                  // Real-time lookup of the associated ticket
                  const associatedTicket = tickets?.find(
                    t => t.requestId === res.id || t.sourceId === res.id || t.trackingId === res.requestNumber
                  );
                  const isApproved = res.status === 'Approved' || !!associatedTicket;

                  return (
                    <div 
                      key={res.id} 
                      className="bg-[#171714] border border-[#d4af37]/15 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden"
                    >
                      {/* Decorative Background Accent */}
                      <div className="absolute top-0 left-0 w-32 h-32 bg-radial-gradient from-[#d4af37]/5 to-transparent blur-2xl pointer-events-none" />
                      
                      {/* Upper Meta */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#d4af37]/10">
                        <div className="space-y-1 text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold tracking-widest bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 px-2.5 py-1 rounded">
                              {res.requestNumber}
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded ${getStatusBadgeStyles(res.status)}`}>
                              {getStatusText(res.status)}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white mt-1.5">{res.clientName}</h4>
                        </div>

                        <div className="text-left font-mono text-[11px] text-gray-400 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-[#d4af37]" />
                          <span>{new Date(res.date).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Detailed Information Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                        <div className="space-y-4">
                          <div className="bg-[#1c1c19] p-3.5 rounded-2xl border border-white/5 space-y-1">
                            <span className="text-[10px] font-bold text-[#d4af37]">نوع الطلب والتصميم المخصص</span>
                            <p className="text-xs text-white font-black">{getProjectTypeArabic(res.projectType)}</p>
                          </div>
                          <div className="bg-[#1c1c19] p-3.5 rounded-2xl border border-white/5 space-y-1">
                            <span className="text-[10px] font-bold text-[#d4af37]">رقم الهاتف المسجل لدينا</span>
                            <p className="text-xs text-white font-mono font-bold" dir="ltr">{res.clientPhone}</p>
                          </div>
                        </div>

                        {/* Admin Message / Notes Box */}
                        <div className="bg-[#1c1c19] p-4.5 rounded-3xl border border-[#d4af37]/10 space-y-2 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold text-[#d4af37] flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              <span>رسالة مهندس الديكور المشرف</span>
                            </span>
                            <p className="text-xs text-gray-200 leading-relaxed mt-2 font-medium">
                              {res.adminNotes || "طلبكم قيد المراجعة الفنية من قبل مهندسي رويال جروب. سيتم التواصل معكم هاتفياً لترتيب معاينة الموقع ورفع القياسات قريباً جداً."}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Rejection Details Box */}
                      {res.status === 'Rejected' && (
                        <div className="bg-red-950/20 border border-red-500/20 p-5 rounded-2xl space-y-3 text-right">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                            <h5 className="text-xs font-black text-red-400">سبب الرفض المعتمد من قبل الإدارة:</h5>
                          </div>
                          <p className="text-xs font-black text-white bg-red-950/40 py-1.5 px-3 rounded-lg inline-block border border-red-900/30">
                            {getRejectionReasonArabic(res.rejectionReason)}
                          </p>
                          {res.rejectionNotes && (
                            <div className="pt-2 border-t border-red-500/10 text-[11px] text-gray-300">
                              <span className="font-bold text-red-400 block mb-1">توضيح إضافي من المهندس:</span>
                              <p className="leading-relaxed">{res.rejectionNotes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CONDITIONAL ACTION PANELS */}
                      {!isApproved && res.status !== 'Rejected' ? (
                        /* WHILE PENDING / IN REVIEW: Show Waiting Info Message */
                        <div className="bg-[#1c1c19] border border-amber-500/20 p-5 rounded-3xl space-y-3 text-right mt-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
                            <h5 className="text-xs font-black text-amber-400">حالة المتابعة الفورية: بانتظار الاعتماد والموافقة</h5>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed font-medium">
                            طلبكم الملكي تم استلامه وهو الآن في طور المراجعة والتدقيق والجدولة وتعيين المهندس المصمم لإنشاء التذكرة وغرفة المحادثة الخاصة بك. ستتحدث هذه الصفحة تلقائياً بالكامل بمجرد موافقة الإدارة. يرجى الانتظار.
                          </p>
                        </div>
                      ) : isApproved && res.status !== 'Rejected' ? (
                        /* WHEN APPROVED: Display Ticket & Assigned Engineer + Enter Chat Button */
                        <div className="bg-gradient-to-br from-[#1c1c19] to-[#171714] border-2 border-[#d4af37]/45 p-6 md:p-8 rounded-3xl space-y-6 text-right mt-4 shadow-2xl relative overflow-hidden">
                          <div className="absolute -left-6 -bottom-6 w-32 h-32 text-[#d4af37]/5 pointer-events-none">
                            <Crown className="w-full h-full" />
                          </div>

                          <div className="flex items-center gap-3 pb-4 border-b border-[#d4af37]/10">
                            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-white">تم قبول طلبك الملكي وتعيين المهندس بنجاح!</h4>
                              <p className="text-[10px] text-emerald-400 mt-0.5">تم تفعيل قناة المتابعة والدردشة المباشرة مع المهندس المصمم</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-1">
                              <span className="text-gray-400 font-bold">رقم تذكرة المتابعة الفنية:</span>
                              <p className="text-sm font-black text-[#d4af37] font-mono">
                                {associatedTicket ? associatedTicket.id : (res.details?.ticketId || 'RG-TKT-ACTIVE')}
                              </p>
                            </div>

                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-1">
                              <span className="text-gray-400 font-bold">المهندس المشرف المعين:</span>
                              <p className="text-sm font-black text-white">
                                {associatedTicket?.assignedEngineerName 
                                  ? `م. ${associatedTicket.assignedEngineerName}` 
                                  : (res.details?.assignedEngineerName ? `م. ${res.details.assignedEngineerName}` : 'بانتظار تعيين المهندس المصمم')}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() => {
                                const ticketId = associatedTicket?.id || res.details?.ticketId;
                                if (ticketId) {
                                  localStorage.setItem('active_client_ticket_id', ticketId);
                                  localStorage.setItem('force_client_role', 'true');
                                  if (setActiveTab) {
                                    setActiveTab('tickets');
                                  }
                                } else {
                                  alert('قيد تفعيل التذكرة بالكامل، يرجى الانتظار ثوانٍ أو تحديث الصفحة.');
                                }
                              }}
                              className="w-full py-4 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#aa7c11] hover:brightness-110 text-[#171714] rounded-2xl text-xs font-black shadow-xl shadow-[#d4af37]/10 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4 text-[#171714] shrink-0 group-hover:scale-110 transition-transform" />
                              <span>دخول غرفة المتابعة ومحادثة المهندس</span>
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {/* Status Tracking Step Progress */}
                      {renderTimeline(res.status)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
