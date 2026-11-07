import { BookletId, ExamQuestion, TopicCategory } from '../types/exam';
import { BOOKLET_1_QUESTIONS } from './questionsBooklet1';
import { BOOKLETS_2_3_4_QUESTIONS } from './questionsBooklets234';

export const ALL_EXAM_QUESTIONS: ExamQuestion[] = [
  ...BOOKLET_1_QUESTIONS,
  ...BOOKLETS_2_3_4_QUESTIONS,
];

export const BOOKLET_METADATA: {
  id: BookletId | 'all';
  title: string;
  subtitle: string;
  questionCount: number;
  pdfFiles: { label: string; url: string }[];
}[] = [
  {
    id: 'all',
    title: 'کل بانک سوالات آزمون (۱۷۵ سوال)',
    subtitle: 'پوشش ۱۰۰٪ تمام ۶ فایل PDF ارسالی (تایپی و دست‌نویس)',
    questionCount: 175,
    pdfFiles: [],
  },
  {
    id: 'booklet-1',
    title: 'دفترچه ۱: آزمون جامع ۸۱ سوالی',
    subtitle: 'فایل 1__1__18c7125f.pdf + جزوه دست‌نویس سوالات ۴۱ تا ۸۰',
    questionCount: 81,
    pdfFiles: [
      { label: 'فایل تایپی ۸۱ سوالی (۱۱ صفحه)', url: '/assets/aistudio/1__1__18c7125f.pdf' },
      { label: 'جزوه دست‌نویس سوالات ۴۱ تا ۸۰', url: '/assets/aistudio/_____________-___60894460.pdf' },
    ],
  },
  {
    id: 'booklet-2',
    title: 'دفترچه ۲: آزمون ۳۷ سوالی',
    subtitle: 'فایل 4_631a6d97.pdf (۵ صفحه کلیددار)',
    questionCount: 37,
    pdfFiles: [{ label: 'فایل تایپی ۳۷ سوالی (۵ صفحه)', url: '/assets/aistudio/4_631a6d97.pdf' }],
  },
  {
    id: 'booklet-3',
    title: 'دفترچه ۳: آزمون ۳۴ سوالی',
    subtitle: 'فایل 2_bc8bb1b0.pdf + برگه حل‌شده در فایل جامع دست‌نویس',
    questionCount: 34,
    pdfFiles: [
      { label: 'فایل تایپی ۳۴ سوالی (۴ صفحه)', url: '/assets/aistudio/2_bc8bb1b0.pdf' },
      { label: 'فایل ترکیبی دست‌نویس و چاپی', url: '/assets/aistudio/_____________467b4662.pdf' },
    ],
  },
  {
    id: 'booklet-4',
    title: 'دفترچه ۴: آزمون ۲۳ سوالی',
    subtitle: 'فایل 3_2c7665ed.pdf (۳ صفحه کلیددار)',
    questionCount: 23,
    pdfFiles: [{ label: 'فایل تایپی ۲۳ سوالی (۳ صفحه)', url: '/assets/aistudio/3_2c7665ed.pdf' }],
  },
];

export const TOPIC_CATEGORIES: TopicCategory[] = [
  'مسکن‌ها و ضدالتهاب‌ها',
  'آنتی‌بیوتیک‌ها و عفونی',
  'گوارش، اسهال و یبوست',
  'دیابت، تیروئید و چربی',
  'قلب، فشار خون و سرم‌ها',
  'اعصاب، خواب و میگرن',
  'پوست، مو، چشم و گوش',
  'بارداری، کودکان و شیرخشک',
  'نسخه‌خوانی، اشکال دارویی و مکمل‌ها',
];
