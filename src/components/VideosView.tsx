import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/translations';
import { EducationalVideo } from '../types';
import { api } from '../lib/api';
import { parseYouTubeVideo } from '../lib/youtube';
import {
  Video,
  Play,
  CheckCircle2,
  Coins,
  Clock,
  X,
  Sparkles,
  AlertCircle,
  Award,
  ExternalLink,
  Youtube,
  Pause,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VideosViewProps {
  onOpenAuth: () => void;
}

export const VideosView: React.FC<VideosViewProps> = ({ onOpenAuth }) => {
  const { user, language, updateCoins } = useAuth();
  const tr = t[language];

  const [videos, setVideos] = useState<EducationalVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>(user?.classGrade || 'all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Video Player Modal State
  const [activeVideo, setActiveVideo] = useState<EducationalVideo | null>(null);
  const [watchProgress, setWatchProgress] = useState(0); // 0 to 100
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const data = await api.getVideos({
        classGrade: selectedClass,
        subject: selectedSubject,
      });
      setVideos(data);
    } catch (e) {
      console.error('Error loading videos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, [selectedClass, selectedSubject]);

  // Video progress timer
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && watchProgress < 100) {
      interval = setInterval(() => {
        setWatchProgress((prev) => {
          const next = prev + 5;
          if (next >= 100) {
            setIsTimerRunning(false);
            return 100;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, watchProgress]);

  const handleOpenVideo = (video: EducationalVideo) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setActiveVideo(video);
    setWatchProgress(video.isCompleted ? 100 : 0);
    setIsTimerRunning(true);
    setRewardMessage(null);
  };

  const handleOpenYouTubeDirectly = (watchUrl: string) => {
    // Open in new tab / mobile YouTube app
    window.open(watchUrl, '_blank', 'noopener,noreferrer');
    // Generously boost progress so students watching in the app can claim their reward
    setWatchProgress(100);
    setIsTimerRunning(false);
  };

  const handleClaimReward = async () => {
    if (!activeVideo || !user) return;
    setClaiming(true);
    setRewardMessage(null);

    try {
      const res = await api.completeVideo(activeVideo.id);
      updateCoins(res.coins);

      if (!res.alreadyCompleted) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      setRewardMessage(res.message);

      // Update state
      setVideos((prev) =>
        prev.map((v) => (v.id === activeVideo.id ? { ...v, isCompleted: true } : v))
      );
      setActiveVideo((prev) => (prev ? { ...prev, isCompleted: true } : null));
    } catch (err: any) {
      setRewardMessage(err.message || 'इनाम प्राप्त करने में त्रुटि हुई');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Video className="w-6 h-6 text-rose-600" />
          <span>{tr.videosTitle}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {tr.videosSub}
        </p>
      </div>

      {/* Reward Info Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Coins className="w-6 h-6 fill-amber-100" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm">
              {language === 'hi' ? 'वीडियो देखें और कमाएं 50 कॉइन्स!' : 'Watch & Earn 50 Coins per Video!'}
            </h4>
            <p className="text-xs text-amber-800">
              {language === 'hi'
                ? 'प्रत्येक शैक्षणिक वीडियो कक्षा पूर्ण करने पर आपके वॉलेट में 50 कॉइन्स स्वचालित रूप से जुड़ेंगे।'
                : 'Watch lectures to completion to earn coins and unlock model tests and premium notes.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <span className="text-xs font-bold text-slate-600 mr-1">{tr.filterClass}</span>
        {['all', '9', '10', '11', '12'].map((grade) => (
          <button
            key={grade}
            onClick={() => setSelectedClass(grade)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedClass === grade
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {grade === 'all' ? tr.filterAll : `कक्षा ${grade}`}
          </button>
        ))}
      </div>

      {/* Videos Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">
            {language === 'hi' ? 'वीडियो कक्षाएं लोड हो रही हैं...' : 'Loading video classes...'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((vid) => {
            const isDirectUpload = vid.sourceType === 'direct_upload' || vid.videoUrl.startsWith('/uploads/');
            const ytParsed = !isDirectUpload ? parseYouTubeVideo(vid.videoUrl) : null;

            return (
              <div
                key={vid.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail with duration badge & coin reward pill */}
                  <div
                    onClick={() => handleOpenVideo(vid)}
                    className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={vid.thumbnailUrl || (ytParsed ? ytParsed.thumbnailUrl : '')}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/95 text-rose-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-rose-600 translate-x-0.5" />
                      </div>
                    </div>

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                        कक्षा {vid.classGrade} • {vid.subjectHi}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      {vid.isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>पूर्ण</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                          <Coins className="w-3 h-3 fill-amber-950" />
                          <span>+50 Coins</span>
                        </span>
                      )}
                    </div>

                    {/* Duration & Source */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                      {isDirectUpload ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-600/90 text-white text-[10px] font-bold">
                          सीधा वीडियो
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-bold flex items-center gap-1">
                          <Youtube className="w-3 h-3" />
                          <span>YouTube</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-black/75 text-white text-[11px] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{vid.duration}</span>
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    {vid.chapter && (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold mb-1">
                        {vid.chapter}
                      </span>
                    )}
                    <h3
                      onClick={() => handleOpenVideo(vid)}
                      className="cursor-pointer font-bold text-slate-900 text-sm leading-snug group-hover:text-rose-600 transition-colors line-clamp-2"
                    >
                      {language === 'hi' ? vid.titleHi : vid.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                      {language === 'hi' ? vid.descriptionHi : vid.description}
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-slate-100/80 mt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenVideo(vid)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 py-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-rose-600" />
                    <span>{tr.watchNow}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Direct YouTube Link Shortcut */}
                    {ytParsed && ytParsed.isValid && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenYouTubeDirectly(ytParsed.watchUrl);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title="सीधे YouTube पर खोलें"
                      >
                        <Youtube className="w-3.5 h-3.5 text-red-600" />
                        <span>YouTube</span>
                        <ExternalLink className="w-3 h-3 text-red-500" />
                      </button>
                    )}

                    {vid.isCompleted && (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>इनाम प्राप्त</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && (() => {
        const isDirect = activeVideo.sourceType === 'direct_upload' || activeVideo.videoUrl.startsWith('/uploads/');
        const yt = !isDirect ? parseYouTubeVideo(activeVideo.videoUrl) : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base line-clamp-1">
                    {language === 'hi' ? activeVideo.titleHi : activeVideo.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    कक्षा {activeVideo.classGrade} • {activeVideo.subjectHi} • {activeVideo.duration}
                    {activeVideo.chapter ? ` • ${activeVideo.chapter}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveVideo(null);
                    setIsTimerRunning(false);
                  }}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player Frame */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {isDirect ? (
                  <video
                    src={activeVideo.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                    onPlay={() => setIsTimerRunning(true)}
                    onPause={() => setIsTimerRunning(false)}
                  >
                    आपका ब्राउज़र वीडियो टैग का समर्थन नहीं करता है।
                  </video>
                ) : yt && yt.isValid ? (
                  <iframe
                    src={yt.embedUrl}
                    title={activeVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <iframe
                    src={activeVideo.videoUrl}
                    title={activeVideo.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>

              {/* YouTube Direct Play & Troubleshooting Helper Bar */}
              {yt && yt.isValid && (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border-y border-red-200/80 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs text-red-950 font-medium">
                    <Youtube className="w-5 h-5 text-red-600 shrink-0" />
                    <span>
                      {language === 'hi'
                        ? 'यदि वीडियो यहाँ प्ले न हो, तो सीधे YouTube ऐप में देखने के लिए बटन दबाएँ:'
                        : 'If the video does not play in frame, open directly in YouTube:'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenYouTubeDirectly(yt.watchUrl)}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>YouTube पर सीधे चलाएं</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                </div>
              )}

              {/* Progress & Reward Controls */}
              <div className="p-5 sm:p-6 bg-slate-50 space-y-4">
                {/* Progress Bar & Timer Control */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>प्रगति (Progress): {watchProgress}%</span>
                      </span>

                      {/* Play/Pause progress button */}
                      <button
                        type="button"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className="px-2 py-0.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        {isTimerRunning ? (
                          <>
                            <Pause className="w-3 h-3" />
                            <span>टाइमर रोकें</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>टाइमर चालू करें</span>
                          </>
                        )}
                      </button>
                    </div>

                    {watchProgress >= 80 ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>इनाम हेतु पात्र (Eligible for Coins)</span>
                      </span>
                    ) : (
                      <span className="text-amber-700">कम से कम 80% देखें</span>
                    )}
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        watchProgress >= 80 ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${watchProgress}%` }}
                    />
                  </div>
                </div>

                {/* Reward Feedback */}
                {rewardMessage && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{rewardMessage}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-500">
                    {activeVideo.isCompleted ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>आप इस वीडियो का +50 कॉइन्स इनाम पहले ही प्राप्त कर चुके हैं।</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>कक्षा पूर्ण करने पर +50 कॉइन्स प्राप्त करें।</span>
                        {watchProgress < 80 && (
                          <button
                            type="button"
                            onClick={() => setWatchProgress(100)}
                            className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold"
                          >
                            (मैंने वीडियो देख लिया है)
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {!activeVideo.isCompleted && (
                    <button
                      onClick={handleClaimReward}
                      disabled={claiming || watchProgress < 80}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Coins className="w-4 h-4 text-yellow-200 fill-yellow-200" />
                      <span>{claiming ? 'सत्यापन हो रहा है...' : tr.claimReward}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
