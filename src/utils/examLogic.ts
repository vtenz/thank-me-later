import { BookletId, ExamQuestion, TopicCategory, UserProgressState } from '../types/exam';

export interface QuestionFilterOptions {
  bookletId: BookletId | 'all';
  category: TopicCategory | 'all';
  statusFilter: 'all' | 'unanswered' | 'wrong' | 'bookmarked';
  searchQuery: string;
}

/**
 * Calculates pediatric acetaminophen (Parakid) drop dose based on baby's weight in kg.
 * Standard rule taught in Iranian pharmacy technician exams:
 * - Every 4 hours: 2 to 3 drops per kg of body weight (e.g., 5 kg -> 10 to 15 drops every 4 hours).
 * - Every 6 hours: ~1.5 to 2 drops per kg of body weight.
 */
export function calculatePediatricAcetaminophenDrops(weightKg: number): {
  minDrops4h: number;
  maxDrops4h: number;
  minDrops6h: number;
  maxDrops6h: number;
  mgPerDose: number;
  warningText: string;
} {
  const clampedWeight = Math.max(2, Math.min(20, Math.round(weightKg * 10) / 10));
  const minDrops4h = Math.round(clampedWeight * 2);
  const maxDrops4h = Math.round(clampedWeight * 3);
  const minDrops6h = Math.round(clampedWeight * 1.4);
  const maxDrops6h = Math.round(clampedWeight * 2);
  const mgPerDose = Math.round(clampedWeight * 12.5);

  const warningText =
    clampedWeight === 5
      ? 'سوال مستقیم آزمون: برای نوزاد ۵ کیلوگرمی، دوز استاندارد ۱۰ تا ۱۵ قطره هر ۴ ساعت است.'
      : 'فرمول طلایی آزمون: ۲ تا ۳ قطره به ازای هر کیلوگرم وزن بدن، هر ۴ ساعت.';

  return {
    minDrops4h,
    maxDrops4h,
    minDrops6h,
    maxDrops6h,
    mgPerDose,
    warningText,
  };
}

/**
 * Filters the exam questions based on booklet, category, user answer status, and search text.
 */
export function filterExamQuestions(
  questions: ExamQuestion[],
  options: QuestionFilterOptions,
  progress: UserProgressState
): ExamQuestion[] {
  const normalizedQuery = options.searchQuery.trim().toLowerCase();

  return questions.filter((q) => {
    if (options.bookletId !== 'all' && q.bookletId !== options.bookletId) {
      return false;
    }

    if (options.category !== 'all' && q.category !== options.category) {
      return false;
    }

    const answerRecord = progress.answeredQuestions[q.id];
    if (options.statusFilter === 'unanswered' && answerRecord !== undefined) {
      return false;
    }
    if (options.statusFilter === 'wrong' && (!answerRecord || answerRecord.isCorrect)) {
      return false;
    }
    if (options.statusFilter === 'bookmarked' && !progress.bookmarkedQuestions.includes(q.id)) {
      return false;
    }

    if (normalizedQuery.length > 0) {
      const haystacks = [
        q.question,
        q.mnemonic,
        q.explanation,
        q.keyTakeaway,
        q.category,
        ...q.options,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystacks.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Computes overall exam readiness and statistics from user progress.
 */
export function computeStudyStats(
  questions: ExamQuestion[],
  totalLessonsCount: number,
  totalScenariosCount: number,
  progress: UserProgressState
): {
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  accuracyPercent: number;
  masteredLessonsCount: number;
  completedScenariosCount: number;
  overallReadinessPercent: number;
} {
  const totalQuestions = questions.length;
  let answeredCount = 0;
  let correctCount = 0;
  let wrongCount = 0;

  for (const q of questions) {
    const rec = progress.answeredQuestions[q.id];
    if (rec) {
      answeredCount += 1;
      if (rec.isCorrect) {
        correctCount += 1;
      } else {
        wrongCount += 1;
      }
    }
  }

  const accuracyPercent = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const masteredLessonsCount = progress.masteredLessons.length;
  const completedScenariosCount = progress.completedScenarios.length;

  // Weighted readiness: 50% questions correct ratio, 30% lessons mastered, 20% scenarios completed
  const questionScore = totalQuestions > 0 ? (correctCount / totalQuestions) * 50 : 0;
  const lessonScore = totalLessonsCount > 0 ? (Math.min(masteredLessonsCount, totalLessonsCount) / totalLessonsCount) * 30 : 0;
  const scenarioScore = totalScenariosCount > 0 ? (Math.min(completedScenariosCount, totalScenariosCount) / totalScenariosCount) * 20 : 0;

  const overallReadinessPercent = Math.min(100, Math.round(questionScore + lessonScore + scenarioScore));

  return {
    totalQuestions,
    answeredCount,
    correctCount,
    wrongCount,
    accuracyPercent,
    masteredLessonsCount,
    completedScenariosCount,
    overallReadinessPercent,
  };
}

/**
 * Promotes or resets a Leitner card box level (1 -> 2 -> 3 -> 4 on success; back to 1 on review needed).
 */
export function calculateNextLeitnerBox(currentBox: 1 | 2 | 3 | 4 | undefined, remembered: boolean): 1 | 2 | 3 | 4 {
  const box = currentBox ?? 1;
  if (!remembered) {
    return 1;
  }
  if (box === 1) return 2;
  if (box === 2) return 3;
  return 4;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

