import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../lib/translations';
import { OnlineTestItem, ActiveTest, TestEvaluationResult } from '../types';
import { api } from '../lib/api';
import {
  FileCheck,
  Clock,
  Coins,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  Bookmark,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TestsViewProps {
  onOpenAuth: () => void;
}

export const TestsView: React.FC<TestsViewProps> = ({ onOpenAuth }) => {
  const { user, language, updateCoins } = useAuth();
  const tr = t[language];

  const [tests, setTests] = useState<OnlineTestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>(user?.classGrade || 'all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Test Taking State
  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state
  const [testResult, setTestResult] = useState<TestEvaluationResult | null>(null);

  // Unlocking state
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const loadTests = async () => {
    setLoading(true);
    try {
      const data = await api.getTests({
        classGrade: selectedClass,
        subject: selectedSubject,
      });
      setTests(data);
    } catch (e) {
      console.error('Error loading tests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [selectedClass, selectedSubject]);

  // Timer countdown
  useEffect(() => {
    if (!activeTest || testResult) return;
    if (remainingSeconds <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, remainingSeconds, testResult]);

  const handleUnlockTest = async (test: OnlineTestItem) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setUnlockingId(test.id);
    setUnlockError(null);
    try {
      const res = await api.unlockTest(test.id);
      updateCoins(res.coins);
      setTests((prev) =>
        prev.map((tItem) => (tItem.id === test.id ? { ...tItem, isUnlocked: true } : tItem))
      );
    } catch (err: any) {
      setUnlockError(err.message || 'अनलॉक करने में त्रुटि');
    } finally {
      setUnlockingId(null);
    }
  };

  const handleStartTest = async (test: OnlineTestItem) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      const fullTest = await api.startTest(test.id);
      setActiveTest(fullTest);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setMarkedForReview({});
      setRemainingSeconds(fullTest.durationMinutes * 60);
      setTestResult(null);
    } catch (err: any) {
      alert(err.message || 'टेस्ट लोड नहीं हो सका');
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleFinalSubmit = async () => {
    if (!activeTest) return;
    setIsSubmitting(true);
    try {
      const result = await api.submitTest(activeTest.id, userAnswers);
      setTestResult(result);

      if (result.percentage >= 60) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }

      // Reload tests to update past score
      loadTests();
    } catch (err: any) {
      alert(err.message || 'टेस्ट जमा करने में समस्या आई');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ================= RENDER: ACTIVE TEST TAKING =================
  if (activeTest && !testResult) {
    const currentQ = activeTest.questions[currentQuestionIndex];
    const totalQ = activeTest.questions.length;
    const answeredCount = Object.keys(userAnswers).length;

    return (
      <div className="space-y-4 pb-20 md:pb-10 max-w-4xl mx-auto">
        {/* Test Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
              {language === 'hi' ? activeTest.titleHi : activeTest.title}
            </h2>
            <p className="text-xs text-slate-500">
              प्रश्न {currentQuestionIndex + 1} / {totalQ} • {answeredCount} हल किए
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-mono font-bold text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            <button
              onClick={() => {
                if (window.confirm(tr.confirmSubmit)) {
                  handleFinalSubmit();
                }
              }}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              {isSubmitting ? '...' : tr.submitTest}
            </button>
          </div>
        </div>

        {/* Question Palette (Mobile / Desktop) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {activeTest.questions.map((q, idx) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isMarked = markedForReview[q.id];
              const isCurrent = idx === currentQuestionIndex;

              let btnStyle = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
              if (isCurrent) {
                btnStyle = 'ring-2 ring-blue-600 font-bold bg-blue-100 text-blue-900';
              } else if (isMarked) {
                btnStyle = 'bg-amber-100 text-amber-900 font-bold';
              } else if (isAnswered) {
                btnStyle = 'bg-emerald-500 text-white font-bold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all ${btnStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Question Card */}
        {currentQ && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {tr.questionNum} {currentQuestionIndex + 1} ({currentQ.marks} {language === 'hi' ? 'अंक' : 'Marks'})
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1 leading-relaxed">
                  {language === 'hi' ? currentQ.questionHi : currentQ.question}
                </h3>
              </div>

              <button
                onClick={() => toggleMarkForReview(currentQ.id)}
                className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors ${
                  markedForReview[currentQ.id]
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">{tr.markForReview}</span>
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {(language === 'hi' ? currentQ.optionsHi : currentQ.options).map((opt, optIdx) => {
                const isSelected = userAnswers[currentQ.id] === optIdx;
                const letter = ['A', 'B', 'C', 'D'][optIdx];

                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {letter}
                    </div>
                    <span className="text-sm font-medium text-slate-900">{opt}</span>
                  </div>
                );
              })}
            </div>

            {/* Question Footer Nav Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-30 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{tr.prev}</span>
              </button>

              {currentQuestionIndex < totalQ - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                >
                  <span>{tr.next}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm(tr.confirmSubmit)) {
                      handleFinalSubmit();
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  {tr.submitTest}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= RENDER: TEST SCORECARD RESULT =================
  if (testResult && activeTest) {
    return (
      <div className="space-y-6 pb-20 md:pb-10 max-w-3xl mx-auto">
        {/* Scorecard Hero */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white/10 mx-auto flex items-center justify-center backdrop-blur-md">
            <Award className="w-9 h-9 text-amber-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            {tr.testResultTitle}
          </h2>
          <p className="text-xs text-blue-200">
            {language === 'hi' ? activeTest.titleHi : activeTest.title}
          </p>

          <div className="flex items-center justify-center gap-6 pt-3">
            <div className="bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-xs">
              <span className="text-[11px] text-blue-200 block uppercase font-semibold">
                {tr.scoreObtained}
              </span>
              <span className="text-2xl font-black text-amber-300">
                {testResult.score} / {testResult.maxScore}
              </span>
            </div>

            <div className="bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-xs">
              <span className="text-[11px] text-blue-200 block uppercase font-semibold">
                {tr.percentage}
              </span>
              <span className="text-2xl font-black text-white">
                {testResult.percentage}%
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setActiveTest(null);
                setTestResult(null);
              }}
              className="px-6 py-2.5 rounded-xl bg-white text-blue-950 font-bold text-xs shadow-md hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'hi' ? 'सभी टेस्ट सूची पर लौटें' : 'Back to Tests List'}</span>
            </button>
          </div>
        </div>

        {/* Detailed Solutions Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 border-b border-slate-100 pb-3">
            {tr.detailedSolutions}
          </h3>

          <div className="space-y-4">
            {testResult.questions.map((q, idx) => (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border ${
                  q.isCorrect
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-red-200 bg-red-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600">
                    {tr.questionNum} {idx + 1}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                      q.isCorrect ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}
                  >
                    {q.isCorrect ? `+${q.marks} अंक (सही)` : `0 अंक (गलत)`}
                  </span>
                </div>

                <p className="font-bold text-sm text-slate-900 mb-3">
                  {language === 'hi' ? q.questionHi : q.question}
                </p>

                {/* Selected vs Correct */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">{tr.yourAnswer}</span>
                    <span className={q.isCorrect ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>
                      {q.selectedAnswer !== undefined
                        ? (language === 'hi' ? q.optionsHi[q.selectedAnswer] : q.options[q.selectedAnswer])
                        : (language === 'hi' ? 'उत्तर नहीं दिया' : 'Not answered')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">{tr.correctAnswerText}</span>
                    <span className="text-emerald-800 font-bold">
                      {language === 'hi' ? q.optionsHi[q.correctAnswer] : q.options[q.correctAnswer]}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                {(q.explanation || q.explanationHi) && (
                  <div className="mt-3 p-3 bg-white/80 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                    <span className="font-bold text-blue-700 mr-1">{tr.explanationText}</span>
                    <span>{language === 'hi' ? q.explanationHi : q.explanation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ================= RENDER: TESTS LIST =================
  return (
    <div className="space-y-6 pb-20 md:pb-10">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-emerald-600" />
          <span>{tr.testsTitle}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {tr.testsSub}
        </p>
      </div>

      {unlockError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{unlockError}</span>
        </div>
      )}

      {/* Class filter */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
        <span className="text-xs font-bold text-slate-600 mr-1">{tr.filterClass}</span>
        {['all', '9', '10', '11', '12'].map((grade) => (
          <button
            key={grade}
            onClick={() => setSelectedClass(grade)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedClass === grade
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {grade === 'all' ? tr.filterAll : `कक्षा ${grade}`}
          </button>
        ))}
      </div>

      {/* Tests Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">
            {language === 'hi' ? 'टेस्ट लोड हो रहे हैं...' : 'Loading mock tests...'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((test) => {
            const isFree = test.coinPrice === 0;
            const isUnlocked = test.isUnlocked || isFree;

            return (
              <div
                key={test.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        कक्षा {test.classGrade} • {test.subjectHi}
                      </span>
                    </div>

                    {isFree ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                        <Unlock className="w-2.5 h-2.5" />
                        {tr.freeTag}
                      </span>
                    ) : isUnlocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {tr.unlockedReady}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-amber-700" />
                        <Coins className="w-3 h-3 text-amber-500 fill-amber-400" />
                        {test.coinPrice} Coins
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {language === 'hi' ? test.titleHi : test.title}
                  </h3>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {test.durationMinutes} {tr.minutes}
                    </span>
                    <span>•</span>
                    <span>
                      {test.questionCount} {language === 'hi' ? 'प्रश्न' : 'Questions'}
                    </span>
                    <span>•</span>
                    <span>
                      {test.totalMarks} {language === 'hi' ? 'पूर्णांक' : 'Marks'}
                    </span>
                  </div>

                  {/* Past score if attempted */}
                  {test.pastAttempt && (
                    <div className="mt-3 p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                      <span className="font-semibold">{tr.pastScore}</span>
                      <span className="font-extrabold">
                        {test.pastAttempt.score} / {test.pastAttempt.maxScore} ({test.pastAttempt.percentage}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                  {isUnlocked ? (
                    <button
                      onClick={() => handleStartTest(test)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>{test.pastAttempt ? tr.retakeTest : tr.startTest}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnlockTest(test)}
                      disabled={unlockingId === test.id}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Coins className="w-4 h-4 text-yellow-200 fill-yellow-200" />
                      <span>
                        {unlockingId === test.id
                          ? '...'
                          : `${tr.unlockTest} (${test.coinPrice} Coins)`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
