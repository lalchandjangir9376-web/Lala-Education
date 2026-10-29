import React, { useState, useRef } from 'react';
import { StudyMaterial, ClassGrade } from '../../types';
import { api } from '../../lib/api';
import { generateAndDownloadPdf } from '../../lib/pdfHelper';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Download,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Coins,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Search,
} from 'lucide-react';

interface NotesManagerProps {
  materials: StudyMaterial[];
  onRefresh: () => void;
  onEditMaterial: (material: StudyMaterial) => void;
  onOpenCreateNew: () => void;
  onOpenAiGenerator: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const NotesManager: React.FC<NotesManagerProps> = ({
  materials,
  onRefresh,
  onEditMaterial,
  onOpenCreateNew,
  onOpenAiGenerator,
  onSuccess,
  onError,
}) => {
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Direct PDF Upload state
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState<number | null>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfClass, setPdfClass] = useState<ClassGrade>('10');
  const [pdfSubject, setPdfSubject] = useState('Science');
  const [pdfChapter, setPdfChapter] = useState('');
  const [pdfCoinPrice, setPdfCoinPrice] = useState('0');
  const [showPdfUploadModal, setShowPdfUploadModal] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  // Delete confirmation
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);

  // Toggle status
  const handleToggleStatus = async (material: StudyMaterial) => {
    const nextStatus = (material.status || 'published') === 'published' ? 'draft' : 'published';
    try {
      await api.toggleMaterialStatus(material.id, nextStatus);
      onSuccess(
        nextStatus === 'published'
          ? 'नोट्स प्रकाशित हो गए! अब विद्यार्थी इन्हें पढ़ व डाउनलोड कर सकते हैं।'
          : 'नोट्स ड्राफ्ट में बदल दिए गए (विद्यार्थियों से छिपा दिए गए)।'
      );
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'स्थिति बदलने में त्रुटि हुई।');
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (!deletingMaterialId) return;
    try {
      await api.deleteMaterial(deletingMaterialId);
      setDeletingMaterialId(null);
      onSuccess('नोट्स सफलतापूर्वक हटा दिए गए!');
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'नोट्स हटाने में त्रुटि हुई।');
    }
  };

  // Direct PDF Upload Submission
  const handleDirectPdfUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPdfFile) {
      onError('कृपया अपने फ़ोन या कंप्यूटर से एक PDF फ़ाइल चुनें।');
      return;
    }
    if (!pdfTitle.trim()) {
      onError('नोट्स का शीर्षक आवश्यक है।');
      return;
    }

    setIsUploadingPdf(true);
    setPdfUploadProgress(0);

    try {
      const uploadRes = await api.uploadMaterialFile(selectedPdfFile, (pct) => {
        setPdfUploadProgress(pct);
      });

      const subjectHiMap: Record<string, string> = {
        Science: 'विज्ञान',
        Mathematics: 'गणित',
        Physics: 'भौतिक विज्ञान',
        Chemistry: 'रसायन विज्ञान',
        Biology: 'जीव विज्ञान',
        English: 'अंग्रेजी',
        'Social Science': 'सामाजिक विज्ञान',
      };

      await api.addMaterial({
        title: pdfTitle,
        titleHi: pdfTitle,
        classGrade: pdfClass,
        subject: pdfSubject,
        subjectHi: subjectHiMap[pdfSubject] || pdfSubject,
        chapter: pdfChapter.trim() || 'अध्याय',
        language: 'hi',
        coinPrice: parseInt(pdfCoinPrice) || 0,
        fileUrl: uploadRes.fileUrl,
        fileType: 'pdf',
        status: 'published',
        pageCount: 12,
        description: `${pdfTitle} - कक्षा ${pdfClass} ${pdfSubject} हस्तलिखित पीडीएफ दस्तावेज़।`,
        descriptionHi: `${pdfTitle} - कक्षा ${pdfClass} ${pdfSubject} हस्तलिखित पीडीएफ दस्तावेज़।`,
      });

      setSelectedPdfFile(null);
      setPdfTitle('');
      setPdfChapter('');
      setShowPdfUploadModal(false);
      onSuccess('PDF सफलतापूर्वक अपलोड एवं प्रकाशित हो गई!');
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'PDF अपलोड करने में त्रुटि हुई।');
    } finally {
      setIsUploadingPdf(false);
      setPdfUploadProgress(null);
    }
  };

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    if (filterClass !== 'all' && m.classGrade !== filterClass) return false;
    if (filterSubject !== 'all' && m.subject !== filterSubject) return false;
    const mStatus = m.status || 'published';
    if (filterStatus !== 'all' && mStatus !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        m.title.toLowerCase().includes(q) ||
        m.titleHi.toLowerCase().includes(q) ||
        (m.chapter && m.chapter.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Action Bar: Create in-app, AI Generator, Upload PDF */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>नोट्स एवं पीडीएफ लाइब्रेरी प्रबंधन</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            विद्यार्थियों के लिए अध्ययन सामग्री बनाएं, संपादित करें, ड्राफ्ट सहेजें और प्रकाशित करें।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Generator button */}
          <button
            type="button"
            onClick={onOpenAiGenerator}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI नोट्स जनरेटर</span>
          </button>

          {/* Create In-app button */}
          <button
            type="button"
            onClick={onOpenCreateNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs sm:text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>नया नोट्स बनाएं (Creator)</span>
          </button>

          {/* Upload PDF from Phone button */}
          <button
            type="button"
            onClick={() => setShowPdfUploadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>फ़ोन से PDF अपलोड</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="शीर्षक या अध्याय द्वारा खोजें..."
            className="w-full px-3.5 py-2 pl-9 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="all">सभी कक्षाएं (All Classes)</option>
            <option value="9">कक्षा 9</option>
            <option value="10">कक्षा 10</option>
            <option value="11">कक्षा 11</option>
            <option value="12">कक्षा 12</option>
          </select>

          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="all">सभी विषय (All Subjects)</option>
            <option value="Science">विज्ञान (Science)</option>
            <option value="Mathematics">गणित (Maths)</option>
            <option value="Physics">भौतिक विज्ञान</option>
            <option value="Chemistry">रसायन विज्ञान</option>
            <option value="Biology">जीव विज्ञान</option>
            <option value="English">अंग्रेजी</option>
            <option value="Social Science">सामाजिक विज्ञान</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="all">सभी स्थितियाँ (All Status)</option>
            <option value="published">केवल प्रकाशित (Published)</option>
            <option value="draft">केवल ड्राफ्ट (Draft)</option>
          </select>
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-3">
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">कोई नोट्स नहीं मिले</h3>
            <p className="text-xs text-slate-400 mt-1">
              "नया नोट्स बनाएं" या "AI नोट्स जनरेटर" पर क्लिक करके नया अध्ययन सामग्री जोड़ें।
            </p>
          </div>
        ) : (
          filteredMaterials.map((mat) => {
            const isPublished = (mat.status || 'published') === 'published';
            const isRichNotes = mat.fileType === 'rich_notes' || Boolean(mat.bodyContent);

            return (
              <div
                key={mat.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-5 hover:border-slate-300 transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left side details */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-3 rounded-2xl shrink-0 ${
                      isRichNotes ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}
                  >
                    <FileText className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                        कक्षा {mat.classGrade}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {mat.subjectHi || mat.subject}
                      </span>
                      {mat.chapter && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                          {mat.chapter}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-600' : 'bg-amber-600'}`}
                        />
                        <span>{isPublished ? 'प्रकाशित (Live)' : 'ड्राफ्ट (Draft)'}</span>
                      </span>
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                      {mat.titleHi || mat.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {mat.contentSummaryHi || mat.descriptionHi || mat.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span>{mat.pageCount || 1} पृष्ठ</span>
                      <span>•</span>
                      <span>{mat.coinPrice === 0 ? 'मुफ़्त (Free)' : `${mat.coinPrice} कॉइन्स`}</span>
                      <span>•</span>
                      <span>{new Date(mat.createdAt).toLocaleDateString('hi-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Right side action controls */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  {/* Toggle publish status */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(mat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      isPublished
                        ? 'text-amber-700 hover:bg-amber-50 border border-amber-200'
                        : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    {isPublished ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                        <span>अप्रकाशित करें</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-amber-600" />
                        <span>प्रकाशित करें</span>
                      </>
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => onEditMaterial(mat)}
                    className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                    title="संपादित करें (Edit)"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Download PDF */}
                  <button
                    type="button"
                    onClick={() => generateAndDownloadPdf(mat)}
                    className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
                    title="PDF डाउनलोड करें"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setDeletingMaterialId(mat.id)}
                    className="p-2 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                    title="हटाएँ (Delete)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Existing PDF Modal */}
      {showPdfUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 my-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <span>फ़ोन से PDF फ़ाइल अपलोड करें</span>
            </h3>

            <form onSubmit={handleDirectPdfUpload} className="space-y-4">
              {/* File picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  PDF दस्तावेज़ चुनें *
                </label>
                <div
                  onClick={() => pdfInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50"
                >
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedPdfFile(e.target.files[0]);
                        if (!pdfTitle) {
                          setPdfTitle(e.target.files[0].name.replace(/\.pdf$/i, ''));
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <FileText className="w-8 h-8 text-blue-600 mx-auto mb-1" />
                  {selectedPdfFile ? (
                    <div>
                      <p className="text-xs font-bold text-slate-900">{selectedPdfFile.name}</p>
                      <p className="text-[11px] text-slate-500">
                        आकार: {(selectedPdfFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">फ़ाइल चुनने के लिए यहाँ टैप करें (अधिकतम 25 MB)</p>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {isUploadingPdf && pdfUploadProgress !== null && (
                <div className="p-3 bg-slate-100 rounded-2xl space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>अपलोड हो रहा है...</span>
                    <span>{pdfUploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${pdfUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">नोट्स का नाम (Title) *</label>
                <input
                  type="text"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  placeholder="उदा: कक्षा 10 विज्ञान अध्याय 1 हस्तलिखित नोट्स"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">कक्षा</label>
                  <select
                    value={pdfClass}
                    onChange={(e) => setPdfClass(e.target.value as ClassGrade)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="9">कक्षा 9</option>
                    <option value="10">कक्षा 10</option>
                    <option value="11">कक्षा 11</option>
                    <option value="12">कक्षा 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">विषय</label>
                  <select
                    value={pdfSubject}
                    onChange={(e) => setPdfSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Science">विज्ञान (Science)</option>
                    <option value="Mathematics">गणित (Maths)</option>
                    <option value="Physics">भौतिक विज्ञान</option>
                    <option value="Chemistry">रसायन विज्ञान</option>
                    <option value="Biology">जीव विज्ञान</option>
                    <option value="English">अंग्रेजी</option>
                    <option value="Social Science">सामाजिक विज्ञान</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">अध्याय</label>
                  <input
                    type="text"
                    value={pdfChapter}
                    onChange={(e) => setPdfChapter(e.target.value)}
                    placeholder="अध्याय 1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">कॉइन मूल्य (0 = Free)</label>
                  <input
                    type="number"
                    value={pdfCoinPrice}
                    onChange={(e) => setPdfCoinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPdfUploadModal(false)}
                  disabled={isUploadingPdf}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPdf || !selectedPdfFile}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs font-bold"
                >
                  {isUploadingPdf ? 'अपलोड जारी है...' : 'PDF अपलोड करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMaterialId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <span className="p-2.5 bg-red-100 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </span>
              <h3 className="font-bold text-base text-slate-900">नोट्स हटाने की पुष्टि</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              क्या आप वाकई इन नोट्स को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMaterialId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
              >
                नहीं, रद्द करें
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                हाँ, हटाएँ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
