import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/translations';
import {
  User as UserIcon,
  GraduationCap,
  Coins,
  Globe,
  Phone,
  Mail,
  Shield,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, language, setLanguage, updateProfile } = useAuth();
  const tr = t[language];

  if (!user) return null;

  const [name, setName] = useState(user.name);
  const [classGrade, setClassGrade] = useState<'9' | '10' | '11' | '12'>(user.classGrade);
  const [board, setBoard] = useState<'RBSE' | 'CBSE'>(user.board);
  const [prefLang, setPrefLang] = useState<'hi' | 'en'>(user.preferredLanguage || language);
  const [phone, setPhone] = useState(user.phone || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await updateProfile({
        name,
        classGrade,
        board,
        preferredLanguage: prefLang,
        phone,
      });
      setLanguage(prefLang);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'त्रुटि हुई');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10 max-w-2xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-blue-700" />
          <span>{tr.profileTitle}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {tr.profileSub}
        </p>
      </div>

      {/* Summary Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-blue-500/20">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
            {user.role === 'admin' ? (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                {tr.studentBadge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            @{user.username} • {user.email}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className="font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              {user.coins} Coins
            </span>
            <span className="text-slate-500">
              कक्षा {user.classGrade} ({user.board})
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई है! (Profile updated successfully)</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {tr.fullName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr.classGrade}
              </label>
              <select
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="9">कक्षा 9</option>
                <option value="10">कक्षा 10</option>
                <option value="11">कक्षा 11</option>
                <option value="12">कक्षा 12</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr.board}
              </label>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="RBSE">RBSE (राजस्थान बोर्ड)</option>
                <option value="CBSE">CBSE Board</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr.preferredLang}
              </label>
              <select
                value={prefLang}
                onChange={(e) => setPrefLang(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {tr.phone}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'सुरक्षित हो रहा है...' : tr.saveProfile}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
