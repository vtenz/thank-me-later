import React, { useState } from 'react';
import {
  CheckCircle2,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  Search,
  HelpCircle,
  Check,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import { CRASH_COURSE_LESSONS } from '../data/crashCourseData';
import { TOPIC_CATEGORIES } from '../data/allQuestions';
import { TopicCategory } from '../types/exam';
import { TtsAudioPlayer } from './TtsAudioPlayer';

interface CrashCourseViewProps {
  masteredLessons: string[];
  onToggleMasteredLesson: (lessonId: string) => void;
  onJumpToCategoryQuestions: (category: TopicCategory) => void;
}

export const CrashCourseView: React.FC<CrashCourseViewProps> = ({
  masteredLessons,
  onToggleMasteredLesson,
  onJumpToCategoryQuestions,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCheckAnswers, setQuickCheckAnswers] = useState<Record<string, number>>({});

  const filteredLessons = CRASH_COURSE_LESSONS.filter((lesson) => {
    if (selectedCategory !== 'all' && lesson.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      const text = [
        lesson.title,
        lesson.subtitle,
        lesson.goldenRule,
        lesson.mnemonicStory,
        ...lesson.trapAlerts,
        ...lesson.comparisonTable.rows.flat(),
      ]
        .join(' ')
        .toLowerCase();
      return text.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Section Header & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-medium text-teal-700 dark:text-teal-400">
              طراحی‌شده برای تسلط از صفر مطلق · ۱۲ فصل طلایی پوشش‌دهنده ۱۰۰٪ سوالات · مجهز به Gemini 3.8 Flash TTS
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              درس‌نامه فشرده و رمزگردانی تصویری شب امتحان
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              اگر تا الان هیچ چیزی نخوانده‌ای، اصلاً نگران نباش! تمام ۱۷۵ سوال امتحانی که فرستادی حول این ۱۲ موضوع می‌چرخند. هر فصل را با «قانون ۵ ثانیه‌ای»، «داستان تصویرسازی ذهنی» و «روخوانی صوتی هوشمند» مرور کن و تیک تثبیت را بزن.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="جستجوی نام دارو یا بیماری در درس‌نامه"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی دارو (مثلاً: داکسی، کورتون، لیکوفار)..."
                className="w-full pr-10 pl-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white dark:focus:bg-slate-800 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Category Segmented Filter */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 dark:bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            همه ۱۲ فصل
          </button>
          {TOPIC_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-teal-700 dark:bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lessons List */}
      {filteredLessons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            هیچ فصلی با عبارت جستجوشده پیدا نشد.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            فیلتر دسته‌بندی یا کلمه جستجو را پاک کنید تا همه ۱۲ فصل نمایش داده شوند.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
          >
            نمایش همه فصل‌ها
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredLessons.map((lesson) => {
            const isMastered = masteredLessons.includes(lesson.id);
            const selectedQuickOption = quickCheckAnswers[lesson.id];
            const isQuickAnswered = selectedQuickOption !== undefined;
            const isQuickCorrect = selectedQuickOption === lesson.quickCheck.correctIndex;

            const narrationScript = `فصل ${lesson.number}: ${lesson.title}. قانون طلایی پنج ثانیه‌ای: ${lesson.goldenRule}. داستان تصویرسازی ذهنی: ${lesson.mnemonicStory}. تله‌های امتحانی مهم این فصل: ${lesson.trapAlerts.join(' . ')}`;

            return (
              <article
                key={lesson.id}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-6 sm:p-8 transition-colors ${
                  isMastered
                    ? 'border-teal-600 dark:border-teal-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Top Row: Editorial Number + Title + Mastery Button */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    {/* Unboxed Metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-semibold text-teal-700 dark:text-teal-400">
                        فصل {lesson.number}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{lesson.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        {lesson.examFrequency}
                      </span>
                      {isMastered && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            تثبیت‌شده در ذهن
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {lesson.number}. {lesson.title}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {lesson.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onJumpToCategoryQuestions(lesson.category)}
                      className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <span>تست‌های این مبحث</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleMasteredLesson(lesson.id)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        isMastered
                          ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                          : 'bg-slate-900 dark:bg-teal-600 text-white hover:bg-slate-800 dark:hover:bg-teal-500'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isMastered ? 'تثبیت شد (بلدم)' : 'ثبت یادگیری این فصل'}</span>
                    </button>
                  </div>
                </div>

                {/* Gemini 3.8 Flash TTS Player for this Crash Course Lesson */}
                <div className="pt-5">
                  <TtsAudioPlayer
                    lessonId={lesson.id}
                    lessonTitle={lesson.title}
                    narrationText={narrationScript}
                    compact={true}
                  />
                </div>

                {/* Golden Rule & Visual Story Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="lg:col-span-5 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 rounded-lg p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-300">
                      <Lightbulb className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                      <span>قانون طلایی ۵ ثانیه‌ای (رمز فوری امتحان)</span>
                    </div>
                    <p className="text-sm font-semibold text-teal-950 dark:text-teal-100 leading-relaxed">
                      {lesson.goldenRule}
                    </p>
                  </div>

                  <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-lg p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <BookOpen className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                      <span>داستان تصویرسازی ذهنی (چطور بدون حفظ کردن یادمان بماند؟)</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {lesson.mnemonicStory}
                    </p>
                  </div>
                </div>

                {/* Comparison Matrix Table */}
                <div className="py-6 border-b border-slate-100 dark:border-slate-800 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    جدول مقایسه‌ای و تفکیک داروهای این فصل
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full text-right border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                          {lesson.comparisonTable.headers.map((header, idx) => (
                            <th
                              key={idx}
                              className="py-3 px-4 font-bold text-xs whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {lesson.comparisonTable.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`py-3 px-4 leading-relaxed ${
                                  cIdx === 0
                                    ? 'font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Exam Trap Alerts */}
                <div className="py-6 border-b border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>تله‌های پرتکرار طراح سوال در این مبحث (مراقب این گزینه‌های انحرافی باشید!)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {lesson.trapAlerts.map((trap, tIdx) => (
                      <div
                        key={tIdx}
                        className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-lg p-4 text-xs text-slate-800 dark:text-amber-100 leading-relaxed"
                      >
                        {trap}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive 1-Question Lock-in Check */}
                <div className="pt-6 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <HelpCircle className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                      <span>مینی‌چالش تثبیت فوری در حافظه</span>
                    </div>
                    {isQuickAnswered && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          isQuickCorrect
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {isQuickCorrect ? (
                          <>
                            <Check className="w-4 h-4" />
                            پاسخ صحیح! کاملاً در ذهنت قفل شد
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            دوباره دقت کن! گزینه اول پاسخ صحیح است
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {lesson.quickCheck.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lesson.quickCheck.options.map((opt, oIdx) => {
                      const isSelected = selectedQuickOption === oIdx;
                      const isCorrectOption = oIdx === lesson.quickCheck.correctIndex;

                      let btnStyle =
                        'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700';
                      if (isQuickAnswered) {
                        if (isCorrectOption) {
                          btnStyle =
                            'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 font-semibold';
                        } else if (isSelected) {
                          btnStyle =
                            'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-950 dark:text-rose-100';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() =>
                            setQuickCheckAnswers((prev) => ({ ...prev, [lesson.id]: oIdx }))
                          }
                          className={`text-right p-3.5 rounded-lg border text-xs sm:text-sm transition-colors flex items-center justify-between gap-3 ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isQuickAnswered && isCorrectOption && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                          )}
                          {isQuickAnswered && isSelected && !isCorrectOption && (
                            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isQuickAnswered && (
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong className="text-slate-900 dark:text-slate-100">توضیح تثبیتی: </strong>
                      {lesson.quickCheck.feedback}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
