import React, { useState } from 'react';
import { ClassGrade, Language, AiNotesRequest, AiNotesResponse, StudyMaterial } from '../../types';
import { api } from '../../lib/api';
import {
  Sparkles,
  BookOpen,
  Send,
  Loader2,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  ListOrdered,
  FileText,
} from 'lucide-react';

interface AiNotesGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotesGenerated: (materialDraft: Partial<StudyMaterial>) => void;
  onError: (msg: string) => void;
}

export const AiNotesGeneratorModal: React.FC<AiNotesGeneratorModalProps> = ({
  isOpen,
  onClose,
  onNotesGenerated,
  onError,
}) => {
  const [topic, setTopic] = useState('');
  const [classGrade, setClassGrade] = useState<ClassGrade>('10');
  const [subject, setSubject] = useState('Science');
  const [chapter, setChapter] = useState('');
  const [language, setLanguage] = useState<Language | 'bilingual'>('hi');
  const [format, setFormat] = useState<'comprehensive' | 'summary' | 'qa' | 'mcq'>('comprehensive');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      onError('कृपया विषय / टॉपिक का नाम दर्ज करें।');
      return;
    }

    setLoading(true);
    try {
      const subjectHiMap: Record<string, string> = {
        Science: 'विज्ञान',
        Mathematics: 'गणित',
        Physics: 'भौतिक विज्ञान',
        Chemistry: 'रसायन विज्ञान',
        Biology: 'जीव विज्ञान',
        English: 'अंग्रेजी',
        'Social Science': 'सामाजिक विज्ञान',
      };

      const res = await api.generateAiNotes({
        topic: topic.trim(),
        classGrade,
        subject,
        chapter: chapter.trim() || `अध्याय: ${topic}`,
        language,
        format,
      });

      // Prepare draft material object
      const draftMaterial: Partial<StudyMaterial> = {
        title: res.title,
        titleHi: res.titleHi,
        classGrade,
        subject,
        subjectHi: subjectHiMap[subject] || subject,
        chapter: res.chapter || chapter || topic,
        language: language,
        coinPrice: 0,
        contentSummary: res.contentSummary,
        contentSummaryHi: res.contentSummaryHi,
        bodyContent: res.bodyContent,
        fileType: 'rich_notes',
        status: 'draft',
      };

      onNotesGenerated(draftMaterial);
      onClose();
    } catch (err: any) {
      onError(err.message || 'एआई नोट्स निर्माण में त्रुटि हुई।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/10 rounded-2xl">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </span>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                एआई नोट्स जनरेटर (AI Notes Generator)
              </h3>
              <p className="text-xs text-blue-200/80">
                राजस्थान बोर्ड एवं सीबीएसई पाठ्यक्रम के अनुसार तुरंत हस्तलिखित नोट्स तैयार करें।
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-5 sm:p-6 space-y-4">
          {/* Topic */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              टॉपिक / अध्याय का नाम (Topic Name) *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="उदा: ओम का नियम एवं प्रतिरोध, प्रकाश का अपवर्तन, द्विघात समीकरण"
              required
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Class & Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                कक्षा (Class) *
              </label>
              <select
                value={classGrade}
                onChange={(e) => setClassGrade(e.target.value as ClassGrade)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="9">कक्षा 9</option>
                <option value="10">कक्षा 10</option>
                <option value="11">कक्षा 11</option>
                <option value="12">कक्षा 12</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                विषय (Subject) *
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="Science">विज्ञान (Science)</option>
                <option value="Mathematics">गणित (Maths)</option>
                <option value="Physics">भौतिक विज्ञान (Physics)</option>
                <option value="Chemistry">रसायन विज्ञान (Chemistry)</option>
                <option value="Biology">जीव विज्ञान (Biology)</option>
                <option value="English">अंग्रेजी (English)</option>
                <option value="Social Science">सामाजिक विज्ञान (Social Sci)</option>
              </select>
            </div>
          </div>

          {/* Chapter & Language */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                अध्याय (वैकल्पिक)
              </label>
              <input
                type="text"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                placeholder="उदा: अध्याय 12"
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                भाषा (Language)
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                <option value="hi">हिंदी (Hindi)</option>
                <option value="en">English</option>
                <option value="bilingual">द्विभाषी (Bilingual)</option>
              </select>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              नोट्स का प्रकार (Desired Format) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormat('comprehensive')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  format === 'comprehensive'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>विस्तृत नोट्स (Detailed)</span>
                </p>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  परिभाषाएँ, सूत्र, व्याख्या एवं उदाहरण
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormat('summary')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  format === 'summary'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>क्विक रिवीजन (Summary)</span>
                </p>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  त्वरित पुनरावृत्ति हेतु सूत्र व मुख्य बिंदु
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormat('qa')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  format === 'qa'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>मॉडल प्रश्नोत्तर (Q&A Set)</span>
                </p>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  लघु एवं दीर्घ उत्तरीय बोर्ड परीक्षा प्रश्न
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormat('mcq')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  format === 'mcq'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs font-bold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-amber-600" />
                  <span>वस्तुनिष्ठ प्रश्न (MCQs)</span>
                </p>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  8-10 बहुविकल्पीय प्रश्न व्याख्या सहित
                </p>
              </button>
            </div>
          </div>

          {/* Notice: Admin review requirement */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <span className="font-bold">⚠️ सूचना:</span>
            <span>
              AI द्वारा सामग्री तैयार होने के बाद, वह सीधे संपादक (Editor) में खुलेगी जहाँ आप समीक्षा व बदलाव करके ही प्रकाशित कर सकेंगे।
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              रद्द करें
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI नोट्स तैयार कर रहा है...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>एआई नोट्स बनाएं (Generate)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
