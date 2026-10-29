import React from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/translations';
import { GraduationCap, Coins, Globe, Shield, User, LogOut } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, onOpenAuth }) => {
  const { user, language, setLanguage, logout } = useAuth();
  const tr = t[language];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-800 transition-colors">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl text-blue-900 tracking-tight">
                  {language === 'hi' ? 'लाला' : 'LALA'}
                </span>
                <span className="font-semibold text-lg sm:text-xl text-blue-600">
                  EDUCATION
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block font-medium">
                {language === 'hi' ? 'राजस्थान शिक्षा मंच (कक्षा 9-12)' : 'Rajasthan Board & CBSE (9-12)'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'home'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              {tr.navHome}
            </button>
            <button
              onClick={() => setCurrentTab('notes')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'notes'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              {tr.navNotes}
            </button>
            <button
              onClick={() => setCurrentTab('videos')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'videos'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              {tr.navVideos}
            </button>
            <button
              onClick={() => setCurrentTab('tests')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'tests'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              {tr.navTests}
            </button>
            <button
              onClick={() => setCurrentTab('ai')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'ai'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              {tr.navAi}
            </button>
            <button
              onClick={() => setCurrentTab('announcements')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'announcements'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'
              }`}
            >
              {tr.cardAnnounceTitle}
            </button>
          </nav>

          {/* Right Action Icons & User info */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Change Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'hi' ? 'English' : 'हिन्दी'}</span>
            </button>

            {/* Admin Portal Button */}
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                user?.role === 'admin'
                  ? currentTab === 'admin'
                    ? 'bg-purple-700 text-white shadow-purple-600/20'
                    : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                  : currentTab === 'admin'
                  ? 'bg-purple-900 text-white'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
              title="Admin Portal"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tr.navAdmin}</span>
              <span className="sm:hidden">Admin</span>
            </button>

            {user ? (
              <>
                {/* Coins Badge */}
                <button
                  onClick={() => setCurrentTab('wallet')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 font-bold text-xs sm:text-sm shadow-2xs hover:bg-amber-100 transition-colors"
                  title="My Coins Wallet"
                >
                  <Coins className="w-4 h-4 text-amber-500 fill-amber-400 animate-pulse" />
                  <span>{user.coins}</span>
                  <span className="text-[10px] text-amber-700 font-medium hidden sm:inline">
                    {tr.myCoins}
                  </span>
                </button>

                {/* Profile Button */}
                <button
                  onClick={() => setCurrentTab('profile')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 transition-colors ${
                    currentTab === 'profile'
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  title={user.name}
                >
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[70px] truncate hidden sm:inline">{user.name.split(' ')[0]}</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title={tr.navLogout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                <span>{tr.login} / {tr.signup}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
