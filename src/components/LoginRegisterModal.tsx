import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/translations';
import { GraduationCap, X, Coins, ShieldCheck, UserCheck, AlertCircle, Shield, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoginRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup' | 'admin';
}

export const LoginRegisterModal: React.FC<LoginRegisterModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signup',
}) => {
  const { login, adminLogin, register, language } = useAuth();
  const tr = t[language];

  const [mode, setMode] = useState<'login' | 'signup' | 'admin'>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [classGrade, setClassGrade] = useState<'9' | '10' | '11' | '12'>('10');
  const [board, setBoard] = useState<'RBSE' | 'CBSE'>('RBSE');
  const [prefLang, setPrefLang] = useState<'hi' | 'en'>(language);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const msg = await register({
          name,
          username,
          email: email || undefined,
          phone: phone || undefined,
          password,
          classGrade,
          board,
          preferredLanguage: prefLang,
        });

        // Trigger confetti for welcome bonus
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        setSuccessMsg(msg || 'पंजीकरण सफल! आपको 100 कॉइन्स प्राप्त हुए हैं।');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else if (mode === 'admin') {
        // Secure server-side admin login
        await adminLogin(username || email, password);
        onClose();
      } else {
        // Standard student login
        await login(username || email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoStudent = () => {
    setMode('login');
    setUsername('rahul_rbse');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`p-5 text-white relative transition-colors ${
            mode === 'admin'
              ? 'bg-gradient-to-r from-purple-800 via-indigo-900 to-purple-950'
              : 'bg-gradient-to-r from-blue-700 to-indigo-800'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              {mode === 'admin' ? (
                <Shield className="w-6 h-6 text-yellow-300" />
              ) : (
                <GraduationCap className="w-6 h-6 text-yellow-300" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {mode === 'signup'
                  ? tr.signupTitle
                  : mode === 'admin'
                  ? (language === 'hi' ? 'व्यवस्थापक लॉगिन (Admin Portal)' : 'Admin Portal Login')
                  : tr.loginTitle}
              </h2>
              <p className="text-xs text-blue-100">
                {mode === 'signup'
                  ? tr.welcomeBonusAlert
                  : mode === 'admin'
                  ? (language === 'hi' ? 'केवल अधिकृत व्यवस्थापक के लिए' : 'Restricted to verified admin')
                  : tr.welcomeBack}
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs inside Header */}
          <div className="mt-3.5 flex rounded-xl bg-black/20 p-1 text-xs font-semibold backdrop-blur-xs">
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-1 rounded-lg transition-colors ${
                mode === 'signup' ? 'bg-white text-blue-900 shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              {language === 'hi' ? 'नया छात्र' : 'Student Signup'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-1 rounded-lg transition-colors ${
                mode === 'login' ? 'bg-white text-blue-900 shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              {language === 'hi' ? 'छात्र लॉगिन' : 'Student Login'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('admin');
                setError(null);
              }}
              className={`flex-1 py-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
                mode === 'admin' ? 'bg-amber-400 text-purple-950 shadow-xs font-bold' : 'text-white/80 hover:text-white'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>{language === 'hi' ? 'एडमिन' : 'Admin'}</span>
            </button>
          </div>

          {/* Welcome Coins Banner on Signup */}
          {mode === 'signup' && (
            <div className="mt-2.5 bg-amber-400/20 border border-amber-300/40 rounded-xl p-2 flex items-center gap-2 text-amber-200 text-xs font-semibold">
              <Coins className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
              <span>{language === 'hi' ? 'तुरंत +100 फ्री कॉइन्स स्वागत बोनस!' : 'Get +100 FREE Coins Welcome Bonus!'}</span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Coins className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'hi' ? 'उदा: सुरेश कुमावत' : 'e.g. Suresh Kumawat'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {tr.classGrade} *
                    </label>
                    <select
                      value={classGrade}
                      onChange={(e) => setClassGrade(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="9">कक्षा 9 (Class 9)</option>
                      <option value="10">कक्षा 10 (Class 10)</option>
                      <option value="11">कक्षा 11 (Class 11)</option>
                      <option value="12">कक्षा 12 (Class 12)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {tr.board} *
                    </label>
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium"
                    >
                      <option value="RBSE">RBSE (राजस्थान बोर्ड)</option>
                      <option value="CBSE">CBSE Board</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {mode === 'signup'
                  ? tr.username
                  : mode === 'admin'
                  ? (language === 'hi' ? 'व्यवस्थापक यूज़रनेम या ईमेल' : 'Admin Username or Email')
                  : tr.emailOrUser}{' '}
                *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  mode === 'admin'
                    ? 'admin_lala अथवा lalajikhatilalaji@gmail.com'
                    : mode === 'signup'
                    ? 'suresh10'
                    : 'username or email'
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'ईमेल (वैकल्पिक)' : 'Email (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {tr.preferredLang}
                  </label>
                  <select
                    value={prefLang}
                    onChange={(e) => setPrefLang(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {mode === 'admin' ? (language === 'hi' ? 'व्यवस्थापक पासवर्ड' : 'Admin Password') : tr.password} *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 ${
                mode === 'admin'
                  ? 'bg-purple-700 hover:bg-purple-800 shadow-purple-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'signup' ? (
                <>
                  <Coins className="w-4 h-4 text-yellow-300" />
                  <span>{tr.signupBtn}</span>
                </>
              ) : mode === 'admin' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-yellow-300" />
                  <span>{language === 'hi' ? 'व्यवस्थापक सत्यापन एवं प्रवेश' : 'Verify & Enter as Admin'}</span>
                </>
              ) : (
                <span>{tr.loginBtn}</span>
              )}
            </button>
          </form>

          {/* Fast demo fill for student only */}
          {mode !== 'admin' && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <button
                type="button"
                onClick={handleFillDemoStudent}
                className="text-blue-600 hover:underline font-semibold"
              >
                {language === 'hi' ? 'छात्र डेमो यूज़रनेम भरें (rahul_rbse)' : 'Auto-fill demo student username'}
              </button>
              <button
                type="button"
                onClick={() => setMode('admin')}
                className="text-purple-700 hover:underline font-bold flex items-center gap-1"
              >
                <Shield className="w-3 h-3" />
                <span>{language === 'hi' ? 'एडमिन लॉगिन' : 'Admin Login'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
