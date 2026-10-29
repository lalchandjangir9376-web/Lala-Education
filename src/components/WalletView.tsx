import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/translations';
import { CoinTransaction } from '../types';
import { api } from '../lib/api';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Video,
  FileCheck,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

export const WalletView: React.FC = () => {
  const { user, language } = useAuth();
  const tr = t[language];

  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [coins, setCoins] = useState<number>(user?.coins || 0);
  const [loading, setLoading] = useState(true);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const data = await api.getWallet();
      setCoins(data.coins);
      setTransactions(data.transactions);
    } catch (e) {
      console.error('Error loading wallet:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'welcome_bonus':
        return <Gift className="w-5 h-5 text-amber-500" />;
      case 'video_reward':
        return <Video className="w-5 h-5 text-rose-500" />;
      case 'test_unlock':
        return <FileCheck className="w-5 h-5 text-blue-500" />;
      case 'pdf_unlock':
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
      default:
        return <Coins className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Coins className="w-6 h-6 text-amber-500 fill-amber-400" />
          <span>{tr.walletTitle}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {tr.walletSub}
        </p>
      </div>

      {/* Main Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-100 uppercase tracking-wider block mb-1">
              {tr.currentBalance}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">{coins}</span>
              <span className="text-lg font-bold text-amber-200">Coins</span>
            </div>
            <p className="text-xs text-amber-100 mt-2 max-w-sm">
              {language === 'hi'
                ? 'इन कॉइन्स का उपयोग विशेष मॉडल पेपर, टेस्ट एवं अध्याय नोट्स अनलॉक करने में करें।'
                : 'Use these coins to unlock premium question banks, tests, and handwritten notes.'}
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-xs space-y-1 sm:max-w-[220px]">
            <div className="font-extrabold flex items-center gap-1.5 text-white">
              <ShieldCheck className="w-4 h-4 text-yellow-300" />
              <span>{language === 'hi' ? 'सुरक्षित लेज़र' : 'Secure Ledger'}</span>
            </div>
            <p className="text-amber-100 text-[11px] leading-relaxed">
              {language === 'hi'
                ? 'सभी कॉइन्स सर्वर पर सत्यापित होते हैं और धोखाधड़ी से सुरक्षित हैं।'
                : 'All transactions are cryptographically verified on the secure backend.'}
            </p>
          </div>
        </div>
      </div>

      {/* How to Earn Coins Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3.5">
        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{tr.howToEarn}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs">
            <span className="font-bold text-amber-900 block mb-1">
              1. {tr.earnRule1}
            </span>
            <p className="text-amber-800 text-[11px]">
              {language === 'hi'
                ? 'जैसे ही आप नया खाता बनाते हैं, आपको तुरंत 100 कॉइन्स मिलते हैं।'
                : '100 free coins credited instantly upon registration.'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/60 text-xs">
            <span className="font-bold text-rose-900 block mb-1">
              2. {tr.earnRule2}
            </span>
            <p className="text-rose-800 text-[11px]">
              {language === 'hi'
                ? 'किसी भी वीडियो कक्षा को 80%+ देखकर 50 कॉइन्स अर्जित करें।'
                : 'Watch lectures to completion and earn 50 coins each.'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-xs">
            <span className="font-bold text-blue-900 block mb-1">
              3. {tr.earnRule3}
            </span>
            <p className="text-blue-800 text-[11px]">
              {language === 'hi'
                ? 'अर्जित कॉइन्स से लॉक किए गए मॉक टेस्ट एवं नोट्स अनलॉक करें।'
                : 'Redeem your earned coins to access locked tests and notes.'}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
          <span>{tr.txHistory}</span>
          <span className="text-xs font-semibold text-slate-400">
            {transactions.length} {language === 'hi' ? 'लेनदेन' : 'Records'}
          </span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-400">
            {language === 'hi' ? 'लेनदेन लोड हो रहे हैं...' : 'Loading transactions...'}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            {tr.noTx}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isCredit = tx.amount > 0;

              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isCredit ? 'bg-emerald-50' : 'bg-slate-100'
                      }`}
                    >
                      {getTxIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900">
                        {tx.description}
                      </p>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {formatDate(tx.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm sm:text-base font-black ${
                        isCredit ? 'text-emerald-600' : 'text-slate-700'
                      }`}
                    >
                      {isCredit ? `+${tx.amount}` : tx.amount}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">Coins</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
