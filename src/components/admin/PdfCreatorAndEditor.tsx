import React, { useState, useEffect } from 'react';
import { StudyMaterial, ClassGrade, Language } from '../../types';
import { api } from '../../lib/api';
import { generateAndDownloadPdf } from '../../lib/pdfHelper';
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Heading1,
  Heading2,
  List,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Coins,
  Send,
  Save,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface PdfCreatorAndEditorProps {
  initialMaterial?: StudyMaterial | null;
  onSaved: (material: StudyMaterial, isPublished: boolean) => void;
  onCancel?: () => void;
  onError: (msg: string) => void;
}

export const PdfCreatorAndEditor: React.FC<PdfCreatorAndEditorProps> = ({
  initialMaterial,
  onSaved,
  onCancel,
  onError,
}) => {
  // Mode: 'create' or 'edit'
  const isEditing = Boolean(initialMaterial && initialMaterial.id);

  // Form State
  const [titleHi, setTitleHi] = useState(initialMaterial?.titleHi || '');
  const [title, setTitle] = useState(initialMaterial?.title || '');
  const [classGrade, setClassGrade] = useState<ClassGrade>(initialMaterial?.classGrade || '10');
  const [subject, setSubject] = useState(initialMaterial?.subject || 'Science');
  const [subjectHi, setSubjectHi] = useState(initialMaterial?.subjectHi || 'विज्ञान');
  const [chapter, setChapter] = useState(initialMaterial?.chapter || 'अध्याय 1');
  const [languageOption, setLanguageOption] = useState<Language | 'bilingual'>((initialMaterial?.language as any) || 'hi');
  const [coinPrice, setCoinPrice] = useState(String(initialMaterial?.coinPrice ?? 0));
  const [description, setDescription] = useState(initialMaterial?.descriptionHi || initialMaterial?.description || '');
  const [bodyContent, setBodyContent] = useState(
    initialMaterial?.bodyContent ||
      `## 1. मुख्य अवधारणा एवं परिभाषाएँ
यहाँ अध्याय की मुख्य परिभाषाएँ एवं संकल्पनाएँ लिखें।

## 2. महत्वपूर्ण सूत्र एवं नियम
• सूत्र 1: उदाहरण
• नियम 2: परिभाषा

## 3. बोर्ड परीक्षा उपयोगी प्रश्नोत्तर (Model Q&As)
**प्रश्न**: मुख्य प्रश्न यहाँ लिखें?
**उत्तर**: सटीक व चरणबद्ध उत्तर यहाँ लिखें।

## 4. लालाजी के परीक्षा टिप्स
• बोर्ड परीक्षा में उत्तर स्वच्छ लिखावट में लिखें।`
  );

  // Active view on mobile: 'editor' vs 'preview'
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update fields if initialMaterial changes (e.g. from AI Generator)
  useEffect(() => {
    if (initialMaterial) {
      setTitleHi(initialMaterial.titleHi || '');
      setTitle(initialMaterial.title || '');
      setClassGrade(initialMaterial.classGrade || '10');
      setSubject(initialMaterial.subject || 'Science');
      setSubjectHi(initialMaterial.subjectHi || 'विज्ञान');
      setChapter(initialMaterial.chapter || 'अध्याय 1');
      if (initialMaterial.language) setLanguageOption(initialMaterial.language);
      if (initialMaterial.coinPrice !== undefined) setCoinPrice(String(initialMaterial.coinPrice));
      if (initialMaterial.descriptionHi || initialMaterial.description) {
        setDescription(initialMaterial.descriptionHi || initialMaterial.description);
      }
      if (initialMaterial.bodyContent) {
        setBodyContent(initialMaterial.bodyContent);
      }
    }
  }, [initialMaterial]);

  // Insert snippet helper
  const insertSnippet = (snippet: string) => {
    setBodyContent((prev) => prev + '\n\n' + snippet);
  };

  // Compile transient StudyMaterial object for preview & download
  const currentPreviewMaterial: StudyMaterial = {
    id: initialMaterial?.id || 'temp_preview',
    title: title || titleHi || 'Class Notes',
    titleHi: titleHi || title || 'कक्षा नोट्स',
    description: description || 'कक्षा नोट्स एवं अभ्यास प्रश्न',
    descriptionHi: description || 'कक्षा नोट्स एवं अभ्यास प्रश्न',
    classGrade,
    subject,
    subjectHi,
    chapter,
    language: languageOption,
    coinPrice: parseInt(coinPrice) || 0,
    fileUrl: initialMaterial?.fileUrl || '/uploads/materials/generated.pdf',
    pageCount: Math.max(1, Math.ceil(bodyContent.length / 500)),
    bodyContent,
    fileType: 'rich_notes',
    createdAt: initialMaterial?.createdAt || new Date().toISOString(),
  };

  // Handle Save (Draft or Publish)
  const handleSave = async (publish: boolean) => {
    if (!titleHi && !title) {
      onError('कृपया नोट्स का शीर्षक दर्ज करें।');
      return;
    }
    if (!bodyContent.trim()) {
      onError('नोट्स की सामग्री खाली नहीं हो सकती।');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title || titleHi,
        titleHi: titleHi || title,
        classGrade,
        subject,
        subjectHi,
        chapter,
        language: languageOption,
        coinPrice: parseInt(coinPrice) || 0,
        description,
        descriptionHi: description,
        bodyContent,
        fileType: 'rich_notes',
        status: publish ? 'published' : 'draft',
        pageCount: Math.max(1, Math.ceil(bodyContent.length / 500)),
      };

      let savedMaterial: StudyMaterial;
      if (isEditing && initialMaterial?.id) {
        const res = await api.updateMaterial(initialMaterial.id, payload);
        savedMaterial = res.material;
      } else {
        const res = await api.addMaterial(payload);
        savedMaterial = res.material;
      }

      onSaved(savedMaterial, publish);
    } catch (err: any) {
      onError(err.message || 'नोट्स सहेजने में त्रुटि हुई।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger PDF Download
  const handleDownload = () => {
    try {
      generateAndDownloadPdf(currentPreviewMaterial, languageOption === 'en' ? 'en' : 'hi');
    } catch (err: any) {
      onError('पीडीएफ डाउनलोड करने में त्रुटि: ' + err.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-white/10 rounded-xl">
              <FileText className="w-5 h-5 text-blue-200" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              {isEditing ? 'नोट्स संपादन (Edit Notes)' : 'इन-ऐप पीडीएफ निर्माता (In-App PDF Creator)'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-blue-200/80 mt-1">
            यहाँ नोट्स टाइप करें या पेस्ट करें, प्रारूपित करें, तुरंत पूर्वावलोकन देखें, डाउनलोड करने योग्य PDF बनाएं और प्रकाशित करें।
          </p>
        </div>

        {/* View Toggle on Mobile & Desktop */}
        <div className="flex bg-white/10 p-1 rounded-2xl backdrop-blur-xs self-start sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              viewMode === 'editor' ? 'bg-blue-600 text-white shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>संपादक (Editor)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>लाइव पूर्वावलोकन (Preview)</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Metadata Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              नोट्स का शीर्षक (हिंदी) *
            </label>
            <input
              type="text"
              value={titleHi}
              onChange={(e) => setTitleHi(e.target.value)}
              placeholder="उदा: प्रकाश का परावर्तन एवं अपवर्तन - सम्पूर्ण हस्तलिखित नोट्स"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Title (English)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Light - Reflection and Refraction Complete Notes"
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Class, Subject, Chapter, Language, Coins */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
              onChange={(e) => {
                setSubject(e.target.value);
                const map: Record<string, string> = {
                  Science: 'विज्ञान',
                  Mathematics: 'गणित',
                  Physics: 'भौतिक विज्ञान',
                  Chemistry: 'रसायन विज्ञान',
                  Biology: 'जीव विज्ञान',
                  English: 'अंग्रेजी',
                  'Social Science': 'सामाजिक विज्ञान',
                };
                setSubjectHi(map[e.target.value] || e.target.value);
              }}
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

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              अध्याय (Chapter)
            </label>
            <input
              type="text"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              placeholder="अध्याय 1"
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              भाषा (Language)
            </label>
            <select
              value={languageOption}
              onChange={(e) => setLanguageOption(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="hi">हिंदी (Hindi)</option>
              <option value="en">English</option>
              <option value="bilingual">द्विभाषी (Bilingual)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              कॉइन मूल्य (0 = मुफ़्त)
            </label>
            <div className="relative">
              <input
                type="number"
                value={coinPrice}
                onChange={(e) => setCoinPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 pl-8 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Coins className="w-4 h-4 text-amber-500 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>

        {/* View Mode Switching: Editor vs Live Preview */}
        {viewMode === 'editor' ? (
          <div className="space-y-3">
            {/* Quick Formatting Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-100 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase px-2">प्रारूप (Insert):</span>
              <button
                type="button"
                onClick={() => insertSnippet('## मुख्य शीर्षक (Section Heading)')}
                className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1"
              >
                <Heading1 className="w-3.5 h-3.5 text-blue-600" />
                <span>शीर्षक (H2)</span>
              </button>

              <button
                type="button"
                onClick={() => insertSnippet('### उप-शीर्षक (Subheading)')}
                className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1"
              >
                <Heading2 className="w-3.5 h-3.5 text-blue-600" />
                <span>उप-शीर्षक (H3)</span>
              </button>

              <button
                type="button"
                onClick={() => insertSnippet('• महत्वपूर्ण बिंदु 1\n• महत्वपूर्ण बिंदु 2')}
                className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1"
              >
                <List className="w-3.5 h-3.5 text-emerald-600" />
                <span>बिंदु सूची (Bullets)</span>
              </button>

              <button
                type="button"
                onClick={() => insertSnippet('📐 **मुख्य सूत्र (Formula)**: V = I × R (जहाँ V = विभव, I = धारा, R = प्रतिरोध)')}
                className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>सूत्र बॉक्स (Formula)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  insertSnippet(
                    '📝 **प्रश्न (Board Exam Question)**: ...\n**उत्तर**: ...'
                  )
                }
                className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>प्रश्नोत्तर (Q&A)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  insertSnippet(
                    '💡 **लालाजी का बोर्ड परीक्षा सुझाव**: इस प्रश्न के उत्तर में चित्र अवश्य बनाएँ, 1 अंक चित्र के लिए निर्धारित है।'
                  )
                }
                className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>परीक्षा टिप (Tip)</span>
              </button>
            </div>

            {/* Content Textarea */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <span>नोट्स सामग्री (Notes Body Content) *</span>
                <span className="text-[11px] font-normal text-slate-500 lowercase">
                  {bodyContent.length} अक्षर • ~{Math.max(1, Math.ceil(bodyContent.length / 500))} पृष्ठ
                </span>
              </div>
              <textarea
                rows={14}
                value={bodyContent}
                onChange={(e) => setBodyContent(e.target.value)}
                placeholder="यहाँ अपने नोट्स लिखें या AI द्वारा तैयार सामग्री को संपादित करें..."
                className="w-full p-4 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm leading-relaxed bg-slate-50/50"
              />
            </div>
          </div>
        ) : (
          /* Live Document Preview */
          <div className="p-5 sm:p-6 rounded-2xl border-2 border-slate-300 bg-white shadow-inner space-y-4 max-h-[500px] overflow-y-auto">
            {/* Header Mockup */}
            <div className="border-b-2 border-blue-900 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold tracking-widest text-blue-900 uppercase">
                    Lala Education App • Rajasthan Board & CBSE
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {titleHi || title || 'अध्याय शीर्षक'}
                  </h3>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <span className="font-bold text-slate-800">कक्षा {classGrade}</span> • {subjectHi}
                  <p className="text-[10px] text-slate-400">{chapter}</p>
                </div>
              </div>
            </div>

            {/* Formatted Content Preview */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
              {bodyContent.split('\n').map((line, idx) => {
                if (line.startsWith('## ')) {
                  return (
                    <h2
                      key={idx}
                      className="text-sm sm:text-base font-bold text-blue-900 pt-2 pb-1 border-b border-blue-100 flex items-center gap-1.5"
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
                    <div key={idx} className="flex items-start gap-2 pl-2">
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
                if (line.includes('📐') || line.includes('सूत्र')) {
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
                  return <div key={idx} className="h-1.5" />;
                }
                return <p key={idx}>{line}</p>;
              })}
            </div>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
          {/* Download PDF button */}
          <button
            type="button"
            onClick={handleDownload}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-indigo-600 text-indigo-700 hover:bg-indigo-50 font-bold text-xs sm:text-sm transition-all"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>PDF डाउनलोड करें (Download PDF)</span>
          </button>

          {/* Save as Draft or Publish */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                रद्द करें
              </button>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>ड्राफ्ट सहेजें (Save Draft)</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>विद्यार्थियों के लिए प्रकाशित करें</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
