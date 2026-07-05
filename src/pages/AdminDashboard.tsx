/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { Project, ColorVariant, DesignRequest, BedroomOption, BedroomSubmission, RequestStatus, RejectionReason, Engineer, TicketStatus } from '../types';
import { 
  Plus, Edit2, Trash2, Check, Star, Settings, Image as ImageIcon, Link as LinkIcon, 
  MapPin, MessageSquare, ClipboardList, Palette, Sliders, LogOut, FileText, Loader2, Save,
  Crown, Phone, X, Calendar, User, CheckCircle2, AlertTriangle, ExternalLink, Mail, Activity
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
    engineers, addEngineer, updateEngineer, deleteEngineer,
    addProject, updateProject, deleteProject, 
    updateDesignRequestStatus, updateCompanySettings, updateSocialLinks, 
    addColorVariant, deleteColorVariant, uploadFile,
    addBedroomOption, updateBedroomOption, deleteBedroomOption,
    updateBedroomSubmissionStatus, deleteBedroomSubmission,
    tickets, messages, updateTicketStatus, assignTicket, deleteTicket, sendTicketMessage
  } = useFirebaseState();

  // Navigation Subtabs
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'bedrooms' | 'kitchens' | 'dressing' | 'wood' | 'projects' | 'requests' | 'settings' | 'engineers' | 'tickets'>('dashboard');

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

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

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

  // Engineer Management state variables
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);
  const [engName, setEngName] = useState('');
  const [engEmail, setEngEmail] = useState('');
  const [engPhone, setEngPhone] = useState('');
  const [engSpecialization, setEngSpecialization] = useState('');
  const [engActive, setEngActive] = useState(true);
  const [engCurrentTickets, setEngCurrentTickets] = useState(0);
  const [engCurrentProjects, setEngCurrentProjects] = useState(0);
  const [showEngineerForm, setShowEngineerForm] = useState(false);

  // Engineer assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{ id: string; type: 'standard' | 'bedroom' } | null>(null);

  // Unified Central Inbox Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | RequestStatus>('All');
  const [filterInboxType, setFilterInboxType] = useState<'All' | 'Standard' | 'Bedroom'>('All');

  // Ticket Management States
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | TicketStatus>('all');
  const [activeAdminTicketId, setActiveAdminTicketId] = useState<string | null>(null);
  const [transferTicketId, setTransferTicketId] = useState<string | null>(null);
  const [adminChatMessageText, setAdminChatMessageText] = useState('');
  const [adminChatFiles, setAdminChatFiles] = useState<File[]>([]);
  const [isSendingAdminMessage, setIsSendingAdminMessage] = useState(false);

  const handleAdminFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setAdminChatFiles(prev => [...prev, ...fileList]);
    }
  };

  const handleSendAdminChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdminTicketId) return;
    if (!adminChatMessageText.trim() && adminChatFiles.length === 0) return;

    setIsSendingAdminMessage(true);
    try {
      const msgPayload = {
        ticketId: activeAdminTicketId,
        senderId: 'admin',
        senderName: 'المدير العام',
        senderRole: 'admin' as const,
        content: adminChatMessageText
      };

      await sendTicketMessage(msgPayload, adminChatFiles);
      setAdminChatMessageText('');
      setAdminChatFiles([]);
    } catch (err) {
      console.error(err);
      showFeedback('حدث خطأ أثناء إرسال الرسالة', 'error');
    } finally {
      setIsSendingAdminMessage(false);
    }
  };

  const getTicketStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            مفتوحة
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
            قيد المعالجة
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            قيد المراجعة الفنية
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            مغلقة / مكتملة
          </span>
        );
      default:
        return null;
    }
  };

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

  // ASSIGN ENGINEER AND APPROVE TICKET FLOW
  const handleAssignAndApprove = async (engineerId: string | null) => {
    if (!assignTarget) return;
    const { id, type } = assignTarget;
    try {
      setGlobalLoading(true);
      const fields: any = { status: 'Approved' };
      if (engineerId) {
        const eng = engineers?.find(e => e.id === engineerId);
        if (eng) {
          fields.assignedEngineerId = eng.id;
          fields.assignedEngineerName = eng.name;
          fields.assignedAt = Date.now();
        }
      }

      if (type === 'standard') {
        await updateDesignRequestStatus(id, 'Approved', fields);
        if (selectedRequest?.id === id) {
          setSelectedRequest(prev => prev ? { ...prev, ...fields } : null);
        }
      } else {
        await updateBedroomSubmissionStatus(id, 'Approved', fields);
        if (selectedSubmission?.id === id) {
          setSelectedSubmission(prev => prev ? { ...prev, ...fields } : null);
        }
      }
      showFeedback('تم قبول الطلب وتعيين المهندس بنجاح وإنشاء التذكرة!');
      setShowAssignModal(false);
      setAssignTarget(null);
    } catch (err) {
      console.error(err);
      showFeedback('فشل قبول الطلب وتعيين المهندس.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleAutoAssignAndApprove = async () => {
    const activeEngineers = engineers?.filter(e => e.active) || [];
    if (activeEngineers.length === 0) {
      showFeedback('لا يوجد مهندسين نشطين حالياً في النظام للتعيين التلقائي. يرجى إضافة مهندس نشط أولاً أو التعيين يدوياً.', 'error');
      return;
    }
    // Choose active engineer with the lowest number of current tickets
    const sorted = [...activeEngineers].sort((a, b) => (a.currentTickets || 0) - (b.currentTickets || 0));
    const chosenEng = sorted[0];
    await handleAssignAndApprove(chosenEng.id);
  };

  // GENERIC STATUS UPDATER
  const handleStatusChange = async (id: string, type: 'standard' | 'bedroom', newStatus: RequestStatus) => {
    if (newStatus === 'Rejected') {
      triggerRejectionModal(id, type);
      return;
    }

    // Check if approved status requires engineer assignment
    if (newStatus === 'Approved') {
      const req = type === 'standard'
        ? designRequests.find(r => r.id === id)
        : bedroomSubmissions.find(s => s.id === id);

      if (req && !req.assignedEngineerId) {
        setAssignTarget({ id, type });
        setShowAssignModal(true);
        return;
      }
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
        coverImage: coverUrl || "",
        images: projGalleryUrls.length > 0 ? projGalleryUrls : [],
        beforeImage: beforeUrl || "",
        afterImage: afterUrl || ""
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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setUploadingCover(true);
      const base64 = await uploadFile(file, 'projects');
      setProjCoverUrl(base64);
      showFeedback('تمت معالجة وحفظ صورة الغلاف بنجاح.');
    } catch (err) {
      console.error(err);
      showFeedback('فشل معالجة صورة الغلاف.', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleBeforeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setUploadingBefore(true);
      const base64 = await uploadFile(file, 'before-after');
      setProjBeforeUrl(base64);
      showFeedback('تمت معالجة وحفظ صورة قبل التنفيذ بنجاح.');
    } catch (err) {
      console.error(err);
      showFeedback('فشل معالجة صورة قبل التنفيذ.', 'error');
    } finally {
      setUploadingBefore(false);
    }
  };

  const handleAfterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setUploadingAfter(true);
      const base64 = await uploadFile(file, 'before-after');
      setProjAfterUrl(base64);
      showFeedback('تمت معالجة وحفظ صورة بعد التنفيذ بنجاح.');
    } catch (err) {
      console.error(err);
      showFeedback('فشل معالجة صورة بعد التنفيذ.', 'error');
    } finally {
      setUploadingAfter(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    try {
      setUploadingGallery(true);
      const promises = files.map(file => uploadFile(file, 'projects'));
      const base64Array = await Promise.all(promises);
      setProjGalleryUrls(prev => [...prev, ...base64Array]);
      showFeedback(`تمت معالجة وإضافة ${files.length} صورة إلى المعرض بنجاح.`);
    } catch (err) {
      console.error(err);
      showFeedback('فشل معالجة بعض أو كل صور المعرض.', 'error');
    } finally {
      setUploadingGallery(false);
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

  // ENGINEER MANAGEMENT HANDLERS
  const resetEngineerForm = () => {
    setEditingEngineer(null);
    setEngName('');
    setEngEmail('');
    setEngPhone('');
    setEngSpecialization('');
    setEngActive(true);
    setEngCurrentTickets(0);
    setEngCurrentProjects(0);
    setShowEngineerForm(false);
  };

  const handleOpenEditEngineer = (eng: Engineer) => {
    setEditingEngineer(eng);
    setEngName(eng.name);
    setEngEmail(eng.email);
    setEngPhone(eng.phone);
    setEngSpecialization(eng.specialization || eng.specialty || '');
    setEngActive(eng.active);
    setEngCurrentTickets(eng.currentTickets || 0);
    setEngCurrentProjects(eng.currentProjects || 0);
    setShowEngineerForm(true);
  };

  const handleSaveEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!engName.trim() || !engEmail.trim() || !engPhone.trim()) {
      showFeedback('الرجاء ملء جميع حقول المهندس الأساسية (الاسم، البريد الإلكتروني، رقم الهاتف).', 'error');
      return;
    }
    try {
      setGlobalLoading(true);
      const engData = {
        name: engName.trim(),
        email: engEmail.trim(),
        phone: engPhone.trim(),
        specialty: engSpecialization.trim(),
        specialization: engSpecialization.trim(),
        active: engActive,
        currentTickets: Number(engCurrentTickets) || 0,
        currentProjects: Number(engCurrentProjects) || 0,
      };

      if (editingEngineer) {
        await updateEngineer(editingEngineer.id, engData);
        showFeedback('تم تحديث بيانات المهندس بنجاح!');
      } else {
        await addEngineer(engData);
        showFeedback('تم إضافة المهندس الجديد بنجاح!');
      }
      resetEngineerForm();
    } catch (err) {
      console.error(err);
      showFeedback('حدث خطأ أثناء حفظ بيانات المهندس.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleToggleEngineerActive = async (eng: Engineer) => {
    try {
      setGlobalLoading(true);
      const newStatus = !eng.active;
      await updateEngineer(eng.id, { active: newStatus });
      showFeedback(newStatus ? 'تم تفعيل المهندس بنجاح.' : 'تم تعطيل المهندس بنجاح.');
    } catch (err) {
      console.error(err);
      showFeedback('فشل في تغيير حالة التفعيل للمهندس.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteEngineerClick = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المهندس نهائياً؟')) return;
    try {
      setGlobalLoading(true);
      await deleteEngineer(id);
      showFeedback('تم حذف المهندس بنجاح.');
      if (editingEngineer?.id === id) {
        resetEngineerForm();
      }
    } catch (err) {
      console.error(err);
      showFeedback('فشل حذف المهندس.', 'error');
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
            { id: 'requests', 
              label: 'طلبات العملاء (Inbox)', 
              icon: (
                <div className="relative">
                  <MessageSquare className="w-4 h-4" />
                  {unreadCount > 0 && <span className="absolute -top-1.5 -left-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
                </div>
              ),
              badge: unreadCount > 0 ? `${unreadCount} جديد` : null
            },
            { id: 'tickets', label: 'إدارة التذاكر', icon: <FileText className="w-4 h-4 text-[#d4af37]" />, badge: `${tickets ? tickets.length : 0} تذكرة` },
            { id: 'engineers', label: 'إدارة المهندسين', icon: <User className="w-4 h-4 text-[#d4af37]" />, badge: `${engineers ? engineers.length : 0} مهندس` },
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

        {/* ==================== SUB TAB: TICKET MANAGEMENT ==================== */}
        {activeSubTab === 'tickets' && (
          <div className="space-y-6 animate-fade-in text-right" dir="rtl">
            
            {/* Ticket Management Stats Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-[#d4af37]" />
                <span className="text-gray-400 text-xs block font-bold">إجمالي التذاكر الفنية</span>
                <span className="text-3xl font-black text-gray-900 mt-2 block font-mono">
                  {tickets ? tickets.length : 0}
                </span>
                <span className="text-[10px] text-gray-400 block mt-1">تذاكر الدعم والطلبات النشطة</span>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500" />
                <span className="text-gray-400 text-xs block font-bold">تذاكر مفتوحة للتعيين</span>
                <span className="text-3xl font-black text-blue-600 mt-2 block font-mono">
                  {tickets ? tickets.filter(t => t.status === 'open').length : 0}
                </span>
                <span className="text-[10px] text-blue-500 font-bold block mt-1">بحاجة لتعيين مهندس أو متابعة</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-[#d4af37]/70" />
                <span className="text-gray-400 text-xs block font-bold">تذاكر قيد المعالجة</span>
                <span className="text-3xl font-black text-[#b8952b] mt-2 block font-mono">
                  {tickets ? tickets.filter(t => t.status === 'in_progress' || t.status === 'under_review').length : 0}
                </span>
                <span className="text-[10px] text-amber-500 font-bold block mt-1">يعمل عليها المهندسون حالياً</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-green-500" />
                <span className="text-gray-400 text-xs block font-bold">تذاكر مغلقة مكتملة</span>
                <span className="text-3xl font-black text-green-600 mt-2 block font-mono">
                  {tickets ? tickets.filter(t => t.status === 'closed').length : 0}
                </span>
                <span className="text-[10px] text-green-500 font-bold block mt-1">تمت معالجتها بنجاح مع العميل</span>
              </div>
            </div>

            {/* Ticket List Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="font-black text-base text-gray-900 border-r-2 border-[#d4af37] pr-2.5">
                    لوحة إدارة ومتابعة التذاكر الفنية (Real-Time)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">عرض جميع قنوات الحوار المباشر مع العملاء ومتابعة المهندسين المسؤولين</p>
                </div>
              </div>

              {/* Filtering & Searching Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 relative">
                  <input
                    type="text"
                    placeholder="ابحث برقم التذكرة، رقم التتبع، اسم العميل، رقم الهاتف أو المهندس المسؤول..."
                    value={ticketSearchQuery}
                    onChange={(e) => setTicketSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-[#d4af37] outline-none font-semibold text-right"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                    <Sliders className="w-4 h-4 rotate-90 text-gray-400" />
                  </div>
                </div>

                <div className="md:col-span-4">
                  <select
                    value={ticketStatusFilter}
                    onChange={(e) => setTicketStatusFilter(e.target.value as any)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:bg-white text-right"
                  >
                    <option value="all">جميع الحالات التكتيكية</option>
                    <option value="open">مفتوحة (Open)</option>
                    <option value="in_progress">قيد العمل (In Progress)</option>
                    <option value="under_review">قيد المراجعة الفنية (Under Review)</option>
                    <option value="closed">مغلقة / مكتملة (Closed)</option>
                  </select>
                </div>
              </div>

              {/* Tickets Table container */}
              <div className="overflow-x-auto rounded-xl border border-gray-150">
                <table className="w-full text-right text-xs font-semibold text-gray-700 min-w-[1000px]">
                  <thead className="bg-[#171714] text-[#d4af37] font-bold border-b border-[#d4af37]/25">
                    <tr>
                      <th className="p-4 rounded-rt-xl">رقم التذكرة</th>
                      <th className="p-4">رقم التتبع</th>
                      <th className="p-4">اسم العميل</th>
                      <th className="p-4">رقم الهاتف</th>
                      <th className="p-4">المهندس المسؤول</th>
                      <th className="p-4">حالة التذكرة</th>
                      <th className="p-4">آخر رسالة</th>
                      <th className="p-4">تاريخ الإنشاء</th>
                      <th className="p-4 rounded-lt-xl text-center">خيارات التحكم والعمليات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {!tickets || tickets.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-gray-400 font-bold">
                          لا توجد تذاكر دعم فني مسجلة في النظام حالياً.
                        </td>
                      </tr>
                    ) : (() => {
                      // Filtered Tickets
                      const filtered = tickets.filter(t => {
                        const q = ticketSearchQuery.toLowerCase();
                        const matchesSearch = 
                          t.id.toLowerCase().includes(q) ||
                          t.clientName.toLowerCase().includes(q) ||
                          t.clientPhone.includes(q) ||
                          (t.assignedEngineerName && t.assignedEngineerName.toLowerCase().includes(q)) ||
                          (t.relatedRequestNumber && t.relatedRequestNumber.toLowerCase().includes(q)) ||
                          (t.trackingId && t.trackingId.toLowerCase().includes(q)) ||
                          (t.subject && t.subject.toLowerCase().includes(q)) ||
                          (t.title && t.title.toLowerCase().includes(q));
                        
                        const matchesStatus = ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
                        
                        return matchesSearch && matchesStatus;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} className="p-12 text-center text-gray-400 font-bold">
                              لم يتم العثور على تذاكر تطابق معايير البحث والفلترة.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map(t => {
                        // Find last message
                        const ticketMsgs = messages.filter(m => m.ticketId === t.id);
                        const lastMsg = ticketMsgs.length > 0 
                          ? [...ticketMsgs].sort((a,b) => b.createdAt - a.createdAt)[0] 
                          : null;
                        
                        // Status styling
                        const statusBadge = getTicketStatusBadge(t.status);

                        return (
                          <tr key={t.id} className="hover:bg-gray-50/50 transition-all border-b border-gray-150">
                            <td className="p-4 font-mono font-black text-gray-900">{t.id}</td>
                            <td className="p-4 font-mono text-gray-600">{t.trackingId || t.relatedRequestNumber || 'مباشر / لا يوجد'}</td>
                            <td className="p-4 font-black text-gray-900">{t.clientName}</td>
                            <td className="p-4 font-mono text-gray-600">{t.clientPhone}</td>
                            <td className="p-4">
                              {t.assignedEngineerName ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-amber-50 text-[#aa7c11] px-2.5 py-1 rounded-md border border-[#d4af37]/20 font-bold">
                                    م. {t.assignedEngineerName}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded-md border border-red-100">
                                  غير معين
                                </span>
                              )}
                            </td>
                            <td className="p-4">{statusBadge}</td>
                            <td className="p-4 max-w-[200px] truncate text-gray-500" title={lastMsg ? lastMsg.content : ''}>
                              {lastMsg ? (
                                <div className="flex flex-col">
                                  <span className="truncate">{lastMsg.content}</span>
                                  <span className="text-[10px] text-gray-400 font-mono mt-0.5">من: {lastMsg.senderName}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">لا توجد رسائل</span>
                              )}
                            </td>
                            <td className="p-4 text-gray-500 font-mono">
                              {new Date(t.createdAt).toLocaleDateString('ar-IQ')}
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-2 justify-center">
                                
                                {/* 1. فتح التذكرة */}
                                <button
                                  type="button"
                                  onClick={() => setActiveAdminTicketId(t.id)}
                                  className="px-3 py-1.5 bg-[#171714] text-[#d4af37] hover:bg-black rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>فتح التذكرة</span>
                                </button>

                                {/* 2. تحويل لمهندس آخر */}
                                <button
                                  type="button"
                                  onClick={() => setTransferTicketId(t.id)}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                >
                                  <User className="w-3.5 h-3.5" />
                                  <span>تحويل لمهندس</span>
                                </button>

                                {/* 3. إغلاق التذكرة (if open) */}
                                {t.status !== 'closed' ? (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await updateTicketStatus(t.id, 'closed');
                                      showFeedback('تم إغلاق التذكرة بنجاح');
                                    }}
                                    className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>إغلاق التذكرة</span>
                                  </button>
                                ) : (
                                  /* 4. إعادة فتح التذكرة (if closed) */
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await updateTicketStatus(t.id, 'open');
                                      showFeedback('تم إعادة فتح التذكرة بنجاح');
                                    }}
                                    className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>إعادة فتح</span>
                                  </button>
                                )}

                                {/* 5. حذف التذكرة */}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`هل أنت متأكد نهائياً من حذف التذكرة رقم [${t.id}]؟ سيتم إزالتها كلياً من قاعدة البيانات.`)) {
                                      await deleteTicket(t.id);
                                      showFeedback('تم حذف التذكرة نهائياً بنجاح');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>حذف التذكرة</span>
                                </button>

                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ==================== MODAL: TRANSFER TICKET TO ENGINEER ==================== */}
            <AnimatePresence>
              {transferTicketId && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-right" dir="rtl">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-xl bg-white rounded-3xl border border-[#d4af37]/40 overflow-hidden shadow-2xl p-6 space-y-6"
                  >
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                      <div className="p-2.5 bg-[#d4af37]/10 text-[#d4af37] rounded-2xl border border-[#d4af37]/20">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-gray-900">تحويل التذكرة لمهندس تصميم آخر</h3>
                        <p className="text-xs text-gray-400 mt-0.5 font-sans">اختر مهندس من القائمة لإسناد التذكرة رقم {transferTicketId} لمتابعته الفنية والمحادثة</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-black text-xs text-gray-700">الكادر الهندسي المتاح حالياً:</h4>
                      <div className="max-h-[220px] overflow-y-auto border border-gray-100 rounded-2xl p-2 space-y-2 bg-gray-50/50">
                        {!engineers || engineers.filter(e => e.active).length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-6">لا يوجد مهندسين نشطين مسجلين في النظام حالياً.</p>
                        ) : (
                          engineers
                            .filter(e => e.active)
                            .map(eng => {
                              const initials = eng.name ? eng.name.trim().split(' ').map(n => n[0]).slice(0, 2).join('') : 'EM';
                              return (
                                <button
                                  key={eng.id}
                                  type="button"
                                  onClick={async () => {
                                    await assignTicket(transferTicketId, eng.id, eng.name);
                                    setTransferTicketId(null);
                                    showFeedback(`تم تحويل التذكرة للمهندس [${eng.name}] بنجاح`);
                                  }}
                                  className="w-full p-3 bg-white border border-gray-150 rounded-xl hover:border-[#d4af37] hover:bg-amber-50/10 transition-all flex items-center justify-between gap-4 text-right shadow-sm group"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#171714] text-[#d4af37] flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-105 transition-all">
                                      {initials}
                                    </div>
                                    <div>
                                      <span className="font-extrabold text-xs text-gray-900 block">م. {eng.name}</span>
                                      <span className="text-[10px] text-gray-400 font-bold block mt-0.5 font-sans">
                                        {eng.specialization || eng.specialty || 'ديكورات داخلية'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-left shrink-0">
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md border border-purple-100">
                                      {eng.currentTickets || 0} تذاكر نشطة
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-3 border-t border-gray-100 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setTransferTicketId(null)}
                        className="w-full py-3 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
                      >
                        تراجع وإلغاء
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* ==================== MODAL: OPEN TICKET / ADMIN CHAT & DETAIL ==================== */}
            <AnimatePresence>
              {activeAdminTicketId && (() => {
                const ticket = tickets.find(t => t.id === activeAdminTicketId);
                if (!ticket) return null;
                
                const ticketMsgs = messages.filter(m => m.ticketId === ticket.id);
                const sortedMsgs = [...ticketMsgs].sort((a,b) => a.createdAt - b.createdAt);

                return (
                  <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 text-right" dir="rtl">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full max-w-4xl bg-white rounded-3xl border border-[#d4af37]/35 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                    >
                      {/* Modal Header */}
                      <div className="p-5 bg-[#171714] text-white flex justify-between items-center border-b border-[#d4af37]/25">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-[#d4af37]" />
                          <div>
                            <h3 className="text-sm font-black text-white">
                              قناة المحادثة والتفاصيل الفنية للتذكرة: {ticket.id}
                            </h3>
                            <p className="text-[10px] text-[#d4af37] font-sans">
                              الموضوع: {ticket.subject || ticket.title || 'دعم فني عام'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => { setActiveAdminTicketId(null); setAdminChatMessageText(''); setAdminChatFiles([]); }}
                          className="p-1.5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Split View */}
                      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden min-h-0">
                        
                        {/* Left Column: Chat messages panel (8 of 12) */}
                        <div className="md:col-span-8 flex flex-col h-full bg-gray-50/50 min-h-0 border-l border-gray-150">
                          
                          {/* Live chat thread */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {sortedMsgs.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <MessageSquare className="w-12 h-12 text-gray-300 animate-pulse" />
                                <p className="text-xs font-bold">لا توجد رسائل في هذه التذكرة بعد. ابدأ بمراسلة العميل!</p>
                              </div>
                            ) : (
                              sortedMsgs.map((msg) => {
                                const isAdmin = msg.senderRole === 'admin';
                                const isClient = msg.senderRole === 'client';
                                
                                return (
                                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-3.5 space-y-1.5 ${
                                      isAdmin 
                                        ? 'bg-[#171714] text-white rounded-br-none border border-[#d4af37]/20 shadow-md' 
                                        : isClient
                                          ? 'bg-blue-50 text-gray-800 rounded-bl-none border border-blue-100 shadow-sm'
                                          : 'bg-amber-50 text-gray-800 rounded-bl-none border border-amber-100 shadow-sm'
                                    }`}>
                                      <div className="flex justify-between items-center gap-4 text-[10px]">
                                        <span className={`font-black ${isAdmin ? 'text-[#d4af37]' : isClient ? 'text-blue-600' : 'text-[#aa7c11]'}`}>
                                          {msg.senderName} ({msg.senderRole === 'admin' ? 'المدير العام' : msg.senderRole === 'client' ? 'العميل' : 'المهندس المصمم'})
                                        </span>
                                        <span className="text-gray-400 font-mono">
                                          {new Date(msg.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">{msg.content}</p>
                                      
                                      {/* Msg Attachments */}
                                      {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="pt-2 border-t border-gray-200/20 mt-2 space-y-1">
                                          {msg.attachments.map((file, idx) => (
                                            <a
                                              key={idx}
                                              href={file.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-[10px] text-[#d4af37] underline font-bold"
                                            >
                                              <span>📎 {file.name}</span>
                                            </a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Chat Input form */}
                          <form onSubmit={handleSendAdminChatMessage} className="p-4 bg-white border-t border-gray-150 space-y-3">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={adminChatMessageText}
                                onChange={(e) => setAdminChatMessageText(e.target.value)}
                                placeholder="اكتب رسالتك الرسمية للعميل والمهندس هنا..."
                                className="flex-1 p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-[#d4af37]"
                              />
                              
                              {/* File upload trigger */}
                              <label className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl cursor-pointer flex items-center justify-center transition-all border border-gray-200" title="إرفاق ملف">
                                <input
                                  type="file"
                                  multiple
                                  onChange={handleAdminFileChange}
                                  className="hidden"
                                />
                                <span>📎</span>
                              </label>

                              <button
                                type="submit"
                                disabled={isSendingAdminMessage}
                                className="px-5 py-2.5 bg-[#d4af37] text-[#171714] font-bold rounded-xl text-xs hover:bg-[#b8952b] transition-all disabled:opacity-50 flex items-center gap-1.5"
                              >
                                {isSendingAdminMessage ? 'جاري الإرسال...' : 'إرسال'}
                              </button>
                            </div>

                            {/* Display attached files before sending */}
                            {adminChatFiles.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1.5">
                                {adminChatFiles.map((file, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] border">
                                    <span className="truncate max-w-[120px]">{file.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => setAdminChatFiles(prev => prev.filter((_, i) => i !== idx))}
                                      className="text-red-500 hover:text-red-700 font-bold ml-1"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </form>
                        </div>

                        {/* Right Column: Ticket details & metadata (4 of 12) */}
                        <div className="md:col-span-4 p-5 overflow-y-auto space-y-5 text-xs">
                          
                          <div>
                            <h4 className="font-extrabold text-gray-900 border-r-2 border-[#d4af37] pr-2 mb-2">بيانات الحالة العامة</h4>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 font-semibold">
                              <div className="flex justify-between">
                                <span className="text-gray-400">حالة التذكرة الحالية:</span>
                                <span>{getTicketStatusBadge(ticket.status)}</span>
                              </div>
                              <div className="flex justify-between border-t border-gray-200/50 pt-2 font-sans">
                                <span className="text-gray-400">تحديث الحالة:</span>
                                <select
                                  value={ticket.status}
                                  onChange={async (e) => {
                                    await updateTicketStatus(ticket.id, e.target.value as TicketStatus);
                                    showFeedback('تم تحديث حالة التذكرة بنجاح');
                                  }}
                                  className="bg-white border border-gray-200 rounded px-1.5 py-0.5 font-bold outline-none text-right text-[11px]"
                                >
                                  <option value="open">مفتوحة (Open)</option>
                                  <option value="in_progress">قيد المعالجة (In Progress)</option>
                                  <option value="under_review">تحت المراجعة (Under Review)</option>
                                  <option value="closed">مغلقة (Closed)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-extrabold text-gray-900 border-r-2 border-[#d4af37] pr-2 mb-2">معلومات العميل</h4>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 font-semibold">
                              <div className="flex justify-between">
                                <span className="text-gray-400">اسم العميل:</span>
                                <span className="text-gray-900">{ticket.clientName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">رقم الهاتف:</span>
                                <span className="text-gray-900 font-mono">{ticket.clientPhone}</span>
                              </div>
                              {ticket.clientEmail && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">البريد الإلكتروني:</span>
                                  <span className="text-gray-900 font-mono truncate max-w-[120px]">{ticket.clientEmail}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-extrabold text-gray-900 border-r-2 border-[#d4af37] pr-2 mb-2">المهندس الفني المسؤول</h4>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 font-semibold">
                              <div className="flex justify-between">
                                <span className="text-gray-400">المهندس المعين:</span>
                                <span className="text-gray-900 font-bold">
                                  {ticket.assignedEngineerName ? `م. ${ticket.assignedEngineerName}` : 'غير معين بعد'}
                                </span>
                              </div>
                              <div className="pt-2 border-t border-gray-200/50 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTransferTicketId(ticket.id);
                                  }}
                                  className="px-2.5 py-1 bg-[#171714] text-[#d4af37] hover:bg-black rounded border border-[#d4af37]/25 text-[10px] font-bold"
                                >
                                  تعديل / تعيين المهندس
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-extrabold text-gray-900 border-r-2 border-[#d4af37] pr-2 mb-2">الوصف المبدئي والملحقات</h4>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                              <p className="text-gray-600 leading-relaxed font-medium">{ticket.description}</p>
                              
                              {ticket.attachments && ticket.attachments.length > 0 && (
                                <div className="pt-2 border-t border-gray-200/50">
                                  <span className="text-gray-400 font-bold block mb-1 font-sans">المرفقات التأسيسية للتذكرة:</span>
                                  <div className="flex flex-col gap-1">
                                    {ticket.attachments.map((url, i) => (
                                      <a
                                        key={i}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#b8952b] underline truncate max-w-[180px] font-bold"
                                      >
                                        📎 مرفق ملف أساسي #{i+1}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>

                      </div>

                      {/* Modal Footer */}
                      <div className="p-4 bg-gray-50 border-t border-gray-150 flex justify-end">
                        <button
                          type="button"
                          onClick={() => { setActiveAdminTicketId(null); setAdminChatMessageText(''); setAdminChatFiles([]); }}
                          className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-xs"
                        >
                          إغلاق التفاصيل
                        </button>
                      </div>
                    </motion.div>
                  </div>
                );
              })()}
            </AnimatePresence>

          </div>
        )}

        {/* ==================== SUB TAB: ENGINEERS MANAGEMENT ==================== */}
        {activeSubTab === 'engineers' && (
          <div className="space-y-8 animate-fade-in">
            {/* Engineers Quick Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-[#d4af37]" />
                <span className="text-gray-400 text-xs block font-bold">إجمالي المهندسين</span>
                <span className="text-3xl font-black text-gray-900 mt-2 block font-mono">
                  {engineers ? engineers.length : 0}
                </span>
                <span className="text-[10px] text-gray-400 block mt-1">كادر التصميم الهندسي</span>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-green-500" />
                <span className="text-gray-400 text-xs block font-bold">المهندسين النشطين</span>
                <span className="text-3xl font-black text-green-600 mt-2 block font-mono">
                  {engineers ? engineers.filter(e => e.active).length : 0}
                </span>
                <span className="text-[10px] text-green-500 font-bold block mt-1">جاهزون لاستلام المشاريع</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-red-400" />
                <span className="text-gray-400 text-xs block font-bold">المهندسين غير النشطين</span>
                <span className="text-3xl font-black text-red-500 mt-2 block font-mono">
                  {engineers ? engineers.filter(e => !e.active).length : 0}
                </span>
                <span className="text-[10px] text-red-400 block mt-1">متوقفون مؤقتاً</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-500" />
                <span className="text-gray-400 text-xs block font-bold">المشاريع والتذاكر الحالية</span>
                <span className="text-3xl font-black text-purple-600 mt-2 block font-mono">
                  {engineers ? engineers.reduce((sum, e) => sum + (e.currentProjects || 0) + (e.currentTickets || 0), 0) : 0}
                </span>
                <span className="text-[10px] text-purple-400 block mt-1">حجم العمل الإجمالي قيد المعالجة</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Right Side: Add/Edit Engineer Form Card (4 of 12 columns) */}
              <div className="lg:col-span-4 bg-[#171714] text-white p-6 rounded-2xl border border-[#d4af37]/30 shadow-xl space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-[#d4af37]/15">
                  <div className="p-2 bg-[#d4af37]/10 text-[#d4af37] rounded-xl border border-[#d4af37]/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">
                      {editingEngineer ? 'تعديل بيانات المهندس' : 'إضافة مهندس جديد'}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">أدخل تفاصيل التخصص والاتصال للكادر الهندسي</p>
                  </div>
                </div>

                <form onSubmit={handleSaveEngineer} className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="block text-gray-300 font-bold">اسم المهندس المصمم <span className="text-[#d4af37]">*</span>:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: م. علي العراقي"
                      value={engName}
                      onChange={(e) => setEngName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#20201c] border border-gray-800 text-white rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-300 font-bold">البريد الإلكتروني <span className="text-[#d4af37]">*</span>:</label>
                    <input
                      type="email"
                      required
                      placeholder="ali@royalgroup.com"
                      value={engEmail}
                      onChange={(e) => setEngEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#20201c] border border-gray-800 text-white rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-left"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-300 font-bold">رقم الهاتف الفعال <span className="text-[#d4af37]">*</span>:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 0770..."
                      value={engPhone}
                      onChange={(e) => setEngPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#20201c] border border-gray-800 text-white rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-left"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-gray-300 font-bold">تخصص المهندس:</label>
                    <input
                      type="text"
                      placeholder="مثال: مصمم ديكور داخلي راقي"
                      value={engSpecialization}
                      onChange={(e) => setEngSpecialization(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#20201c] border border-gray-800 text-white rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-gray-300 font-bold">المشاريع الحالية:</label>
                      <input
                        type="number"
                        min="0"
                        value={engCurrentProjects}
                        onChange={(e) => setEngCurrentProjects(Number(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 bg-[#20201c] border border-gray-800 text-white rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-gray-300 font-bold">التذاكر الحالية:</label>
                      <input
                        type="number"
                        min="0"
                        value={engCurrentTickets}
                        onChange={(e) => setEngCurrentTickets(Number(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 bg-[#20201c] border border-gray-800 text-white rounded-xl outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-gray-300 font-bold">حالة تفعيل الحساب:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={engActive}
                        onChange={(e) => setEngActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37]"></div>
                      <span className="mr-2 text-xs font-bold text-gray-300">
                        {engActive ? 'نشط' : 'معطل'}
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[#d4af37]/10">
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-[#d4af37] text-[#171714] font-black rounded-xl hover:bg-[#b8952b] transition-all flex items-center justify-center gap-2"
                    >
                      {editingEngineer ? 'حفظ التعديلات' : 'إضافة الكادر'}
                    </button>
                    {editingEngineer && (
                      <button
                        type="button"
                        onClick={resetEngineerForm}
                        className="px-4 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-all font-bold"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Left Side: Engineers List Card (8 of 12 columns) */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-black text-sm text-gray-900 border-r-2 border-[#d4af37] pr-2.5">
                      قائمة المهندسين الحالية
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">تتبع كادر التصميم، ونسب الإشغال، وحالة النشاط لكل مهندس</p>
                  </div>
                </div>

                {/* Search box */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="البحث عن مهندس بالاسم أو التخصص..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-[#d4af37] outline-none font-semibold text-right"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                    <Sliders className="w-4 h-4 rotate-90" />
                  </div>
                </div>

                {/* Engineers List Table / Cards */}
                <div className="space-y-4">
                  {!engineers || engineers.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-xs text-gray-400 font-bold">لا يوجد مهندسين مسجلين حالياً في النظام.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {engineers
                        .filter(e => {
                          if (!searchQuery) return true;
                          const nameMatch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
                          const specMatch = (e.specialization || e.specialty || '').toLowerCase().includes(searchQuery.toLowerCase());
                          const emailMatch = e.email.toLowerCase().includes(searchQuery.toLowerCase());
                          return nameMatch || specMatch || emailMatch;
                        })
                        .map(eng => {
                          const initials = eng.name ? eng.name.trim().split(' ').map(n => n[0]).slice(0, 2).join('') : 'EM';
                          return (
                            <div
                              key={eng.id}
                              className={`p-4 bg-gray-50 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between gap-4 relative ${
                                !eng.active ? 'opacity-70 grayscale-[25%]' : 'border-gray-100'
                              }`}
                            >
                              {/* Card Top: Avatar, Name & Specialty */}
                              <div className="flex gap-3">
                                <div className="w-12 h-12 rounded-xl bg-[#171714] text-[#d4af37] flex items-center justify-center font-black text-sm shrink-0 shadow-inner border border-[#d4af37]/20">
                                  {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-extrabold text-xs text-gray-900 truncate flex items-center gap-1.5">
                                    {eng.name}
                                    <span className={`w-2 h-2 rounded-full ${eng.active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                  </h4>
                                  <p className="text-[10px] text-gray-400 mt-1 font-bold">
                                    {eng.specialization || eng.specialty || 'مهندس مصمم'}
                                  </p>
                                </div>
                              </div>

                              {/* Contact Details Block */}
                              <div className="space-y-1.5 text-[10px] text-gray-600 font-semibold pt-1 border-t border-gray-100">
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-[#d4af37]" />
                                  <span className="font-mono">{eng.phone}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Mail className="w-3 h-3 text-[#d4af37]" />
                                  <span className="truncate">{eng.email}</span>
                                </div>
                              </div>

                              {/* Workload Stats Bento Indicators */}
                              <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-white p-2 rounded-xl border border-gray-200/60 text-center">
                                  <span className="text-[9px] text-gray-400 block font-bold">مشاريع جارية</span>
                                  <span className="text-sm font-black text-[#171714] font-mono mt-0.5 block">
                                    {eng.currentProjects || 0}
                                  </span>
                                </div>
                                <div className="bg-white p-2 rounded-xl border border-gray-200/60 text-center">
                                  <span className="text-[9px] text-gray-400 block font-bold">تذاكر نشطة</span>
                                  <span className="text-sm font-black text-[#171714] font-mono mt-0.5 block">
                                    {eng.currentTickets || 0}
                                  </span>
                                </div>
                              </div>

                              {/* Card Actions Bottom */}
                              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                                  eng.active 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  {eng.active ? 'نشط ومتاح' : 'غير نشط'}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleToggleEngineerActive(eng)}
                                    className={`p-1.5 rounded transition-all text-[10px] font-bold border ${
                                      eng.active 
                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                                        : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                                    }`}
                                    title={eng.active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                                  >
                                    {eng.active ? 'تعطيل' : 'تفعيل'}
                                  </button>

                                  <button
                                    onClick={() => handleOpenEditEngineer(eng)}
                                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded"
                                    title="تعديل البيانات"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteEngineerClick(eng.id)}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded"
                                    title="حذف المهندس"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
                      <div className="flex flex-col gap-1.5">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setColorFile(e.target.files[0]);
                              setColorUrl('');
                            }
                          }} 
                          className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-[#171714]/10 file:text-[#171714] hover:file:bg-[#171714]/15"
                        />
                        <input 
                          type="text" 
                          value={colorUrl} 
                          onChange={(e) => {
                            setColorUrl(e.target.value);
                            setColorFile(null);
                          }} 
                          placeholder="https://... أو سيتم استخدام الملف المرفق" 
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" 
                        />
                      </div>
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

      {/* ==================== MODAL: ENGINEER ASSIGNMENT OVERLAY ==================== */}
      <AnimatePresence>
        {showAssignModal && assignTarget && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-xl bg-white rounded-3xl border border-[#d4af37]/40 overflow-hidden shadow-2xl p-6 space-y-6 text-right"
            >
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="p-2.5 bg-[#d4af37]/10 text-[#d4af37] rounded-2xl border border-[#d4af37]/20">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">تعيين مهندس للتصميم والمتابعة</h3>
                  <p className="text-xs text-gray-400 mt-0.5">اختر طريقة إسناد هذا الطلب المعتمد لأحد المهندسين لتظهر التذكرة في بوابته فوراً.</p>
                </div>
              </div>

              {/* Option A: Auto Assignment */}
              <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Activity className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-xs text-amber-900">التعيين التلقائي الذكي (Smart Auto-Assign)</h4>
                    <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5">
                      سيقوم النظام بالبحث عن الكادر الهندسي النشط حالياً، واختيار المهندس صاحب العبء العملي الأقل (الذي لديه أقل عدد من التذاكر النشطة) لضمان سرعة الاستجابة للعميل.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoAssignAndApprove}
                  className="w-full py-3 bg-[#d4af37] text-[#171714] font-black rounded-xl hover:bg-[#b8952b] transition-all flex items-center justify-center gap-2 text-xs shadow-md shadow-[#d4af37]/15"
                >
                  <Check className="w-4 h-4" />
                  تفعيل التعيين التلقائي والموافقة الفورية
                </button>
              </div>

              {/* Option B: Manual Selection list */}
              <div className="space-y-3">
                <h4 className="font-black text-xs text-gray-700">أو اختيار مهندس مصمم يدوياً:</h4>
                <div className="max-h-[220px] overflow-y-auto border border-gray-100 rounded-2xl p-2 space-y-2 bg-gray-50/50">
                  {!engineers || engineers.filter(e => e.active).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">لا يوجد مهندسين نشطين مسجلين في النظام حالياً.</p>
                  ) : (
                    engineers
                      .filter(e => e.active)
                      .map(eng => {
                        const initials = eng.name ? eng.name.trim().split(' ').map(n => n[0]).slice(0, 2).join('') : 'EM';
                        return (
                          <button
                            key={eng.id}
                            type="button"
                            onClick={() => handleAssignAndApprove(eng.id)}
                            className="w-full p-3 bg-white border border-gray-150 rounded-xl hover:border-[#d4af37] hover:bg-amber-50/10 transition-all flex items-center justify-between gap-4 text-right shadow-sm group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#171714] text-[#d4af37] flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-105 transition-all">
                                {initials}
                              </div>
                              <div>
                                <span className="font-extrabold text-xs text-gray-900 block">{eng.name}</span>
                                <span className="text-[10px] text-gray-400 font-bold block mt-0.5">
                                  {eng.specialization || eng.specialty || 'مهندس مصمم'}
                                </span>
                              </div>
                            </div>
                            <div className="text-left shrink-0">
                              <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md border border-purple-100">
                                {eng.currentTickets || 0} تذاكر نشطة
                              </span>
                            </div>
                          </button>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 pt-3 border-t border-gray-100 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setShowAssignModal(false); setAssignTarget(null); }}
                  className="flex-1 py-3 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
                >
                  تراجع وإلغاء القبول
                </button>
                <button
                  type="button"
                  onClick={() => handleAssignAndApprove(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                >
                  الموافقة بدون تعيين مهندس
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

                  {/* Primary Cover Upload and Preview */}
                  <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-150">
                    <label className="font-extrabold text-xs text-gray-700 block">الصورة الرئيسية للمشروع *</label>
                    
                    {projCoverUrl ? (
                      <div className="w-full h-48 rounded-xl overflow-hidden bg-black/5 relative border border-gray-200 shadow-inner">
                        <img
                          src={projCoverUrl}
                          className="w-full h-full object-cover"
                          alt="Cover Preview"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setProjCoverUrl('')}
                          className="absolute top-2 left-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-md flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف واستبدال</span>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full">
                        <label className={`w-full h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#d4af37] cursor-pointer flex flex-col items-center justify-center p-4 bg-white hover:bg-gray-50/50 transition-all ${uploadingCover ? 'opacity-50 pointer-events-none' : ''}`}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="hidden"
                          />
                          {uploadingCover ? (
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                              <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
                              <span className="text-xs font-bold">جاري ضغط ومعالجة الصورة...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                              <span className="text-xs font-bold text-gray-600">اضغط لاختيار صورة الغلاف الرئيسية</span>
                              <span className="text-[10px] text-gray-400">تدعم JPEG، PNG، WEBP (يتم تحويلها لـ Base64 مضغوط)</span>
                            </div>
                          )}
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Before and After Comparers (Local selection) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Before Image */}
                    <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-150">
                      <label className="font-extrabold text-xs text-red-700 block font-sans">صورة قبل العمل والتنفيذ - اختياري</label>
                      
                      {projBeforeUrl ? (
                        <div className="w-full h-36 rounded-xl overflow-hidden bg-black/5 relative border border-gray-200 shadow-inner">
                          <img
                            src={projBeforeUrl}
                            className="w-full h-full object-cover"
                            alt="Before Preview"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setProjBeforeUrl('')}
                            className="absolute top-2 left-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full">
                          <label className={`w-full h-28 rounded-xl border-2 border-dashed border-gray-300 hover:border-red-500 cursor-pointer flex flex-col items-center justify-center p-3 bg-white hover:bg-gray-50/50 transition-all ${uploadingBefore ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBeforeUpload}
                              className="hidden"
                            />
                            {uploadingBefore ? (
                              <div className="flex flex-col items-center gap-1.5 text-gray-500">
                                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                                <span className="text-[10px] font-bold">جاري المعالجة...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 text-gray-500 text-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                                <span className="text-[11px] font-bold text-gray-600">اختر صورة حالة الموقع (قبل العمل)</span>
                                <span className="text-[9px] text-gray-400">تظهر في مقارنة قبل/بعد</span>
                              </div>
                            )}
                          </label>
                        </div>
                      )}
                    </div>

                    {/* After Image */}
                    <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-150">
                      <label className="font-extrabold text-xs text-[#d4af37] block font-sans">صورة بعد العمل والتنفيذ - اختياري</label>
                      
                      {projAfterUrl ? (
                        <div className="w-full h-36 rounded-xl overflow-hidden bg-black/5 relative border border-gray-200 shadow-inner">
                          <img
                            src={projAfterUrl}
                            className="w-full h-full object-cover"
                            alt="After Preview"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setProjAfterUrl('')}
                            className="absolute top-2 left-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>حذف</span>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full">
                          <label className={`w-full h-28 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#d4af37] cursor-pointer flex flex-col items-center justify-center p-3 bg-white hover:bg-gray-50/50 transition-all ${uploadingAfter ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAfterUpload}
                              className="hidden"
                            />
                            {uploadingAfter ? (
                              <div className="flex flex-col items-center gap-1.5 text-gray-500">
                                <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
                                <span className="text-[10px] font-bold">جاري المعالجة...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 text-gray-500 text-center">
                                <ImageIcon className="w-6 h-6 text-gray-400" />
                                <span className="text-[11px] font-bold text-gray-600">اختر صورة النتيجة النهائية (بعد العمل)</span>
                                <span className="text-[9px] text-gray-400">تظهر في مقارنة قبل/بعد</span>
                              </div>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multi Gallery Local Upload */}
                  <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-150">
                    <label className="font-extrabold text-xs text-gray-700 block">معرض صور إضافية للمشروع (Gallery Images) *</label>
                    
                    {projGalleryUrls.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 p-3 bg-white border border-gray-200 rounded-xl mb-3">
                        {projGalleryUrls.map((url, i) => (
                          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-150 group shadow-sm bg-gray-50">
                            <img src={url} className="w-full h-full object-cover" alt="Gallery preview" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => setProjGalleryUrls(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-xs transition-all duration-200 flex-col gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>إزالة</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="w-full">
                        <label className={`w-full h-28 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#d4af37] cursor-pointer flex flex-col items-center justify-center p-4 bg-white hover:bg-gray-50/50 transition-all ${uploadingGallery ? 'opacity-50 pointer-events-none' : ''}`}>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleGalleryUpload}
                            className="hidden"
                          />
                          {uploadingGallery ? (
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                              <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
                              <span className="text-xs font-bold">جاري ضغط ومعالجة صور المعرض...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500 text-center">
                              <div className="flex items-center gap-1 text-gray-400">
                                <ImageIcon className="w-6 h-6" />
                                <Plus className="w-4 h-4 -mr-2 mt-2 bg-white rounded-full border shadow-sm p-0.5" />
                              </div>
                              <span className="text-xs font-bold text-gray-600">اضغط لاختيار صور إضافية للمعرض (متعدد)</span>
                              <span className="text-[10px] text-gray-400">يمكنك تحديد عدة صور دفعة واحدة وتخزينها كـ Base64 مدمج</span>
                            </div>
                          )}
                        </label>
                      </div>
                      <p className="text-[10px] text-gray-400 text-center">سيتم حفظ معرض الصور نهائياً عند حفظ المشروع بالكامل.</p>
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
