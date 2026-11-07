import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePediatricAcetaminophenDrops,
  filterExamQuestions,
  computeStudyStats,
  calculateNextLeitnerBox,
} from './examLogic';
import { ALL_EXAM_QUESTIONS } from '../data/allQuestions';
import { CONCEPTUAL_LESSONS } from '../data/conceptualCourseData';
import { CINEMA_EPISODES } from '../data/cinemaEpisodesData';
import { UserProgressState } from '../types/exam';

test('ALL_EXAM_QUESTIONS contains all 175 questions with valid options and mnemonics', () => {
  assert.equal(ALL_EXAM_QUESTIONS.length, 175);
  for (const q of ALL_EXAM_QUESTIONS) {
    assert.ok(q.options.length >= 4, `Question ${q.id} should have at least 4 options`);
    assert.ok(
      q.correctIndex >= 0 && q.correctIndex < q.options.length,
      `Question ${q.id} has invalid correctIndex ${q.correctIndex}`
    );
    assert.ok(q.mnemonic.length > 5, `Question ${q.id} should have a mnemonic`);
    assert.ok(q.explanation.length > 10, `Question ${q.id} should have an explanation`);
  }
});

test('CINEMA_EPISODES contains 12 zero-effort audio-visual masterclass episodes covering all exam topics', () => {
  assert.equal(CINEMA_EPISODES.length, 12);
  for (const ep of CINEMA_EPISODES) {
    assert.equal(ep.visualScenes.length, 4, `Episode ${ep.id} should have 4 visual scenes`);
    assert.ok(ep.colloquialAudioScript.length > 100, `Episode ${ep.id} should have colloquial audio script`);
    assert.ok(ep.podcastDialogue.length >= 4, `Episode ${ep.id} should have podcast dialogue`);
    assert.ok(ep.rapidFireQuestions.length >= 5, `Episode ${ep.id} should have rapid-fire questions`);
  }
});

test('CONCEPTUAL_LESSONS contains 8 deep conceptual lessons with TTS narration and podcast dialogues', () => {
  assert.equal(CONCEPTUAL_LESSONS.length, 8);
  for (const lesson of CONCEPTUAL_LESSONS) {
    assert.ok(lesson.ttsNarrationText.length > 50, `Lesson ${lesson.id} should have TTS narration text`);
    assert.ok(lesson.podcastDialogue.length >= 2, `Lesson ${lesson.id} should have podcast dialogue turns`);
    assert.equal(lesson.causalChain.length, 4, `Lesson ${lesson.id} should have 4 causal chain steps`);
    assert.ok(lesson.clinicalWhyList.length >= 2, `Lesson ${lesson.id} should have clinical why items`);
    for (const w of lesson.clinicalWhyList) {
      assert.ok(w.whyQuestion.length > 5 && w.scientificAnswer.length > 5);
    }
  }
});

test('calculatePediatricAcetaminophenDrops calculates 10-15 drops for 5kg infant', () => {
  const res = calculatePediatricAcetaminophenDrops(5);
  assert.equal(res.minDrops4h, 10);
  assert.equal(res.maxDrops4h, 15);
});

test('filterExamQuestions filters by booklet and search query', () => {
  const emptyProgress: UserProgressState = {
    answeredQuestions: {},
    bookmarkedQuestions: ['b1-q1'],
    masteredLessons: [],
    leitnerBoxes: {},
    completedScenarios: [],
  };

  const b1 = filterExamQuestions(
    ALL_EXAM_QUESTIONS,
    { bookletId: 'booklet-1', category: 'all', statusFilter: 'all', searchQuery: '' },
    emptyProgress
  );
  assert.equal(b1.length, 81);

  const bookmarked = filterExamQuestions(
    ALL_EXAM_QUESTIONS,
    { bookletId: 'all', category: 'all', statusFilter: 'bookmarked', searchQuery: '' },
    emptyProgress
  );
  assert.equal(bookmarked.length, 1);
  assert.equal(bookmarked[0].id, 'b1-q1');
});

test('computeStudyStats and calculateNextLeitnerBox work accurately', () => {
  const progress: UserProgressState = {
    answeredQuestions: {
      'b1-q1': { selectedIndex: 1, isCorrect: true, timestamp: 1 },
      'b1-q2': { selectedIndex: 2, isCorrect: false, timestamp: 2 },
    },
    bookmarkedQuestions: [],
    masteredLessons: ['lesson-1', 'lesson-2'],
    leitnerBoxes: {},
    completedScenarios: ['scen-1'],
  };

  const stats = computeStudyStats(ALL_EXAM_QUESTIONS, 10, 10, progress);
  assert.equal(stats.answeredCount, 2);
  assert.equal(stats.correctCount, 1);
  assert.equal(stats.wrongCount, 1);
  assert.equal(stats.accuracyPercent, 50);

  assert.equal(calculateNextLeitnerBox(1, true), 2);
  assert.equal(calculateNextLeitnerBox(3, true), 4);
  assert.equal(calculateNextLeitnerBox(3, false), 1);
});
