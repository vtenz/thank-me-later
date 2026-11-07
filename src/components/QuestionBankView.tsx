import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Bookmark,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
  EyeOff,
  RotateCcw,
  Timer,
  Play,
  Award,
} from 'lucide-react';
import {
  ALL_EXAM_QUESTIONS,
  BOOKLET_METADATA,
  TOPIC_CATEGORIES,
} from '../data/allQuestions';
import { BookletId, TopicCategory, UserProgressState } from '../types/exam';
import { filterExamQuestions, toPersianDigits } from '../utils/examLogic';

interface QuestionBankViewProps {
  progress: UserProgressState;
  initialCategoryFilter?: TopicCategory | 'all';
  autoStartMockExam?: boolean;
  onAnswerQuestion: (questionId: string, selectedIndex: number, isCorrect: boolean) => void;
  onToggleBookmark: (questionId: string) => void;
  onResetAnswers: () => void;
}

const OPTION_LETTERS = ['الف', 'ب', 'ج', 'د', 'ه'];

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  progress,
  initialCategoryFilter = 'all',
  autoStartMockExam = false,
  onAnswerQuestion,
  onToggleBookmark,
  onResetAnswers,
}) => {
  const [selectedBooklet, setSelectedBooklet] = useState<BookletId | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory | 'all'>(initialCategoryFilter);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unanswered' | 'wrong' | 'bookmarked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealAllKeys, setRevealAllKeys] = useState(false);

  // Timed Mock Exam State
  const [isMockExamActive, setIsMockExamActive] = useState(autoStartMockExam);
  const [mockQuestionsIds, setMockQuestionsIds] = useState<string[]>([]);
  const [mockAnswers, setMockAnswers] = useState<Record<string, number>>({});
  const [mockSubmitted, setMockSubmitted] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(1200); // 20 minutes

  useEffect(() => {
    setSelectedCategory(initialCategoryFilter);
  }, [initialCategoryFilter]);

  useEffect(() => {
    if (autoStartMockExam && !isMockExamActive) {
      startNewMockExam();
    }
  }, [autoStartMockExam]);

  useEffect(() => {
    if (!isMockExamActive || mockSubmitted) return;
    const interval = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setMockSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isMockExamActive, mockSubmitted]);

  const startNewMockExam = () => {
    const shuffled = [...ALL_EXAM_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 20);
    setMockQuestionsIds(shuffled.map((q) => q.id));
    setMockAnswers({});
    setMockSubmitted(false);
    setSecondsRemaining(1200);
    setIsMockExamActive(true);
  };

  const filteredQuestions = useMemo(() => {
    return filterExamQuestions(
      ALL_EXAM_QUESTIONS,
      {
        bookletId: selectedBooklet,
        category: selectedCategory,
        statusFilter,
        searchQuery,
      },
      progress
    );
  }, [selectedBooklet, selectedCategory, statusFilter, searchQuery, progress]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  if (isMockExamActive) {
    const mockQuestions = mockQuestionsIds
      .map((id) => ALL_EXAM_QUESTIONS.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => Boolean(q));

    const answeredMockCount = Object.keys(mockAnswers).length;
    const correctMockCount = mockQuestions.filter(
      (q) => mockAnswers[q.id] === q.correctIndex
    ).length;
    const mockScorePercent =
      mockQuestions.length > 0
        ? Math.round((correctMockCount / mockQuestions.length) * 100)
        : 0;

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                شبیه‌ساز شرایط واقعی جلسه امتحان · ۲۰ سوال منتخب
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                آزمون آزمایشی زمان‌دار تکنسین داروخانه
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                <Timer className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>

              {!mockSubmitted ? (
                <button
                  type="button"
                  onClick={() => {
                    setMockSubmitted(true);
                    mockQuestions.forEach((q) => {
                      const sel = mockAnswers[q.id];
                      if (sel !== undefined) {
                        onAnswerQuestion(q.id, sel, sel === q.correctIndex);
                      }
                    });
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  ثبت نهایی و مشاهده کارنامه ({toPersianDigits(answeredMockCount)} از {toPersianDigits(mockQuestions.length)})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startNewMockExam}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-teal-600 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  آزمون ۲۰ سوالی جدید
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsMockExamActive(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
              >
                بازگشت به بانک ۱۷۵ سوال
              </button>
            </div>
          </div>

          {mockSubmitted && (
            <div className="mt-6 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                  <Award className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                  <span>
                    نتیجه آزمون شما: {toPersianDigits(correctMockCount)} پاسخ صحیح از {toPersianDigits(mockQuestions.length)} سوال ({toPersianDigits(mockScorePercent)}٪)
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {mockScorePercent >= 70
                    ? 'عالی! با این تسلط، قبولی شما در آزمون تکنسین داروخانه حتمی است. پاسخ‌های تشریحی زیر را مرور کنید.'
                    : 'نگران نباش! تمام سوالاتی که نزدی یا اشتباه زدی در پایین با «رمز طلایی قفل در حافظه» توضیح داده شده‌اند.'}
                </p>
              </div>
              <div className="flex items-center gap-6 text-xs tabular-nums">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">صحیح: </span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {toPersianDigits(correctMockCount)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">نادرست یا نزده: </span>
                  <strong className="text-rose-700 dark:text-rose-400 font-bold">
                    {toPersianDigits(mockQuestions.length - correctMockCount)}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mock Questions List */}
        <div className="space-y-4">
          {mockQuestions.map((q, idx) => {
            const selectedIdx = mockAnswers[q.id];
            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span>سوال {toPersianDigits(idx + 1)} از ۲۰</span>
                  <span aria-hidden="true"> · </span>
                  <span>{q.category}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                  {toPersianDigits(idx + 1)}. {q.question}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selectedIdx === oIdx;
                    const isCorrect = oIdx === q.correctIndex;
                    let cls =
                      'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700';
                    if (!mockSubmitted && isSelected) {
                      cls =
                        'bg-teal-50 dark:bg-teal-950/60 border-teal-700 dark:border-teal-500 text-teal-950 dark:text-teal-100 font-semibold';
                    } else if (mockSubmitted) {
                      if (isCorrect) {
                        cls =
                          'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        cls =
                          'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-950 dark:text-rose-100';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        disabled={mockSubmitted}
                        onClick={() =>
                          setMockAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                        }
                        className={`text-right p-3.5 rounded-lg border text-sm transition-colors flex items-center justify-between gap-3 ${cls}`}
                      >
                        <span>
                          <strong className="ml-1.5">{OPTION_LETTERS[oIdx]})</strong>
                          {opt}
                        </span>
                        {mockSubmitted && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        )}
                        {mockSubmitted && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {mockSubmitted && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-lg text-teal-950 dark:text-teal-100">
                      <strong className="font-bold">رمز طلایی حافظه: </strong>
                      {q.mnemonic}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      <strong className="text-slate-900 dark:text-slate-100">توضیح علمی: </strong>
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Panel & Booklet Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-teal-700 dark:text-teal-400">
              بانک جامع و کالبدشکافی‌شده · ۱۷۵ سوال رسمی در ۴ دفترچه
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              بانک سوالات امتحانی با رمزگردانی و پاسخ تشریحی
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              روی هر گزینه کلیک کنید تا بلافاصله پاسخ صحیح، «رمز طلایی قفل در حافظه» و دلیل غلط بودن سایر گزینه‌ها را ببینید.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setRevealAllKeys((prev) => !prev)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${
                revealAllKeys
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {revealAllKeys ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  <span>مخفی کردن پاسخ‌ها (حالت تست‌زنی)</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>نمایش کلید و رمز همه سوالات (مرور سریع)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={startNewMockExam}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>شروع آزمون ۲۰ سوالی زمان‌دار</span>
            </button>
          </div>
        </div>

        {/* Booklet Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {BOOKLET_METADATA.map((b) => {
            const isActive = selectedBooklet === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBooklet(b.id)}
                className={`text-right p-3.5 rounded-lg border transition-colors flex flex-col justify-between gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 dark:bg-teal-600 border-slate-900 dark:border-teal-500 text-white'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="text-xs font-bold">{b.title}</div>
                <div
                  className={`text-[11px] leading-snug ${
                    isActive
                      ? 'text-slate-200 dark:text-teal-100'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {b.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Search, Status Filter & Category Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'همه سوالات' },
                { id: 'unanswered', label: 'نزده‌ها' },
                { id: 'wrong', label: 'غلط‌های من (مرور اشتباهات)' },
                { id: 'bookmarked', label: 'نشان‌شده‌ها (ستاره‌دار)' },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === st.id
                    ? 'bg-teal-700 dark:bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}

            {Object.keys(progress.answeredQuestions).length > 0 && (
              <button
                type="button"
                onClick={onResetAnswers}
                className="px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 rounded-lg hover:bg-rose-100 transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>پاک کردن پاسخ‌های قبلی</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              aria-label="فیلتر موضوع داروشناسی"
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as TopicCategory | 'all')
              }
              className="px-3.5 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600"
            >
              <option value="all">همه ۹ مبحث داروشناسی</option>
              {TOPIC_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="جستجو در بانک سوالات"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در ۱۷۵ سوال (مثلاً: میگرن، انسولین)..."
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Count Header */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
        <span>
          نمایش <strong className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">{toPersianDigits(filteredQuestions.length)}</strong> سوال از ۱۷۵ سوال آزمون
        </span>
        {selectedCategory !== 'all' && (
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className="text-teal-700 dark:text-teal-400 hover:underline font-medium"
          >
            حذف فیلتر «{selectedCategory}»
          </button>
        )}
      </div>

      {/* Questions Feed */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            هیچ سوالی با این فیلتر پیدا نشد.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            اگر روی فیلتر «غلط‌های من» یا «نشان‌شده‌ها» هستید، ابتدا چند سوال را پاسخ دهید یا نشان‌دار کنید.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedBooklet('all');
              setSelectedCategory('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
          >
            نمایش تمام ۱۷۵ سوال
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const userAnswer = progress.answeredQuestions[q.id];
            const isBookmarked = progress.bookmarkedQuestions.includes(q.id);
            const showSolution = revealAllKeys || userAnswer !== undefined;

            const bookletLabel =
              q.bookletId === 'booklet-1'
                ? 'دفترچه ۱ (جامع ۸۱ سوالی)'
                : q.bookletId === 'booklet-2'
                ? 'دفترچه ۲ (۳۷ سوالی)'
                : q.bookletId === 'booklet-3'
                ? 'دفترچه ۳ (۳۴ سوالی)'
                : 'دفترچه ۴ (۲۳ سوالی)';

            return (
              <article
                key={q.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-colors"
              >
                {/* Top Metadata Row */}
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      سوال {toPersianDigits(q.questionNumber)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{bookletLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-teal-700 dark:text-teal-400 font-medium">{q.category}</span>
                    {userAnswer && (
                      <>
                        <span aria-hidden="true">·</span>
                        {userAnswer.isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            پاسخ صحیح دادید
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400 font-semibold">
                            <XCircle className="w-3.5 h-3.5" />
                            نیاز به مرور مجدد
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label={`نشان کردن سوال ${toPersianDigits(q.questionNumber)}`}
                    onClick={() => onToggleBookmark(q.id)}
                    className={`p-2 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                      isBookmarked
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-amber-900 dark:text-amber-200'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        isBookmarked ? 'fill-amber-500 text-amber-600' : ''
                      }`}
                    />
                    <span>{isBookmarked ? 'نشان‌شده' : 'نشان کردن'}</span>
                  </button>
                </div>

                {/* Question Stem */}
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 py-4 leading-relaxed">
                  {toPersianDigits(q.questionNumber)}. {q.question}
                </h2>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = userAnswer?.selectedIndex === oIdx;
                    const isCorrectOption = oIdx === q.correctIndex;

                    let optionStyle =
                      'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700';

                    if (showSolution) {
                      if (isCorrectOption) {
                        optionStyle =
                          'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 font-semibold';
                      } else if (isSelected && !isCorrectOption) {
                        optionStyle =
                          'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-950 dark:text-rose-100';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() =>
                          onAnswerQuestion(q.id, oIdx, oIdx === q.correctIndex)
                        }
                        className={`text-right p-3.5 rounded-lg border text-sm transition-colors flex items-center justify-between gap-3 ${optionStyle}`}
                      >
                        <span className="leading-relaxed">
                          <strong className="ml-1.5 text-slate-500 dark:text-slate-400">
                            {OPTION_LETTERS[oIdx]})
                          </strong>
                          {opt}
                        </span>
                        {showSolution && isCorrectOption && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>صحیح</span>
                          </span>
                        )}
                        {showSolution && isSelected && !isCorrectOption && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 shrink-0">
                            <XCircle className="w-4 h-4" />
                            <span>نادرست</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Instant Mnemonic & Clinical Dissection */}
                {showSolution && (
                  <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-6 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-lg p-4 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-300">
                        <Lightbulb className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                        <span>رمز طلایی قفل در حافظه</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-teal-950 dark:text-teal-100 leading-relaxed">
                        {q.mnemonic}
                      </p>
                    </div>

                    <div className="lg:col-span-6 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg p-4 space-y-1.5">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        کالبدشکافی علمی و علت رد سایر گزینه‌ها
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {q.explanation}
                      </p>
                      <div className="pt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
                        جمع‌بندی ۱ خطی: {q.keyTakeaway}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
