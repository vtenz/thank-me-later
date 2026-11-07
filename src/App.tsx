/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Moon, Sun, FileText, Layers, Film } from 'lucide-react';
import { ALL_EXAM_QUESTIONS } from './data/allQuestions';
import { CRASH_COURSE_LESSONS } from './data/crashCourseData';
import { CONCEPTUAL_LESSONS } from './data/conceptualCourseData';
import { CINEMA_EPISODES } from './data/cinemaEpisodesData';
import { PATIENT_SCENARIOS } from './data/simulatorAndLeitnerData';
import { TopicCategory, UserProgressState } from './types/exam';
import { computeStudyStats, calculateNextLeitnerBox, toPersianDigits } from './utils/examLogic';
import { CinemaMasterclassView } from './components/CinemaMasterclassView';
import { CrashCourseView } from './components/CrashCourseView';
import { ConceptualCourseView } from './components/ConceptualCourseView';
import { QuestionBankView } from './components/QuestionBankView';
import { PharmacySimulatorView } from './components/PharmacySimulatorView';
import { LeitnerFlashcardsView } from './components/LeitnerFlashcardsView';
import { PdfReferenceView } from './components/PdfReferenceView';

type ActiveTab =
  | 'cinema-masterclass'
  | 'crash-course'
  | 'conceptual-course'
  | 'question-bank'
  | 'simulator'
  | 'leitner'
  | 'pdfs';

const STORAGE_KEY = 'pharmacode_exam_progress_v1';
const THEME_STORAGE_KEY = 'vtenz_theme_dark_v1';

const INITIAL_PROGRESS: UserProgressState = {
  answeredQuestions: {},
  bookmarkedQuestions: [],
  masteredLessons: [],
  masteredConceptualIds: [],
  watchedCinemaEpisodes: [],
  leitnerBoxes: {},
  completedScenarios: [],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('crash-course');
  const [targetCategory, setTargetCategory] = useState<TopicCategory | 'all'>('all');
  const [triggerMockExam, setTriggerMockExam] = useState<boolean>(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        return savedTheme === 'true';
      }
    } catch {
      // Fallback
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, String(isDark));
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  const [progress, setProgress] = useState<UserProgressState>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_PROGRESS, ...parsed };
      }
    } catch {
      // Fallback to initial state
    }
    return INITIAL_PROGRESS;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  const stats = useMemo(() => {
    return computeStudyStats(
      ALL_EXAM_QUESTIONS,
      CRASH_COURSE_LESSONS.length,
      PATIENT_SCENARIOS.length,
      progress
    );
  }, [progress]);

  const handleToggleMasteredLesson = (lessonId: string) => {
    setProgress((prev) => {
      const exists = prev.masteredLessons.includes(lessonId);
      const masteredLessons = exists
        ? prev.masteredLessons.filter((id) => id !== lessonId)
        : [...prev.masteredLessons, lessonId];
      return { ...prev, masteredLessons };
    });
  };

  const handleToggleMasteredConceptual = (conceptualId: string) => {
    setProgress((prev) => {
      const current = prev.masteredConceptualIds ?? [];
      const exists = current.includes(conceptualId);
      const masteredConceptualIds = exists
        ? current.filter((id) => id !== conceptualId)
        : [...current, conceptualId];
      return { ...prev, masteredConceptualIds };
    });
  };

  const handleMarkEpisodeWatched = (episodeId: string) => {
    setProgress((prev) => {
      const current = prev.watchedCinemaEpisodes ?? [];
      const exists = current.includes(episodeId);
      const watchedCinemaEpisodes = exists
        ? current.filter((id) => id !== episodeId)
        : [...current, episodeId];
      return { ...prev, watchedCinemaEpisodes };
    });
  };

  const handleAnswerQuestion = (
    questionId: string,
    selectedIndex: number,
    isCorrect: boolean
  ) => {
    setProgress((prev) => ({
      ...prev,
      answeredQuestions: {
        ...prev.answeredQuestions,
        [questionId]: {
          selectedIndex,
          isCorrect,
          timestamp: Date.now(),
        },
      },
    }));
  };

  const handleToggleBookmark = (questionId: string) => {
    setProgress((prev) => {
      const exists = prev.bookmarkedQuestions.includes(questionId);
      const bookmarkedQuestions = exists
        ? prev.bookmarkedQuestions.filter((id) => id !== questionId)
        : [...prev.bookmarkedQuestions, questionId];
      return { ...prev, bookmarkedQuestions };
    });
  };

  const handleResetAnswers = () => {
    setProgress((prev) => ({
      ...prev,
      answeredQuestions: {},
    }));
  };

  const handleCompleteScenario = (scenarioId: string) => {
    setProgress((prev) => {
      if (prev.completedScenarios.includes(scenarioId)) return prev;
      return {
        ...prev,
        completedScenarios: [...prev.completedScenarios, scenarioId],
      };
    });
  };

  const handleGradeLeitnerCard = (cardId: string, remembered: boolean) => {
    setProgress((prev) => {
      const currentBox = prev.leitnerBoxes[cardId];
      const nextBox = calculateNextLeitnerBox(currentBox, remembered);
      return {
        ...prev,
        leitnerBoxes: {
          ...prev.leitnerBoxes,
          [cardId]: nextBox,
        },
      };
    });
  };

  const handleJumpToCategoryQuestions = (category: TopicCategory) => {
    setTargetCategory(category);
    setTriggerMockExam(false);
    setActiveTab('question-bank');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartMockExamFromHeader = () => {
    setTargetCategory('all');
    setTriggerMockExam(true);
    setActiveTab('question-bank');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const watchedEpisodesCount = (progress.watchedCinemaEpisodes ?? []).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          dir="ltr"
          onClick={(e) => {
            e.preventDefault();
            setTriggerMockExam(false);
            setActiveTab('crash-course');
          }}
          className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          Vtenz / thank me later
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="منوی اصلی"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <button
            type="button"
            onClick={() => {
              setTriggerMockExam(false);
              setActiveTab('crash-course');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'crash-course'
                ? 'text-teal-700 dark:text-teal-400 font-bold underline underline-offset-8 decoration-2'
                : 'hover:text-slate-900 dark:hover:text-white hover:underline hover:underline-offset-8'
            }`}
          >
            درس‌نامه و رمزها
          </button>
          <button
            type="button"
            onClick={() => {
              setTriggerMockExam(false);
              setActiveTab('conceptual-course');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'conceptual-course'
                ? 'text-teal-700 dark:text-teal-400 font-bold underline underline-offset-8 decoration-2'
                : 'hover:text-slate-900 dark:hover:text-white hover:underline hover:underline-offset-8'
            }`}
          >
            درس‌نامه مفهومی
          </button>
          <button
            type="button"
            onClick={() => {
              setTriggerMockExam(false);
              setActiveTab('cinema-masterclass');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'cinema-masterclass'
                ? 'text-teal-700 dark:text-teal-400 font-bold underline underline-offset-8 decoration-2'
                : 'hover:text-slate-900 dark:hover:text-white hover:underline hover:underline-offset-8'
            }`}
          >
            اگه حال خوندن نداری
          </button>
          <button
            type="button"
            onClick={() => {
              setTriggerMockExam(false);
              setActiveTab('question-bank');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'question-bank' && !triggerMockExam
                ? 'text-teal-700 dark:text-teal-400 font-bold underline underline-offset-8 decoration-2'
                : 'hover:text-slate-900 dark:hover:text-white hover:underline hover:underline-offset-8'
            }`}
          >
            بانک ۱۷۵ سوال
          </button>
          <button
            type="button"
            onClick={() => {
              setTriggerMockExam(false);
              setActiveTab('simulator');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'simulator'
                ? 'text-teal-700 dark:text-teal-400 font-bold underline underline-offset-8 decoration-2'
                : 'hover:text-slate-900 dark:hover:text-white hover:underline hover:underline-offset-8'
            }`}
          >
            شبیه‌ساز داروخانه
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleStartMockExamFromHeader}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 dark:bg-teal-600 rounded-lg hover:bg-teal-800 dark:hover:bg-teal-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            آزمون شبیه‌ساز
          </button>
        </div>
      </header>

      {/* Mobile Navigation Strip (visible only below md) */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setTriggerMockExam(false);
            setActiveTab('crash-course');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
            activeTab === 'crash-course'
              ? 'bg-teal-700 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          درس‌نامه و رمزها
        </button>
        <button
          type="button"
          onClick={() => {
            setTriggerMockExam(false);
            setActiveTab('conceptual-course');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
            activeTab === 'conceptual-course'
              ? 'bg-teal-700 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          درس‌نامه مفهومی
        </button>
        <button
          type="button"
          onClick={() => {
            setTriggerMockExam(false);
            setActiveTab('cinema-masterclass');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
            activeTab === 'cinema-masterclass'
              ? 'bg-teal-700 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          اگه حال خوندن نداری
        </button>
        <button
          type="button"
          onClick={() => {
            setTriggerMockExam(false);
            setActiveTab('question-bank');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
            activeTab === 'question-bank'
              ? 'bg-teal-700 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          بانک ۱۷۵ سوال
        </button>
        <button
          type="button"
          onClick={() => {
            setTriggerMockExam(false);
            setActiveTab('simulator');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
            activeTab === 'simulator'
              ? 'bg-teal-700 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          شبیه‌ساز داروخانه
        </button>
        <button
          type="button"
          onClick={() => {
            setTriggerMockExam(false);
            setActiveTab('leitner');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
            activeTab === 'leitner'
              ? 'bg-teal-700 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          جعبه لایتنر
        </button>
        <button
          type="button"
          onClick={() => {
            setTriggerMockExam(false);
            setActiveTab('pdfs');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
            activeTab === 'pdfs'
              ? 'bg-teal-700 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          جزوه‌های PDF
        </button>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Workspace Quick-Controls Bar: Cinema Mode + Leitner + PDFs + Dark Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 transition-colors">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => {
                setTriggerMockExam(false);
                setActiveTab('cinema-masterclass');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'cinema-masterclass'
                  ? 'bg-teal-700 dark:bg-teal-600 text-white'
                  : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>اگه حال خوندن نداری (تدریس خودکار صوتی و تصویری کل ۱۷۵ سوال)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setTriggerMockExam(false);
                setActiveTab('leitner');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'leitner'
                  ? 'bg-teal-700 border-teal-700 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>جعبه لایتنر</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTriggerMockExam(false);
                setActiveTab('pdfs');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'pdfs'
                  ? 'bg-teal-700 border-teal-700 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>جزوه‌های PDF اصلی (۶ فایل)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'تغییر به حالت روز (روشن)' : 'تغییر به حالت شب (دارک مود)'}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>حالت روز (روشن)</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span>دارک مود (حالت شب)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* KPI Study Readiness Strip */}
        <section
          aria-label="وضعیت پیشرفت مطالعه"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100 dark:divide-slate-800 transition-colors"
        >
          <div className="space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              اپیزودهای «اگه حال خوندن نداری»
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {toPersianDigits(watchedEpisodesCount)} از {toPersianDigits(CINEMA_EPISODES.length)} اپیزود
            </div>
            <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
              پوشش ۱۰۰٪ تمام ۱۷۵ سوال در ۲۵ دقیقه
            </div>
          </div>

          <div className="pt-4 lg:pt-0 lg:pr-6 space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              سوالات تمرین‌شده از کل بانک
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {toPersianDigits(stats.answeredCount)} از {toPersianDigits(stats.totalQuestions)} سوال
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 tabular-nums">
              {toPersianDigits(stats.correctCount)} صحیح · {toPersianDigits(stats.wrongCount)} نیاز به مرور
            </div>
          </div>

          <div className="pt-4 lg:pt-0 lg:pr-6 space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              میانگین دقت پاسخ‌گویی
            </div>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {toPersianDigits(stats.accuracyPercent)}٪
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              نصاب قبولی هدف: بالای ۸۰٪
            </div>
          </div>

          <div className="pt-4 lg:pt-0 lg:pr-6 space-y-1">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              درس‌نامه‌های فشرده و مفهومی
            </div>
            <div className="text-xl font-bold text-teal-700 dark:text-teal-400 tabular-nums">
              {toPersianDigits(stats.masteredLessonsCount)} از ۱۲ فشرده · {toPersianDigits((progress.masteredConceptualIds ?? []).length)} از {toPersianDigits(CONCEPTUAL_LESSONS.length)} مفهومی
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              ذخیره خودکار پیشرفت در مرورگر شما
            </div>
          </div>
        </section>

        {/* Active View */}
        {activeTab === 'cinema-masterclass' && (
          <CinemaMasterclassView
            watchedEpisodes={progress.watchedCinemaEpisodes ?? []}
            onMarkEpisodeWatched={handleMarkEpisodeWatched}
          />
        )}

        {activeTab === 'crash-course' && (
          <CrashCourseView
            masteredLessons={progress.masteredLessons}
            onToggleMasteredLesson={handleToggleMasteredLesson}
            onJumpToCategoryQuestions={handleJumpToCategoryQuestions}
          />
        )}

        {activeTab === 'conceptual-course' && (
          <ConceptualCourseView
            masteredConceptualIds={progress.masteredConceptualIds ?? []}
            onToggleMasteredConceptual={handleToggleMasteredConceptual}
            onJumpToCategoryQuestions={handleJumpToCategoryQuestions}
          />
        )}

        {activeTab === 'question-bank' && (
          <QuestionBankView
            progress={progress}
            initialCategoryFilter={targetCategory}
            autoStartMockExam={triggerMockExam}
            onAnswerQuestion={handleAnswerQuestion}
            onToggleBookmark={handleToggleBookmark}
            onResetAnswers={handleResetAnswers}
          />
        )}

        {activeTab === 'simulator' && (
          <PharmacySimulatorView
            completedScenarios={progress.completedScenarios}
            onCompleteScenario={handleCompleteScenario}
          />
        )}

        {activeTab === 'leitner' && (
          <LeitnerFlashcardsView
            progress={progress}
            onGradeCard={handleGradeLeitnerCard}
          />
        )}

        {activeTab === 'pdfs' && (
          <PdfReferenceView
            onOpenDigitalBooklet={() => {
              setTriggerMockExam(false);
              setActiveTab('question-bank');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Clean Quiet Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 px-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <span dir="ltr" className="font-bold text-slate-700 dark:text-slate-200">
          Vtenz / thank me later
        </span>{' '}
        · سامانه جامع آمادگی آزمون تکنسین داروخانه · مجهز به بخش «اگه حال خوندن نداری»، درس‌نامه مفهومی، بانک ۱۷۵ سوال و موتور صوتی Gemini 3.8 Flash TTS
      </footer>
    </div>
  );
}
