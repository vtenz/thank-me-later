import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  GitBranch,
  HelpCircle,
  MessageSquare,
  Search,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { CONCEPTUAL_LESSONS } from '../data/conceptualCourseData';
import { TOPIC_CATEGORIES } from '../data/allQuestions';
import { TopicCategory } from '../types/exam';
import { TtsAudioPlayer } from './TtsAudioPlayer';
import { toPersianDigits } from '../utils/examLogic';

interface ConceptualCourseViewProps {
  masteredConceptualIds: string[];
  onToggleMasteredConceptual: (id: string) => void;
  onJumpToCategoryQuestions: (category: TopicCategory) => void;
}

export const ConceptualCourseView: React.FC<ConceptualCourseViewProps> = ({
  masteredConceptualIds,
  onToggleMasteredConceptual,
  onJumpToCategoryQuestions,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});

  const filteredLessons = CONCEPTUAL_LESSONS.filter((lesson) => {
    if (selectedCategory !== 'all' && lesson.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      const text = [
        lesson.title,
        lesson.subtitle,
        lesson.coreQuestion,
        lesson.deepMechanism,
        ...lesson.causalChain.flatMap((c) => [c.stepTitle, c.stepDetail]),
        ...lesson.clinicalWhyList.flatMap((w) => [w.whyQuestion, w.scientificAnswer]),
      ]
        .join(' ')
        .toLowerCase();
      return text.includes(q);
    }
    return true;
  });

  const toggleTranscript = (id: string) => {
    setExpandedTranscripts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-400">
              <Brain className="w-4 h-4" />
              <span>یادگیری عمیق و ریشه‌ای مکانیسم‌ها · مجهز به پادکست صوتی Gemini 3.8 Flash TTS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              درس‌نامه مفهومی و فلسفه اثر داروها در بدن
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              اگر دوست داری به جای حفظ کردن طوطی‌وار، <strong className="text-slate-900 dark:text-slate-200">«چرایی علمی»</strong> پشت هر دارو را بفهمی (که چرا تامسولوسین سرگیجه می‌دهد، چرا استاتین شب خورده می‌شود یا چرا لووتیروکسین ناشتاست)، این ۸ درس‌نامه مفهومی را بخوان یا با صدای استودیویی <strong className="font-mono text-teal-700 dark:text-teal-400">Gemini 3.8 Flash TTS</strong> گوش بده.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="جستجو در درس‌نامه مفهومی"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی مفهوم (مثلاً: گیرنده آلفا، سیتوکروم، رینگر)..."
                className="w-full pr-10 pl-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 dark:bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            همه ۸ درس‌نامه مفهومی ({toPersianDigits(CONCEPTUAL_LESSONS.length)})
          </button>
          {TOPIC_CATEGORIES.map((cat) => {
            const hasLesson = CONCEPTUAL_LESSONS.some((l) => l.category === cat);
            if (!hasLesson) return null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-teal-700 dark:bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conceptual Lessons List */}
      {filteredLessons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            هیچ درس‌نامه مفهومی با این عبارت پیدا نشد.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors"
          >
            نمایش همه ۸ فصل مفهومی
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredLessons.map((lesson) => {
            const isMastered = masteredConceptualIds.includes(lesson.id);
            const showTranscript = Boolean(expandedTranscripts[lesson.id]);

            return (
              <article
                key={lesson.id}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-6 sm:p-8 space-y-6 transition-colors ${
                  isMastered
                    ? 'border-teal-600 dark:border-teal-500'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono font-bold text-teal-700 dark:text-teal-400">
                        فصل مفهومی {lesson.number}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{lesson.category}</span>
                      {isMastered && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            درک عمیق ثبت شد
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
                      <span>تست‌های مرتبط</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleMasteredConceptual(lesson.id)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                        isMastered
                          ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                          : 'bg-slate-900 dark:bg-teal-600 text-white hover:bg-slate-800 dark:hover:bg-teal-500'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isMastered ? 'کاملاً فهمیدم' : 'ثبت درک مفهومی'}</span>
                    </button>
                  </div>
                </div>

                {/* Gemini 3.8 Flash TTS Studio Audio Bar */}
                <TtsAudioPlayer
                  lessonId={lesson.id}
                  lessonTitle={lesson.title}
                  narrationText={lesson.ttsNarrationText}
                  podcastDialogue={lesson.podcastDialogue}
                />

                {/* Core Question & Deep Mechanism */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300">
                      <HelpCircle className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                      <span>پرسش بنیادین این فصل (چرا این اتفاق می‌افتد؟)</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {lesson.coreQuestion}
                    </p>
                  </div>

                  <div className="lg:col-span-7 bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 rounded-xl p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-300">
                      <Sparkles className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                      <span>تشریح مکانیسم به زبان ساده و علمی</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {lesson.deepMechanism}
                    </p>
                  </div>
                </div>

                {/* 4-Step Causal Chain (From Molecule to Clinical Exam Answer) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <GitBranch className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                    <span>زنجیره علت و معلول (از ورود دارو به بدن تا پاسخ سوال امتحان)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {lesson.causalChain.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-2 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                            گام {toPersianDigits(sIdx + 1)} · {step.stepTitle}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {step.stepDetail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical "Why" Dissection Cards */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    کالبدشکافی «چراهای بالینی» در سوالات آزمون
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {lesson.clinicalWhyList.map((item, wIdx) => (
                      <div
                        key={wIdx}
                        className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-2"
                      >
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          ❓ {item.whyQuestion}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <strong className="text-teal-800 dark:text-teal-400">پاسخ علمی: </strong>
                          {item.scientificAnswer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expandable Podcast Dialogue Script */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => toggleTranscript(lesson.id)}
                    className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>
                      {showTranscript
                        ? 'بستن متن گفتگوی استاد و دانشجو'
                        : 'مشاهده متن کامل پادکست دونفره (استاد و دانشجو)'}
                    </span>
                  </button>

                  {showTranscript && (
                    <div className="mt-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                      {lesson.podcastDialogue.map((turn, tIdx) => (
                        <div key={tIdx} className="text-xs leading-relaxed">
                          <strong
                            className={
                              turn.speaker === 'Ostad'
                                ? 'text-teal-800 dark:text-teal-400 font-bold ml-1.5'
                                : 'text-amber-800 dark:text-amber-400 font-bold ml-1.5'
                            }
                          >
                            {turn.speaker === 'Ostad' ? 'استاد فارماکولوژی:' : 'دانشجو:'}
                          </strong>
                          <span className="text-slate-700 dark:text-slate-200">
                            {turn.text}
                          </span>
                        </div>
                      ))}
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
