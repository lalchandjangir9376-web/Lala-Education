import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/translations';
import { StudyMaterial } from '../types';
import { api } from '../lib/api';
import { generateAndDownloadPdf } from '../lib/pdfHelper';
import {
  BookOpen,
  Search,
  Download,
  Eye,
  Lock,
  Unlock,
  Coins,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Share2,
  Sparkles,
} from 'lucide-react';

interface StudyMaterialsViewProps {
  onOpenAuth: () => void;
}

export const StudyMaterialsView: React.FC<StudyMaterialsViewProps> = ({ onOpenAuth }) => {
  const { user, language, updateCoins } = useAuth();
  const tr = t[language];

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>(user?.classGrade || 'all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reader / Preview Modal state
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const loadMaterials = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMaterials({
        classGrade: selectedClass,
        subject: selectedSubject,
        language: selectedLanguage,
      });
      setMaterials(data);
    } catch (err: any) {
      setError(err.message || 'सामग्री लोड करने में असमर्थ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [selectedClass, selectedSubject, selectedLanguage]);

  const handleUnlock = async (material: StudyMaterial) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    setUnlockingId(material.id);
    setUnlockError(null);

    try {
      const res = await api.unlockMaterial(material.id);
      updateCoins(res.coins);
      // Update local state to unlocked
      setMaterials((prev) =>
        prev.map((m) => (m.id === material.id ? { ...m, isUnlocked: true } : m))
      );
      if (previewMaterial && previewMaterial.id === material.id) {
        setPreviewMaterial({ ...previewMaterial, isUnlocked: true });
      }
    } catch (err: any) {
      setUnlockError(err.message || 'अनलॉक करने में त्रुटि हुई');
    } finally {
      setUnlockingId(null);
    }
  };

  const handleDownload = (material: StudyMaterial) => {
    // If it's a real uploaded file on server (/uploads/materials/...)
    if (material.fileUrl && material.fileUrl.startsWith('/uploads/')) {
      const link = document.createElement('a');
      link.href = material.fileUrl;
      link.download = `${material.subject}_Class${material.classGrade}_Notes.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Otherwise generate clean printable PDF with metadata using jsPDF
    try {
      generateAndDownloadPdf(material, language);
    } catch (err) {
      console.warn('PDF generation fallback:', err);
    }
  };

  // Client search filtering
  const filteredMaterials = materials.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.titleHi.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.subjectHi.toLowerCase().includes(q) ||
      m.chapter.toLowerCase().includes(q)
    );
  });

  const subjects = [
    { id: 'all', name: tr.filterAll },
    { id: 'Science', name: 'विज्ञान (Science)' },
    { id: 'Mathematics', name: 'गणित (Maths)' },
    { id: 'Physics', name: 'भौतिक विज्ञान (Physics)' },
    { id: 'Chemistry', name: 'रसायन विज्ञान (Chemistry)' },
    { id: 'Biology', name: 'जीव विज्ञान (Biology)' },
    { id: 'Social Science', name: 'सामाजिक विज्ञान (Social)' },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Header & Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-700" />
          <span>{tr.materialsTitle}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {tr.materialsSub}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr.searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        {/* Filter Chips: Class Grade */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-600 mr-1.5">{tr.filterClass}</span>
          {['all', '9', '10', '11', '12'].map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedClass(grade)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedClass === grade
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {grade === 'all' ? tr.filterAll : `कक्षा ${grade}`}
            </button>
          ))}
        </div>

        {/* Filter Chips: Subject */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-600 mr-1.5">{tr.filterSubject}</span>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedSubject === sub.id
                  ? 'bg-blue-100 text-blue-800 font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">
            {language === 'hi' ? 'नोट्स लोड हो रहे हैं...' : 'Loading notes...'}
          </p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">
            {language === 'hi' ? 'कोई अध्ययन सामग्री नहीं मिली' : 'No study materials found'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'hi' ? 'कृपया फिल्टर बदलकर पुनः देखें' : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMaterials.map((mat) => {
            const isFree = mat.coinPrice === 0;
            const isUnlocked = mat.isUnlocked || isFree;

            return (
              <div
                key={mat.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                        कक्षा {mat.classGrade}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {mat.subjectHi || mat.subject}
                      </span>
                    </div>

                    {isFree ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" />
                        {tr.freeTag}
                      </span>
                    ) : isUnlocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
                        {tr.unlockedReady}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-amber-700" />
                        <Coins className="w-3 h-3 text-amber-500 fill-amber-400" />
                        {mat.coinPrice} Coins
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {language === 'hi' ? mat.titleHi : mat.title}
                  </h3>
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    {mat.chapter}
                  </p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {language === 'hi' ? mat.descriptionHi : mat.description}
                  </p>
                </div>

                {/* Footer Action buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {mat.pageCount} {tr.pages} • {mat.language === 'hi' ? 'हिन्दी माध्यम' : 'English'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isUnlocked ? (
                      <>
                        <button
                          onClick={() => setPreviewMaterial(mat)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{tr.readNotes}</span>
                        </button>
                        <button
                          onClick={() => handleDownload(mat)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title={tr.downloadPdf}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleUnlock(mat)}
                        disabled={unlockingId === mat.id}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <Coins className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
                        <span>
                          {unlockingId === mat.id
                            ? '...'
                            : `${tr.unlockWithCoins} (${mat.coinPrice})`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Reader / Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-blue-800 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    {language === 'hi' ? previewMaterial.titleHi : previewMaterial.title}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    कक्षा {previewMaterial.classGrade} • {previewMaterial.subjectHi} • {previewMaterial.chapter}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Document Reader Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-800 text-sm leading-relaxed">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-700" />
                  <span>
                    {language === 'hi'
                      ? 'लाला एजुकेशन - प्रमाणित राजस्थान बोर्ड अध्ययन नोट्स'
                      : 'Lala Education - Verified RBSE Study Material'}
                  </span>
                </div>
                <p className="text-blue-800">
                  {language === 'hi'
                    ? previewMaterial.contentSummaryHi || previewMaterial.descriptionHi
                    : previewMaterial.contentSummary || previewMaterial.description}
                </p>
              </div>

              {/* Document Notes Content */}
              <div className="space-y-4">
                {previewMaterial.bodyContent ? (
                  <div className="space-y-3 font-sans">
                    {previewMaterial.bodyContent.split('\n').map((line, idx) => {
                      if (line.startsWith('## ')) {
                        return (
                          <h2
                            key={idx}
                            className="text-sm sm:text-base font-bold text-blue-900 pt-3 pb-1 border-b border-blue-100 flex items-center gap-1.5"
                          >
                            <span>{line.replace(/^##\s+/, '')}</span>
                          </h2>
                        );
                      }
                      if (line.startsWith('### ')) {
                        return (
                          <h3 key={idx} className="text-xs sm:text-sm font-bold text-slate-900 pt-1">
                            {line.replace(/^###\s+/, '')}
                          </h3>
                        );
                      }
                      if (line.startsWith('• ') || line.startsWith('- ')) {
                        return (
                          <div key={idx} className="flex items-start gap-2 pl-2 text-xs sm:text-sm">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{line.replace(/^[•\-]\s+/, '')}</span>
                          </div>
                        );
                      }
                      if (line.includes('💡') || line.includes('सुझाव')) {
                        return (
                          <div
                            key={idx}
                            className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-amber-900 text-xs"
                          >
                            {line}
                          </div>
                        );
                      }
                      if (line.includes('📐') || line.includes('सूत्र') || line.includes('Formula')) {
                        return (
                          <div
                            key={idx}
                            className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-semibold"
                          >
                            {line}
                          </div>
                        );
                      }
                      if (line.trim() === '') {
                        return <div key={idx} className="h-1" />;
                      }
                      return (
                        <p key={idx} className="text-xs sm:text-sm text-slate-800">
                          {line}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <h4 className="font-extrabold text-base text-slate-900 border-b border-slate-200 pb-2">
                      {language === 'hi' ? 'महत्वपूर्ण परीक्षा बिंदु एवं सूत्र:' : 'Key Exam Points & Formulas:'}
                    </h4>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs sm:text-sm">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          1
                        </span>
                        <div>
                          <strong className="text-slate-900">
                            {language === 'hi' ? 'मुख्य परिभाषा एवं नियम:' : 'Core Concept:'}
                          </strong>{' '}
                          {language === 'hi'
                            ? 'रासायनिक अभिक्रिया में अभिकारकों के पुराने बंध टूटते हैं तथा नए उत्पाद बनते हैं। द्रव्यमान संरक्षण के नियम के अनुसार किसी भी रासायनिक अभिक्रिया में द्रव्यमान का न तो निर्माण होता है और न ही विनाश।'
                            : 'According to the law of conservation of mass, matter can neither be created nor destroyed in a chemical reaction. Mass of reactants strictly equals mass of products.'}
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          2
                        </span>
                        <div>
                          <strong className="text-slate-900">
                            {language === 'hi' ? 'महत्वपूर्ण सूत्र:' : 'Key Formula:'}
                          </strong>{' '}
                          <code className="px-2 py-0.5 rounded-md bg-white border border-slate-300 font-mono text-blue-800 font-bold">
                            Zn + 2HCl → ZnCl₂ + H₂↑
                          </code>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          3
                        </span>
                        <div>
                          <strong className="text-slate-900">
                            {language === 'hi' ? 'बोर्ड परीक्षा के लिए विशेष:' : 'Board Exam Special:'}
                          </strong>{' '}
                          {language === 'hi'
                            ? 'संक्षारण (Corrosion) एवं विकृतगंधिता (Rancidity) की परिभाषा एवं रोकथाम के उपाय राजस्थान बोर्ड में 2 अंक में बार-बार पूछे जाते हैं।'
                            : 'Corrosion and Rancidity definitions with preventive measures are recurring 2-mark questions in board papers.'}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/70 text-xs text-amber-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? 'इस नोट्स का पूरा अध्ययन करने के बाद टेस्ट सेक्शन में जाकर इसका मॉक टेस्ट दें और अपनी तैयारी परखें।'
                      : 'After studying these notes, head to the Tests section to practice the chapter mock test!'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {previewMaterial.pageCount} {tr.pages} • PDF Version 2.4
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewMaterial)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{tr.downloadPdf}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
