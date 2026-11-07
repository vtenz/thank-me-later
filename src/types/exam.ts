export type TopicCategory =
  | 'مسکن‌ها و ضدالتهاب‌ها'
  | 'آنتی‌بیوتیک‌ها و عفونی'
  | 'گوارش، اسهال و یبوست'
  | 'دیابت، تیروئید و چربی'
  | 'قلب، فشار خون و سرم‌ها'
  | 'اعصاب، خواب و میگرن'
  | 'پوست، مو، چشم و گوش'
  | 'بارداری، کودکان و شیرخشک'
  | 'نسخه‌خوانی، اشکال دارویی و مکمل‌ها';

export type BookletId = 'booklet-1' | 'booklet-2' | 'booklet-3' | 'booklet-4';

export interface ExamQuestion {
  id: string;
  bookletId: BookletId;
  questionNumber: number;
  category: TopicCategory;
  question: string;
  options: string[];
  correctIndex: number;
  mnemonic: string;
  explanation: string;
  keyTakeaway: string;
}

export interface CrashCourseLesson {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: TopicCategory;
  examFrequency: string;
  goldenRule: string;
  mnemonicStory: string;
  comparisonTable: {
    headers: string[];
    rows: string[][];
  };
  trapAlerts: string[];
  quickCheck: {
    question: string;
    options: string[];
    correctIndex: number;
    feedback: string;
  };
}

export interface PatientScenario {
  id: string;
  patientName: string;
  patientAge: string;
  avatarLabel: string;
  chiefComplaint: string;
  patientHistory: string;
  questionPrompt: string;
  choices: {
    label: string;
    isCorrect: boolean;
    clinicalFeedback: string;
  }[];
  goldenPearl: string;
  relatedQuestionIds: string[];
}

export interface LeitnerCard {
  id: string;
  category: TopicCategory;
  frontQuestion: string;
  backAnswer: string;
  mnemonicHook: string;
  examTrap: string;
}

export interface ConceptualLesson {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: TopicCategory;
  coreQuestion: string;
  deepMechanism: string;
  causalChain: {
    stepTitle: string;
    stepDetail: string;
  }[];
  clinicalWhyList: {
    whyQuestion: string;
    scientificAnswer: string;
  }[];
  ttsNarrationText: string;
  podcastDialogue: {
    speaker: 'Ostad' | 'Daneshjoo';
    text: string;
  }[];
}

export interface UserProgressState {
  answeredQuestions: Record<string, { selectedIndex: number; isCorrect: boolean; timestamp: number }>;
  bookmarkedQuestions: string[];
  masteredLessons: string[];
  masteredConceptualIds?: string[];
  watchedCinemaEpisodes?: string[];
  leitnerBoxes: Record<string, 1 | 2 | 3 | 4>; // Box 1 (daily) to Box 4 (mastered)
  completedScenarios: string[];
}
