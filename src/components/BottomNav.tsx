import React from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/translations';
import { Home, BookOpen, Video, FileCheck, Coins } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab, onOpenAuth }) => {
  const { user, language } = useAuth();
  const tr = t[language];

  const handleTabClick = (tab: string) => {
    if (!user && tab !== 'home') {
      onOpenAuth();
      return;
    }
    setCurrentTab(tab);
  };

  const navItems = [
    { id: 'home', label: tr.navHome, icon: Home },
    { id: 'notes', label: tr.navNotes, icon: BookOpen },
    { id: 'videos', label: tr.navVideos, icon: Video },
    { id: 'tests', label: tr.navTests, icon: FileCheck },
    { id: 'wallet', label: tr.navWallet, icon: Coins },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
                isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-blue-600 rounded-b-full" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight truncate max-w-[56px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
