import React, { useState } from 'react';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { BookletId } from '../types/exam';
import { toPersianDigits } from '../utils/examLogic';

interface PdfReferenceViewProps {
  onOpenDigitalBooklet: (bookletId: BookletId) => void;
}

const ATTACHED_PDFS: {
  id: string;
  title: string;
  subtitle: string;
  pagesCount: number;
  url: string;
  mappedBookletId: BookletId;
  mappedBookletLabel: string;
}[] = [
  {
    id: 'pdf-1',
    title: 'جزوه تایپی جامع ۸۱ سوالی (کلیددار)',
    subtitle: 'شامل سوالات ۱ تا ۸۱ با علامت‌گذاری پاسخ‌های صحیح',
    pagesCount: 11,
    url: '/assets/aistudio/1__1__18c7125f.pdf',
    mappedBookletId: 'booklet-1',
    mappedBookletLabel: 'حل تعاملی در دفترچه ۱ (۸۱ سوال)',
  },
  {
    id: 'pdf-2',
    title: 'جزوه تایپی ۳۷ سوالی (کلیددار)',
    subtitle: 'شامل سوالات ۱ تا ۳۷ (شوره سر، شیرخشک AR، BID، وارفارین و...)',
    pagesCount: 5,
    url: '/assets/aistudio/4_631a6d97.pdf',
    mappedBookletId: 'booklet-2',
    mappedBookletLabel: 'حل تعاملی در دفترچه ۲ (۳۷ سوال)',
  },
  {
    id: 'pdf-3',
    title: 'جزوه تایپی ۳۴ سوالی (کلیددار)',
    subtitle: 'شامل سوالات ۱ تا ۳۴ (سرم‌ها، قرص LD، ملین‌های بارداری، تاوانکس و...)',
    pagesCount: 4,
    url: '/assets/aistudio/2_bc8bb1b0.pdf',
    mappedBookletId: 'booklet-3',
    mappedBookletLabel: 'حل تعاملی در دفترچه ۳ (۳۴ سوال)',
  },
  {
    id: 'pdf-4',
    title: 'جزوه تایپی ۲۳ سوالی (کلیددار)',
    subtitle: 'شامل سوالات ۱ تا ۲۳ (میگرن، مخدرها، دپومدرول، رستانکس و...)',
    pagesCount: 3,
    url: '/assets/aistudio/3_2c7665ed.pdf',
    mappedBookletId: 'booklet-4',
    mappedBookletLabel: 'حل تعاملی در دفترچه ۴ (۲۳ سوال)',
  },
  {
    id: 'pdf-5',
    title: 'جزوه دست‌نویس در سررسید (سوالات ۴۱ تا ۸۰)',
    subtitle: 'نسخه دست‌نویس منطبق با نیمه دوم دفترچه جامع ۸۱ سوالی',
    pagesCount: 6,
    url: '/assets/aistudio/_____________-___60894460.pdf',
    mappedBookletId: 'booklet-1',
    mappedBookletLabel: 'حل تعاملی در دفترچه ۱',
  },
  {
    id: 'pdf-6',
    title: 'فایل ترکیبی برگه‌های امتحانی و دست‌نویس (۱۱ صفحه)',
    subtitle: 'شامل برگه‌های حل‌شده دفترچه‌های ۳۴ سوالی، ۲۳ سوالی و ۸۱ سوالی',
    pagesCount: 11,
    url: '/assets/aistudio/_____________467b4662.pdf',
    mappedBookletId: 'booklet-3',
    mappedBookletLabel: 'حل تعاملی در دفترچه ۳ و ۴',
  },
];

export const PdfReferenceView: React.FC<PdfReferenceViewProps> = ({
  onOpenDigitalBooklet,
}) => {
  const [selectedPdfIdx, setSelectedPdfIdx] = useState(0);
  const activePdf = ATTACHED_PDFS[selectedPdfIdx];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 transition-colors">
        <div className="space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="text-xs font-medium text-teal-700 dark:text-teal-400">
            آرشیو کامل برگه‌های اصلی ارسالی شما · ۶ فایل PDF
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            مشاهده‌گر جزوه‌های اصلی و تطبیق با بانک سوالات
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            تمام ۶ فایل PDF ارسالی شما کلمه به کلمه تایپ، تصحیح و رمزگردانی شده‌اند. در اینجا می‌توانید اصل برگه‌ها را نیز مشاهده یا دانلود کنید.
          </p>
        </div>

        {/* 6 PDF Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ATTACHED_PDFS.map((pdf, idx) => {
            const isSelected = idx === selectedPdfIdx;
            return (
              <button
                key={pdf.id}
                type="button"
                onClick={() => setSelectedPdfIdx(idx)}
                className={`text-right p-4 rounded-xl border transition-colors flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-teal-600 border-slate-900 dark:border-teal-500 text-white'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold">{pdf.title}</span>
                  <span
                    className={`text-xs font-mono tabular-nums shrink-0 ${
                      isSelected ? 'text-teal-200' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {toPersianDigits(pdf.pagesCount)} صفحه
                  </span>
                </div>
                <p
                  className={`text-[11px] leading-relaxed ${
                    isSelected ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {pdf.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active PDF Toolbar & Viewer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {activePdf.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activePdf.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenDigitalBooklet(activePdf.mappedBookletId)}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>{activePdf.mappedBookletLabel}</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <a
              href={activePdf.url}
              download
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود PDF اصلی</span>
            </a>
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 h-[680px]">
          <iframe
            title={activePdf.title}
            src={activePdf.url}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
