import React, { useState } from 'react';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Calculator,
  FileText,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Syringe,
} from 'lucide-react';
import { PATIENT_SCENARIOS } from '../data/simulatorAndLeitnerData';
import { calculatePediatricAcetaminophenDrops, toPersianDigits } from '../utils/examLogic';

interface PharmacySimulatorViewProps {
  completedScenarios: string[];
  onCompleteScenario: (scenarioId: string) => void;
}

const PRESCRIPTION_DECODER_ITEMS = [
  {
    code: 'Cap SR',
    title: 'کپسول پیوسته‌رهش (Sustained Release)',
    category: 'شکل دارویی خوراکی',
    absorptionSpeed: 'آزادسازی تدریجی و طولانی‌مدت',
    examRule: 'هرگز نباید خرد، جویده یا باز شود! (گزینه الف و ب در امتحان صحیح است).',
    dangerNote: 'خرد کردن آن کل دوز دارو را یکجا آزاد کرده و مسمومیت شدید ایجاد می‌کند.',
  },
  {
    code: 'IV',
    title: 'تزریق وریدی / داخل رگ (Intravenous)',
    category: 'روش تزریق',
    absorptionSpeed: '۱۰۰٪ فوری (سریع‌ترین جذب)',
    examRule: 'بیشترین جذب و بیشترین احتمال ایجاد عارضه ناگهانی را در بین تزریقات دارد.',
    dangerNote: 'سرم رینگر (حاوی کلسیم) هرگز نباید با سفتریاکسون وریدی مخلوط شود!',
  },
  {
    code: 'Susp',
    title: 'سوسپانسیون خوراکی (Suspension)',
    category: 'شکل دارویی مایع',
    absorptionSpeed: 'معمولی (نیازمند همگن‌سازی)',
    examRule: 'برچسب «قبل از مصرف به خوبی تکان دهید» مخصوص سوسپانسیون است.',
    dangerNote: 'ذرات موثره دارو در ته ظرف ته‌نشین می‌شوند و بدون تکان دادن دوز دارو خطا می‌خورد.',
  },
  {
    code: 'Supp',
    title: 'شیاف (Suppository)',
    category: 'شکل دارویی مقعدی/واژینال',
    absorptionSpeed: 'سریع از مخاط (مناسب کودکِ دارای استفراغ)',
    examRule: 'شیاف مناسب تب اطفال = استامینوفن ۱۲۵ | شیاف بیزاکودیل ۱۰ برای کودکان مناسب نیست.',
    dangerNote: 'شیاف دیکلوفناک و آسپرین در آبله‌مرغان کودکان استفاده نمی‌شود.',
  },
  {
    code: 'BID',
    title: 'دو بار در روز (Bis in die / هر ۱۲ ساعت)',
    category: 'دستور مصرف نسخه',
    absorptionSpeed: 'فاصله دوز ۱۲ ساعته',
    examRule: 'BID = دو بار در روز | QD = یک بار در روز | TID = سه بار در روز | QID = چهار بار در روز.',
    dangerNote: 'Bi یعنی ۲ (مثل دوچرخه Bicycle) -> دو بار در شبانه‌روز.',
  },
  {
    code: 'Ophthalmic Oint',
    title: 'پماد چشمی (Ophthalmic Ointment)',
    category: 'فرآورده استریل چشمی',
    absorptionSpeed: 'ماندگاری بالا روی سطح چشم (معمولاً شب‌ها)',
    examRule: 'Ophthalmic Oint = پماد چشمی | Ophthalmic Drop = قطره چشمی.',
    dangerNote: 'قطره چشمی آرتیپیک ادونس فاقد پرزرواتیو (نگه‌دارنده) است.',
  },
  {
    code: 'Nasal Spray & Neb',
    title: 'اسپری بینی و محلول نبولایزر',
    category: 'اشکال دارویی تنفسی',
    absorptionSpeed: 'جذب موضعی سریع در مجاری تنفسی',
    examRule: 'هر دو نماد Nasal Spray و Neb نشانگر اشکال تنفسی هستند (گزینه الف و ب).',
    dangerNote: 'اسپری سالبوتامول برای حمله حاد آسم و فلوتیکازون برای کنترل طولانی‌مدت است.',
  },
];

export const PharmacySimulatorView: React.FC<PharmacySimulatorViewProps> = ({
  completedScenarios,
  onCompleteScenario,
}) => {
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, number>>({});
  const [babyWeightKg, setBabyWeightKg] = useState<number>(5);
  const [selectedCodeIdx, setSelectedCodeIdx] = useState<number>(0);

  const currentScenario = PATIENT_SCENARIOS[activeScenarioIdx];
  const selectedChoiceIdx = selectedChoices[currentScenario.id];
  const isScenarioAnswered = selectedChoiceIdx !== undefined;
  const dropCalculation = calculatePediatricAcetaminophenDrops(babyWeightKg);
  const activeDecoder = PRESCRIPTION_DECODER_ITEMS[selectedCodeIdx];

  const handleSelectChoice = (cIdx: number) => {
    setSelectedChoices((prev) => ({ ...prev, [currentScenario.id]: cIdx }));
    if (currentScenario.choices[cIdx].isCorrect) {
      onCompleteScenario(currentScenario.id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Two-Zone Interactive Pharmacy Counter Patient Simulator */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-teal-700 dark:text-teal-400">
              شبیه‌ساز بالینی پیشخوان داروخانه · {toPersianDigits(completedScenarios.length)} از {toPersianDigits(PATIENT_SCENARIOS.length)} پرونده تکمیل‌شده
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              شبیه‌ساز مراجعین واقعی داروخانه و آزمایشگاه دوزینگ
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              مفاهیم وقتی در ذهن قفل می‌شوند که خودت را پشت پیشخوان داروخانه ببینی و به سوال بیمار جواب بدهی!
            </p>
          </div>

          {/* Scenario Step Controller */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label="بیمار قبلی"
              onClick={() =>
                setActiveScenarioIdx((prev) =>
                  prev > 0 ? prev - 1 : PATIENT_SCENARIOS.length - 1
                )
              }
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-3 tabular-nums">
              بیمار {toPersianDigits(activeScenarioIdx + 1)} از {toPersianDigits(PATIENT_SCENARIOS.length)}
            </span>
            <button
              type="button"
              aria-label="بیمار بعدی"
              onClick={() =>
                setActiveScenarioIdx((prev) =>
                  prev < PATIENT_SCENARIOS.length - 1 ? prev + 1 : 0
                )
              }
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scenario Selector Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {PATIENT_SCENARIOS.map((scen, idx) => {
            const isDone = completedScenarios.includes(scen.id);
            const isCurrent = idx === activeScenarioIdx;
            return (
              <button
                key={scen.id}
                type="button"
                onClick={() => setActiveScenarioIdx(idx)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
                  isCurrent
                    ? 'bg-slate-900 dark:bg-teal-600 border-slate-900 dark:border-teal-500 text-white'
                    : isDone
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                <span>
                  {toPersianDigits(idx + 1)}. {scen.patientName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Two-Zone Sandbox Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Interactive Stage: Patient Presentation */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                <div className="space-y-1">
                  <div className="text-xs text-teal-700 dark:text-teal-400 font-semibold">
                    {currentScenario.avatarLabel} · {currentScenario.patientAge}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {currentScenario.patientName}
                  </h2>
                </div>
                <UserCheck className="w-6 h-6 text-teal-700 dark:text-teal-400 shrink-0" />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  شرح حال و سوال مراجعه‌کننده در داروخانه:
                </div>
                <blockquote className="text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 leading-relaxed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  {currentScenario.chiefComplaint}
                </blockquote>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-slate-100">پرونده دارویی: </strong>
                {currentScenario.patientHistory}
              </div>
            </div>

            <div className="bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-300">
                <Lightbulb className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                <span>نکته طلایی این پرونده در آزمون:</span>
              </div>
              <p className="text-xs font-semibold text-teal-950 dark:text-teal-100 leading-relaxed">
                {currentScenario.goldenPearl}
              </p>
            </div>
          </div>

          {/* Control & Decision Deck */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {currentScenario.questionPrompt}
              </h3>

              <div className="space-y-3">
                {currentScenario.choices.map((choice, cIdx) => {
                  const isSelected = selectedChoiceIdx === cIdx;
                  let choiceStyle =
                    'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700';
                  if (isScenarioAnswered) {
                    if (choice.isCorrect) {
                      choiceStyle =
                        'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 font-semibold';
                    } else if (isSelected && !choice.isCorrect) {
                      choiceStyle =
                        'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-950 dark:text-rose-100';
                    }
                  }

                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => handleSelectChoice(cIdx)}
                      className={`w-full text-right p-4 rounded-lg border text-sm transition-colors flex items-start justify-between gap-3 ${choiceStyle}`}
                    >
                      <span className="leading-relaxed">{choice.label}</span>
                      {isScenarioAnswered && choice.isCorrect && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>توصیه صحیح</span>
                        </span>
                      )}
                      {isScenarioAnswered && isSelected && !choice.isCorrect && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 shrink-0">
                          <XCircle className="w-4 h-4" />
                          <span>خطای دارویی</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {isScenarioAnswered && (
              <div
                className={`p-4 rounded-lg border text-xs sm:text-sm leading-relaxed ${
                  currentScenario.choices[selectedChoiceIdx].isCorrect
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                    : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
                }`}
              >
                <div className="font-bold mb-1">
                  {currentScenario.choices[selectedChoiceIdx].isCorrect
                    ? 'آفرین! مشاوره شما کاملاً علمی و منطبق با کلید آزمون است:'
                    : 'دقت کن! چرا این گزینه اشتباه است؟'}
                </div>
                <p>{currentScenario.choices[selectedChoiceIdx].clinicalFeedback}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Pediatric Parakid Dosing Calculator & Prescription Decoder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Pediatric Drop Dosing Simulator */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400">
              <Calculator className="w-4 h-4" />
              <span>شبیه‌ساز تعاملی محاسبه دوز قطره استامینوفن (پاراکید)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              محاسبه‌گر دوز قطره و شیاف اطفال بر اساس وزن
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              اهرم وزن نوزاد را حرکت دهید تا فرمول استاندارد آزمون (۲ تا ۳ قطره به ازای هر کیلوگرم وزن بدن در هر ۴ ساعت) را به صورت زنده ببینید:
            </p>

            {/* Labeled Weight Slider */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="baby-weight-slider"
                  className="text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  وزن نوزاد / کودک:
                </label>
                <span className="text-lg font-mono font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                  {toPersianDigits(babyWeightKg)} کیلوگرم (kg)
                </span>
              </div>

              <input
                id="baby-weight-slider"
                type="range"
                min={3}
                max={12}
                step={1}
                value={babyWeightKg}
                onChange={(e) => setBabyWeightKg(Number(e.target.value))}
                className="w-full accent-teal-700 dark:accent-teal-400 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                <span>3 kg</span>
                <span>5 kg (سوال آزمون)</span>
                <span>8 kg</span>
                <span>12 kg</span>
              </div>
            </div>

            {/* Live Output Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-lg p-4 space-y-1">
                <div className="text-xs text-teal-800 dark:text-teal-300 font-medium">
                  دوز استاندارد هر ۴ ساعت:
                </div>
                <div className="text-xl font-bold text-teal-950 dark:text-teal-100 tabular-nums">
                  {toPersianDigits(dropCalculation.minDrops4h)} تا {toPersianDigits(dropCalculation.maxDrops4h)} قطره
                </div>
                <div className="text-[11px] text-teal-700 dark:text-teal-400">
                  فرمول: ۲ تا ۳ قطره × {toPersianDigits(babyWeightKg)} کیلوگرم
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-1">
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  شیاف مجاز تب کودک:
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  شیاف استامینوفن ۱۲۵
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  (دیکلوفناک ۱۰۰ و گلیسرین ۲ بزرگسال است)
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-lg p-4 text-xs text-amber-950 dark:text-amber-100 font-medium leading-relaxed">
            {dropCalculation.warningText}
          </div>
        </section>

        {/* Interactive Prescription & Injection Decoder */}
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-colors">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400">
              <FileText className="w-4 h-4" />
              <span>مترجم تعاملی اختصارات نسخه‌خوانی و شکل‌های تزریق</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              کالبدشکافی نمادهای انگلیسی در نسخ کاغذی
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              روی هر اختصار کلیک کنید تا معنی دقیق، سرعت جذب و سوال امتحانی مربوط به آن نمایش داده شود:
            </p>

            {/* Code Selector Buttons */}
            <div className="flex flex-wrap gap-2">
              {PRESCRIPTION_DECODER_ITEMS.map((item, idx) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelectedCodeIdx(idx)}
                  className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold transition-colors border whitespace-nowrap shrink-0 ${
                    selectedCodeIdx === idx
                      ? 'bg-slate-900 dark:bg-teal-600 border-slate-900 dark:border-teal-500 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.code}
                </button>
              ))}
            </div>

            {/* Active Code Details */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {activeDecoder.category}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {activeDecoder.title}
                  </h3>
                </div>
                <span className="font-mono text-sm font-bold text-teal-700 dark:text-teal-400">
                  {activeDecoder.code}
                </span>
              </div>

              <div className="space-y-2 text-xs sm:text-sm">
                <div>
                  <strong className="text-slate-900 dark:text-slate-100">ویژگی جذب و رهش: </strong>
                  <span className="text-slate-700 dark:text-slate-300">
                    {activeDecoder.absorptionSpeed}
                  </span>
                </div>
                <div>
                  <strong className="text-teal-900 dark:text-teal-300">نکته مستقیم امتحان: </strong>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {activeDecoder.examRule}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-lg p-4 text-xs text-rose-950 dark:text-rose-100 flex items-start gap-2 leading-relaxed">
            <Syringe className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
            <span>
              <strong>هشدار ایمنی: </strong>
              {activeDecoder.dangerNote}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
