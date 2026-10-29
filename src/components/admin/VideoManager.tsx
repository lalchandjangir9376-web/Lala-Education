import React, { useState, useRef } from 'react';
import { EducationalVideo, ClassGrade } from '../../types';
import { api } from '../../lib/api';
import { parseYouTubeVideo } from '../../lib/youtube';
import {
  Video,
  Play,
  Upload,
  Youtube,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  FileVideo,
  Eye,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Info,
} from 'lucide-react';

interface VideoManagerProps {
  videos: EducationalVideo[];
  onRefresh: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const VideoManager: React.FC<VideoManagerProps> = ({
  videos,
  onRefresh,
  onSuccess,
  onError,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'youtube' | 'direct_upload'>('youtube');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [classGrade, setClassGrade] = useState<ClassGrade>('10');
  const [subject, setSubject] = useState('Science');
  const [subjectHi, setSubjectHi] = useState('विज्ञान');
  const [chapter, setChapter] = useState('अध्याय 1');
  const [duration, setDuration] = useState('30:00');
  const [coinReward, setCoinReward] = useState('50');
  const [description, setDescription] = useState('');
  const [isDraft, setIsDraft] = useState(false);

  // YouTube Specific
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Direct Upload Specific
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Edit Video Modal State
  const [editingVideo, setEditingVideo] = useState<EducationalVideo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTitleHi, setEditTitleHi] = useState('');
  const [editClass, setEditClass] = useState<ClassGrade>('10');
  const [editSubject, setEditSubject] = useState('Science');
  const [editSubjectHi, setEditSubjectHi] = useState('विज्ञान');
  const [editChapter, setEditChapter] = useState('');
  const [editDuration, setEditDuration] = useState('30:00');
  const [editCoinReward, setEditCoinReward] = useState('50');
  const [editVideoUrl, setEditVideoUrl] = useState('');

  // Delete Confirmation Modal State
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setTitleHi('');
    setYoutubeUrl('');
    setSelectedFile(null);
    setUploadProgress(null);
    setDescription('');
    setIsDraft(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle YouTube Publish
  const handlePublishYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && !titleHi) {
      onError('वीडियो का शीर्षक आवश्यक है।');
      return;
    }
    if (!youtubeUrl) {
      onError('YouTube वीडियो का लिंक आवश्यक है।');
      return;
    }

    const parsed = parseYouTubeVideo(youtubeUrl);
    if (!parsed.isValid) {
      onError('कृपया एक मान्य YouTube वीडियो लिंक या 11-अक्षरों का वीडियो ID डालें। (उदा: https://www.youtube.com/watch?v=... या https://youtu.be/...)');
      return;
    }

    try {
      await api.addVideo({
        title: title || titleHi,
        titleHi: titleHi || title,
        classGrade,
        subject,
        subjectHi,
        chapter,
        videoUrl: parsed.embedUrl,
        thumbnailUrl: parsed.thumbnailUrl,
        sourceType: 'youtube',
        duration,
        coinReward: parseInt(coinReward) || 50,
        description,
        descriptionHi: description,
        status: isDraft ? 'draft' : 'published',
      });
      resetForm();
      onSuccess(isDraft ? 'YouTube वीडियो ड्राफ्ट के रूप में सहेज लिया गया!' : 'YouTube वीडियो कक्षा सफलतापूर्वक प्रकाशित हो गई!');
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'YouTube वीडियो जोड़ने में त्रुटि हुई।');
    }
  };

  // Handle Direct Upload
  const handleDirectUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      onError('कृपया अपने फ़ोन या कंप्यूटर से एक वीडियो फ़ाइल चुनें।');
      return;
    }
    if (!title && !titleHi) {
      onError('वीडियो का शीर्षक आवश्यक है।');
      return;
    }

    // Size limit check (100MB)
    const maxBytes = 100 * 1024 * 1024;
    if (selectedFile.size > maxBytes) {
      onError(`फ़ाइल का आकार ${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB है। अधिकतम अनुमत सीमा 100MB है। बड़ी कक्षाओं के लिए YouTube लिंक का उपयोग करें।`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadRes = await api.uploadVideoFile(selectedFile, (pct) => {
        setUploadProgress(pct);
      });

      await api.addVideo({
        title: title || titleHi,
        titleHi: titleHi || title,
        classGrade,
        subject,
        subjectHi,
        chapter,
        videoUrl: uploadRes.fileUrl,
        sourceType: 'direct_upload',
        videoFileName: uploadRes.fileName,
        fileSizeMb: uploadRes.fileSizeMb,
        thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
        duration,
        coinReward: parseInt(coinReward) || 50,
        description,
        descriptionHi: description,
        status: isDraft ? 'draft' : 'published',
      });

      resetForm();
      onSuccess(isDraft ? 'अपलोड किया गया वीडियो ड्राफ्ट में सहेज लिया गया!' : 'वीडियो सफलतापूर्वक अपलोड एवं प्रकाशित हो गया!');
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'वीडियो अपलोड विफल रहा।');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Toggle Video Status (Draft <-> Published)
  const handleToggleStatus = async (video: EducationalVideo) => {
    const nextStatus = (video.status || 'published') === 'published' ? 'draft' : 'published';
    try {
      await api.toggleVideoStatus(video.id, nextStatus);
      onSuccess(nextStatus === 'published' ? 'वीडियो प्रकाशित हो गया!' : 'वीडियो ड्राफ्ट में बदल दिया गया (विद्यार्थियों से छिपा दिया गया)।');
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'स्थिति बदलने में त्रुटि हुई।');
    }
  };

  // Start Editing
  const startEdit = (vid: EducationalVideo) => {
    setEditingVideo(vid);
    setEditTitle(vid.title);
    setEditTitleHi(vid.titleHi);
    setEditClass(vid.classGrade);
    setEditSubject(vid.subject);
    setEditSubjectHi(vid.subjectHi);
    setEditChapter(vid.chapter || '');
    setEditDuration(vid.duration);
    setEditCoinReward(String(vid.coinReward || 50));
    setEditVideoUrl(vid.videoUrl);
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    let finalVideoUrl = editVideoUrl;
    let finalThumbnail = editingVideo.thumbnailUrl;

    if (
      editingVideo.sourceType === 'youtube' ||
      editVideoUrl.includes('youtube') ||
      editVideoUrl.includes('youtu.be')
    ) {
      const parsed = parseYouTubeVideo(editVideoUrl);
      if (parsed.isValid) {
        finalVideoUrl = parsed.embedUrl;
        finalThumbnail = parsed.thumbnailUrl;
      }
    }

    try {
      await api.updateVideo(editingVideo.id, {
        title: editTitle,
        titleHi: editTitleHi,
        classGrade: editClass,
        subject: editSubject,
        subjectHi: editSubjectHi,
        chapter: editChapter,
        duration: editDuration,
        coinReward: parseInt(editCoinReward) || 50,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumbnail,
      });
      setEditingVideo(null);
      onSuccess('वीडियो विवरण सफलतापूर्वक अपडेट हो गया!');
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'अपडेट करने में त्रुटि हुई।');
    }
  };

  // Delete Video
  const confirmDelete = async () => {
    if (!deletingVideoId) return;
    try {
      await api.deleteVideo(deletingVideoId);
      setDeletingVideoId(null);
      onSuccess('वीडियो सफलतापूर्वक हटा दिया गया!');
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'वीडियो हटाने में त्रुटि हुई।');
    }
  };

  // Filtered videos
  const filteredVideos = videos.filter((v) => {
    if (filterClass !== 'all' && v.classGrade !== filterClass) return false;
    const vStatus = v.status || 'published';
    if (filterStatus !== 'all' && vStatus !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Upload/Add Video Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Card Header with Sub-tabs */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-white/10 rounded-xl">
                  <Video className="w-5 h-5 text-blue-200" />
                </span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  वीडियो कक्षा प्रबंधन (Educational Video Manager)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-blue-200/80 mt-1">
                YouTube लिंक जोड़ें या अपने Android फ़ोन की गैलरी से सीधे वीडियो अपलोड करें।
              </p>
            </div>

            {/* Toggle Modes */}
            <div className="flex bg-white/10 p-1 rounded-2xl backdrop-blur-xs self-start sm:self-center">
              <button
                type="button"
                onClick={() => setActiveSubTab('youtube')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeSubTab === 'youtube'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Youtube className="w-4 h-4" />
                <span>YouTube लिंक</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('direct_upload')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  activeSubTab === 'direct_upload'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>सीधा वीडियो अपलोड</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6">
          {activeSubTab === 'youtube' ? (
            <form onSubmit={handlePublishYouTube} className="space-y-4">
              {/* YouTube URL input with auto-preview notice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  YouTube वीडियो लिंक (URL) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="उदा: https://www.youtube.com/watch?v=... या https://youtu.be/... या Shorts"
                    required
                    className="w-full px-4 py-3 pl-10 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                  />
                  <Youtube className="w-5 h-5 text-red-600 absolute left-3 top-3.5" />
                </div>

                {/* Real-time YouTube Validation & Test Preview */}
                {(() => {
                  if (!youtubeUrl.trim()) {
                    return (
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-blue-600" />
                        <span>सिस्टम अपने आप YouTube वीडियो को विद्यार्थियों के लिए एम्बेड प्लेयर व थंबनेल में बदल देगा।</span>
                      </p>
                    );
                  }
                  const parsed = parseYouTubeVideo(youtubeUrl);
                  if (parsed.isValid && parsed.videoId) {
                    return (
                      <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={parsed.thumbnailUrl}
                            alt="Preview"
                            className="w-16 h-10 object-cover rounded-lg shadow-xs border border-emerald-300 shrink-0"
                            onError={(e) => {
                              (e.target as any).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1 text-emerald-800 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>सत्यापित YouTube वीडियो (ID: {parsed.videoId})</span>
                            </div>
                            <p className="text-[11px] text-emerald-700 mt-0.5">
                              यह वीडियो विद्यार्थियों के ऐप में सीधे चलेगा।
                            </p>
                          </div>
                        </div>
                        <a
                          href={parsed.watchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>चलाकर टेस्ट करें</span>
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      </div>
                    );
                  } else if (youtubeUrl.trim().length > 6) {
                    return (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          अमान्य YouTube लिंक। कृपया YouTube शेयर लिंक (https://youtu.be/...) या सामान्य लिंक (https://www.youtube.com/watch?v=...) डालें।
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Title Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    वीडियो का नाम (हिंदी) *
                  </label>
                  <input
                    type="text"
                    value={titleHi}
                    onChange={(e) => setTitleHi(e.target.value)}
                    placeholder="उदा: रासायनिक अभिक्रियाएँ एवं समीकरण - सम्पूर्ण पाठ"
                    required
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
                    placeholder="e.g. Chemical Reactions and Equations - Full Chapter"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Class, Subject, Chapter, Duration */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    अवधि (Duration)
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="35:00"
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Coin Reward & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Coin Reward (इनाम)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={coinReward}
                      onChange={(e) => setCoinReward(e.target.value)}
                      placeholder="50"
                      className="w-full px-3 py-2.5 pl-8 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <Coins className="w-4 h-4 text-amber-500 absolute left-2.5 top-3" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">विद्यार्थी को 80% वीडियो देखने पर मिलेगा</p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    संक्षिप्त विवरण (Description)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="इस कक्षा में रासायनिक समीकरणों को संतुलित करना सिखाया गया है।"
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Draft Toggle & Submit */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={isDraft}
                    onChange={(e) => setIsDraft(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>ड्राफ्ट के रूप में सहेजें (अभी विद्यार्थियों को न दिखाएं)</span>
                </label>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    साफ़ करें (Reset)
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
                  >
                    <Youtube className="w-4 h-4" />
                    <span>{isDraft ? 'ड्राफ्ट सहेजें' : 'YouTube वीडियो प्रकाशित करें'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Direct Upload Form */
            <form onSubmit={handleDirectUpload} className="space-y-4">
              {/* Storage Info Banner */}
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">फ़ोन से सीधा वीडियो अपलोड (Android Direct Upload)</p>
                  <p className="text-blue-800 leading-relaxed text-[11px]">
                    अधिकतम फ़ाइल आकार: <strong>100 MB</strong> (MP4, WebM, MOV समर्थित)। यह वीडियो सीधे आपके ऐप सर्वर के सुरक्षित स्टोरेज में सुरक्षित रहेगा। 1 से 2 घंटे की लंबी कक्षाओं के लिए YouTube लिंक का उपयोग करना अधिक उपयुक्त है।
                  </p>
                </div>
              </div>

              {/* File Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  वीडियो फ़ाइल चुनें (Gallery / Files) *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${
                    selectedFile
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        if (!titleHi) {
                          const base = e.target.files[0].name.replace(/\.[^/.]+$/, '');
                          setTitleHi(base);
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-200 text-blue-600">
                      <FileVideo className="w-7 h-7" />
                    </div>
                    {selectedFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{selectedFile.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          आकार: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <span className="inline-block mt-1 text-[11px] font-semibold text-blue-600">
                          बदलने के लिए यहाँ टैप करें
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          फ़ाइल चुनने के लिए यहाँ टैप करें (Choose Video)
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          MP4, WebM, MOV (अधिकतम 100 MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar when uploading */}
              {isUploading && uploadProgress !== null && (
                <div className="p-3.5 bg-slate-100 rounded-2xl space-y-1.5 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 text-blue-700">
                      <Upload className="w-3.5 h-3.5 animate-bounce" />
                      <span>अपलोड हो रहा है... ({uploadProgress}%)</span>
                    </span>
                    <span>कृपया प्रतीक्षा करें</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Title & Metadata Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    वीडियो का नाम (हिंदी) *
                  </label>
                  <input
                    type="text"
                    value={titleHi}
                    onChange={(e) => setTitleHi(e.target.value)}
                    placeholder="उदा: भौतिकी अध्याय 1 - स्थिर वैद्युतिकी"
                    required
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
                    placeholder="e.g. Physics Ch-1 Electrostatics Lecture"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Class, Subject, Chapter, Duration */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    कक्षा *
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
                    विषय *
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
                    अध्याय
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
                    अवधि (Duration)
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="25:00"
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Coin Reward & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Coin Reward (इनाम)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={coinReward}
                      onChange={(e) => setCoinReward(e.target.value)}
                      placeholder="50"
                      className="w-full px-3 py-2.5 pl-8 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <Coins className="w-4 h-4 text-amber-500 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    संक्षिप्त विवरण
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="मोबाइल से रिकॉर्ड किया गया हस्तलिखित समाधान वीडियो।"
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Draft toggle & Action buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={isDraft}
                    onChange={(e) => setIsDraft(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>ड्राफ्ट में सहेजें (अप्रकाशित रखें)</span>
                </label>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isUploading}
                    className="px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? 'अपलोड जारी है...' : isDraft ? 'ड्राफ्ट सहेजें' : 'अपलोड एवं प्रकाशित करें'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Video Library List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        {/* Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>उपलब्ध वीडियो कक्षाएं ({filteredVideos.length})</span>
            </h3>
            <p className="text-xs text-slate-500">सभी प्रकाशित एवं ड्राफ्ट वीडियो का प्रबंधन करें।</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="all">सभी कक्षाएं</option>
              <option value="9">कक्षा 9</option>
              <option value="10">कक्षा 10</option>
              <option value="11">कक्षा 11</option>
              <option value="12">कक्षा 12</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="all">सभी स्थितियाँ</option>
              <option value="published">केवल प्रकाशित (Published)</option>
              <option value="draft">केवल ड्राफ्ट (Drafts)</option>
            </select>
          </div>
        </div>

        {/* Video Cards Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Video className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">कोई वीडियो नहीं मिला</p>
            <p className="text-[11px] text-slate-400 mt-0.5">ऊपर दिए गए फॉर्म से YouTube लिंक या वीडियो फ़ाइल जोड़ें।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVideos.map((vid) => {
              const isPublished = (vid.status || 'published') === 'published';
              const isYoutube = vid.sourceType === 'youtube' || vid.videoUrl.includes('youtube.com') || vid.videoUrl.includes('youtu.be');

              return (
                <div
                  key={vid.id}
                  className="p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-slate-50/50 flex flex-col justify-between gap-3 transition-shadow"
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-28 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                      <img
                        src={vid.thumbnailUrl}
                        alt={vid.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/80 text-[10px] text-white font-mono font-semibold">
                        {vid.duration}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                          कक्षा {vid.classGrade}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-medium">
                          {vid.subjectHi || vid.subject}
                        </span>
                        {isYoutube ? (
                          <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold flex items-center gap-0.5">
                            <Youtube className="w-3 h-3" />
                            <span>YouTube</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-0.5">
                            <Upload className="w-3 h-3" />
                            <span>Direct {vid.fileSizeMb ? `${vid.fileSizeMb}MB` : ''}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                        {vid.titleHi || vid.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {vid.chapter ? `${vid.chapter} • ` : ''}इनाम: +{vid.coinReward || 50} कॉइन्स
                      </p>

                      {/* Status badge */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPublished
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                          <span>{isPublished ? 'प्रकाशित (Live)' : 'ड्राफ्ट (Draft)'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(vid)}
                      className={`flex items-center gap-1 font-semibold text-[11px] px-2.5 py-1 rounded-lg transition-colors ${
                        isPublished
                          ? 'text-amber-700 hover:bg-amber-50'
                          : 'text-emerald-700 hover:bg-emerald-50'
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

                    <div className="flex items-center gap-1">
                      {isYoutube ? (() => {
                        const parsed = parseYouTubeVideo(vid.videoUrl);
                        return (
                          <a
                            href={parsed.isValid ? parsed.watchUrl : vid.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 text-[11px] font-bold flex items-center gap-1 transition-colors"
                            title="YouTube पर चलाकर देखें"
                          >
                            <Play className="w-3.5 h-3.5 fill-red-600" />
                            <span>चलाएं</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        );
                      })() : (
                        <a
                          href={vid.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="वीडियो चलाकर देखें"
                        >
                          <Play className="w-3.5 h-3.5 fill-blue-600" />
                          <span>चलाएं</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => startEdit(vid)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white transition-colors"
                        title="संपादन करें (Edit)"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingVideoId(vid.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-white transition-colors"
                        title="हटाएँ (Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Video Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 my-6">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-600" />
              <span>वीडियो कक्षा संपादित करें (Edit Video)</span>
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">शीर्षक (हिंदी)</label>
                <input
                  type="text"
                  value={editTitleHi}
                  onChange={(e) => setEditTitleHi(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title (English)</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">कक्षा</label>
                  <select
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value as ClassGrade)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="9">कक्षा 9</option>
                    <option value="10">कक्षा 10</option>
                    <option value="11">कक्षा 11</option>
                    <option value="12">कक्षा 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">अध्याय</label>
                  <input
                    type="text"
                    value={editChapter}
                    onChange={(e) => setEditChapter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">अवधि (Duration)</label>
                  <input
                    type="text"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Coin Reward</label>
                  <input
                    type="number"
                    value={editCoinReward}
                    onChange={(e) => setEditCoinReward(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">वीडियो URL (YouTube या फ़ाइल लिंक)</label>
                <input
                  type="text"
                  value={editVideoUrl}
                  onChange={(e) => setEditVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  परिवर्तन सहेजें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <span className="p-2.5 bg-red-100 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </span>
              <h3 className="font-bold text-base text-slate-900">वीडियो हटाने की पुष्टि</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              क्या आप वाकई इस वीडियो को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingVideoId(null)}
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
