import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { StudyMaterialsView } from './components/StudyMaterialsView';
import { VideosView } from './components/VideosView';
import { TestsView } from './components/TestsView';
import { AiAssistantView } from './components/AiAssistantView';
import { WalletView } from './components/WalletView';
import { AnnouncementsView } from './components/AnnouncementsView';
import { ProfileView } from './components/ProfileView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { LoginRegisterModal } from './components/LoginRegisterModal';
import { Announcement, OnlineTestItem } from './types';
import { api } from './lib/api';

function MainApp() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Global feeds for Dashboard
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tests, setTests] = useState<OnlineTestItem[]>([]);

  const loadDashboardData = async () => {
    try {
      const [annData, testData] = await Promise.all([
        api.getAnnouncements(),
        api.getTests(),
      ]);
      setAnnouncements(annData);
      setTests(testData);
    } catch (e) {
      console.warn('Initial data load notice:', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Tab router
  const renderCurrentView = () => {
    switch (currentTab) {
      case 'home':
        return (
          <DashboardView
            setCurrentTab={setCurrentTab}
            announcements={announcements}
            tests={tests}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        );
      case 'notes':
        return <StudyMaterialsView onOpenAuth={() => setAuthModalOpen(true)} />;
      case 'videos':
        return <VideosView onOpenAuth={() => setAuthModalOpen(true)} />;
      case 'tests':
        return <TestsView onOpenAuth={() => setAuthModalOpen(true)} />;
      case 'ai':
        return <AiAssistantView />;
      case 'wallet':
        return <WalletView />;
      case 'announcements':
        return <AnnouncementsView announcements={announcements} />;
      case 'profile':
        return <ProfileView />;
      case 'admin':
        return <AdminDashboardView onDataChanged={loadDashboardData} />;
      default:
        return (
          <DashboardView
            setCurrentTab={setCurrentTab}
            announcements={announcements}
            tests={tests}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',_'Noto_Sans_Devanagari',_sans-serif]">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {renderCurrentView()}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Login / Signup Modal */}
      <LoginRegisterModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
