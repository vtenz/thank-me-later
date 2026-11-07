import React, { useState, useMemo } from 'react';
import {
  RotateCw,
  CheckCircle2,
  XCircle,
  Layers,
  Lightbulb,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LEITNER_CARDS } from '../data/simulatorAndLeitnerData';
import { ALL_EXAM_QUESTIONS } from '../data/allQuestions';
import { LeitnerCard, UserProgressState } from '../types/exam';
import { toPersianDigits } from '../utils/examLogic';

interface LeitnerFlashcardsViewProps {
  progress: UserProgressState;
  onGradeCard: (cardId: string, remembered: boolean) => void;
}

const BOX_METADATA: { box: 1 | 2 | 3 | 4 | 'all'; title: string; subtitle: string }[] = [
  { box: 'all', title: 'همه کارت‌ها', subtitle: 'کل کارت‌های جعبه لایتنر' },
  { box: 1, title: 'خانه ۱: مرور فوری', subtitle: 'کارت‌های جدید یا نیازمند تکرار' },
  { box: 2, title: 'خانه ۲: در حال تثبیت', subtitle: '۱ بار پاسخ صحیح داده‌اید' },
  { box: 3, title: 'خانه ۳: تسلط بالا', subtitle: '۲ بار پاسخ صحیح متوالی' },
  { box: 4, title: 'خانه ۴: قفل در حافظه', subtitle: 'کاملاً حفظ و آماده امتحان' },
];

export const LeitnerFlashcardsView: React.FC<LeitnerFlashcardsViewProps> = ({
  progress,
  onGradeCard,
}) => {
  const [selectedBox, setSelectedBox] = useState<1 | 2 | 3 | 4 | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const allCards: LeitnerCard[] = useMemo(() => {
    const bookmarkedAsCards: LeitnerCard[] = progress.bookmarkedQuestions
      .map((qId) => ALL_EXAM_QUESTIONS.find((q) => q.id === qId))
      .filter((q): q is NonNullable<typeof q> => Boolean(q))
      .map((q) => ({
        id: `bm-${q.id}`,
        category: q.category,
        frontQuestion: q.question,
        backAnswer: q.options[q.correctIndex],
        mnemonicHook: q.mnemonic,
        examTrap: q.explanation,
      }));

    return [...LEITNER_CARDS, ...bookmarkedAsCards];
  }, [progress.bookmarkedQuestions]);

  const filteredCards = useMemo(() => {
    if (selectedBox === 'all') return allCards;
    return allCards.filter((c) => (progress.leitnerBoxes[c.id] ?? 1) === selectedBox);
  }, [allCards, selectedBox, progress.leitnerBoxes]);

  const safeIndex =
    filteredCards.length > 0 ? Math.min(currentIndex, filteredCards.length - 1) : 0;
  const activeCard = filteredCards[safeIndex];

  const handleGrade = (remembered: boolean) => {
    if (!activeCard) return;
    onGradeCard(activeCard.id, remembered);
    setIsFlipped(false);
    if (safeIndex < filteredCards.length - 1) {
      setCurrentIndex(safeIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Box Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 transition-colors">
        <div className="space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="text-xs font-medium text-teal-700 dark:text-teal-400">
            سیستم تکرار با فاصله (Spaced Repetition) · روش علمی ضد فراموشی
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            جعبه لایتنر ۴ مرحله‌ای و فلش‌کارت‌های شب امتحان
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            روی کارت کلیک کنید تا برگردد؛ اگر پاسخ و رمز را بلد بودید دکمه «بلد بودم (انتقال به خانه بعد)» و اگر شک داشتید «نیاز به مرور مجدد» را بزنید.
          </p>
        </div>

        {/* 4 Leitner Boxes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {BOX_METADATA.map((item) => {
            const count =
              item.box === 'all'
                ? allCards.length
                : allCards.filter((c) => (progress.leitnerBoxes[c.id] ?? 1) === item.box)
                    .length;
            const isSelected = selectedBox === item.box;

            return (
              <button
                key={String(item.box)}
                type="button"
                onClick={() => {
                  setSelectedBox(item.box);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={`text-right p-3.5 rounded-lg border transition-colors flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-teal-600 border-slate-900 dark:border-teal-500 text-white'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold">{item.title}</span>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      isSelected ? 'text-teal-200' : 'text-teal-700 dark:text-teal-400'
                    }`}
                  >
                    {toPersianDigits(count)} کارت
                  </span>
                </div>
                <div
                  className={`text-[11px] ${
                    isSelected ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Flashcard Stage */}
      {!activeCard ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center space-y-3">
          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            در حال حاضر هیچ کارتی در این خانه از جعبه لایتنر وجود ندارد.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            می‌توانید به «خانه ۱» یا «همه کارت‌ها» بروید و کارت‌ها را مرور کنید.
          </p>
          <button
            type="button"
            onClick={() => setSelectedBox('all')}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
          >
            نمایش همه کارت‌ها ({toPersianDigits(allCards.length)})
          </button>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Card Navigation Bar */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                کارت {toPersianDigits(safeIndex + 1)} از {toPersianDigits(filteredCards.length)}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeCard.category}</span>
              <span aria-hidden="true">·</span>
              <span className="text-teal-700 dark:text-teal-400 font-semibold">
                خانه فعلی: {toPersianDigits(progress.leitnerBoxes[activeCard.id] ?? 1)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="کارت قبلی"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredCards.length - 1
                  );
                }}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="کارت بعدی"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((prev) =>
                    prev < filteredCards.length - 1 ? prev + 1 : 0
                  );
                }}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Flashcard Surface */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-10 space-y-6 transition-colors">
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                سوال روی کارت:
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                {activeCard.frontQuestion}
              </h2>
            </div>

            {!isFlipped ? (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center py-8 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  اول جواب را در ذهنت بگو، سپس دکمه زیر را بزن تا پشت کارت و رمز طلایی را ببینی:
                </p>
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="px-6 py-3 text-sm font-bold text-white bg-slate-900 dark:bg-teal-600 rounded-xl hover:bg-slate-800 dark:hover:bg-teal-500 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>برگرداندن کارت و مشاهده پاسخ</span>
                </button>
              </div>
            ) : (
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-5">
                <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl p-5 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    پاسخ صحیح در آزمون:
                  </div>
                  <p className="text-base sm:text-lg font-bold text-emerald-950 dark:text-emerald-100 leading-relaxed">
                    {activeCard.backAnswer}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-xl p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-300">
                      <Lightbulb className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                      <span>رمز طلایی قفل در حافظه:</span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-teal-950 dark:text-teal-100 leading-relaxed">
                      {activeCard.mnemonicHook}
                    </p>
                  </div>

                  <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span>تله امتحانی مرتبط:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 leading-relaxed">
                      {activeCard.examTrap}
                    </p>
                  </div>
                </div>

                {/* Self-Grading Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleGrade(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-xs sm:text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <XCircle className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                    <span>شک داشتم / برگشت به خانه ۱</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGrade(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-bold hover:bg-emerald-800 transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>کاملاً بلد بودم (ارتقا به خانه بالاتر)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
