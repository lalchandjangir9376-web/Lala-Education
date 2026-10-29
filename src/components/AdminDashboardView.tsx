import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/translations';
import { AdminStats, StudyMaterial, EducationalVideo, OnlineTestItem, Announcement } from '../types';
import { api } from '../lib/api';
import { VideoManager } from './admin/VideoManager';
import { PdfCreatorAndEditor } from './admin/PdfCreatorAndEditor';
import { NotesManager } from './admin/NotesManager';
import { AiNotesGeneratorModal } from './admin/AiNotesGeneratorModal';
import {
  Shield,
  Users,
  BookOpen,
  Video,
  FileCheck,
  Coins,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Bell,
  Sparkles,
  FileText,
  Upload,
} from 'lucide-react';

interface AdminDashboardViewProps {
  onDataChanged?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onDataChanged }) => {
  const { user, language, adminLogin } = useAuth();
  const tr = t[language];

  // Admin Login Form State for unauthenticated or student visitors
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'videos' | 'pdf_creator' | 'materials' | 'tests' | 'notices'>('stats');
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Data collections
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [videos, setVideos] = useState<EducationalVideo[]>([]);
  const [tests, setTests] = useState<OnlineTestItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // State for editing in PDF Creator
  const [materialToEdit, setMaterialToEdit] = useState<StudyMaterial | null>(null);

  // AI Notes Generator Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Add Test Form State
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestTitleHi, setNewTestTitleHi] = useState('');
  const [newTestClass, setNewTestClass] = useState<'9' | '10' | '11' | '12'>('10');
  const [newTestSubject, setNewTestSubject] = useState('Science');
  const [newTestSubjectHi, setNewTestSubjectHi] = useState('विज्ञान');
  const [newTestDuration, setNewTestDuration] = useState('15');
  const [newTestCoinPrice, setNewTestCoinPrice] = useState('0');

  // Simple test questions builder
  const [q1Text, setQ1Text] = useState('What is the SI unit of electric current?');
  const [q1TextHi, setQ1TextHi] = useState('विद्युत धारा का SI मात्रक क्या है?');
  const [q1Opt1, setQ1Opt1] = useState('Ampere (ऐम्पियर)');
  const [q1Opt2, setQ1Opt2] = useState('Volt (वोल्ट)');
  const [q1Opt3, setQ1Opt3] = useState('Ohm (ओम)');
  const [q1Opt4, setQ1Opt4] = useState('Watt (वाट)');
  const [q1Correct, setQ1Correct] = useState(0);
  const [q1ExplHi, setQ1ExplHi] = useState('विद्युत धारा का SI मात्रक ऐम्पियर (A) होता है।');

  // Add Notice Form State
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeTitleHi, setNewNoticeTitleHi] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeContentHi, setNewNoticeContentHi] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<'exam' | 'notice' | 'scholarship' | 'materials'>('notice');
  const [newNoticeImportant, setNewNoticeImportant] = useState(false);

  // Delete confirmations
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [deletingNoticeId, setDeletingNoticeId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, m, v, tList, a] = await Promise.all([
        api.getAdminStats(),
        api.getMaterials(),
        api.getVideos(),
        api.getTests(),
        api.getAnnouncements(),
      ]);
      setStats(s);
      setMaterials(m);
      setVideos(v);
      setTests(tList);
      setAnnouncements(a);
    } catch (e: any) {
      setActionError(e.message || 'एडमिन डेटा लोड नहीं हो सका');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
    }
  }, [user]);

  const triggerSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
    loadData();
    onDataChanged?.();
  };

  const triggerError = (msg: string) => {
    setActionError(msg);
    setTimeout(() => setActionError(null), 4000);
  };

  // Secure Admin Login Handler
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError(null);
    try {
      await adminLogin(adminIdentifier.trim(), adminPassword);
      setAdminIdentifier('');
      setAdminPassword('');
      loadData();
      triggerSuccess('व्यवस्थापक सत्यापन सफल! Lala Education Admin Panel में आपका स्वागत है।');
    } catch (err: any) {
      setAdminLoginError(err.message || 'सत्यापन विफल रहा। कृपया सही व्यवस्थापक पासवर्ड दर्ज करें।');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  // Add Test Handler
  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await api.addTest({
        title: newTestTitle || newTestTitleHi,
        titleHi: newTestTitleHi || newTestTitle,
        classGrade: newTestClass,
        subject: newTestSubject,
        subjectHi: newTestSubjectHi,
        durationMinutes: parseInt(newTestDuration) || 15,
        coinPrice: parseInt(newTestCoinPrice) || 0,
        questions: [
          {
            question: q1Text,
            questionHi: q1TextHi,
            options: [q1Opt1, q1Opt2, q1Opt3, q1Opt4],
            optionsHi: [q1Opt1, q1Opt2, q1Opt3, q1Opt4],
            correctAnswer: q1Correct,
            explanation: 'Correct formula and board definition',
            explanationHi: q1ExplHi,
            marks: 4,
          },
        ],
      });
      setNewTestTitle('');
      setNewTestTitleHi('');
      triggerSuccess('नया ऑनलाइन टेस्ट सफलतापूर्वक प्रकाशित हो गया!');
    } catch (err: any) {
      triggerError(err.message || 'त्रुटि हुई');
    }
  };

  // Add Notice Handler
  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await api.addAnnouncement({
        title: newNoticeTitle || newNoticeTitleHi,
        titleHi: newNoticeTitleHi || newNoticeTitle,
        content: newNoticeContent || newNoticeContentHi,
        contentHi: newNoticeContentHi || newNoticeContent,
        category: newNoticeCategory,
        isImportant: newNoticeImportant,
      });
      setNewNoticeTitle('');
      setNewNoticeTitleHi('');
      setNewNoticeContent('');
      setNewNoticeContentHi('');
      triggerSuccess('नवीनतम सूचना/नोटिस प्रकाशित हो गई!');
    } catch (err: any) {
      triggerError(err.message || 'त्रुटि हुई');
    }
  };

  // Delete Test
  const confirmDeleteTest = async () => {
    if (!deletingTestId) return;
    try {
      await api.deleteTest(deletingTestId);
      setDeletingTestId(null);
      triggerSuccess('टेस्ट सफलतापूर्वक हटा दिया गया!');
    } catch (err: any) {
      triggerError(err.message || 'टेस्ट हटाने में त्रुटि हुई।');
    }
  };

  // Delete Notice
  const confirmDeleteNotice = async () => {
    if (!deletingNoticeId) return;
    try {
      await api.deleteAnnouncement(deletingNoticeId);
      setDeletingNoticeId(null);
      triggerSuccess('सूचना सफलतापूर्वक हटा दी गई!');
    } catch (err: any) {
      triggerError(err.message || 'सूचना हटाने में त्रुटि हुई।');
    }
  };

  // If visitor is NOT a verified admin, render secure Admin Login UI
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-6 text-white text-center">
            <div className="w-14 h-14 mx-auto mb-3 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xs">
              <Shield className="w-7 h-7 text-amber-300" />
            </div>
            <h2 className="text-xl font-black tracking-tight">
              {language === 'hi' ? 'व्यवस्थापक पोर्टल प्रवेश' : 'Admin Portal Login'}
            </h2>
            <p className="text-xs text-blue-200/80 mt-1">
              {language === 'hi'
                ? 'लाला एजुकेशन ऐप - केवल अधिकृत व्यवस्थापक के लिए'
                : 'Restricted to verified administrators'}
            </p>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">
            {user && user.role !== 'admin' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
                {language === 'hi'
                  ? `आप वर्तमान में छात्र (${user.name}) के रूप में लॉगिन हैं। एडमिन पैनल खोलने हेतु व्यवस्थापक पासवर्ड दर्ज करें:`
                  : `Currently logged in as student (${user.name}). Enter admin credentials to proceed:`}
              </div>
            )}

            {adminLoginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{adminLoginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'hi' ? 'व्यवस्थापक यूज़रनेम या ईमेल' : 'Admin Username or Email'} *
                </label>
                <input
                  type="text"
                  required
                  value={adminIdentifier}
                  onChange={(e) => setAdminIdentifier(e.target.value)}
                  placeholder="admin_lala अथवा lalajikhatilalaji@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'hi' ? 'व्यवस्थापक पासवर्ड' : 'Admin Password'} *
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={adminLoginLoading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {adminLoginLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-amber-300" />
                    <span>{language === 'hi' ? 'व्यवस्थापक सत्यापित करें और प्रवेश करें' : 'Verify & Enter Admin Panel'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                🔒 सुरक्षा नीति: व्यवस्थापक पासवर्ड सर्वर-साइड सत्यापित होता है। केवल प्रमाणित व्यवस्थापक ही सामग्री अपलोड व प्रकाशित कर सकते हैं।
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-10 max-w-6xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-700" />
              <span>लाला एजुकेशन एडमिन पैनल (Admin Panel)</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              प्रमाणित व्यवस्थापक
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            YouTube व वीडियो कक्षाएं, इन-ऐप PDF निर्माता, AI नोट्स जनरेटर एवं ऑनलाइन टेस्ट प्रबंधन।
          </p>
        </div>

        {/* AI Quick Button */}
        <button
          type="button"
          onClick={() => setIsAiModalOpen(true)}
          className="self-start sm:self-center flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>AI नोट्स जनरेटर खोलें</span>
        </button>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Horizontal Scrollable Tabs for Mobile & Desktop */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {[
          { id: 'stats', label: 'डैशबोर्ड व आँकड़े', icon: Layers },
          { id: 'videos', label: 'YouTube व वीडियो प्रबंधन', icon: Video },
          { id: 'pdf_creator', label: 'PDF क्रिएटर (In-App)', icon: FileText },
          { id: 'materials', label: 'नोट्स लाइब्रेरी प्रबंधन', icon: BookOpen },
          { id: 'tests', label: 'ऑनलाइन टेस्ट', icon: FileCheck },
          { id: 'notices', label: 'सूचनाएं व नोटिस', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'pdf_creator' && !materialToEdit) {
                  setMaterialToEdit(null);
                }
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: STATS ================= */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">कुल विद्यार्थी</span>
                <span className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Users className="w-5 h-5" />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{stats.totalStudents}</p>
              <p className="text-[11px] text-slate-400 mt-1">राजस्थान के पंजीकृत छात्र</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">पीडीएफ व नोट्स</span>
                <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <BookOpen className="w-5 h-5" />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{stats.totalMaterials}</p>
              <p className="text-[11px] text-slate-400 mt-1">हस्तलिखित नोट्स व गाइड</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">वीडियो लेक्चर्स</span>
                <span className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
                  <Video className="w-5 h-5" />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{stats.totalVideos}</p>
              <p className="text-[11px] text-slate-400 mt-1">YouTube एवं डायरेक्ट वीडियो</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ऑनलाइन टेस्ट्स</span>
                <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <FileCheck className="w-5 h-5" />
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{stats.totalTests}</p>
              <p className="text-[11px] text-slate-400 mt-1">{stats.totalTestAttempts} बार टेस्ट दिए गए</p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              त्वरित क्रियाएं (Quick Actions)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMaterialToEdit(null);
                  setActiveTab('pdf_creator');
                }}
                className="p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100/80 text-left transition-all"
              >
                <FileText className="w-6 h-6 text-blue-600 mb-2" />
                <p className="text-xs font-bold text-blue-950">PDF बनाएं</p>
                <p className="text-[10px] text-blue-700">इन-ऐप नोट्स एडिटर</p>
              </button>

              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/80 text-left transition-all"
              >
                <Sparkles className="w-6 h-6 text-indigo-600 mb-2" />
                <p className="text-xs font-bold text-indigo-950">AI से नोट्स बनाएं</p>
                <p className="text-[10px] text-indigo-700">Gemini 3.8 Flash</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('videos')}
                className="p-4 rounded-2xl bg-red-50 border border-red-100 hover:bg-red-100/80 text-left transition-all"
              >
                <Video className="w-6 h-6 text-red-600 mb-2" />
                <p className="text-xs font-bold text-red-950">वीडियो जोड़ें</p>
                <p className="text-[10px] text-red-700">YouTube या अपलोड</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tests')}
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/80 text-left transition-all"
              >
                <FileCheck className="w-6 h-6 text-emerald-600 mb-2" />
                <p className="text-xs font-bold text-emerald-950">टेस्ट बनाएं</p>
                <p className="text-[10px] text-emerald-700">ऑब्जेक्टिव प्रश्न बैंक</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: VIDEOS MANAGER ================= */}
      {activeTab === 'videos' && (
        <VideoManager
          videos={videos}
          onRefresh={loadData}
          onSuccess={triggerSuccess}
          onError={triggerError}
        />
      )}

      {/* ================= TAB 3: PDF CREATOR & EDITOR ================= */}
      {activeTab === 'pdf_creator' && (
        <PdfCreatorAndEditor
          initialMaterial={materialToEdit}
          onSaved={(mat, isPub) => {
            setMaterialToEdit(null);
            triggerSuccess(
              isPub
                ? 'नोट्स सफलतापूर्वक प्रकाशित हो गए!'
                : 'नोट्स ड्राफ्ट के रूप में सहेज लिया गया!'
            );
            setActiveTab('materials');
          }}
          onCancel={() => {
            setMaterialToEdit(null);
            setActiveTab('materials');
          }}
          onError={triggerError}
        />
      )}

      {/* ================= TAB 4: NOTES & MATERIALS LIBRARY ================= */}
      {activeTab === 'materials' && (
        <NotesManager
          materials={materials}
          onRefresh={loadData}
          onEditMaterial={(mat) => {
            setMaterialToEdit(mat);
            setActiveTab('pdf_creator');
          }}
          onOpenCreateNew={() => {
            setMaterialToEdit(null);
            setActiveTab('pdf_creator');
          }}
          onOpenAiGenerator={() => setIsAiModalOpen(true)}
          onSuccess={triggerSuccess}
          onError={triggerError}
        />
      )}

      {/* ================= TAB 5: ONLINE TESTS ================= */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          {/* Add Test Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <span>नया ऑनलाइन टेस्ट तैयार करें (Create Online Mock Test)</span>
            </h3>

            <form onSubmit={handleAddTest} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    टेस्ट का शीर्षक (हिंदी) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTestTitleHi}
                    onChange={(e) => setNewTestTitleHi(e.target.value)}
                    placeholder="उदा: कक्षा 10 विज्ञान - रासायनिक अभिक्रियाएँ मॉक टेस्ट"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Title (English)</label>
                  <input
                    type="text"
                    value={newTestTitle}
                    onChange={(e) => setNewTestTitle(e.target.value)}
                    placeholder="e.g. Class 10 Science - Chemical Reactions Test"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">कक्षा</label>
                  <select
                    value={newTestClass}
                    onChange={(e) => setNewTestClass(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="9">कक्षा 9</option>
                    <option value="10">कक्षा 10</option>
                    <option value="11">कक्षा 11</option>
                    <option value="12">कक्षा 12</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">विषय</label>
                  <select
                    value={newTestSubject}
                    onChange={(e) => {
                      setNewTestSubject(e.target.value);
                      const map: Record<string, string> = {
                        Science: 'विज्ञान',
                        Mathematics: 'गणित',
                        Physics: 'भौतिक विज्ञान',
                        Chemistry: 'रसायन विज्ञान',
                      };
                      setNewTestSubjectHi(map[e.target.value] || e.target.value);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="Science">विज्ञान (Science)</option>
                    <option value="Mathematics">गणित (Maths)</option>
                    <option value="Physics">भौतिक विज्ञान</option>
                    <option value="Chemistry">रसायन विज्ञान</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">समय सीमा (मिनट)</label>
                  <input
                    type="number"
                    value={newTestDuration}
                    onChange={(e) => setNewTestDuration(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">अनलॉक मूल्य (Coins)</label>
                  <input
                    type="number"
                    value={newTestCoinPrice}
                    onChange={(e) => setNewTestCoinPrice(e.target.value)}
                    placeholder="0 = मुफ़्त"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              {/* Sample Question Builder */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 text-xs">प्रश्न 1 (Question 1)</span>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">प्रश्न (हिंदी)</label>
                  <input
                    type="text"
                    value={q1TextHi}
                    onChange={(e) => setQ1TextHi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">विकल्प 1</label>
                    <input
                      type="text"
                      value={q1Opt1}
                      onChange={(e) => setQ1Opt1(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">विकल्प 2</label>
                    <input
                      type="text"
                      value={q1Opt2}
                      onChange={(e) => setQ1Opt2(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">विकल्प 3</label>
                    <input
                      type="text"
                      value={q1Opt3}
                      onChange={(e) => setQ1Opt3(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">विकल्प 4</label>
                    <input
                      type="text"
                      value={q1Opt4}
                      onChange={(e) => setQ1Opt4(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">सही उत्तर (Correct Answer)</label>
                    <select
                      value={q1Correct}
                      onChange={(e) => setQ1Correct(parseInt(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      <option value={0}>विकल्प 1</option>
                      <option value={1}>विकल्प 2</option>
                      <option value={2}>विकल्प 3</option>
                      <option value={3}>विकल्प 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">व्याख्या (Explanation)</label>
                    <input
                      type="text"
                      value={q1ExplHi}
                      onChange={(e) => setQ1ExplHi(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm text-xs sm:text-sm"
                >
                  नया ऑनलाइन टेस्ट प्रकाशित करें
                </button>
              </div>
            </form>
          </div>

          {/* Tests List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">उपलब्ध ऑनलाइन टेस्ट्स ({tests.length})</h3>
            <div className="space-y-2">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 bg-slate-50/50"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                        कक्षा {test.classGrade}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">{test.subjectHi}</span>
                    </div>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 mt-1">{test.titleHi || test.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {test.questionCount} प्रश्न • {test.durationMinutes} मिनट • {test.coinPrice === 0 ? 'मुफ़्त' : `${test.coinPrice} कॉइन्स`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeletingTestId(test.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: NOTICES & ANNOUNCEMENTS ================= */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          {/* Add Notice Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <span>नई सूचना / नोटिस प्रकाशित करें</span>
            </h3>

            <form onSubmit={handleAddNotice} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">नोटिस का शीर्षक (हिंदी) *</label>
                <input
                  type="text"
                  required
                  value={newNoticeTitleHi}
                  onChange={(e) => setNewNoticeTitleHi(e.target.value)}
                  placeholder="उदा: आरबीएसई बोर्ड परीक्षा 2027 मॉडल पेपर्स जारी"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">विस्तृत विवरण (Content) *</label>
                <textarea
                  rows={3}
                  required
                  value={newNoticeContentHi}
                  onChange={(e) => setNewNoticeContentHi(e.target.value)}
                  placeholder="नोटिस का पूरा विवरण यहाँ लिखें..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">श्रेणी (Category)</label>
                  <select
                    value={newNoticeCategory}
                    onChange={(e) => setNewNoticeCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="exam">बोर्ड परीक्षा (Exam)</option>
                    <option value="notice">सामान्य नोटिस (Notice)</option>
                    <option value="scholarship">छात्रवृत्ति (Scholarship)</option>
                    <option value="materials">अध्ययन सामग्री (Materials)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newNoticeImportant}
                      onChange={(e) => setNewNoticeImportant(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>महत्वपूर्ण सूचना (लाल बैज दर्शाएं)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm text-xs sm:text-sm"
                >
                  नोटिस प्रकाशित करें
                </button>
              </div>
            </form>
          </div>

          {/* Notices List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">प्रकाशित सूचनाएं ({announcements.length})</h3>
            <div className="space-y-2">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-2xl border border-slate-200 flex items-start justify-between gap-3 bg-slate-50/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                        {ann.category}
                      </span>
                      {ann.isImportant && (
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold">
                          अति-महत्वपूर्ण
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{ann.date}</span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">{ann.titleHi || ann.title}</h4>
                    <p className="text-xs text-slate-600">{ann.contentHi || ann.content}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeletingNoticeId(ann.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Notes Generator Modal */}
      <AiNotesGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onNotesGenerated={(draft) => {
          setMaterialToEdit(draft as StudyMaterial);
          setActiveTab('pdf_creator');
          triggerSuccess('AI द्वारा नोट्स तैयार हो गए हैं! कृपया नीचे समीक्षा व संपादन करके प्रकाशित करें।');
        }}
        onError={triggerError}
      />

      {/* Delete Test Modal */}
      {deletingTestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">टेस्ट हटाने की पुष्टि</h3>
            <p className="text-xs text-slate-600">क्या आप वाकई इस ऑनलाइन टेस्ट को हटाना चाहते हैं?</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTestId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={confirmDeleteTest}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                हटाएँ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Notice Modal */}
      {deletingNoticeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">सूचना हटाने की पुष्टि</h3>
            <p className="text-xs text-slate-600">क्या आप इस सूचना को हटाना चाहते हैं?</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingNoticeId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={confirmDeleteNotice}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                हटाएँ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
