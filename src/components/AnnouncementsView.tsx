import React from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/translations';
import { Announcement } from '../types';
import { Bell, Calendar, Tag, AlertCircle, BookmarkCheck, FileText } from 'lucide-react';

interface AnnouncementsViewProps {
  announcements: Announcement[];
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ announcements }) => {
  const { language } = useAuth();
  const tr = t[language];

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'exam':
        return { label: language === 'hi' ? 'बोर्ड परीक्षा' : 'Exam Schedule', color: 'bg-rose-100 text-rose-800' };
      case 'scholarship':
        return { label: language === 'hi' ? 'छात्रवृत्ति' : 'Scholarship', color: 'bg-emerald-100 text-emerald-800' };
      case 'materials':
        return { label: language === 'hi' ? 'नोट्स वितरण' : 'Study Notes', color: 'bg-blue-100 text-blue-800' };
      default:
        return { label: language === 'hi' ? 'सूचना' : 'General Notice', color: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Bell className="w-6 h-6 text-sky-600" />
          <span>{tr.annTitle}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {tr.annSub}
        </p>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((ann) => {
          const cat = getCategoryBadge(ann.category);

          return (
            <div
              key={ann.id}
              className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-xs hover:shadow-md transition-all ${
                ann.isImportant ? 'border-amber-300 ring-1 ring-amber-300/60' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cat.color}`}>
                    {cat.label}
                  </span>
                  {ann.isImportant && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold uppercase">
                      {tr.importantNotice}
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {ann.date}
                </span>
              </div>

              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">
                {language === 'hi' ? ann.titleHi : ann.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">
                {language === 'hi' ? ann.contentHi : ann.content}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
