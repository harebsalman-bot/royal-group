/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { Project, ColorVariant, CompanySettings, SocialLinks, DesignRequest, BedroomOption } from '../types';
import { 
  Plus, Edit2, Trash2, Check, Star, Settings, Image as ImageIcon, Link as LinkIcon, 
  MapPin, MessageSquare, ClipboardList, Palette, Sliders, LogOut, FileText, Loader2, Save,
  Crown, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const {
    isFirebaseConnected, projects, categories, colorVariants, designRequests, 
    companySettings, socialLinks, bedroomOptions, bedroomSubmissions,
    addProject, updateProject, deleteProject, 
    updateDesignRequestStatus, updateCompanySettings, updateSocialLinks, 
    addColorVariant, deleteColorVariant, uploadFile,
    addBedroomOption, updateBedroomOption, deleteBedroomOption, addBedroomSubmission,
    updateBedroomSubmissionStatus, deleteBedroomSubmission
  } = useFirebaseState();

  // Navigation tab for admin dashboard
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'requests' | 'colors' | 'bedroom' | 'settings'>('projects');

  // Unified Loading and Status feedback
  const [globalLoading, setGlobalLoading] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, message: '', type: 'success' });

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ show: true, message: msg, type });
    setTimeout(() => setFeedback(prev => ({ ...prev, show: false })), 4000);
  };

  // ==========================================
  // STATE & HANDLERS FOR PROJECTS MANAGER
  // ==========================================
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projArea, setProjArea] = useState('');
  const [projCity, setProjCity] = useState('');
  const [projCategory, setProjCategory] = useState('صالات');
  const [projFeatured, setProjFeatured] = useState(false);
  const [projCoverFile, setProjCoverFile] = useState<File | null>(null);
  const [projCoverUrl, setProjCoverUrl] = useState('');
  const [projGalleryUrls, setProjGalleryUrls] = useState<string[]>([]);
  const [projBeforeFile, setProjBeforeFile] = useState<File | null>(null);
  const [projBeforeUrl, setProjBeforeUrl] = useState('');
  const [projAfterFile, setProjAfterFile] = useState<File | null>(null);
  const [projAfterUrl, setProjAfterUrl] = useState('');

  const resetProjectForm = () => {
    setEditingProject(null);
    setProjTitle('');
    setProjDesc('');
    setProjArea('');
    setProjCity('');
    setProjCategory('صالات');
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

      // Upload files if selected
      if (projCoverFile) {
        coverUrl = await uploadFile(projCoverFile, 'projects');
      }
      if (projBeforeFile) {
        beforeUrl = await uploadFile(projBeforeFile, 'before-after');
      }
      if (projAfterFile) {
        afterUrl = await uploadFile(projAfterFile, 'before-after');
      }

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
      console.error(err);
      showFeedback('حدث خطأ أثناء حفظ المشروع.', 'error');
    } finally {
      setGlobalLoading(false);
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
      console.error(err);
      showFeedback('حدث خطأ أثناء رفع صور المعرض.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleRemoveGalleryImage = (idx: number) => {
    setProjGalleryUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المشروع نهائياً؟')) return;
    try {
      setGlobalLoading(true);
      await deleteProject(id);
      showFeedback('تم حذف المشروع بنجاح!');
    } catch (err) {
      console.error(err);
      showFeedback('فشل حذف المشروع.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // ==========================================
  // STATE & HANDLERS FOR COLOR LAB MANAGER
  // ==========================================
  const [colorName, setColorName] = useState('');
  const [colorType, setColorType] = useState<'wood' | 'marble' | 'wall' | 'flooring'>('wood');
  const [colorHex, setColorHex] = useState('#B1A796');
  const [colorFile, setColorFile] = useState<File | null>(null);
  const [colorUrl, setColorUrl] = useState('');

  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorName.trim() || (!colorFile && !colorUrl.trim() && !window.confirm('متابعة بدون رفع صورة مخصصة؟ (سيتم استخدام صورة افتراضية)'))) return;

    try {
      setGlobalLoading(true);
      let renderImgUrl = colorUrl.trim() || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1200";
      
      if (colorFile) {
        renderImgUrl = await uploadFile(colorFile, 'color-lab');
      }

      await addColorVariant({
        name: colorName,
        type: colorType,
        colorValue: colorHex,
        image: renderImgUrl
      });

      setColorName('');
      setColorFile(null);
      setColorUrl('');
      showFeedback('تم إضافة خيار اللون الجديد للمختبر!');
    } catch (err) {
      console.error(err);
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
      console.error(err);
      showFeedback('فشل حذف خيار اللون.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // ==========================================
  // STATE & HANDLERS FOR BEDROOM DESIGN OPTIONS
  // ==========================================
  const [bedOptName, setBedOptName] = useState('');
  const [bedOptDesc, setBedOptDesc] = useState('');
  const [bedOptSection, setBedOptSection] = useState<'bed' | 'headboard' | 'nightstand' | 'vanity' | 'wardrobe' | 'tvUnit' | 'curtains' | 'flooring' | 'ceiling' | 'lighting'>('bed');
  const [bedOptFile, setBedOptFile] = useState<File | null>(null);
  const [bedOptUrl, setBedOptUrl] = useState('');
  const [editingBedOptId, setEditingBedOptId] = useState<string | null>(null);

  const handleEditBedroomOptionClick = (opt: BedroomOption) => {
    setEditingBedOptId(opt.id);
    setBedOptName(opt.name);
    setBedOptDesc(opt.description || '');
    setBedOptSection(opt.section);
    setBedOptUrl(opt.image);
    setBedOptFile(null); // Reset any selected file
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
      
      if (bedOptFile) {
        renderImgUrl = await uploadFile(bedOptFile, 'bedroom-options');
      }

      if (editingBedOptId) {
        await updateBedroomOption(editingBedOptId, {
          name: bedOptName.trim(),
          section: bedOptSection,
          description: bedOptDesc.trim(),
          image: renderImgUrl
        });
        showFeedback('تم تحديث خيار التصميم لغرف النوم بنجاح!');
      } else {
        await addBedroomOption({
          name: bedOptName.trim(),
          section: bedOptSection,
          description: bedOptDesc.trim(),
          image: renderImgUrl
        });
        showFeedback('تم إضافة خيار التصميم لغرف النوم بنجاح!');
      }

      // Reset form & edit state
      setEditingBedOptId(null);
      setBedOptName('');
      setBedOptDesc('');
      setBedOptFile(null);
      setBedOptUrl('');
    } catch (err) {
      console.error(err);
      showFeedback(editingBedOptId ? 'فشل تحديث خيار التصميم.' : 'فشل إضافة خيار التصميم.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteBedroomOption = async (id: string) => {
    if (!window.confirm('حذف هذا الخيار من قائمة التصاميم المتاحة للزبائن؟')) return;
    try {
      setGlobalLoading(true);
      await deleteBedroomOption(id);
      if (editingBedOptId === id) {
        handleCancelEditBedroomOption();
      }
      showFeedback('تم حذف خيار التصميم بنجاح.');
    } catch (err) {
      console.error(err);
      showFeedback('فشل حذف خيار التصميم.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleUpdateSubStatus = async (id: string, status: 'pending' | 'reviewed' | 'completed') => {
    try {
      setGlobalLoading(true);
      await updateBedroomSubmissionStatus(id, status);
      showFeedback('تم تحديث حالة استمارة الخيارات بنجاح.');
    } catch (err) {
      console.error(err);
      showFeedback('فشل تحديث حالة الاستمارة.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteSub = async (id: string) => {
    if (!window.confirm('حذف استمارة الخيارات هذه بشكل نهائي؟')) return;
    try {
      setGlobalLoading(true);
      await deleteBedroomSubmission(id);
      showFeedback('تم حذف الاستمارة بنجاح.');
    } catch (err) {
      console.error(err);
      showFeedback('فشل حذف الاستمارة.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // ==========================================
  // STATE & HANDLERS FOR COMPANY INFO & SOCIALS
  // ==========================================
  const [compAddress, setCompAddress] = useState(companySettings.address);
  const [compPhone, setCompPhone] = useState(companySettings.phone);
  const [compWhatsapp, setCompWhatsapp] = useState(companySettings.whatsapp);
  const [compAbout, setCompAbout] = useState(companySettings.aboutText);

  const [socialInsta, setSocialInsta] = useState(socialLinks.instagram);
  const [socialFb, setSocialFb] = useState(socialLinks.facebook);
  const [socialTk, setSocialTk] = useState(socialLinks.tiktok);
  const [socialYt, setSocialYt] = useState(socialLinks.youtube);

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
      console.error(err);
      showFeedback('فشل حفظ التعديلات.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  // ==========================================
  // HANDLERS FOR DESIGN REQUESTS MANAGER
  // ==========================================
  const handleUpdateReqStatus = async (id: string, status: 'pending' | 'reviewed' | 'completed') => {
    try {
      setGlobalLoading(true);
      await updateDesignRequestStatus(id, status);
      showFeedback('تم تحديث حالة الطلب بنجاح.');
    } catch (err) {
      console.error(err);
      showFeedback('فشل تحديث حالة الطلب.', 'error');
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="bg-[#faf9f6] min-h-screen py-10" dir="rtl">
      {/* Upper Status Notifications */}
      <AnimatePresence>
        {feedback.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-6 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 max-w-sm ${
              feedback.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <Check className={`w-5 h-5 shrink-0 ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
            <span className="text-xs font-bold leading-relaxed">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Admin Header */}
        <div className="bg-[#171714] rounded-3xl p-6 md:p-8 border border-[#d4af37]/20 flex flex-col md:flex-row justify-between items-center gap-6 text-white shadow-xl">
          <div className="flex items-center gap-4 text-right w-full md:w-auto">
            <div className="p-3 rounded-2xl bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/25 shrink-0">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black font-sans">لوحة إدارة Royal Group</h1>
              <p className="text-[10px] text-gray-400 mt-1">
                {isFirebaseConnected 
                  ? <span className="text-green-400 flex items-center gap-1">● متصل بالـ Firebase المباشر للشركة</span>
                  : <span className="text-amber-400 flex items-center gap-1">● تشغيل بالوضع التجريبي الذاتي</span>
                }
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-5 py-2.5 bg-red-950/40 hover:bg-red-900/30 text-red-300 border border-red-500/25 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer self-stretch md:self-auto justify-center"
          >
            <LogOut className="w-4 h-4" />
            تسجيل خروج الأدمن
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#d4af37]/10 pb-4">
          {[
            { id: 'projects', label: 'إدارة المشاريع وقبل وبعد', icon: <Sliders className="w-4 h-4" /> },
            { id: 'requests', label: `طلبات التصميم المترتبة (${designRequests.length})`, icon: <ClipboardList className="w-4 h-4" /> },
            { id: 'colors', label: 'مختبر تجربة الألوان التفاعلي', icon: <Palette className="w-4 h-4" /> },
            { id: 'bedroom', label: `خيارات واستمارات غرف النوم (${bedroomSubmissions.length})`, icon: <Crown className="w-4 h-4 text-[#d4af37]" /> },
            { id: 'settings', label: 'معلومات الشركة والسوشيال ميديا', icon: <Settings className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                resetProjectForm();
              }}
              className={`px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-[#171714] text-[#d4af37] border border-[#d4af37]/35 shadow-md shadow-[#d4af37]/5'
                  : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Global Spinner */}
        {globalLoading && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            <span>جاري معالجة الطلب ورفع الملفات إلى الخادم...</span>
          </div>
        )}

        {/* ==========================================
            TAB CONTENT: PROJECTS MANAGER
            ========================================== */}
        {activeSubTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-gray-900 font-sans">قائمة المشاريع الحالية ({projects.length})</h3>
              {!showProjectForm && (
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="px-4 py-2.5 bg-[#171714] text-white hover:text-[#d4af37] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Plus className="w-4 h-4 text-[#d4af37]" />
                  إضافة مشروع جديد
                </button>
              )}
            </div>

            {/* Project Form (Create or Edit) */}
            {showProjectForm && (
              <form onSubmit={handleSaveProject} className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow space-y-6 text-right">
                <h4 className="text-sm font-bold text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5 font-sans">
                  {editingProject ? `تعديل مشروع: ${editingProject.title}` : 'تفاصيل المشروع الجديد'}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">عنوان المشروع بالعربية</label>
                    <input
                      type="text"
                      required
                      value={projTitle}
                      onChange={(e) => setProjTitle(e.target.value)}
                      placeholder="مثال: مطبخ رويال غريج المنصور"
                      className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">القسم</label>
                      <select
                        value={projCategory}
                        onChange={(e) => setProjCategory(e.target.value)}
                        className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold text-gray-800"
                      >
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">مشروع مميز؟ (يعرض بالرئيسية)</label>
                      <div className="flex items-center h-[46px] pr-2">
                        <input
                          type="checkbox"
                          checked={projFeatured}
                          onChange={(e) => setProjFeatured(e.target.checked)}
                          className="w-4 h-4 text-[#d4af37] rounded border-gray-300 focus:ring-[#d4af37]"
                        />
                        <span className="text-xs font-bold text-gray-700 mr-2">تميز المشروع</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">المساحة الإجمالية</label>
                    <input
                      type="text"
                      required
                      value={projArea}
                      onChange={(e) => setProjArea(e.target.value)}
                      placeholder="مثال: 45 م²"
                      className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">المدينة والموقع</label>
                    <input
                      type="text"
                      required
                      value={projCity}
                      onChange={(e) => setProjCity(e.target.value)}
                      placeholder="مثال: بغداد - اليرموك"
                      className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">وصف فني وتفصيلي للمشروع</label>
                  <textarea
                    rows={4}
                    required
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    placeholder="اكتب هنا تفاصيل التصميم، المواد المستخدمة، واللمسات الخاصة برويال جروب..."
                    className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none"
                  />
                </div>

                {/* Cover & Compare Images */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                  {/* Cover */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-800">صورة الغلاف الأساسية</label>
                    <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center space-y-2 relative min-h-28">
                      <ImageIcon className="w-6 h-6 text-[#d4af37]" />
                      <span className="text-[10px] text-gray-500">اختر ملف صورة الغلاف</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setProjCoverFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      {(projCoverFile || projCoverUrl) && (
                        <span className="text-[9px] text-green-600 font-bold z-10 bg-white px-2 py-0.5 rounded border border-green-200">
                          {projCoverFile ? projCoverFile.name : 'الصورة الحالية محملة'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 block">أو أدخل رابط الصورة المباشر (Firestore):</span>
                      <input
                        type="text"
                        value={projCoverUrl}
                        onChange={(e) => {
                          setProjCoverUrl(e.target.value);
                          setProjCoverFile(null);
                        }}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full p-2 text-[10px] bg-white border border-gray-200 rounded-lg outline-none font-sans"
                      />
                    </div>
                  </div>

                  {/* Before (Comparison) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400">صورة "قبل" التنفيذ (مقارنة)</label>
                    <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center space-y-2 relative min-h-28">
                      <Sliders className="w-6 h-6 text-gray-400" />
                      <span className="text-[10px] text-gray-400">تحميل مقارنة "قبل" (اختياري)</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setProjBeforeFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      {(projBeforeFile || projBeforeUrl) && (
                        <span className="text-[9px] text-amber-600 font-bold z-10 bg-white px-2 py-0.5 rounded border border-amber-200">
                          {projBeforeFile ? projBeforeFile.name : 'الصورة محملة'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 block">أو أدخل رابط الصورة المباشر (Firestore):</span>
                      <input
                        type="text"
                        value={projBeforeUrl}
                        onChange={(e) => {
                          setProjBeforeUrl(e.target.value);
                          setProjBeforeFile(null);
                        }}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full p-2 text-[10px] bg-white border border-gray-200 rounded-lg outline-none font-sans"
                      />
                    </div>
                  </div>

                  {/* After (Comparison) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#d4af37]">صورة "بعد" التنفيذ (مقارنة)</label>
                    <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center space-y-2 relative min-h-28">
                      <Sliders className="w-6 h-6 text-[#d4af37]" />
                      <span className="text-[10px] text-gray-500">تحميل مقارنة "بعد" (اختياري)</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setProjAfterFile(e.target.files[0]);
                          }
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                      {(projAfterFile || projAfterUrl) && (
                        <span className="text-[9px] text-green-600 font-bold z-10 bg-white px-2 py-0.5 rounded border border-green-200">
                          {projAfterFile ? projAfterFile.name : 'الصورة محملة'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-gray-500 block">أو أدخل رابط الصورة المباشر (Firestore):</span>
                      <input
                        type="text"
                        value={projAfterUrl}
                        onChange={(e) => {
                          setProjAfterUrl(e.target.value);
                          setProjAfterFile(null);
                        }}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full p-2 text-[10px] bg-white border border-gray-200 rounded-lg outline-none font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Project Gallery */}
                <div className="space-y-2.5 pt-4 border-t border-gray-100">
                  <label className="text-xs font-bold text-gray-800">معرض صور المشروع بالكامل</label>
                  
                  {/* Direct URL input for Gallery */}
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      id="galleryUrlInput"
                      placeholder="أدخل رابط صورة لإضافتها للمعرض..."
                      className="flex-1 p-2 text-[10px] bg-white border border-gray-200 rounded-lg outline-none font-sans"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const target = e.currentTarget;
                          if (target.value.trim()) {
                            setProjGalleryUrls(prev => [...prev, target.value.trim()]);
                            target.value = '';
                            showFeedback('تم إضافة رابط الصورة للمعرض!');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('galleryUrlInput') as HTMLInputElement;
                        if (input && input.value.trim()) {
                          setProjGalleryUrls(prev => [...prev, input.value.trim()]);
                          input.value = '';
                          showFeedback('تم إضافة رابط الصورة للمعرض!');
                        }
                      }}
                      className="px-3 py-1.5 bg-[#171714] text-white hover:text-[#d4af37] text-[10px] rounded-lg font-bold"
                    >
                      إضافة رابط
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-2">
                    {/* Add gallery image */}
                    <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center space-y-1.5 relative min-h-24">
                      <Plus className="w-5 h-5 text-gray-400" />
                      <span className="text-[9px] text-gray-500">رفع صور</span>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={handleGalleryUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                      />
                    </div>

                    {projGalleryUrls.map((url, idx) => (
                      <div key={idx} className="relative h-24 rounded-xl overflow-hidden border border-gray-200 group bg-[#232321]">
                        <img src={url} alt="معاينة المعرض" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 rounded text-white opacity-0 group-hover:opacity-100 transition-all text-xs"
                          title="حذف الصورة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form buttons */}
                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={resetProjectForm}
                    className="px-5 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-xs font-bold transition-all text-gray-500"
                  >
                    إلغاء التعديل
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-[#171714] text-white hover:text-[#d4af37] border border-transparent hover:border-[#d4af37]/35 text-xs font-black rounded-lg transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4 text-[#d4af37]" />
                    <span>{editingProject ? 'حفظ تعديلات المشروع' : 'حفظ المشروع الجديد'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* List Of Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((proj) => (
                <div key={proj.id} className="bg-white rounded-2xl border border-gray-150 p-4 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex gap-3 items-start text-right">
                    <img src={proj.coverImage} alt={proj.title} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100 bg-[#232321]" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#d4af37]/10 text-[#d4af37] text-[9px] font-black rounded">{proj.category}</span>
                        {proj.featured && <Star className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" />}
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 truncate font-sans">{proj.title}</h4>
                      <p className="text-[10px] text-gray-400 truncate">{proj.description}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-100 pt-3">
                    <span>مساحة: <strong className="text-gray-900">{proj.area}</strong></span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenEditProject(proj)}
                        className="p-1.5 hover:bg-[#d4af37]/10 text-gray-500 hover:text-[#d4af37] rounded transition-all"
                        title="تعديل المشروع"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-1.5 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded transition-all"
                        title="حذف المشروع"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB CONTENT: DESIGN REQUESTS MANAGER
            ========================================== */}
        {activeSubTab === 'requests' && (
          <div className="space-y-6">
            <h3 className="text-base font-black text-gray-900 font-sans">طلبات التصميم المرسلة من الزوار ({designRequests.length})</h3>
            
            {designRequests.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-gray-700">لا توجد طلبات واردة حالياً</h4>
                <p className="text-xs text-gray-400">ستظهر طلبات العملاء هنا بمجرد تعبئة استمارة طلب التصميم.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {designRequests.map((req) => (
                  <div key={req.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-right space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 font-sans">العميل: {req.name}</h4>
                        <span className="text-[10px] text-gray-400">بتاريخ: {new Date(req.createdAt).toLocaleDateString('ar-IQ')} • الهاتف: <strong className="text-gray-900 font-mono tracking-wide">{req.phone}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">حالة الطلب:</span>
                        <select
                          value={req.status}
                          onChange={(e) => handleUpdateReqStatus(req.id, e.target.value as any)}
                          className={`p-2 rounded text-xs font-bold border outline-none ${
                            req.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            req.status === 'reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-green-50 text-green-700 border-green-200'
                          }`}
                        >
                          <option value="pending">قيد الانتظار (جديد)</option>
                          <option value="reviewed">تمت المراجعة والاتصال</option>
                          <option value="completed">تم الاتفاق والتعاقد</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                      <div>الموقع: <strong className="text-gray-900">{req.city}</strong></div>
                      <div>نوع المشروع: <strong className="text-gray-900">{req.projectType}</strong></div>
                      <div>المساحة: <strong className="text-gray-900">{req.area}</strong></div>
                      <div>الميزانية المرصودة: <strong className="text-[#d4af37] font-black">{req.budget}</strong></div>
                    </div>

                    {/* Blueprints and Image Attachments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block mb-2">المخططات والخرائط المرفقة</span>
                        {req.plansUrl && req.plansUrl.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {req.plansUrl.map((url, index) => (
                              <a 
                                key={index} 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] border border-gray-200 hover:bg-gray-200 transition-all font-bold"
                              >
                                <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                                مخطط {index + 1}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">لم يتم إرفاق أي مخططات.</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block mb-2">صور موقع البناء الحالي المرفقة</span>
                        {req.imageUrl && req.imageUrl.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {req.imageUrl.map((url, index) => (
                              <a 
                                key={index} 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] border border-gray-200 hover:bg-gray-200 transition-all font-bold"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                                صورة مضافة {index + 1}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">لم يتم إرفاق صور للموقع.</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB CONTENT: COLOR LAB MANAGER
            ========================================== */}
        {activeSubTab === 'colors' && (
          <div className="space-y-6">
            <h3 className="text-base font-black text-gray-900 font-sans">تهيئة مختبر تجربة الألوان</h3>
            
            {/* Color Form */}
            <form onSubmit={handleAddColor} className="bg-white p-6 rounded-3xl border border-gray-200 shadow text-right space-y-4">
              <h4 className="text-xs font-bold text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2 font-sans">إضافة خامة / تلوين جديد للمختبر التفاعلي</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700">اسم اللون / الخامة</label>
                  <input
                    type="text"
                    required
                    value={colorName}
                    onChange={(e) => setColorName(e.target.value)}
                    placeholder="مثال: رخام كالكاتا الذهبي"
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700">نوع الخامة / عنصر التعديل</label>
                  <select
                    value={colorType}
                    onChange={(e) => setColorType(e.target.value as any)}
                    className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-800 font-bold"
                  >
                    <option value="wood">خشب (Wood)</option>
                    <option value="marble">رخام (Marble)</option>
                    <option value="wall">جدار (Wall)</option>
                    <option value="flooring">أرضية (Flooring)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700">درجة اللون / كود الـ Hex</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-10 h-10 border-0 p-0 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      required
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="flex-1 p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none text-center font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700">صورة المعاينة الفنية للرندر</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && setColorFile(e.target.files[0])}
                    className="w-full text-xs p-1.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    value={colorUrl}
                    onChange={(e) => {
                      setColorUrl(e.target.value);
                      setColorFile(null);
                    }}
                    placeholder="أو أدخل رابط صورة مباشرة هنا..."
                    className="w-full p-2 text-[10px] bg-white border border-gray-200 rounded-lg outline-none font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#171714] text-white hover:text-[#d4af37] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4 text-[#d4af37]" />
                  حفظ وإدراج الخيار
                </button>
              </div>
            </form>

            {/* List Of Colors */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {colorVariants.map((color) => (
                <div key={color.id} className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between text-right space-y-3">
                  <div className="space-y-2">
                    <div className="h-24 rounded-lg overflow-hidden border border-gray-100 bg-[#232321]">
                      <img src={color.image} alt={color.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-bold uppercase">{color.type}</span>
                      <span 
                        className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-inner" 
                        style={{ backgroundColor: color.colorValue }}
                      />
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 font-sans">{color.name}</h4>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-end">
                    <button
                      onClick={() => handleDeleteColor(color.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-all text-xs"
                      title="حذف الخيار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB CONTENT: BEDROOM ROYAL DESIGNER (ColorLab)
            ========================================== */}
        {activeSubTab === 'bedroom' && (() => {
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

          return (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-right">
                  <h3 className="text-base font-black text-gray-900 font-sans">إدارة مختبر غرف النوم الملكية (ColorLab)</h3>
                  <p className="text-xs text-gray-500 mt-0.5">أضف خيارات تصميم غرف النوم وعاين استمارات خيارات الزبائن المباشرة</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form to Add/Edit Option */}
                <form onSubmit={handleAddBedroomOption} className="lg:col-span-5 bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow space-y-4 text-right">
                  <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5 font-sans">
                    {editingBedOptId ? 'تعديل خيار التصميم الملكي' : 'إضافة خيار تصميم جديد للزبائن'}
                  </h4>
                  
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600">اسم الخيار بالعربية</label>
                      <input
                        type="text"
                        required
                        value={bedOptName}
                        onChange={(e) => setBedOptName(e.target.value)}
                        placeholder="مثال: سرير مخملي أسود بإطارات نحاسية"
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600">القسم المخصص له</label>
                      <select
                        value={bedOptSection}
                        onChange={(e: any) => setBedOptSection(e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none"
                      >
                        <option value="bed">تصميم السرير ولونه</option>
                        <option value="headboard">خلفية السرير (الهيدبورد)</option>
                        <option value="nightstand">الكومودينو (Nightstands)</option>
                        <option value="vanity">طاولة التسريحة (Vanity)</option>
                        <option value="wardrobe">خزانة الملابس / الدريسنج</option>
                        <option value="tvUnit">ديكور التلفزيون (TV Unit)</option>
                        <option value="curtains">تصاميم الستائر</option>
                        <option value="flooring">الأرضيات الراقية</option>
                        <option value="ceiling">ديكورات السقف والجبس</option>
                        <option value="lighting">توزيع الإنارة والثريا</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600">وصف الخيار (اختياري)</label>
                      <textarea
                        rows={3}
                        value={bedOptDesc}
                        onChange={(e) => setBedOptDesc(e.target.value)}
                        placeholder="وصف تفصيلي مبسط يوضح فخامة الخيار للزبون..."
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-600">رفع صورة مخصصة</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setBedOptFile(e.target.files[0]);
                            }
                          }}
                          className="w-full text-xs text-gray-500 file:mr-0 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-600">أو رابط صورة جاهز</label>
                        <input
                          type="text"
                          value={bedOptUrl}
                          onChange={(e) => setBedOptUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none text-left font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-2">
                      {editingBedOptId && (
                        <button
                          type="button"
                          onClick={handleCancelEditBedroomOption}
                          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
                        >
                          إلغاء
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#171714] text-white hover:text-[#d4af37] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                      >
                        {editingBedOptId ? (
                          <>
                            <Save className="w-4 h-4 text-[#d4af37]" />
                            حفظ التعديلات
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 text-[#d4af37]" />
                            إضافة الخيار الفاخر
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* View Existing Options */}
                <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow space-y-6 text-right">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5 font-sans">قائمة خيارات غرف النوم الحالية ({bedroomOptions.length})</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                    {bedroomOptions.map((opt) => (
                      <div key={opt.id} className="bg-gray-50 p-3 rounded-2xl border border-gray-150 flex gap-3 relative">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                          <img src={opt.image} alt={opt.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-[#d4af37]/10 text-[#aa7c11] rounded uppercase">
                            {SECTIONS_METADATA.find(s => s.key === opt.section)?.title || opt.section}
                          </span>
                          <h5 className="text-xs font-bold text-gray-900 truncate mt-1">{opt.name}</h5>
                          {opt.description && <p className="text-[10px] text-gray-500 truncate">{opt.description}</p>}
                        </div>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1">
                          <button
                            onClick={() => handleEditBedroomOptionClick(opt)}
                            type="button"
                            className="text-gray-400 hover:text-[#aa7c11] p-1.5 rounded hover:bg-amber-50"
                            title="تعديل الخيار"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBedroomOption(opt.id)}
                            type="button"
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                            title="حذف الخيار"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customer Submissions Section */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow space-y-6 text-right">
                <h4 className="text-xs font-black text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5 font-sans">استمارات خيارات غرف النوم الواردة من الزبائن ({bedroomSubmissions.length})</h4>

                {bedroomSubmissions.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-gray-150 rounded-2xl space-y-2">
                    <ClipboardList className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-xs text-gray-400">لا توجد استمارات مرسلة حالياً من مختبر غرف النوم.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bedroomSubmissions.map((sub) => (
                      <div key={sub.id} className="border border-gray-200 rounded-2xl p-5 space-y-4 hover:shadow-md transition-all">
                        {/* Customer Meta */}
                        <div className="flex flex-wrap justify-between items-center gap-3 bg-gray-50 p-3 rounded-xl">
                          <div className="flex items-center gap-4">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-black text-gray-900">{sub.clientName}</h4>
                              <p className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                <span>{sub.clientPhone}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Status Badge */}
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                              sub.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : sub.status === 'reviewed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800 animate-pulse'
                            }`}>
                              {sub.status === 'completed' ? 'منجز' : sub.status === 'reviewed' ? 'قيد المراجعة' : 'جديد ومفتوح'}
                            </span>

                            <select
                              value={sub.status || 'pending'}
                              onChange={(e) => handleUpdateSubStatus(sub.id, e.target.value as any)}
                              className="text-[10px] p-1.5 bg-white border border-gray-300 rounded outline-none"
                            >
                              <option value="pending">جديد</option>
                              <option value="reviewed">قيد المراجعة</option>
                              <option value="completed">منجز</option>
                            </select>

                            <button
                              onClick={() => handleDeleteSub(sub.id)}
                              type="button"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Selections Chosen Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          {Object.entries(sub.selections || {}).map(([secKey, sel]: [string, any]) => (
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ==========================================
            TAB CONTENT: COMPANY INFO & SOCIALS
            ========================================== */}
        {activeSubTab === 'settings' && (
          <div className="space-y-6">
            <h3 className="text-base font-black text-gray-900 font-sans">تعديل بيانات الشركة والسوشيال ميديا</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-right">
              {/* Company contact info */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow space-y-4">
                <h4 className="text-xs font-bold text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5 font-sans">معلومات الاتصال والعناوين الرسمية</h4>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">العنوان الرسمي للشركة</label>
                    <input
                      type="text"
                      value={compAddress}
                      onChange={(e) => setCompAddress(e.target.value)}
                      placeholder="العنوان الكامل"
                      className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600">رقم الهاتف</label>
                      <input
                        type="text"
                        value={compPhone}
                        onChange={(e) => setCompPhone(e.target.value)}
                        placeholder="رقم الهاتف"
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none text-left font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600">رقم الواتساب</label>
                      <input
                        type="text"
                        value={compWhatsapp}
                        onChange={(e) => setCompWhatsapp(e.target.value)}
                        placeholder="رقم الواتساب"
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none text-left font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">نبذة تعريفية عن الشركة (صفحة من نحن والجهة الرئيسية)</label>
                    <textarea
                      rows={5}
                      value={compAbout}
                      onChange={(e) => setCompAbout(e.target.value)}
                      placeholder="قصة ونبذة تأسيس الشركة المعمارية..."
                      className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#1e1e1a] border-r-2 border-[#d4af37] pr-2.5 font-sans">روابط منصات التواصل الاجتماعي</h4>
                  
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600">رابط انستغرام (Instagram)</label>
                      <input
                        type="text"
                        value={socialInsta}
                        onChange={(e) => setSocialInsta(e.target.value)}
                        placeholder="https://instagram.com/..."
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none text-left font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600">رابط فيسبوك (Facebook)</label>
                      <input
                        type="text"
                        value={socialFb}
                        onChange={(e) => setSocialFb(e.target.value)}
                        placeholder="https://facebook.com/..."
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none text-left font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600">رابط تيك توك (TikTok)</label>
                      <input
                        type="text"
                        value={socialTk}
                        onChange={(e) => setSocialTk(e.target.value)}
                        placeholder="https://tiktok.com/@..."
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none text-left font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600">رابط يوتيوب (YouTube)</label>
                      <input
                        type="text"
                        value={socialYt}
                        onChange={(e) => setSocialYt(e.target.value)}
                        placeholder="https://youtube.com/..."
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none text-left font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    className="px-8 py-3.5 bg-[#171714] text-white hover:text-[#d4af37] border border-transparent hover:border-[#d4af37]/35 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 shadow"
                  >
                    <Save className="w-4 h-4 text-[#d4af37]" />
                    حفظ التغييرات بالكامل
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
