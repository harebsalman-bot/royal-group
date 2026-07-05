/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useFirebaseState } from '../components/FirestoreStateContext';
import { Project } from '../types';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { Eye, MapPin, Minimize2, Sparkles, FolderOpen, Grid, Layout, Sliders, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Projects: React.FC = () => {
  const { projects, categories } = useFirebaseState();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Filter projects by category
  const filteredProjects = selectedCategory === 'all'
    ? projects
    : projects.filter(p => p.category === selectedCategory);

  return (
    <div className="bg-[#faf9f6] py-16 min-h-screen space-y-12" dir="rtl">
      {/* 1. Header Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <span className="text-[#d4af37] text-xs font-bold tracking-widest uppercase flex justify-center items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          معرض الأعمال الفاخرة
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-[#1e1e1a] font-sans tracking-tight">مشاريع رويال جروب</h1>
        <p className="text-gray-500 text-xs md:text-sm max-w-lg mx-auto font-sans leading-relaxed">
          تصفح أرقى التصاميم وأرقى الأعمال الهندسية المنجزة بأيدي مهندسينا ومحترفينا في العراق.
        </p>
      </div>

      {/* 2. Categories Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2 pb-4 border-b border-[#d4af37]/10">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#171714] text-[#d4af37] border border-[#d4af37]/35 shadow-md shadow-[#d4af37]/5'
                : 'bg-white hover:bg-[#171714]/5 text-gray-600 border border-gray-200'
            }`}
          >
            جميع المشاريع ({projects.length})
          </button>
          
          {categories.map((cat) => {
            const count = projects.filter(p => p.category === cat.name).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === cat.name
                    ? 'bg-[#171714] text-[#d4af37] border border-[#d4af37]/35 shadow-md shadow-[#d4af37]/5'
                    : 'bg-white hover:bg-[#171714]/5 text-gray-600 border border-gray-200'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Projects Grid Display */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto" />
            <h3 className="text-lg font-bold text-gray-700">لا توجد مشاريع مضافة حالياً في هذا القسم</h3>
            <p className="text-xs text-gray-400">تابعونا قريباً لإضافة أحدث التصاميم الهندسية الفاخرة.</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project) => (
                <motion.div
                  layout
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setActiveProject(project)}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div className="h-64 relative overflow-hidden bg-[#232321]">
                    <img 
                      src={project.coverImage || undefined} 
                      alt={project.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="px-4 py-2 bg-[#171714]/95 text-[#d4af37] text-xs font-bold rounded-lg border border-[#d4af37]/40 shadow-xl flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        عرض التفاصيل والمقارنة
                      </div>
                    </div>
                    {project.featured && (
                      <div className="absolute top-4 right-4 bg-[#d4af37] text-[#171714] text-[9px] font-black tracking-widest px-2.5 py-1 rounded shadow">
                        مميز
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-sm text-gray-200 text-[10px] font-bold px-2.5 py-1 rounded">
                      {project.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#d4af37]" /> {project.city}</span>
                        <span>المساحة: <strong>{project.area}</strong></span>
                      </div>
                      <h3 className="text-base font-black text-[#1e1e1a] group-hover:text-[#d4af37] transition-colors font-sans">
                        {project.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* 4. Luxury Project Detail & Comparison Modal */}
      <AnimatePresence>
        {activeProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-[#faf9f6] rounded-2xl border border-[#d4af37]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#d4af37]/15 flex justify-between items-center bg-[#171714] text-white">
                <div className="flex items-center gap-3">
                  <span className="bg-[#d4af37] text-[#171714] text-[9px] font-black px-2.5 py-0.5 rounded">
                    {activeProject.category}
                  </span>
                  <h3 className="text-lg font-bold font-sans text-white">{activeProject.title}</h3>
                </div>
                <button 
                  onClick={() => setActiveProject(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-8 text-right flex-1">
                {/* Meta details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-white border border-gray-100 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 block font-medium">المدينة والموقع</span>
                    <strong className="text-gray-900 mt-0.5 inline-block">{activeProject.city}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">المساحة الإجمالية</span>
                    <strong className="text-gray-900 mt-0.5 inline-block">{activeProject.area}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">القسم</span>
                    <strong className="text-[#d4af37] mt-0.5 inline-block">{activeProject.category}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">تاريخ الإنجاز</span>
                    <strong className="text-gray-900 mt-0.5 inline-block">
                      {new Date(activeProject.createdAt).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long' })}
                    </strong>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-900 font-sans border-r-2 border-[#d4af37] pr-2.5">وصف المشروع</h4>
                  <p className="text-xs text-gray-600 leading-relaxed text-justify">
                    {activeProject.description}
                  </p>
                </div>

                {/* Before & After Interactive Comparison */}
                {activeProject.beforeImage && activeProject.afterImage && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 font-sans border-r-2 border-[#d4af37] pr-2.5 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#d4af37]" />
                      مقارنة التنفيذ (قبل وبعد)
                    </h4>
                    <p className="text-gray-500 text-[11px] mt-1">اسحب الشريط المنزلق الذهبي يميناً ويساراً لمقارنة العمل قبل البدء وبعد تسليم المفتاح.</p>
                    <BeforeAfterSlider 
                      beforeImage={activeProject.beforeImage} 
                      afterImage={activeProject.afterImage} 
                      height="h-[380px]"
                    />
                  </div>
                )}

                {/* Complete Project Gallery */}
                {activeProject.images && activeProject.images.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 font-sans border-r-2 border-[#d4af37] pr-2.5">معرض صور المشروع الكامل</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {activeProject.images.map((img, idx) => (
                        <div key={idx} className="relative h-44 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-[#232321]">
                          <img 
                            src={img || undefined} 
                            alt={`${activeProject.title} ${idx + 1}`} 
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Close Footer Button */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 text-left">
                <button
                  onClick={() => setActiveProject(null)}
                  className="px-5 py-2.5 rounded-lg bg-[#171714] text-white hover:text-[#d4af37] text-xs font-semibold transition-colors"
                >
                  إغلاق نافذة المعاينة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
