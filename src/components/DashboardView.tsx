import React from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/translations';
import { Announcement, OnlineTestItem } from '../types';
import {
  BookOpen,
  Video,
  FileCheck,
  Bot,
  Coins,
  Bell,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  Clock,
} from 'lucide-react';

interface DashboardViewProps {
  setCurrentTab: (tab: string) => void;
  announcements: Announcement[];
  tests: OnlineTestItem[];
  onOpenAuth: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setCurrentTab,
  announcements,
  tests,
  onOpenAuth,
}) => {
  const { user, language } = useAuth();
  const tr = t[language];

  const handleProtectedAction = (targetTab: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setCurrentTab(targetTab);
  };

  const importantAnnounce = announcements.find((a) => a.isImportant) || announcements[0];

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Welcome Banner / Header Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-4 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {user ? `${user.board} • कक्षा ${user.classGrade}` : 'राजस्थान बोर्ड एवं सीबीएसई विशेष'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {tr.greeting} {user ? user.name : 'प्रिय विद्यार्थी'}
            </h1>
            <p className="mt-1 text-sm sm:text-base text-blue-100/90 max-w-xl font-normal leading-relaxed">
              {language === 'hi'
                ? 'कक्षा 9-12 के उत्कृष्ट हस्तलिखित नोट्स, वीडियो कक्षाएं एवं ऑनलाइन टेस्ट से बोर्ड परीक्षा में शीर्ष स्थान प्राप्त करें।'
                : 'Ace your Class 9-12 board exams with handwritten revision notes, recorded lectures, and instant MCQ mock tests.'}
            </p>
          </div>

          {/* User Quick Stats or Login Prompt */}
          <div className="shrink-0 flex items-center gap-3">
            {user ? (
              <div
                onClick={() => setCurrentTab('wallet')}
                className="cursor-pointer bg-white/10 hover:bg-white/20 transition-all border border-white/20 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-amber-300 fill-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="text-[11px] text-blue-200 uppercase font-semibold">
                    {tr.myCoins}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-1">
                    <span>{user.coins}</span>
                    <span className="text-xs text-amber-300 font-bold">Coins</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-sm shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2"
              >
                <Coins className="w-4 h-4 fill-blue-950" />
                <span>{language === 'hi' ? 'लॉगिन करें (+100 फ्री कॉइन्स)' : 'Log In (+100 Free Coins)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Announcement Ticker Bar */}
      {importantAnnounce && (
        <div
          onClick={() => setCurrentTab('announcements')}
          className="cursor-pointer bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-amber-900 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[11px] font-extrabold uppercase">
              {tr.importantNotice}
            </span>
            <p className="text-xs sm:text-sm font-semibold truncate">
              {language === 'hi' ? importantAnnounce.titleHi : importantAnnounce.title}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0 text-amber-700" />
        </div>
      )}

      {/* Quick Action Cards Grid (PDFs, Videos, Tests, AI Guru, Wallet, News) */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>{tr.quickLinks}</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Study Materials / PDFs */}
          <div
            onClick={() => handleProtectedAction('notes')}
            className="group cursor-pointer bg-white hover:bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-700 transition-colors">
                {tr.cardPdfTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {tr.cardPdfSub}
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-blue-600 gap-1">
              <span>{language === 'hi' ? 'नोट्स देखें' : 'View Notes'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Educational Videos */}
          <div
            onClick={() => handleProtectedAction('videos')}
            className="group cursor-pointer bg-white hover:bg-rose-50/40 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-rose-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Video className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-rose-700 transition-colors">
                  {tr.cardVideosTitle}
                </h3>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                  +50 Coins
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {tr.cardVideosSub}
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-rose-600 gap-1">
              <span>{language === 'hi' ? 'लेक्चर्स देखें' : 'Watch Videos'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Online Tests */}
          <div
            onClick={() => handleProtectedAction('tests')}
            className="group cursor-pointer bg-white hover:bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-emerald-700 transition-colors">
                {tr.cardTestsTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {tr.cardTestsSub}
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-emerald-600 gap-1">
              <span>{language === 'hi' ? 'टेस्ट दें' : 'Take Tests'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: AI Study Assistant */}
          <div
            onClick={() => handleProtectedAction('ai')}
            className="group cursor-pointer bg-white hover:bg-indigo-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-indigo-700 transition-colors">
                  {tr.cardAiTitle}
                </h3>
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">
                  AI 24/7
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {tr.cardAiSub}
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-indigo-600 gap-1">
              <span>{language === 'hi' ? 'संदेह पूछें' : 'Ask Doubts'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: My Coins & Wallet */}
          <div
            onClick={() => handleProtectedAction('wallet')}
            className="group cursor-pointer bg-white hover:bg-amber-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-amber-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Coins className="w-6 h-6 text-amber-500 fill-amber-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-amber-800 transition-colors">
                {tr.cardWalletTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {tr.cardWalletSub}
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-amber-700 gap-1">
              <span>{user ? `${user.coins} Coins` : tr.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: Rajasthan News & Announcements */}
          <div
            onClick={() => setCurrentTab('announcements')}
            className="group cursor-pointer bg-white hover:bg-slate-100/70 p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-sky-700 transition-colors">
                {tr.cardAnnounceTitle}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {tr.cardAnnounceSub}
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-bold text-sky-700 gap-1">
              <span>{tr.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Practice Tests Spotlight */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {tr.upcomingTests}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'hi'
                ? 'समयबद्ध ऑनलाइन परीक्षा देकर अपनी तैयारी का आकलन करें'
                : 'Evaluate your exam readiness with timed multiple-choice mock papers'}
            </p>
          </div>
          <button
            onClick={() => handleProtectedAction('tests')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>{tr.viewAll}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {tests.slice(0, 2).map((test) => (
            <div
              key={test.id}
              onClick={() => handleProtectedAction('tests')}
              className="cursor-pointer border border-slate-100 hover:border-blue-200 bg-slate-50/70 hover:bg-blue-50/40 rounded-2xl p-4 transition-all flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                    कक्षा {test.classGrade} • {test.subjectHi}
                  </span>
                  {test.coinPrice === 0 ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {tr.freeTag}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-600 fill-amber-500" />
                      {test.coinPrice} Coins
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                  {language === 'hi' ? test.titleHi : test.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {test.durationMinutes} {tr.minutes}
                  </span>
                  <span>•</span>
                  <span>{test.totalMarks} {language === 'hi' ? 'अंक' : 'Marks'}</span>
                </div>
              </div>
              <button className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shrink-0">
                {tr.startTest}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
