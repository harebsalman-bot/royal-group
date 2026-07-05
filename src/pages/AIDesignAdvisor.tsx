/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { 
  Sparkles, 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Image as ImageIcon, 
  Send,
  Eye,
  RefreshCw,
  Home as HomeIcon,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIDesignAdvisorProps {
  setActiveTab?: (tab: string) => void;
}

export const AIDesignAdvisor: React.FC<AIDesignAdvisorProps> = ({ setActiveTab }) => {
  const { addDesignRequest, isFirebaseConnected } = useFirebaseState();

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Analysis states
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'completed' | 'error'>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [designReport, setDesignReport] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');

  // Request Execution states
  const [isExecutingDesign, setIsExecutingDesign] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCity, setClientCity] = useState('بغداد');
  const [clientArea, setClientArea] = useState('');
  const [clientBudget, setClientBudget] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');
  const [successRequestNumber, setSuccessRequestNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const loadingMessages = [
    "جاري قراءة تفاصيل الصورة وتهيئة الاتصال...",
    "جاري فحص العناصر المعمارية والنمط الفني...",
    "جاري تحليل تناسق الألوان وتأثيرات الإضاءة...",
    "جاري دراسة توزيع قطع الأثاث والنسب المترية...",
    "جاري فحص جودة خامات الأرضيات والتشطيبات الخشبية...",
    "جاري صياغة تقرير التصميم الداخلي الملكي والحلول المقترحة باللغة العربية..."
  ];

  // Simulated progress timer for elegant loading sequence
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (analysisStatus === 'analyzing') {
      let currentProgress = 0;
      setAnalysisProgress(0);
      setAnalysisMessage(loadingMessages[0]);

      interval = setInterval(() => {
        currentProgress += 1;
        setAnalysisProgress(currentProgress);

        // Update message based on progress bracket
        const msgIdx = Math.min(
          Math.floor((currentProgress / 100) * loadingMessages.length),
          loadingMessages.length - 1
        );
        setAnalysisMessage(loadingMessages[msgIdx]);

        if (currentProgress >= 95) {
          clearInterval(interval);
        }
      }, 150);
    }
    return () => clearInterval(interval);
  }, [analysisStatus]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('الرجاء اختيار ملف صورة صالح فقط (JPEG / PNG).');
      setAnalysisStatus('error');
      return;
    }
    setSelectedFile(file);
    setAnalysisStatus('idle');
    setDesignReport('');
    setShowRequestForm(false);
    setFormStatus('idle');

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Run Gemini Analysis
  const runAnalysis = async () => {
    if (!selectedFile || !imagePreview) return;

    try {
      setAnalysisStatus('analyzing');
      setErrorMessage('');

      // Extract base64 without the header prefix
      const base64Data = imagePreview.split(',')[1];
      const mimeType = selectedFile.type;

      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: mimeType
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to analyze image");
      }

      const data = await response.json();
      setDesignReport(data.report || "فشل توليد التقرير.");
      setAnalysisProgress(100);
      setAnalysisStatus('completed');
      
      // Auto-scroll to report after brief delay
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);

    } catch (err: any) {
      console.error("Analysis error:", err);
      setErrorMessage(err.message || "حدث خطأ غير متوقع أثناء الاتصال بخدمة مستشار التصميم.");
      setAnalysisStatus('error');
    }
  };

  // Submit Design Execution Request
  const handleRequestSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !clientArea.trim() || !clientBudget.trim()) {
      setFormError('الرجاء ملء جميع الحقول الأساسية المطلوبة.');
      return;
    }

    if (!selectedFile) {
      setFormError('صورة الغرفة مفقودة، يرجى إعادة رفعها والبدء من جديد.');
      return;
    }

    try {
      setFormStatus('submitting');
      setFormError('');

      // Create rich description using AI Advisor details
      const aiNote = `[مستشار التصميم الذكي] طلب تنفيذ تصميم مبني على تحليل صورة الغرفة المرفقة.\n\nالمدينة: ${clientCity}\nالمساحة: ${clientArea}\nالميزانية: ${clientBudget}`;

      const result = await addDesignRequest(
        {
          name: clientName,
          phone: clientPhone,
          city: clientCity,
          projectType: 'استشارة الذكاء الاصطناعي',
          area: clientArea,
          budget: clientBudget,
          adminNotes: aiNote
        },
        [], // No plans
        [selectedFile] // Room image is uploaded as design reference
      );

      setSuccessRequestNumber(result?.requestNumber || 'RG-PENDING');
      setFormStatus('success');
      setClientName('');
      setClientPhone('');
      setClientArea('');
      setClientBudget('');
    } catch (err: any) {
      console.error("Execution request failed:", err);
      setFormStatus('error');
      setFormError(err.message || 'حدث خطأ أثناء تسجيل طلب التنفيذ، يرجى المحاولة لاحقاً.');
    }
  };

  // Automated design execution (No forms or extra steps)
  const handleAutoExecuteDesign = async () => {
    if (!selectedFile) return;

    try {
      setIsExecutingDesign(true);

      const clientNamePlaceholder = `عميل المستشار الذكي #${Math.floor(100 + Math.random() * 900)}`;
      const clientPhonePlaceholder = "07704679311";

      const aiNote = `[مستشار التصميم الذكي - تنفيذ فوري تلقائي]\n\nالمدينة: بغداد\nالمساحة: غير محددة\nالميزانية: غير محددة\n\nتوصيات التصميم بالكامل:\n\n${designReport}`;

      const result = await addDesignRequest(
        {
          name: clientNamePlaceholder,
          phone: clientPhonePlaceholder,
          city: "بغداد",
          projectType: 'استشارة الذكاء الاصطناعي',
          area: 'غير محدد',
          budget: 'غير محدد',
          adminNotes: aiNote
        },
        [], // No plans
        [selectedFile] // Room image uploaded
      );

      // Save ticket id to local storage so ProjectTickets can auto-load it
      if (result && result.ticketId) {
        localStorage.setItem('active_client_ticket_id', result.ticketId);
        localStorage.setItem('force_client_role', 'true');
      }

      // Transition client directly to the chat room
      if (setActiveTab) {
        setActiveTab('tickets');
      }
    } catch (err: any) {
      console.error("Auto execute design failed:", err);
      alert("حدث خطأ أثناء تسجيل وتنفيذ التصميم تلقائياً: " + (err.message || err));
    } finally {
      setIsExecutingDesign(false);
    }
  };

  const handleCopy = () => {
    if (successRequestNumber) {
      navigator.clipboard.writeText(successRequestNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Markdown parsing logic for Arabic Report
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\//g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-extrabold text-gray-900 border-b border-[#d4af37]/25">{part}</strong>;
      }
      return part;
    });
  };

  const renderReportContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      // Headers
      if (trimmed.startsWith('###')) {
        return (
          <h3 key={idx} className="text-sm md:text-base font-black text-[#d4af37] border-r-2 border-[#d4af37] pr-3 mt-6 mb-3 font-sans">
            {parseBoldText(trimmed.replace(/^###\s*/, ''))}
          </h3>
        );
      }
      if (trimmed.startsWith('##')) {
        return (
          <h2 key={idx} className="text-base md:text-lg font-black text-[#1e1e1a] border-r-4 border-[#d4af37] pr-3 mt-8 mb-4 font-sans">
            {parseBoldText(trimmed.replace(/^##\s*/, ''))}
          </h2>
        );
      }
      if (trimmed.startsWith('#')) {
        return (
          <h1 key={idx} className="text-lg md:text-xl font-black text-[#1e1e1a] border-r-4 border-[#d4af37] pr-4 mt-10 mb-5 font-sans">
            {parseBoldText(trimmed.replace(/^#\s*/, ''))}
          </h1>
        );
      }

      // Bullet Lists
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <li key={idx} className="mr-4 text-xs md:text-sm text-gray-700 list-none flex items-start gap-2.5 py-1 leading-relaxed">
            <span className="text-[#d4af37] text-lg leading-none select-none">•</span>
            <span className="flex-grow">{parseBoldText(trimmed.substring(1).trim())}</span>
          </li>
        );
      }

      // Numbered Lists
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <div key={idx} className="mr-2 text-xs md:text-sm text-gray-700 flex items-start gap-2.5 py-1.5 leading-relaxed">
            <span className="bg-[#d4af37]/10 text-[#d4af37] text-[10px] font-black w-5 h-5 rounded-md flex items-center justify-center shrink-0">
              {numMatch[1]}
            </span>
            <span className="flex-grow">{parseBoldText(numMatch[2])}</span>
          </div>
        );
      }

      // Regular Paragraph
      return (
        <p key={idx} className="text-xs md:text-sm text-gray-600 leading-relaxed font-sans mb-2.5">
          {parseBoldText(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="bg-[#faf9f6] py-16" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-[#d4af37] text-xs font-bold tracking-widest uppercase flex justify-center items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            مستشار التصميم الذكائي الملكي
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-[#1e1e1a] font-sans tracking-tight">AI Design Advisor</h1>
          <p className="text-gray-500 text-xs md:text-sm max-w-xl mx-auto font-sans leading-relaxed">
            ارفع صورة لغرفتك الحالية، وسيقوم محرك الذكاء الاصطناعي بتحليل النمط العام، الألوان، خامات الأرضيات، الإضاءة، التشطيبات الخشبية، وتقديم تقرير معماري ملكي متكامل باللغة العربية مع خطط وحلول قابلة للتنفيذ المباشر.
          </p>
        </div>

        {/* Uploader Card */}
        <div className="bg-white rounded-3xl border border-[#d4af37]/15 p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-[#d4af37] via-[#f3e5ab] to-[#d4af37]" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left side: Upload action */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5 font-sans">رفع الفراغ للمستشار</h3>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center text-center space-y-4 cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-[#d4af37] bg-[#d4af37]/5 scale-[0.99]' 
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-350'
                }`}
              >
                <UploadCloud className="w-10 h-10 text-[#d4af37]" />
                <div className="space-y-1.5">
                  <span className="text-xs md:text-sm font-bold text-gray-800 block">اسحب وأسقط صورة الغرفة هنا</span>
                  <span className="text-[10px] md:text-xs text-gray-400 block">أو انقر هنا لتحديد ملف من جهازك (JPG, PNG)</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-150">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#d4af37]" />
                    <div className="text-right">
                      <span className="text-xs font-semibold text-gray-800 block truncate max-w-[150px] md:max-w-[200px]">{selectedFile.name}</span>
                      <span className="text-[9px] text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setImagePreview(null);
                      setAnalysisStatus('idle');
                      setDesignReport('');
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 hover:bg-red-50 rounded-lg transition-all"
                  >
                    إلغاء الملف
                  </button>
                </div>
              )}

              <button
                onClick={runAnalysis}
                disabled={!selectedFile || analysisStatus === 'analyzing'}
                className="w-full py-3.5 bg-[#171714] text-white hover:text-[#d4af37] border border-transparent hover:border-[#d4af37]/35 text-xs font-black rounded-xl transition-all shadow-lg disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {analysisStatus === 'analyzing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
                    <span>جاري تشغيل محرك الذكاء الاصطناعي الملكي...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#d4af37]" />
                    <span>بدء التحليل الفني بالذكاء الاصطناعي</span>
                  </>
                )}
              </button>
            </div>

            {/* Right side: Image preview frame */}
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-200 aspect-video md:aspect-square relative overflow-hidden group">
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-3 right-3 text-white text-[10px] font-bold bg-black/45 px-2.5 py-1 rounded-md backdrop-blur-sm flex items-center gap-1">
                    <Eye className="w-3 h-3 text-[#d4af37]" />
                    معاينة الفراغ الحالي
                  </span>
                </>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <ImageIcon className="w-10 h-10 text-gray-300 mx-auto" />
                  <span className="text-[11px] text-gray-400 block font-medium">لم يتم تحديد صورة بعد لإخضاعها للمعاينة الفنية</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading / Analyzing Screen */}
        <AnimatePresence>
          {analysisStatus === 'analyzing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl border border-[#d4af37]/15 p-8 md:p-12 shadow-xl space-y-8 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 left-0 h-1 bg-[#d4af37]/20" />
              <div className="absolute top-0 right-0 h-1 bg-[#d4af37] transition-all duration-300" style={{ width: `${analysisProgress}%` }} />

              <div className="relative flex items-center justify-center w-20 h-20 bg-gray-50 border border-gray-200 rounded-2xl mx-auto shadow-md">
                <Loader2 className="w-10 h-10 animate-spin text-[#d4af37]" />
              </div>

              <div className="space-y-3.5">
                <h3 className="text-base font-black text-[#1e1e1a] font-sans">محرك الذكاء الاصطناعي يقوم بالفحص الفني الآن</h3>
                <div className="flex justify-center items-center gap-1.5">
                  <span className="text-xs font-black text-[#d4af37] font-mono">{analysisProgress}%</span>
                  <p className="text-xs text-gray-500 font-sans">{analysisMessage}</p>
                </div>
              </div>

              {/* Progress visual indicator */}
              <div className="w-full max-w-md mx-auto bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#d4af37] h-full transition-all duration-350" style={{ width: `${analysisProgress}%` }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {analysisStatus === 'error' && (
          <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs md:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <div className="space-y-1 text-right">
              <span className="font-bold block">فشل التحليل الذكي</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Completed Report Display */}
        {analysisStatus === 'completed' && designReport && (
          <motion.div
            ref={reportRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header Tag */}
            <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">تم التوليد بواسطة مستشارنا الذكي</span>
                  <span className="text-sm font-black text-gray-900 font-sans">تقرير التشخيص المعماري الملكي</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setAnalysisStatus('idle');
                  setDesignReport('');
                  setSelectedFile(null);
                  setImagePreview(null);
                  setShowRequestForm(false);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-[#d4af37]/10 border border-transparent hover:border-[#d4af37]/35 text-xs text-gray-600 hover:text-[#171714] rounded-lg transition-all font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحليل صورة أخرى</span>
              </button>
            </div>

            {/* Document Card */}
            <div className="bg-white rounded-3xl border border-[#d4af37]/15 p-8 md:p-12 shadow-2xl relative overflow-hidden text-right leading-relaxed space-y-6">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-[#d4af37] via-[#f3e5ab] to-[#d4af37]" />
              
              {/* Report Rendered Content */}
              <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-sans prose-headings:font-black text-gray-800">
                {renderReportContent(designReport)}
              </div>

              {/* Action Ribbon */}
              <div className="pt-8 border-t border-gray-100 flex flex-wrap gap-4 items-center justify-center">
                <button
                  onClick={handleAutoExecuteDesign}
                  disabled={isExecutingDesign}
                  className="px-8 py-4 bg-[#171714] text-white hover:text-[#d4af37] border border-transparent hover:border-[#d4af37]/40 text-xs font-black rounded-xl transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isExecutingDesign ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
                      <span>جاري تنفيذ هذا التصميم...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#d4af37]" />
                      <span>تنفيذ هذا التصميم</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([designReport], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `RoyalGroup-DesignReport-${Date.now()}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-6 py-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#d4af37]" />
                  <span>تحميل التقرير كـ نص</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Request Execution Form Modal/Section */}
        <AnimatePresence>
          {showRequestForm && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white rounded-3xl border border-[#d4af37]/15 p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-[#d4af37] via-[#f3e5ab] to-[#d4af37]" />
              
              <AnimatePresence mode="wait">
                {formStatus === 'success' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="py-12 flex flex-col items-center text-center space-y-6"
                  >
                    <div className="p-4 rounded-full bg-green-50 text-green-500 border border-green-200">
                      <CheckCircle className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-gray-900 font-sans">تم إرسال طلب التنفيذ بنجاح!</h3>
                      <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                        لقد تم تسجيل طلب التنفيذ الخاص بك بنجاح في قاعدة البيانات الملكية، وتم ربط تقرير تشخيص الذكاء الاصطناعي مع الصورة المرفوعة بالفولدر الهندسي الخاص بك. سيقوم فريقنا بالاتصال بك قريباً.
                      </p>
                    </div>

                    {/* Tracking Box */}
                    <div className="w-full max-w-md bg-gray-50 rounded-2xl border border-gray-150 p-6 space-y-4 text-right">
                      <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2">معلومات المتابعة الفورية</h4>
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                        <button 
                          onClick={handleCopy}
                          className="px-3 py-1 bg-[#171714] hover:bg-[#b8952b] text-white hover:text-[#171714] text-[10px] font-bold rounded-lg transition-all"
                        >
                          {copied ? 'تم النسخ!' : 'نسخ الرمز'}
                        </button>
                        <div className="text-right">
                          <span className="block text-[10px] text-gray-400 font-medium">رمز تتبع الطلب الموحد</span>
                          <span className="text-xs font-black text-[#d4af37] font-mono select-all tracking-wider">{successRequestNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                      {setActiveTab && (
                        <button
                          onClick={() => setActiveTab('track')}
                          className="px-6 py-3 rounded-xl bg-[#d4af37] hover:bg-[#b8952b] text-[#171714] text-xs font-black tracking-wide transition-all shadow-lg"
                        >
                          تتبع حالة الطلب الآن
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowRequestForm(false);
                          setFormStatus('idle');
                        }}
                        className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all"
                      >
                        إغلاق النافذة
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleRequestSubmission} className="space-y-8 text-right">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                      <h3 className="text-sm md:text-base font-bold text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5 font-sans">استمارة طلب تنفيذ التصميم المختار</h3>
                      <button
                        type="button"
                        onClick={() => setShowRequestForm(false)}
                        className="text-xs text-gray-400 hover:text-gray-600 font-bold px-2 py-1 rounded"
                      >
                        إغلاق النافذة
                      </button>
                    </div>

                    {/* Form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">الاسم الكامل <strong className="text-red-500">*</strong></label>
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="الرجاء كتابة اسمك الثلاثي"
                          className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:bg-white outline-none transition-all text-gray-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">رقم الهاتف <strong className="text-red-500">*</strong></label>
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="مثال: 07704679311"
                          className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:bg-white outline-none transition-all text-gray-900 text-left dir-ltr"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">المدينة / المحافظة</label>
                        <select
                          value={clientCity}
                          onChange={(e) => setClientCity(e.target.value)}
                          className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:bg-white outline-none transition-all text-gray-900 font-bold"
                        >
                          <option>بغداد</option>
                          <option>البصرة</option>
                          <option>النجف الأشرف</option>
                          <option>كربلاء المقدسة</option>
                          <option>أربيل</option>
                          <option>السليمانية</option>
                          <option>نينوى</option>
                          <option>محافظة أخرى</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">المساحة الإجمالية للمشروع <strong className="text-red-500">*</strong></label>
                        <input
                          type="text"
                          required
                          value={clientArea}
                          onChange={(e) => setClientArea(e.target.value)}
                          placeholder="مثال: 200 م²"
                          className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:bg-white outline-none transition-all text-gray-900"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">الميزانية المقدرة للتنفيذ <strong className="text-red-500">*</strong></label>
                        <input
                          type="text"
                          required
                          value={clientBudget}
                          onChange={(e) => setClientBudget(e.target.value)}
                          placeholder="مثال: 20,000 $"
                          className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] focus:bg-white outline-none transition-all text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Form Error Banner */}
                    {formError && (
                      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={formStatus === 'submitting'}
                        className="px-8 py-3.5 bg-[#171714] text-white hover:text-[#d4af37] border border-transparent hover:border-[#d4af37]/35 text-xs font-black rounded-lg transition-all shadow-xl disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      >
                        {formStatus === 'submitting' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
                            <span>جاري تسجيل طلب التنفيذ...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-[#d4af37]" />
                            <span>تأكيد وإرسال طلب التنفيذ الملكي</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
