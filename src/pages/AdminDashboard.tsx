/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { Project, ColorVariant, DesignRequest, BedroomOption, BedroomSubmission, RequestStatus, RejectionReason } from '../types';
import { 
  Plus, Edit2, Trash2, Check, Star, Settings, Image as ImageIcon, Link as LinkIcon, 
  MapPin, MessageSquare, ClipboardList, Palette, Sliders, LogOut, FileText, Loader2, Save,
  Crown, Phone, X, Calendar, User, CheckCircle2, AlertTriangle, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const SECTIONS_METADATA = [
  { key: 'bed', title: 'تصميم السرير ولونه' },
  { key: 'headboard', title: 'خلفية السرير (الهيدبورد)' },
  { key: 'nightstand', title: 'الكومودينو (Nightstands)' },
  { key: 'vanity', title: 'طاولة التسريحة (Vanity)' },
  { key: 'wardrobe', title: 'خزانة الملابس / الدريسنج' },
  { key: 'tvUnit', title: 'ديكور التلفزيون (TV Unit)' },
  { key: 'curtains', title: 'تصاميم الستائر' },
  { key: 'flooring', title: 'الأرضيات الراقية' },
  { key: 'ceiling', title: 'ديكورات السقف والجبس' },
  { key: 'lighting', title: 'توزيع الإنارة والثريا' }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const {
    isFirebaseConnected, projects, categories, colorVariants, designRequests, 
    companySettings, socialLinks, bedroomOptions, bedroomSubmissions,
    addProject, updateProject, deleteProject, 
    updateDesignRequestStatus, updateCompanySettings, updateSocialLinks, 
    addColorVariant, deleteColorVariant, uploadFile,
    addBedroomOption, updateBedroomOption, deleteBedroomOption,
    updateBedroomSubmissionStatus, deleteBedroomSubmission
  } = useFirebaseState();

  // Navigation Subtabs
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'bedrooms' | 'kitchens' | 'dressing' | 'wood' | 'projects' | 'requests' | 'settings'>('dashboard');

  // Global loading / feedback states
  const [globalLoading, setGlobalLoading] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, message: '', type: 'success' });

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ show: true, message: msg, type });
    setTimeout(() => setFeedback(prev => ({ ...prev, show: false })), 4000);
  };

  // Details Modal States
  const [selectedRequest, setSelectedRequest] = useState<DesignRequest | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<BedroomSubmission | null>(null);

  // Rejection Modal States
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState<{ id: string; type: 'standard' | 'bedroom' } | null>(null);
  const [selectedReason, setSelectedReason] = useState<RejectionReason>('Outside our scope');
  const [customRejectionNotes, setCustomRejectionNotes] = useState('');

  // Admin Notes text state
  const [adminNotesInput, setAdminNotesInput] = useState('');

  // Project form states
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projArea, setProjArea] = useState('');
  const [projCity, setProjCity] = useState('');
  const [projCategory, setProjCategory] = useState('غرف نوم');
  const [projFeatured, setProjFeatured] = useState(false);
  const [projCoverFile, setProjCoverFile] = useState<File | null>(null);
  const [projCoverUrl, setProjCoverUrl] = useState('');
  const [projGalleryUrls, setProjGalleryUrls] = useState<string[]>([]);
  const [projBeforeFile, setProjBeforeFile] = useState<File | null>(null);
  const [projBeforeUrl, setProjBeforeUrl] = useState('');
  const [projAfterFile, setProjAfterFile] = useState<File | null>(null);
  const [projAfterUrl, setProjAfterUrl] = useState('');

  // Color Variant form states
  const [colorName, setColorName] = useState('');
  const [colorType, setColorType] = useState<'wood' | 'marble' | 'wall' | 'flooring'>('wood');
  const [colorHex, setColorHex] = useState('#B1A796');
  const [colorFile, setColorFile] = useState<File | null>(null);
  const [colorUrl, setColorUrl] = useState('');

  // Bedroom design options states
  const [bedOptName, setBedOptName] = useState('');
  const [bedOptDesc, setBedOptDesc] = useState('');
  const [bedOptSection, setBedOptSection] = useState<'bed' | 'headboard' | 'nightstand' | 'vanity' | 'wardrobe' | 'tvUnit' | 'curtains' | 'flooring' | 'ceiling' | 'lighting'>('bed');
  const [bedOptFile, setBedOptFile] = useState<File | null>(null);
  const [bedOptUrl, setBedOptUrl] = useState('');
  const [editingBedOptId, setEditingBedOptId] = useState<string | null>(null);

  // Settings states
  const [compAddress, setCompAddress] = useState(companySettings.address);
  const [compPhone, setCompPhone] = useState(companySettings.phone);
  const [compWhatsapp, setCompWhatsapp] = useState(companySettings.whatsapp);
  const [compAbout, setCompAbout] = useState(companySettings.aboutText);

  const [socialInsta, setSocialInsta] = useState(socialLinks.instagram);
  const [socialFb, setSocialFb] = useState(socialLinks.facebook);
  const [socialTk, setSocialTk] = useState(socialLinks.tiktok);
  const [socialYt, setSocialYt] = useState(socialLinks.youtube);

  // Unified Central Inbox Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | RequestStatus>('All');
  const [filterInboxType, setFilterInboxType] = useState<'All' | 'Standard' | 'Bedroom'>('All');

  // Integrations URL Builders
  const getWhatsAppLink = (phone: string, requestNumber?: string) => {
    let cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    if (cleanPhone.startsWith('07')) {
      cleanPhone = '964' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('7')) {
      cleanPhone = '964' + cleanPhone;
    }
    const text = `السلام عليكم، معكم رويال جروب بخصوص طلب التصميم رقم ${requestNumber || ''}. يسعدنا التواصل معكم لتنسيق تفاصيل مشروعكم الفاخر.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const getTelLink = (phone: string) => {
    return `tel:${phone.replace(/[\s\-\+\(\)]/g, '')}`;
  };

  // Calculated variables
  const unreadCount = designRequests.filter(r => !r.viewed).length + bedroomSubmissions.filter(s => !s.viewed).length;

  // MARK READ ACTIONS
  const handleOpenRequest = async (req: DesignRequest) => {
    setSelectedRequest(req);
    setSelectedSubmission(null);
    setAdminNotesInput(req.adminNotes || '');
    if (!req.viewed) {
      await updateDesignRequestStatus(req.id, req.status, { viewed: true });
    }
  };

  const handleOpenSubmission = async (sub: BedroomSubmission) => {
    setSelectedSubmission(sub);
    setSelectedRequest(null);
    setAdminNotesInput(sub.adminNotes || '');
    if (!sub.viewed) {
      await updateBedroomSubmissionStatus(sub.id, sub.status, { viewed: true });
    }
  };

  // REJECTION HANDLERS
  const triggerRejectionModal = (id: string, type: 'standard' | 'bedroom') => {
    setRejectionTarget({ id, type });
    setSelectedReason('Outside our scope');
    setCustomRejectionNotes('');
    setRejectionModalOpen(true);
  };

  const confirmRejection = async () => {
    if (!rejectionTarget) return;
    try {
      setGlobalLoading(true);
      const updates = {
        status: 'Rejected' as RequestStatus,
        rejectionReason: selectedReason,
        rejectionNotes: customRejectionNotes,
        viewed: true
      };
      if (rejectionTarget.type === 'standard') {
        await updateDesignRequestStatus(rejectionTarget.id, 'Rejected', updates);
        if (selectedRequest?.id === rejectionTarget.id) {
          setSelectedRequest(prev => prev ? { ...prev, ...updates } : null);
        }
      } else {
        await updateBedroomSubmissionStatus(rejectionTarget.id, 'Rejected', updates);
        if (selectedSubmission?.id === rejectionTarget.id) {
          setSelectedSubmission(prev => prev ? { ...prev, ...updates } : null);
        }
      }
      showFeedback('تم رفض الطلب وتسجيل السبب والملاحظات بنجاح.', 'success');
      setRejectionModalOpen(false);
      setRejectionTarget(null);
    } catch (e) {
      console.error(e);
      showFeedback('حدث خطأ أثناء الرفض.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // ADMIN NOTES ACTIONS
  const handleSaveAdminNotes = async () => {
    if (selectedRequest) {
      try {
        setGlobalLoading(true);
        await updateDesignRequestStatus(selectedRequest.id, selectedRequest.status, { adminNotes: adminNotesInput });
        setSelectedRequest(prev => prev ? { ...prev, adminNotes: adminNotesInput } : null);
        showFeedback('تم حفظ ملاحظات الإدارة بنجاح.');
      } catch (err) {
        showFeedback('فشل حفظ الملاحظات.', 'error');
      } finally {
        setGlobalLoading(false);
      }
    } else if (selectedSubmission) {
      try {
        setGlobalLoading(true);
        await updateBedroomSubmissionStatus(selectedSubmission.id, selectedSubmission.status, { adminNotes: adminNotesInput });
        setSelectedSubmission(prev => prev ? { ...prev, adminNotes: adminNotesInput } : null);
        showFeedback('تم حفظ ملاحظات الإدارة بنجاح.');
      } catch (err) {
        showFeedback('فشل حفظ الملاحظات.', 'error');
      } finally {
        setGlobalLoading(false);
      }
    }
  };

  // GENERIC STATUS UPDATER
  const handleStatusChange = async (id: string, type: 'standard' | 'bedroom', newStatus: RequestStatus) => {
    if (newStatus === 'Rejected') {
      triggerRejectionModal(id, type);
      return;
    }
    try {
      setGlobalLoading(true);
      const fields = { status: newStatus };
      if (type === 'standard') {
        await updateDesignRequestStatus(id, newStatus, fields);
        if (selectedRequest?.id === id) setSelectedRequest(prev => prev ? { ...prev, ...fields } : null);
      } else {
        await updateBedroomSubmissionStatus(id, newStatus, fields);
        if (selectedSubmission?.id === id) setSelectedSubmission(prev => prev ? { ...prev, ...fields } : null);
      }
      showFeedback('تم تحديث حالة الطلب بنجاح.');
    } catch (err) {
      showFeedback('فشل تحديث حالة الطلب.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // PROJECT METHODS
  const resetProjectForm = () => {
    setEditingProject(null);
    setProjTitle('');
    setProjDesc('');
    setProjArea('');
    setProjCity('');
    setProjCategory('غرف نوم');
    setProjFeatured(false);
    setProjCoverFile(null);
    setProjCoverUrl('');
    setProjGalleryUrls([]);
    setProjBeforeFile(null);
    setProjBeforeUrl('');
    setProjAfterFile(null);
    setProjAfterUrl('');
    setShowProjectForm(false);
  };

  const handleOpenEditProject = (p: Project) => {
    setEditingProject(p);
    setProjTitle(p.title);
    setProjDesc(p.description);
    setProjArea(p.area);
    setProjCity(p.city);
    setProjCategory(p.category);
    setProjFeatured(p.featured);
    setProjCoverUrl(p.coverImage);
    setProjGalleryUrls(p.images || []);
    setProjBeforeUrl(p.beforeImage || '');
    setProjAfterUrl(p.afterImage || '');
    setShowProjectForm(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim() || !projDesc.trim() || !projArea.trim() || !projCity.trim()) {
      showFeedback('الرجاء ملء جميع حقول المشروع الأساسية.', 'error');
      return;
    }
    try {
      setGlobalLoading(true);
      let coverUrl = projCoverUrl;
      let beforeUrl = projBeforeUrl;
      let afterUrl = projAfterUrl;

      if (!coverUrl && !editingProject) {
        showFeedback('الرجاء اختيار صورة غلاف للمشروع.', 'error');
        setGlobalLoading(false);
        return;
      }

      const pData = {
        title: projTitle,
        description: projDesc,
        area: projArea,
        city: projCity,
        category: projCategory,
        featured: projFeatured,
        coverImage: coverUrl,
        images: projGalleryUrls.length > 0 ? projGalleryUrls : [coverUrl],
        beforeImage: beforeUrl || undefined,
        afterImage: afterUrl || undefined
      };

      if (editingProject) {
        await updateProject(editingProject.id, pData);
        showFeedback('تم تحديث المشروع بنجاح!');
      } else {
        await addProject(pData);
        showFeedback('تم إضافة المشروع الجديد بنجاح!');
      }
      resetProjectForm();
    } catch (err) {
      showFeedback('حدث خطأ أثناء حفظ المشروع.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleOpenAddProjectForCategory = (categoryName: string) => {
    resetProjectForm();
    setProjCategory(categoryName);
    setShowProjectForm(true);
  };

  const handleReorderProject = async (projId: string, direction: 'up' | 'down') => {
    const sorted = [...projects].sort((a, b) => {
      const idxA = typeof a.orderIndex === 'number' ? a.orderIndex : 999999;
      const idxB = typeof b.orderIndex === 'number' ? b.orderIndex : 999999;
      if (idxA !== idxB) return idxA - idxB;
      return b.createdAt - a.createdAt;
    });

    const index = sorted.findIndex(p => p.id === projId);
    if (index === -1) return;

    let targetIndex = -1;
    if (direction === 'up' && index > 0) {
      targetIndex = index - 1;
    } else if (direction === 'down' && index < sorted.length - 1) {
      targetIndex = index + 1;
    }

    if (targetIndex !== -1) {
      try {
        setGlobalLoading(true);
        const currentProj = sorted[index];
        const targetProj = sorted[targetIndex];

        await updateProject(currentProj.id, { orderIndex: targetIndex });
        await updateProject(targetProj.id, { orderIndex: index });
        
        showFeedback('تم تغيير ترتيب المشروع بنجاح!');
      } catch (err) {
        console.error(err);
        showFeedback('فشل في إعادة ترتيب المشاريع.', 'error');
      } finally {
        setGlobalLoading(false);
      }
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setGlobalLoading(true);
      const urls: string[] = [];
      for (const file of Array.from(e.target.files)) {
        const url = await uploadFile(file, 'projects');
        urls.push(url);
      }
      setProjGalleryUrls(prev => [...prev, ...urls]);
      showFeedback('تم رفع صور المعرض بنجاح!');
    } catch (err) {
      showFeedback('حدث خطأ أثناء رفع صور المعرض.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // COLOR LAB HANDLERS
  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorName.trim() || (!colorFile && !colorUrl.trim() && !window.confirm('متابعة بدون رفع صورة مخصصة؟'))) return;
    try {
      setGlobalLoading(true);
      let renderImgUrl = colorUrl.trim() || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200";
      if (colorFile) renderImgUrl = await uploadFile(colorFile, 'color-lab');
      await addColorVariant({ name: colorName, type: colorType, colorValue: colorHex, image: renderImgUrl });
      setColorName('');
      setColorFile(null);
      setColorUrl('');
      showFeedback('تم إضافة خيار اللون الجديد للمختبر!');
    } catch (err) {
      showFeedback('فشل إضافة خيار اللون.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteColor = async (id: string) => {
    if (!window.confirm('حذف هذا اللون من مختبر تجربة الألوان؟')) return;
    try {
      setGlobalLoading(true);
      await deleteColorVariant(id);
      showFeedback('تم حذف اللون المختار.');
    } catch (err) {
      showFeedback('فشل حذف خيار اللون.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setGlobalLoading(true);
      await updateCompanySettings({
        address: compAddress,
        phone: compPhone,
        whatsapp: compWhatsapp,
        aboutText: compAbout,
        aboutImage: companySettings.aboutImage
      });
      await updateSocialLinks({
        instagram: socialInsta,
        facebook: socialFb,
        tiktok: socialTk,
        youtube: socialYt
      });
      showFeedback('تم حفظ معلومات الشركة وروابط التواصل الاجتماعي بنجاح!');
    } catch (err) {
      showFeedback('فشل حفظ التعديلات.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // BEDROOM OPTION HANDLERS
  const handleEditBedroomOptionClick = (opt: BedroomOption) => {
    setEditingBedOptId(opt.id);
    setBedOptName(opt.name);
    setBedOptDesc(opt.description || '');
    setBedOptSection(opt.section);
    setBedOptUrl(opt.image);
    setBedOptFile(null);
  };

  const handleCancelEditBedroomOption = () => {
    setEditingBedOptId(null);
    setBedOptName('');
    setBedOptDesc('');
    setBedOptSection('bed');
    setBedOptUrl('');
    setBedOptFile(null);
  };

  const handleAddBedroomOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedOptName.trim()) {
      showFeedback('الرجاء كتابة اسم الخيار المخصص.', 'error');
      return;
    }
    try {
      setGlobalLoading(true);
      let renderImgUrl = bedOptUrl.trim() || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200";
      if (bedOptFile) renderImgUrl = await uploadFile(bedOptFile, 'bedroom-options');

      if (editingBedOptId) {
        await updateBedroomOption(editingBedOptId, {
          name: bedOptName.trim(),
          section: bedOptSection,
          description: bedOptDesc.trim(),
          image: renderImgUrl
        });
        showFeedback('تم تحديث خيار التصميم بنجاح!');
      } else {
        await addBedroomOption({
          name: bedOptName.trim(),
          section: bedOptSection,
          description: bedOptDesc.trim(),
          image: renderImgUrl
        });
        showFeedback('تم إضافة خيار التصميم بنجاح!');
      }
      handleCancelEditBedroomOption();
    } catch (err) {
      showFeedback('فشل حفظ خيار التصميم.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // MASTER LIST OF RECENT/FILTERED REQUESTS
  const allInboxItems = [
    ...designRequests.map(r => ({ ...r, inboxType: 'Standard' as const, clientName: r.name, clientPhone: r.phone })),
    ...bedroomSubmissions.map(s => ({ ...s, inboxType: 'Bedroom' as const, clientName: s.clientName, clientPhone: s.clientPhone }))
  ].sort((a, b) => b.createdAt - a.createdAt);

  const filteredInboxItems = allInboxItems.filter(item => {
    const matchesSearch = item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.clientPhone.includes(searchQuery) ||
                          (item.requestNumber && item.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'All' ? true : item.status === filterStatus;
    const matchesType = filterInboxType === 'All' ? true : item.inboxType === filterInboxType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadgeClass = (status: RequestStatus) => {
    switch (status) {
      case 'New': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Under Review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contacted': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Approved': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'In Progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const translateStatus = (status: RequestStatus) => {
    switch (status) {
      case 'New': return 'جديد';
      case 'Under Review': return 'قيد الدراسة';
      case 'Contacted': return 'تم التواصل';
      case 'Approved': return 'موافق عليه';
      case 'In Progress': return 'قيد التنفيذ';
      case 'Completed': return 'مكتمل';
      case 'Rejected': return 'مرفوض';
      default: return status;
    }
  };

  return (
    <div className="bg-[#faf9f6] min-h-screen py-8 text-right font-sans" dir="rtl">
      {/* Upper Status Notifications */}
      <AnimatePresence>
        {feedback.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-6 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 max-w-sm ${
              feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-xs font-bold leading-relaxed">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Admin Header */}
        <div className="bg-[#171714] rounded-3xl p-6 md:p-8 border border-[#d4af37]/20 flex flex-col md:flex-row justify-between items-center gap-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-l from-[#d4af37] via-yellow-200 to-[#d4af37]" />
          <div className="flex items-center gap-4 text-right">
            <div className="p-3 rounded-2xl bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/25 shrink-0">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black">لوحة الإدارة الشاملة • Royal Group</h1>
              <p className="text-[10px] text-gray-400 mt-1">
                {isFirebaseConnected ? <span className="text-green-400">● متصل بقاعدة البيانات الحية للشركة</span> : <span className="text-amber-400">● تشغيل بالوضع المحلي التجريبي</span>}
              </p>
            </div>
          </div>
          <button onClick={onLogout} className="px-5 py-2.5 bg-red-950/40 hover:bg-red-900/30 text-red-300 border border-red-500/25 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer">
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>

        {/* Reorganized Horizontal Tabs Menu */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#d4af37]/10 pb-4">
          {[
            { id: 'dashboard', label: 'لوحة القياس (Stats)', icon: <Sliders className="w-4 h-4" /> },
            { id: 'bedrooms', label: 'غرف النوم (Bedrooms)', icon: <Crown className="w-4 h-4 text-[#d4af37]" />, badge: `${projects.filter(p => p.category === 'غرف نوم').length} مشاريع` },
            { id: 'kitchens', label: 'المطابخ (Kitchens)', icon: <Palette className="w-4 h-4" />, badge: `${projects.filter(p => p.category === 'مطابخ').length} مشاريع` },
            { id: 'dressing', label: 'غرف الملابس (Dressing)', icon: <Settings className="w-4 h-4" />, badge: `${projects.filter(p => p.category === 'غرف ملابس').length} مشاريع` },
            { id: 'wood', label: 'ديكورات خشبية (Wood)', icon: <Star className="w-4 h-4" />, badge: `${projects.filter(p => p.category === 'ديكورات خشبية').length} مشاريع` },
            { id: 'projects', label: 'إدارة جميع المشاريع', icon: <ImageIcon className="w-4 h-4" />, badge: `${projects.length} كلي` },
            { 
              id: 'requests', 
              label: 'طلبات العملاء (Inbox)', 
              icon: (
                <div className="relative">
                  <MessageSquare className="w-4 h-4" />
                  {unreadCount > 0 && <span className="absolute -top-1.5 -left-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                </div>
              ),
              badge: unreadCount > 0 ? `${unreadCount} جديد` : null
            },
            { id: 'settings', label: 'الإعدادات والمختبر', icon: <Settings className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveSubTab(tab.id as any); resetProjectForm(); }}
              className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                activeSubTab === tab.id
                  ? 'bg-[#171714] text-[#d4af37] border-[#d4af37]/45 shadow-lg'
                  : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                  tab.id === 'requests' && unreadCount > 0
                    ? 'bg-red-600 text-white border-red-700'
                    : 'bg-[#d4af37]/15 text-[#aa7c11] border-[#d4af37]/25'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Global Loading Spinner */}
        {globalLoading && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
            <span>جاري حفظ البيانات وتحديث خادم رويال جروب...</span>
          </div>
        )}

        {/* ==================== SUB TAB: DASHBOARD ==================== */}
        {activeSubTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-[#d4af37]" />
                <span className="text-gray-400 text-xs block font-bold">الطلبات غير المقروءة</span>
                <span className="text-3xl font-black text-gray-900 mt-2 block font-mono">{unreadCount}</span>
                {unreadCount > 0 && <span className="text-[10px] text-red-500 font-bold block mt-1 animate-pulse">💡 يتطلب مراجعة فورية</span>}
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-gray-400 text-xs block font-bold">إجمالي طلبات التصميم</span>
                <span className="text-3xl font-black text-gray-900 mt-2 block font-mono">{designRequests.length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-gray-400 text-xs block font-bold">استمارات غرف النوم</span>
                <span className="text-3xl font-black text-gray-900 mt-2 block font-mono">{bedroomSubmissions.length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-gray-400 text-xs block font-bold">المشاريع المنشورة</span>
                <span className="text-3xl font-black text-gray-900 mt-2 block font-mono">{projects.length}</span>
              </div>
            </div>

            {/* Quick Activity Table */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h3 className="text-sm font-black text-gray-900 font-sans border-r-2 border-[#d4af37] pr-2.5">آخر 5 طلبات مستلمة في النظام</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold">
                      <th className="pb-3">رقم الطلب</th>
                      <th className="pb-3">العميل</th>
                      <th className="pb-3">رقم الهاتف</th>
                      <th className="pb-3">النوع</th>
                      <th className="pb-3">تاريخ الإرسال</th>
                      <th className="pb-3">الحالة</th>
                      <th className="pb-3 text-left">التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allInboxItems.slice(0, 5).map((item) => (
                      <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${!item.viewed ? 'bg-amber-50/20 font-bold' : ''}`}>
                        <td className="py-3 font-mono text-gray-900">{item.requestNumber || 'بدون رقم'}</td>
                        <td className="py-3">{item.clientName}</td>
                        <td className="py-3 font-mono">{item.clientPhone}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${item.inboxType === 'Bedroom' ? 'bg-amber-100 text-[#aa7c11]' : 'bg-gray-100 text-gray-800'}`}>
                            {item.inboxType === 'Bedroom' ? 'مختبر غرف نوم' : 'طلب مخصص'}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">{new Date(item.createdAt).toLocaleDateString('ar-IQ')}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${getStatusBadgeClass(item.status)}`}>
                            {translateStatus(item.status)}
                          </span>
                        </td>
                        <td className="py-3 text-left">
                          <button
                            onClick={() => item.inboxType === 'Bedroom' ? handleOpenSubmission(item as any) : handleOpenRequest(item as any)}
                            className="px-2.5 py-1.5 bg-[#171714] text-white hover:text-[#d4af37] text-[10px] font-bold rounded-lg"
                          >
                            عرض ومعالجة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUB TAB: BEDROOMS ==================== */}
        {activeSubTab === 'bedrooms' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Option Editor */}
              <form onSubmit={handleAddBedroomOption} className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5">
                  {editingBedOptId ? 'تعديل خيار النوم الملكي' : 'إضافة خيار تصميم جديد لغرف النوم'}
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">اسم الخيار</label>
                    <input type="text" required value={bedOptName} onChange={(e) => setBedOptName(e.target.value)} placeholder="مثال: سرير كشمير بإضاءة مخفية" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">القسم المخصص</label>
                    <select value={bedOptSection} onChange={(e: any) => setBedOptSection(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold">
                      {SECTIONS_METADATA.map(s => <option key={s.key} value={s.key}>{s.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">وصف الخيار (اختياري)</label>
                    <textarea rows={3} value={bedOptDesc} onChange={(e) => setBedOptDesc(e.target.value)} placeholder="اكتب ميزات التصميم الفاخر..." className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl resize-none" />
                  </div>
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600 font-mono">رابط صورة المعاينة الفنية</label>
                      <input type="text" value={bedOptUrl} onChange={(e) => setBedOptUrl(e.target.value)} placeholder="https://..." className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">أو تحميل ملف صورة جديد</label>
                      <input type="file" accept="image/*" onChange={(e) => e.target.files && setBedOptFile(e.target.files[0])} className="w-full text-xs" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editingBedOptId && <button type="button" onClick={handleCancelEditBedroomOption} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold">إلغاء</button>}
                    <button type="submit" className="flex-1 py-2 bg-[#171714] text-[#d4af37] hover:bg-black rounded-lg text-xs font-bold">{editingBedOptId ? 'حفظ التعديلات' : 'إضافة الخيار'}</button>
                  </div>
                </div>
              </form>

              {/* View/Delete Option Cards Grid */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5">خيارات غرف النوم المتاحة للعملاء ({bedroomOptions.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {bedroomOptions.map(opt => (
                    <div key={opt.id} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex gap-3 relative">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                        <img src={opt.image} alt={opt.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#d4af37]/10 text-[#aa7c11] rounded">
                          {SECTIONS_METADATA.find(s => s.key === opt.section)?.title || opt.section}
                        </span>
                        <h5 className="text-xs font-bold mt-1.5 text-gray-900 truncate">{opt.name}</h5>
                        {opt.description && <p className="text-[10px] text-gray-400 truncate">{opt.description}</p>}
                      </div>
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        <button onClick={() => handleEditBedroomOptionClick(opt)} className="p-1.5 text-gray-400 hover:text-[#aa7c11] hover:bg-amber-50 rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { if(window.confirm('حذف الخيار؟')) deleteBedroomOption(opt.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Bedroom submissions inbox & projects block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
              {/* Bedroom Projects */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5">
                    مشاريع غرف نوم رويال جروب ({projects.filter(p => p.category === 'غرف نوم').length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleOpenAddProjectForCategory('غرف نوم')}
                    className="px-3 py-1.5 bg-[#171714] text-[#d4af37] hover:bg-black text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة مشروع جديد
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {projects
                    .filter(p => p.category === 'غرف نوم')
                    .sort((a, b) => {
                      const idxA = typeof a.orderIndex === 'number' ? a.orderIndex : 999999;
                      const idxB = typeof b.orderIndex === 'number' ? b.orderIndex : 999999;
                      if (idxA !== idxB) return idxA - idxB;
                      return b.createdAt - a.createdAt;
                    })
                    .map((p, pIdx, arr) => (
                      <div key={p.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3 relative hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          <img src={p.coverImage} className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-inner" />
                          <div>
                            <h5 className="text-xs font-bold text-gray-900">{p.title}</h5>
                            <p className="text-[10px] text-gray-400">{p.city} • {p.area}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Reordering Controls */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={pIdx === 0}
                              onClick={() => handleReorderProject(p.id, 'up')}
                              className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-25 text-[10px]"
                              title="تحريك لأعلى"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={pIdx === arr.length - 1}
                              onClick={() => handleReorderProject(p.id, 'down')}
                              className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-25 text-[10px]"
                              title="تحريك لأسفل"
                            >
                              ▼
                            </button>
                          </div>
                          <button onClick={() => handleOpenEditProject(p)} className="p-1.5 text-gray-500 hover:text-[#d4af37] hover:bg-amber-50 rounded" title="تعديل"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if(window.confirm('حذف هذا المشروع نهائياً؟')) deleteProject(p.id); }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Custom Bedroom submissions inbox */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5">استمارات خيارات غرف النوم من الزبائن ({bedroomSubmissions.length})</h4>
                <div className="space-y-4">
                  {bedroomSubmissions.map(sub => (
                    <div key={sub.id} className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
                      <div>
                        <h5 className="text-xs font-black text-gray-900">{sub.clientName} (رقم: {sub.requestNumber || 'معلق'})</h5>
                        <span className="text-[10px] text-gray-400">الهاتف: {sub.clientPhone} • التاريخ: {new Date(sub.createdAt).toLocaleDateString('ar-IQ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleOpenSubmission(sub)} className="px-3 py-1.5 bg-[#171714] text-[#d4af37] rounded-lg text-xs font-bold">عرض الاختيارات والملاحظات</button>
                        <button onClick={() => { if(window.confirm('حذف استمارة النوم؟')) deleteBedroomSubmission(sub.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUB TAB: KITCHENS ==================== */}
        {activeSubTab === 'kitchens' && (
          <div className="space-y-8 text-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Kitchen Projects */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5">
                    مشاريع مطابخ رويال جروب ({projects.filter(p => p.category === 'مطابخ').length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleOpenAddProjectForCategory('مطابخ')}
                    className="px-3 py-1.5 bg-[#171714] text-[#d4af37] hover:bg-black text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة مشروع جديد
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {projects
                    .filter(p => p.category === 'مطابخ')
                    .sort((a, b) => {
                      const idxA = typeof a.orderIndex === 'number' ? a.orderIndex : 999999;
                      const idxB = typeof b.orderIndex === 'number' ? b.orderIndex : 999999;
                      if (idxA !== idxB) return idxA - idxB;
                      return b.createdAt - a.createdAt;
                    })
                    .map((p, pIdx, arr) => (
                      <div key={p.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3 relative hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          <img src={p.coverImage} className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-inner" />
                          <div>
                            <h5 className="text-xs font-bold text-gray-900">{p.title}</h5>
                            <p className="text-[10px] text-gray-400">{p.city} • {p.area}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Reordering Controls */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={pIdx === 0}
                              onClick={() => handleReorderProject(p.id, 'up')}
                              className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-25 text-[10px]"
                              title="تحريك لأعلى"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={pIdx === arr.length - 1}
                              onClick={() => handleReorderProject(p.id, 'down')}
                              className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-25 text-[10px]"
                              title="تحريك لأسفل"
                            >
                              ▼
                            </button>
                          </div>
                          <button onClick={() => handleOpenEditProject(p)} className="p-1.5 text-gray-500 hover:text-[#d4af37] hover:bg-amber-50 rounded" title="تعديل"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if(window.confirm('حذف هذا المشروع نهائياً؟')) deleteProject(p.id); }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Kitchen Design Requests */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5">طلبات تصميم مطابخ مخصصة ({designRequests.filter(r => r.projectType === 'مطابخ').length})</h4>
                <div className="space-y-3">
                  {designRequests.filter(r => r.projectType === 'مطابخ').map(r => (
                    <div key={r.id} className="p-3 border border-gray-100 rounded-xl flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <h5 className="text-xs font-black text-gray-900">{r.name}</h5>
                        <p className="text-[10px] text-gray-400">الهاتف: {r.phone} • المساحة: {r.area}</p>
                      </div>
                      <button onClick={() => handleOpenRequest(r)} className="px-3 py-1 bg-[#171714] text-[#d4af37] text-[10px] font-bold rounded">إدارة الطلب</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUB TAB: DRESSING ==================== */}
        {activeSubTab === 'dressing' && (
          <div className="space-y-8 text-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Dressing Projects */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5">
                    مشاريع غرف ملابس ودريسنج روم ({projects.filter(p => p.category === 'غرف ملابس').length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleOpenAddProjectForCategory('غرف ملابس')}
                    className="px-3 py-1.5 bg-[#171714] text-[#d4af37] hover:bg-black text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة مشروع جديد
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {projects
                    .filter(p => p.category === 'غرف ملابس')
                    .sort((a, b) => {
                      const idxA = typeof a.orderIndex === 'number' ? a.orderIndex : 999999;
                      const idxB = typeof b.orderIndex === 'number' ? b.orderIndex : 999999;
                      if (idxA !== idxB) return idxA - idxB;
                      return b.createdAt - a.createdAt;
                    })
                    .map((p, pIdx, arr) => (
                      <div key={p.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3 relative hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          <img src={p.coverImage} className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-inner" />
                          <div>
                            <h5 className="text-xs font-bold text-gray-900">{p.title}</h5>
                            <p className="text-[10px] text-gray-400">{p.city} • {p.area}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Reordering Controls */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={pIdx === 0}
                              onClick={() => handleReorderProject(p.id, 'up')}
                              className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-25 text-[10px]"
                              title="تحريك لأعلى"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={pIdx === arr.length - 1}
                              onClick={() => handleReorderProject(p.id, 'down')}
                              className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-25 text-[10px]"
                              title="تحريك لأسفل"
                            >
                              ▼
                            </button>
                          </div>
                          <button onClick={() => handleOpenEditProject(p)} className="p-1.5 text-gray-500 hover:text-[#d4af37] hover:bg-amber-50 rounded" title="تعديل"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if(window.confirm('حذف هذا المشروع نهائياً؟')) deleteProject(p.id); }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Dressing Design Requests */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5">طلبات غرف ملابس مخصصة ({designRequests.filter(r => r.projectType === 'غرف ملابس').length})</h4>
                <div className="space-y-3">
                  {designRequests.filter(r => r.projectType === 'غرف ملابس').map(r => (
                    <div key={r.id} className="p-3 border border-gray-100 rounded-xl flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <h5 className="text-xs font-black text-gray-900">{r.name}</h5>
                        <p className="text-[10px] text-gray-400">الهاتف: {r.phone} • المساحة: {r.area}</p>
                      </div>
                      <button onClick={() => handleOpenRequest(r)} className="px-3 py-1 bg-[#171714] text-[#d4af37] text-[10px] font-bold rounded">إدارة الطلب</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUB TAB: WOOD ==================== */}
        {activeSubTab === 'wood' && (
          <div className="space-y-8 text-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Wood Projects */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5">
                    مشاريع الديكورات الخشبية ({projects.filter(p => p.category === 'ديكورات خشبية').length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleOpenAddProjectForCategory('ديكورات خشبية')}
                    className="px-3 py-1.5 bg-[#171714] text-[#d4af37] hover:bg-black text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    إضافة مشروع جديد
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto pr-1">
                  {projects
                    .filter(p => p.category === 'ديكورات خشبية')
                    .sort((a, b) => {
                      const idxA = typeof a.orderIndex === 'number' ? a.orderIndex : 999999;
                      const idxB = typeof b.orderIndex === 'number' ? b.orderIndex : 999999;
                      if (idxA !== idxB) return idxA - idxB;
                      return b.createdAt - a.createdAt;
                    })
                    .map((p, pIdx, arr) => (
                      <div key={p.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between gap-3 relative hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          <img src={p.coverImage} className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-inner" />
                          <div>
                            <h5 className="text-xs font-bold text-gray-900">{p.title}</h5>
                            <p className="text-[10px] text-gray-400">{p.city} • {p.area}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Reordering Controls */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={pIdx === 0}
                              onClick={() => handleReorderProject(p.id, 'up')}
                              className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-25 text-[10px]"
                              title="تحريك لأعلى"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={pIdx === arr.length - 1}
                              onClick={() => handleReorderProject(p.id, 'down')}
                              className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-25 text-[10px]"
                              title="تحريك لأسفل"
                            >
                              ▼
                            </button>
                          </div>
                          <button onClick={() => handleOpenEditProject(p)} className="p-1.5 text-gray-500 hover:text-[#d4af37] hover:bg-amber-50 rounded" title="تعديل"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { if(window.confirm('حذف هذا المشروع نهائياً؟')) deleteProject(p.id); }} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Wood Design Requests */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5">طلبات الديكورات الخشبية ({designRequests.filter(r => r.projectType === 'ديكورات خشبية').length})</h4>
                <div className="space-y-3">
                  {designRequests.filter(r => r.projectType === 'ديكورات خشبية').map(r => (
                    <div key={r.id} className="p-3 border border-gray-100 rounded-xl flex justify-between items-center hover:bg-gray-50">
                      <div>
                        <h5 className="text-xs font-black text-gray-900">{r.name}</h5>
                        <p className="text-[10px] text-gray-400">الهاتف: {r.phone} • المساحة: {r.area}</p>
                      </div>
                      <button onClick={() => handleOpenRequest(r)} className="px-3 py-1 bg-[#171714] text-[#d4af37] text-[10px] font-bold rounded">إدارة الطلب</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SUB TAB: PROJECTS ==================== */}
        {activeSubTab === 'projects' && (
          <div className="space-y-6 text-right">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 flex-wrap gap-4">
              <button 
                onClick={() => handleOpenAddProjectForCategory('غرف نوم')} 
                className="px-4 py-2.5 bg-[#171714] text-[#d4af37] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-black transition-all"
              >
                <Plus className="w-4 h-4" />
                إضافة مشروع جديد
              </button>
              <h3 className="text-base font-black text-gray-900 border-r-2 border-[#d4af37] pr-2.5">إدارة معرض الأعمال والمقارنات العامة ({projects.length} مشروع)</h3>
            </div>

            {/* Existing Projects grid list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects
                .sort((a, b) => {
                  const idxA = typeof a.orderIndex === 'number' ? a.orderIndex : 999999;
                  const idxB = typeof b.orderIndex === 'number' ? b.orderIndex : 999999;
                  if (idxA !== idxB) return idxA - idxB;
                  return b.createdAt - a.createdAt;
                })
                .map((p, pIdx, arr) => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                    <div className="flex gap-3 text-right">
                      <img src={p.coverImage} className="w-16 h-16 rounded-xl object-cover border" />
                      <div className="space-y-1 flex-1 min-w-0">
                        <span className="px-2 py-0.5 bg-[#d4af37]/10 text-[#d4af37] text-[9px] font-black rounded">{p.category}</span>
                        <h4 className="text-xs font-bold text-gray-900 truncate">{p.title}</h4>
                        <p className="text-[10px] text-gray-400 truncate">{p.city}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] border-t border-gray-100 pt-3 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Reordering Controls */}
                        <div className="flex gap-1 bg-gray-50 border rounded-lg p-0.5">
                          <button
                            type="button"
                            disabled={pIdx === 0}
                            onClick={() => handleReorderProject(p.id, 'up')}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-25 text-[9px]"
                            title="تحريك لأعلى"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={pIdx === arr.length - 1}
                            onClick={() => handleReorderProject(p.id, 'down')}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-25 text-[9px]"
                            title="تحريك لأسفل"
                          >
                            ▼
                          </button>
                        </div>
                        <span>مساحة: <strong>{p.area}</strong></span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenEditProject(p)} className="p-1.5 hover:bg-[#d4af37]/10 rounded text-gray-400 hover:text-[#d4af37]" title="تعديل"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { if(window.confirm('حذف هذا المشروع؟')) deleteProject(p.id); }} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600" title="حذف"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ==================== SUB TAB: CLIENT REQUESTS (Inbox) ==================== */}
        {activeSubTab === 'requests' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-gray-900 font-sans border-r-2 border-[#d4af37] pr-2.5">صندوق طلبات العملاء الموحد ({filteredInboxItems.length} طلبات مطابقة)</h3>
              
              {/* Search and Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <input
                  type="text"
                  placeholder="ابحث باسم العميل، رقم الهاتف، أو رقم الطلب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#d4af37] outline-none"
                />
                <select value={filterStatus} onChange={(e: any) => setFilterStatus(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold">
                  <option value="All">جميع الحالات</option>
                  <option value="New">جديد ومفتوح (New)</option>
                  <option value="Under Review">قيد المراجعة والدراسة</option>
                  <option value="Contacted">تم التواصل والاتصال</option>
                  <option value="Approved">موافق عليه ومؤكد</option>
                  <option value="In Progress">قيد التصميم والتنفيذ</option>
                  <option value="Completed">مكتمل بالكامل (Completed)</option>
                  <option value="Rejected">مرفوض مع تبرير السبب</option>
                </select>
                <select value={filterInboxType} onChange={(e: any) => setFilterInboxType(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold">
                  <option value="All">جميع أنواع الطلبات</option>
                  <option value="Standard">طلبات تصميم عامة</option>
                  <option value="Bedroom">استمارات مختبر غرف النوم</option>
                </select>
              </div>
            </div>

            {/* List of filtered Inbox items */}
            {filteredInboxItems.length === 0 ? (
              <div className="p-20 text-center bg-white rounded-3xl border border-gray-150">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-gray-700">لا توجد نتائج بحث مطابقة للمرشحات الحالية</h4>
                <p className="text-xs text-gray-400">يرجى تعديل الكلمات البحثية أو تصفير المرشحات.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredInboxItems.map((item) => (
                  <div key={item.id} className={`bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 relative ${!item.viewed ? 'border-r-4 border-r-[#d4af37] bg-gradient-to-l from-amber-50/5 via-white to-white' : ''}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-gray-900">{item.clientName}</h4>
                          <span className="text-[9px] font-black font-mono px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {item.requestNumber || 'بدون رقم'}
                          </span>
                          {!item.viewed && (
                            <span className="text-[8px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded animate-pulse">
                              جديد ومستجد
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">
                          بتاريخ: {new Date(item.createdAt).toLocaleDateString('ar-IQ')} • الهاتف: <span className="font-mono text-gray-700">{item.clientPhone}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Select dropdown */}
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, item.inboxType === 'Bedroom' ? 'bedroom' : 'standard', e.target.value as RequestStatus)}
                          className={`p-2 rounded text-[11px] font-bold border outline-none cursor-pointer ${getStatusBadgeClass(item.status)}`}
                        >
                          <option value="New">جديد (New)</option>
                          <option value="Under Review">قيد المراجعة</option>
                          <option value="Contacted">تم التواصل</option>
                          <option value="Approved">موافق عليه</option>
                          <option value="In Progress">قيد التنفيذ</option>
                          <option value="Completed">مكتمل</option>
                          <option value="Rejected">مرفوض (Rejected)</option>
                        </select>

                        {/* WhatsApp / Calling Shortcuts */}
                        <a href={getWhatsAppLink(item.clientPhone, item.requestNumber)} target="_blank" rel="noopener noreferrer" className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all" title="تواصل واتساب">
                          <MessageSquare className="w-4 h-4" />
                        </a>
                        <a href={getTelLink(item.clientPhone)} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all" title="اتصال مباشر">
                          <Phone className="w-4 h-4" />
                        </a>

                        {/* Action View Detail modal */}
                        <button
                          onClick={() => item.inboxType === 'Bedroom' ? handleOpenSubmission(item as any) : handleOpenRequest(item as any)}
                          className="px-3 py-2 bg-[#171714] text-white hover:text-[#d4af37] text-[10px] font-bold rounded-lg"
                        >
                          عرض ومعالجة الملف الفني
                        </button>
                      </div>
                    </div>

                    {/* Metadata Overview summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 text-right">
                      {item.inboxType === 'Standard' ? (
                        <>
                          <div>الموقع: <strong className="text-gray-900">{(item as any).city}</strong></div>
                          <div>نوع المساحة: <strong className="text-gray-900">{(item as any).projectType}</strong></div>
                          <div>المساحة المقدرة: <strong className="text-gray-900">{(item as any).area}</strong></div>
                          <div>الميزانية: <strong className="text-[#d4af37] font-bold">{(item as any).budget}</strong></div>
                        </>
                      ) : (
                        <>
                          <div>النوع: <strong className="text-gray-900">مختبر غرف النوم الملكية</strong></div>
                          <div>الخيارات المحددة: <strong className="text-gray-900 font-mono">{Object.keys((item as any).selections || {}).length} خيارات</strong></div>
                          <div className="col-span-2">الملاحظات: <strong className="text-gray-400 italic">تم إرسالها عبر مختبر الرندر المباشر</strong></div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== SUB TAB: SETTINGS & COLOR LAB ==================== */}
        {activeSubTab === 'settings' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Company Profile Settings */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5">بيانات معلومات الشركة والاتصال</h4>
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">العنوان الرسمي</label>
                    <input type="text" value={compAddress} onChange={(e) => setCompAddress(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">رقم الهاتف الأساسي</label>
                      <input type="text" value={compPhone} onChange={(e) => setCompPhone(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-left font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-600">رقم الواتساب الرسمي</label>
                      <input type="text" value={compWhatsapp} onChange={(e) => setCompWhatsapp(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-left font-mono" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">قصة ونبذة عن رويال جروب (رويال جروب في سطور)</label>
                    <textarea rows={4} value={compAbout} onChange={(e) => setCompAbout(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl resize-none leading-relaxed" />
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <h5 className="font-bold mb-3">روابط حسابات التواصل الاجتماعي</h5>
                    <div className="space-y-3">
                      <input type="text" value={socialInsta} onChange={(e) => setSocialInsta(e.target.value)} placeholder="رابط انستقرام" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-left font-mono" />
                      <input type="text" value={socialFb} onChange={(e) => setSocialFb(e.target.value)} placeholder="رابط فيسبوك" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-left font-mono" />
                      <input type="text" value={socialTk} onChange={(e) => setSocialTk(e.target.value)} placeholder="رابط تيك توك" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-left font-mono" />
                      <input type="text" value={socialYt} onChange={(e) => setSocialYt(e.target.value)} placeholder="رابط يوتيوب" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-left font-mono" />
                    </div>
                  </div>
                  <div className="pt-3 flex justify-end">
                    <button type="button" onClick={handleSaveSettings} className="px-6 py-2.5 bg-[#171714] text-[#d4af37] font-bold rounded-xl flex items-center gap-1.5"><Save className="w-4 h-4" /> حفظ الإعدادات</button>
                  </div>
                </div>
              </div>

              {/* Color Lab Variants manager */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5">إدارة خامات مختبر تجربة الألوان</h4>
                <form onSubmit={handleAddColor} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold">اسم اللون / الخامة</label>
                      <input type="text" required value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="مثال: خشب الجوز" className="w-full p-2 bg-white border border-gray-200 rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold">الخامة</label>
                      <select value={colorType} onChange={(e) => setColorType(e.target.value as any)} className="w-full p-2 bg-white border border-gray-200 rounded-lg font-bold">
                        <option value="wood">خشب (Wood)</option>
                        <option value="marble">رخام (Marble)</option>
                        <option value="wall">جدران (Wall)</option>
                        <option value="flooring">أرضيات (Flooring)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold">كود اللون (Hex)</label>
                      <div className="flex gap-2">
                        <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
                        <input type="text" required value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="flex-1 p-1 bg-white border border-gray-200 rounded font-mono text-center" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold">رابط صورة الرندر</label>
                      <input type="text" value={colorUrl} onChange={(e) => setColorUrl(e.target.value)} placeholder="https://..." className="w-full p-2 bg-white border border-gray-200 rounded-lg" />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button type="submit" className="px-4 py-2 bg-[#171714] text-[#d4af37] rounded-lg font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> حفظ الخامة</button>
                  </div>
                </form>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {colorVariants.map(color => (
                    <div key={color.id} className="bg-gray-50 p-2 rounded-xl border border-gray-100 text-center relative">
                      <img src={color.image} className="w-full h-16 object-cover rounded-lg mb-1" />
                      <h5 className="text-[10px] font-bold text-gray-900 truncate">{color.name}</h5>
                      <span className="text-[8px] bg-white border px-1 py-0.2 rounded font-mono uppercase">{color.type}</span>
                      <button type="button" onClick={() => handleDeleteColor(color.id)} className="absolute top-1 left-1 p-1 bg-white/85 text-red-600 hover:bg-red-50 rounded shadow-sm border"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== MODAL: DETAILS VIEW ==================== */}
      <AnimatePresence>
        {(selectedRequest || selectedSubmission) && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white rounded-3xl border border-[#d4af37]/35 overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-right"
            >
              {/* Modal Header */}
              <div className="p-5 bg-[#171714] text-white flex justify-between items-center border-b border-[#d4af37]/25">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-[#d4af37]" />
                  <h3 className="text-sm font-black">
                    تفاصيل ملف الطلب: {selectedRequest ? selectedRequest.requestNumber : selectedSubmission?.requestNumber}
                  </h3>
                </div>
                <button
                  onClick={() => { setSelectedRequest(null); setSelectedSubmission(null); }}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 text-xs">
                {/* 1. Technical specs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-2xl border border-gray-150">
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2">معلومات العميل والاتصال</h4>
                    <p>الاسم الكامل: <strong>{selectedRequest ? selectedRequest.name : selectedSubmission?.clientName}</strong></p>
                    <p>رقم الهاتف: <strong className="font-mono text-gray-700">{selectedRequest ? selectedRequest.phone : selectedSubmission?.clientPhone}</strong></p>
                    <p>تاريخ الإرسال: <strong>{new Date(selectedRequest ? selectedRequest.createdAt : selectedSubmission!.createdAt).toLocaleString('ar-IQ')}</strong></p>
                    <p>الحالة الحالية للطلب: 
                      <span className={`mr-2 px-2.5 py-1 rounded border text-[10px] font-black ${getStatusBadgeClass(selectedRequest ? selectedRequest.status : selectedSubmission!.status)}`}>
                        {translateStatus(selectedRequest ? selectedRequest.status : selectedSubmission!.status)}
                      </span>
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2">المواصفات الهندسية المطلوبة</h4>
                    {selectedRequest ? (
                      <>
                        <p>المدينة / الموقع: <strong>{selectedRequest.city}</strong></p>
                        <p>نوع الفراغ: <strong>{selectedRequest.projectType}</strong></p>
                        <p>المساحة الإجمالية: <strong>{selectedRequest.area}</strong></p>
                        <p>الميزانية المرصودة: <strong className="text-[#d4af37] font-black">{selectedRequest.budget}</strong></p>
                      </>
                    ) : (
                      <>
                        <p>القسم: <strong>مختبر غرف النوم الملكية الفاخرة</strong></p>
                        <p>الخيارات المحددة بالاستمارة: <strong>{Object.keys(selectedSubmission?.selections || {}).length} أقسام</strong></p>
                        <p>تتبع الأكواد: <strong className="text-[#d4af37] font-mono">{selectedSubmission?.id}</strong></p>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Custom Selections if it is a bedroom submission */}
                {selectedSubmission && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2">الخيارات التصميمية المنتقاة للسرير والغرفة</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {Object.entries(selectedSubmission.selections || {}).map(([secKey, sel]: [string, any]) => (
                        <div key={secKey} className="bg-white p-2.5 border border-gray-150 rounded-xl space-y-1.5 text-center">
                          <span className="text-[9px] font-extrabold text-[#aa7c11] block">
                            {SECTIONS_METADATA.find(s => s.key === secKey)?.title || secKey}
                          </span>
                          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/5">
                            <img src={sel.image} alt={sel.name} className="w-full h-full object-cover" />
                          </div>
                          <h5 className="text-[10px] font-bold text-gray-800 truncate" title={sel.name}>{sel.name}</h5>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Blueprints and Site Photos (Standard Requests Only) */}
                {selectedRequest && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-gray-100">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block mb-2">المخططات الهندسية المرفقة</span>
                      {selectedRequest.plansUrl && selectedRequest.plansUrl.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.plansUrl.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-gray-100 border p-2 rounded-lg font-bold">
                              <FileText className="w-4 h-4 text-[#d4af37]" />
                              <span>المخطط {idx + 1} <ExternalLink className="w-3 h-3 text-gray-400 inline" /></span>
                            </a>
                          ))}
                        </div>
                      ) : <span className="text-[10px] text-gray-400 italic">لم يرفق أي مخطط.</span>}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block mb-2">صور موقع البناء الحالي المرفقة</span>
                      {selectedRequest.imageUrl && selectedRequest.imageUrl.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.imageUrl.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-gray-100 border p-2 rounded-lg font-bold">
                              <ImageIcon className="w-4 h-4 text-[#d4af37]" />
                              <span>الصورة {idx + 1} <ExternalLink className="w-3 h-3 text-gray-400 inline" /></span>
                            </a>
                          ))}
                        </div>
                      ) : <span className="text-[10px] text-gray-400 italic">لم ترفق أي صور للموقع الحالي.</span>}
                    </div>
                  </div>
                )}

                {/* 4. REJECTION REASON DISPLAY */}
                {(selectedRequest?.status === 'Rejected' || selectedSubmission?.status === 'Rejected') && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-2">
                    <div className="flex items-center gap-2 font-black text-xs text-red-700">
                      <AlertTriangle className="w-4.5 h-4.5" />
                      <span>تنبيه: تم رفض هذا الطلب مسبقاً من قِبل الإدارة</span>
                    </div>
                    <p>سبب الرفض المعتمد: <strong>
                      {selectedRequest ? selectedRequest.rejectionReason : selectedSubmission?.rejectionReason}
                    </strong></p>
                    <p>الملاحظات الإضافية للرفض: <span className="italic">
                      {selectedRequest ? selectedRequest.rejectionNotes : selectedSubmission?.rejectionNotes || 'لا توجد'}
                    </span></p>
                  </div>
                )}

                {/* 5. Engineer Notes Editor & Updates */}
                <div className="space-y-2.5 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gray-800">ملاحظات المهندس وإشعارات الإدارة (تظهر للعميل في صفحة تتبع الطلب):</label>
                    <button onClick={handleSaveAdminNotes} className="px-4 py-1.5 bg-[#171714] text-[#d4af37] border border-[#d4af37]/45 rounded-lg font-bold hover:bg-black">
                      حفظ وتحديث ملاحظات الإدارة
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="مثال: نقوم الآن بدراسة المخطط وسنتصل بكم عبر الواتساب لتأكيد موعد اللقاء الهندسي الأول..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl resize-none outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-5 bg-gray-50 border-t border-gray-150 flex justify-between items-center flex-wrap gap-4">
                <div className="flex gap-2">
                  <a
                    href={getWhatsAppLink(selectedRequest ? selectedRequest.phone : selectedSubmission!.clientPhone, selectedRequest ? selectedRequest.requestNumber : selectedSubmission?.requestNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>تواصل واتساب</span>
                  </a>
                  <a
                    href={getTelLink(selectedRequest ? selectedRequest.phone : selectedSubmission!.clientPhone)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Phone className="w-4 h-4" />
                    <span>اتصال بالعميل</span>
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-gray-500">تحديث فوري للحالة:</span>
                  <select
                    value={selectedRequest ? selectedRequest.status : selectedSubmission?.status}
                    onChange={(e) => handleStatusChange(selectedRequest ? selectedRequest.id : selectedSubmission!.id, selectedRequest ? 'standard' : 'bedroom', e.target.value as RequestStatus)}
                    className="p-2 border border-gray-300 rounded-lg text-xs font-bold bg-white"
                  >
                    <option value="New">جديد ومفتوح</option>
                    <option value="Under Review">قيد المراجعة</option>
                    <option value="Contacted">تم التواصل والاتصال</option>
                    <option value="Approved">موافق عليه</option>
                    <option value="In Progress">قيد التنفيذ</option>
                    <option value="Completed">مكتمل</option>
                    <option value="Rejected">مرفوض</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: REJECTION CONFIRMATION ==================== */}
      <AnimatePresence>
        {rejectionModalOpen && rejectionTarget && (
          <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white rounded-3xl border border-red-500/50 overflow-hidden shadow-2xl p-6 space-y-6 text-right"
            >
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-sm font-black">تفاصيل رفض الطلب في رويال جروب</h3>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                يرجى تبرير سبب رفض هذا الطلب. هذا السبب والملاحظات ستتم كتابتها في قاعدة البيانات لتظهر للعميل فوراً عند الاستعلام عن طلبه برقم الطلب.
              </p>

              <div className="space-y-4 text-xs">
                {/* Rejection Preset selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 block">اختر سبب الرفض الرئيسي:</label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value as RejectionReason)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                  >
                    <option value="Outside our scope">خارج نطاق أعمالنا / تخصصنا</option>
                    <option value="Missing project information">نقص في المخططات أو معلومات المشروع</option>
                    <option value="Schedule fully booked">جدول العمل ممتلئ بالكامل حالياً</option>
                    <option value="Budget mismatch">الميزانية المرصودة غير متطابقة مع معاييرنا</option>
                    <option value="Other">أسباب أخرى (موضحة أدناه)</option>
                  </select>
                </div>

                {/* Custom rejection details */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 block">شرح تفصيلي أو ملاحظات إضافية:</label>
                  <textarea
                    rows={4}
                    value={customRejectionNotes}
                    onChange={(e) => setCustomRejectionNotes(e.target.value)}
                    placeholder="مثال: نشكركم لاهتمامكم برويال جروب. نعتذر منكم لعدم إمكانية تلبية طلبكم حالياً بسبب امتلاء جدول المهندسين لهذا الشهر..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:bg-white leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setRejectionModalOpen(false); setRejectionTarget(null); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-bold"
                >
                  تراجع عن الرفض
                </button>
                <button
                  type="button"
                  onClick={confirmRejection}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/10"
                >
                  تأكيد رفض الطلب نهائياً
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: PROJECT ADD/EDIT OVERLAY ==================== */}
      <AnimatePresence>
        {showProjectForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-white w-full max-w-4xl rounded-3xl border border-gray-100 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col text-right"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <button
                  type="button"
                  onClick={resetProjectForm}
                  className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 cursor-pointer transition-all"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-sm font-black text-gray-900 border-r-2 border-[#d4af37] pr-2.5">
                  {editingProject ? `تعديل مشروع: ${editingProject.title}` : 'تفاصيل المشروع الملكي الجديد'}
                </h3>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-xs">
                <form onSubmit={handleSaveProject} className="space-y-6">
                  {/* Basic text specs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="font-extrabold text-gray-700">عنوان المشروع (اسم المشروع) *</label>
                      <input
                        type="text"
                        required
                        value={projTitle}
                        onChange={(e) => setProjTitle(e.target.value)}
                        placeholder="أدخل اسماً فريداً ومعبراً للمشروع"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-gray-700">القسم / التصنيف *</label>
                        <select
                          value={projCategory}
                          onChange={(e) => setProjCategory(e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs"
                        >
                          <option value="غرف نوم">غرف نوم (Bedrooms)</option>
                          <option value="مطابخ">مطابخ (Kitchens)</option>
                          <option value="غرف ملابس">غرف ملابس (Dressing)</option>
                          <option value="ديكورات خشبية">ديكورات خشبية (Wood)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-gray-700">تثبيت بالرئيسية</label>
                        <div className="flex items-center h-[46px] pr-2">
                          <input
                            type="checkbox"
                            checked={projFeatured}
                            onChange={(e) => setProjFeatured(e.target.checked)}
                            className="w-4 h-4 rounded text-[#d4af37] focus:ring-[#d4af37]"
                          />
                          <span className="text-xs font-bold text-gray-700 mr-2">مشروع مميز (Featured)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="font-extrabold text-gray-700">مساحة المشروع الإجمالية *</label>
                      <input
                        type="text"
                        required
                        value={projArea}
                        onChange={(e) => setProjArea(e.target.value)}
                        placeholder="مثال: 120 م² أو 5×4 م"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-extrabold text-gray-700">المدينة والموقع *</label>
                      <input
                        type="text"
                        required
                        value={projCity}
                        onChange={(e) => setProjCity(e.target.value)}
                        placeholder="مثال: بغداد - حي المنصور"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-gray-700">الوصف الهندسي والتفاصيل الفنية *</label>
                    <textarea
                      rows={4}
                      required
                      value={projDesc}
                      onChange={(e) => setProjDesc(e.target.value)}
                      placeholder="صفحة تفاصيل المشروع: يرجى كتابة تفاصيل الأخشاب المستخدمة، الخامات والمواصفات الكاملة..."
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:bg-white leading-relaxed"
                    />
                  </div>

                  {/* Primary Cover URL and Preview */}
                  <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-150">
                    <label className="font-extrabold text-xs text-gray-700 block">رابط الصورة الرئيسية للمشروع (Cover Image URL) *</label>
                    {projCoverUrl && (
                      <div className="w-full h-40 rounded-xl overflow-hidden bg-black/5 relative border border-gray-200 shadow-inner mb-3">
                        <img
                          src={projCoverUrl}
                          className="w-full h-full object-cover"
                          alt="Cover Preview"
                        />
                        <button
                          type="button"
                          onClick={() => setProjCoverUrl('')}
                          className="absolute top-2 left-2 px-2 py-1 bg-red-600/95 text-white rounded-lg text-[10px] font-bold"
                        >
                          إزالة الصورة
                        </button>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        required
                        value={projCoverUrl}
                        onChange={(e) => setProjCoverUrl(e.target.value)}
                        placeholder="ضع رابط صورة الغلاف المباشر هنا (مثال: https://example.com/cover.jpg)"
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs text-left font-mono outline-none focus:border-[#d4af37]"
                      />
                      <p className="text-[10px] text-gray-400">ملاحظة: يدعم روابط الصور من أي موقع أو خادم مباشر.</p>
                    </div>
                  </div>

                  {/* Before and After Comparers (URLs only) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Before Image URL */}
                    <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-150">
                      <label className="font-extrabold text-xs text-red-700 block font-sans">رابط صورة قبل العمل والتنفيذ (Before Image URL) - اختياري</label>
                      {projBeforeUrl && (
                        <div className="w-full h-36 rounded-xl overflow-hidden bg-black/5 relative border border-gray-200 shadow-inner mb-3">
                          <img
                            src={projBeforeUrl}
                            className="w-full h-full object-cover"
                            alt="Before Preview"
                          />
                          <button
                            type="button"
                            onClick={() => setProjBeforeUrl('')}
                            className="absolute top-2 left-2 px-2 py-1 bg-red-600/95 text-white rounded-lg text-[10px] font-bold"
                          >
                            إزالة
                          </button>
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={projBeforeUrl}
                          onChange={(e) => setProjBeforeUrl(e.target.value)}
                          placeholder="رابط صورة قبل التنفيذ (اختياري)..."
                          className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-[11px] text-left font-mono outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    {/* After Image URL */}
                    <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-150">
                      <label className="font-extrabold text-xs text-[#d4af37] block font-sans">رابط صورة بعد العمل والتنفيذ (After Image URL) - اختياري</label>
                      {projAfterUrl && (
                        <div className="w-full h-36 rounded-xl overflow-hidden bg-black/5 relative border border-gray-200 shadow-inner mb-3">
                          <img
                            src={projAfterUrl}
                            className="w-full h-full object-cover"
                            alt="After Preview"
                          />
                          <button
                            type="button"
                            onClick={() => setProjAfterUrl('')}
                            className="absolute top-2 left-2 px-2 py-1 bg-red-600/95 text-white rounded-lg text-[10px] font-bold"
                          >
                            إزالة
                          </button>
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={projAfterUrl}
                          onChange={(e) => setProjAfterUrl(e.target.value)}
                          placeholder="رابط صورة بعد التنفيذ (اختياري)..."
                          className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-[11px] text-left font-mono outline-none focus:border-[#d4af37]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multi Gallery URLs */}
                  <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-150">
                    <label className="font-extrabold text-xs text-gray-700 block">معرض صور إضافية للمشروع (Gallery Image URLs) *</label>
                    {projGalleryUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 p-3 bg-white border border-gray-200 rounded-xl mb-3">
                        {projGalleryUrls.map((url, i) => (
                          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-150 group shadow-sm bg-gray-50">
                            <img src={url} className="w-full h-full object-cover" alt="Gallery preview" />
                            <button
                              type="button"
                              onClick={() => setProjGalleryUrls(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-[10px] transition-all"
                            >
                              إزالة
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Paste area for multiple URLs */}
                      <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                        <label className="font-bold text-[10px] text-gray-500 block">إضافة روابط متعددة دفعة واحدة (رابط في كل سطر أو مفصولة بفواصل)</label>
                        <textarea
                          id="bulkGalleryUrls"
                          rows={2}
                          placeholder="انسخ روابط الصور هنا...&#10;https://example.com/img1.jpg&#10;https://example.com/img2.jpg"
                          className="w-full p-2 text-[11px] font-mono text-left bg-gray-50 border rounded-lg resize-none outline-none focus:bg-white focus:border-[#d4af37]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const txtArea = document.getElementById('bulkGalleryUrls') as HTMLTextAreaElement;
                            if (txtArea && txtArea.value.trim()) {
                              const lines = txtArea.value.split(/[\n,]+/).map(line => line.trim()).filter(line => line.length > 0);
                              if (lines.length > 0) {
                                setProjGalleryUrls(p => [...p, ...lines]);
                                txtArea.value = '';
                                showFeedback(`تم إضافة ${lines.length} رابط إلى المعرض.`);
                              }
                            }
                          }}
                          className="w-full py-1.5 bg-[#171714] text-[#d4af37] rounded-lg font-bold text-[10px] hover:bg-black transition-all"
                        >
                          إضافة هذه الروابط للمعرض
                        </button>
                      </div>

                      {/* Direct add link helper */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="addGalInputModal"
                          placeholder="أو أضف رابط صورة مباشر واحد..."
                          className="flex-1 p-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none font-mono text-left"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const inp = document.getElementById('addGalInputModal') as HTMLInputElement;
                            if (inp && inp.value.trim()) {
                              setProjGalleryUrls(p => [...p, inp.value.trim()]);
                              inp.value = '';
                            }
                          }}
                          className="px-4 py-2 bg-[#171714] text-[#d4af37] rounded-xl font-bold text-xs"
                        >
                          إضافة
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-400">سيتم حفظ معرض الصور نهائياً عند حفظ المشروع بالكامل.</p>
                    </div>
                  </div>

                  {/* Submission and Close buttons */}
                  <div className="flex justify-end gap-3 pt-5 border-t border-gray-150 bg-gray-50/50 p-4 -mx-8 -mb-8 rounded-b-3xl">
                    <button
                      type="button"
                      onClick={resetProjectForm}
                      className="px-5 py-2.5 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-bold"
                    >
                      إلغاء التعديل
                    </button>
                    <button
                      type="submit"
                      disabled={globalLoading}
                      className="px-8 py-2.5 bg-[#171714] text-[#d4af37] hover:bg-black rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {globalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{editingProject ? 'تحديث وتأكيد التغييرات' : 'حفظ المشروع ونشره بالمعرض'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
