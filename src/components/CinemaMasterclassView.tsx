import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Loader2,
  Sparkles,
  CheckCircle2,
  Film,
  Zap,
  Mic2,
  Users,
  Repeat,
  AlertCircle,
} from 'lucide-react';
import { CINEMA_EPISODES } from '../data/cinemaEpisodesData';
import { ALL_EXAM_QUESTIONS, BOOKLET_METADATA } from '../data/allQuestions';
import { BookletId } from '../types/exam';
import { toPersianDigits } from '../utils/examLogic';

interface CinemaMasterclassViewProps {
  watchedEpisodes: string[];
  onMarkEpisodeWatched: (episodeId: string) => void;
}

export const CinemaMasterclassView: React.FC<CinemaMasterclassViewProps> = ({
  watchedEpisodes,
  onMarkEpisodeWatched,
}) => {
  const [cinemaSubMode, setCinemaSubMode] = useState<'episodes' | 'reels-175'>('episodes');

  // --- Mode 1: 12-Episode Auto-Play Masterclass State ---
  const [activeEpisodeIdx, setActiveEpisodeIdx] = useState<number>(0);
  const [voiceMode, setVoiceMode] = useState<'narration' | 'podcast'>('narration');
  const [voiceName, setVoiceName] = useState<string>('Kore');
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [autoAdvanceEpisodes, setAutoAdvanceEpisodes] = useState<boolean>(true);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioProgressPercent, setAudioProgressPercent] = useState<number>(0);
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Record<string, string>>({});

  // --- Mode 2: 175-Question Auto-Reels State ---
  const [reelsBooklet, setReelsBooklet] = useState<BookletId | 'all'>('all');
  const [reelsIndex, setReelsIndex] = useState<number>(0);
  const [isReelsPlaying, setIsReelsPlaying] = useState<boolean>(false);
  const [reelsIntervalSec, setReelsIntervalSec] = useState<number>(7);
  const [isReelsTtsLoading, setIsReelsTtsLoading] = useState<boolean>(false);

  const currentEpisode = CINEMA_EPISODES[activeEpisodeIdx] || CINEMA_EPISODES[0];

  const reelsQuestions =
    reelsBooklet === 'all'
      ? ALL_EXAM_QUESTIONS
      : ALL_EXAM_QUESTIONS.filter((q) => q.bookletId === reelsBooklet);

  const safeReelsIdx =
    reelsQuestions.length > 0 ? Math.min(reelsIndex, reelsQuestions.length - 1) : 0;
  const currentReelQuestion = reelsQuestions[safeReelsIdx];

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Auto-advance timer for 175 Question Reels (when playing in silent visual timer mode)
  useEffect(() => {
    if (cinemaSubMode !== 'reels-175' || !isReelsPlaying) return;
    const timer = window.setInterval(() => {
      setReelsIndex((prev) => {
        if (prev < reelsQuestions.length - 1) return prev + 1;
        setIsReelsPlaying(false);
        return 0;
      });
    }, reelsIntervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [cinemaSubMode, isReelsPlaying, reelsIntervalSec, reelsQuestions.length]);

  const fetchEpisodeAudioUrl = async (
    epIdx: number,
    mode: 'narration' | 'podcast',
    voice: string
  ): Promise<string> => {
    const ep = CINEMA_EPISODES[epIdx];
    const cacheKey = `${ep.id}::${mode}::${voice}`;
    if (audioCacheRef.current[cacheKey]) {
      return audioCacheRef.current[cacheKey];
    }

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: ep.colloquialAudioScript,
        mode,
        voiceName: voice,
        dialogueTurns: mode === 'podcast' ? ep.podcastDialogue : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data?.audioBase64) {
      throw new Error(data?.error || 'خطا در دریافت صدای تدریس از سرور');
    }

    const mimeType = data.mimeType || 'audio/wav';
    const dataUrl = `data:${mimeType};base64,${data.audioBase64}`;
    audioCacheRef.current[cacheKey] = dataUrl;
    return dataUrl;
  };

  const playEpisodeAtIndex = async (
    epIdx: number,
    mode = voiceMode,
    voice = voiceName
  ) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setActiveEpisodeIdx(epIdx);
    setActiveSceneIdx(0);
    setAudioProgressPercent(0);
    setIsPlayingAudio(false);
    setIsLoadingAudio(true);
    setAudioError(null);

    try {
      const url = await fetchEpisodeAudioUrl(epIdx, mode, voice);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.playbackRate = playbackRate;
        await audioRef.current.play();
        setIsPlayingAudio(true);
      }

      // Pre-fetch next episode in background so Auto-Advance has zero delay
      if (epIdx + 1 < CINEMA_EPISODES.length) {
        fetchEpisodeAudioUrl(epIdx + 1, mode, voice).catch(() => {});
      }
    } catch (err: any) {
      setAudioError(
        err?.message || 'خطا در تولید صدای تدریس؛ دوباره روی دکمه پخش کلیک کنید.'
      );
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleTogglePlayCurrentEpisode = async () => {
    const cacheKey = `${currentEpisode.id}::${voiceMode}::${voiceName}`;
    if (
      audioRef.current &&
      audioRef.current.src &&
      audioCacheRef.current[cacheKey] === audioRef.current.src
    ) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.playbackRate = playbackRate;
        await audioRef.current.play();
        setIsPlayingAudio(true);
      }
      return;
    }

    await playEpisodeAtIndex(activeEpisodeIdx, voiceMode, voiceName);
  };

  const handleEpisodeEnded = () => {
    setIsPlayingAudio(false);
    onMarkEpisodeWatched(currentEpisode.id);

    if (autoAdvanceEpisodes && activeEpisodeIdx < CINEMA_EPISODES.length - 1) {
      const nextIdx = activeEpisodeIdx + 1;
      playEpisodeAtIndex(nextIdx, voiceMode, voiceName);
    }
  };

  const handleSpeakSingleReelQuestion = async () => {
    if (!currentReelQuestion) return;
    if (audioRef.current && isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    setIsReelsTtsLoading(true);
    setAudioError(null);
    try {
      const correctOptionText =
        currentReelQuestion.options[currentReelQuestion.correctIndex];
      const script = `سوال شماره ${currentReelQuestion.questionNumber}: ${currentReelQuestion.question} <breath> جواب قطعی در امتحان: ${correctOptionText}! <breath> رمز فوری حافظه: ${currentReelQuestion.mnemonic}`;

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: script,
          mode: 'narration',
          voiceName: 'Kore',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.audioBase64) {
        throw new Error(data?.error || 'خطا در پخش صوتی سوال');
      }
      const url = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.playbackRate = playbackRate;
        await audioRef.current.play();
        setIsPlayingAudio(true);
      }
    } catch (err: any) {
      setAudioError(err?.message || 'خطا در پخش صوتی سوال');
    } finally {
      setIsReelsTtsLoading(false);
    }
  };

  const activeScene =
    currentEpisode.visualScenes[activeSceneIdx] || currentEpisode.visualScenes[0];

  return (
    <div className="space-y-8">
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (!audioRef.current || !audioRef.current.duration) return;
          const pct = Math.min(
            100,
            Math.round((audioRef.current.currentTime / audioRef.current.duration) * 100)
          );
          setAudioProgressPercent(pct);

          // Sync visual storyboard scene (4 scenes per episode)
          const sceneIndex = Math.min(3, Math.floor((pct / 100) * 4));
          setActiveSceneIdx(sceneIndex);
        }}
        onEnded={() => {
          if (cinemaSubMode === 'episodes') {
            handleEpisodeEnded();
          } else {
            setIsPlayingAudio(false);
          }
        }}
        onPause={() => setIsPlayingAudio(false)}
        onPlay={() => setIsPlayingAudio(true)}
        className="hidden"
      />

      {/* Top Mode Switcher Banner: Zero-Effort Cinema vs 175-Question Auto-Reels */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400">
              <Film className="w-4 h-4" />
              <span>حالت ویژه خستگی مطلق · بدون نیاز به خواندن متن‌های طولانی یا کلیک کردن</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              اگه حال خوندن نداری (تکیه بده، گوش کن و تصویرها رو ببین!)
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              وقتی مغزت خسته‌ست و حوصله درس خوندن نداری، فقط دکمه <strong className="text-teal-700 dark:text-teal-400">«شروع تدریس خودکار»</strong> رو بزن؛ استاد هوشمند با لحن خودمانی و پرانرژی، کل نکات <strong className="text-slate-900 dark:text-white">۱۷۵ سوال امتحانی</strong> رو توی ۱۲ اپیزود کوتاه (کمتر از ۲۵ دقیقه کل دوره!) برات تعریف می‌کنه و اسلایدهای تصویری رو خودش یکی‌یکی جلو می‌بره.
            </p>
          </div>

          {/* Sub-mode Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                setIsReelsPlaying(false);
                setCinemaSubMode('episodes');
              }}
              className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors inline-flex items-center justify-center gap-2 border cursor-pointer ${
                cinemaSubMode === 'episodes'
                  ? 'bg-teal-700 dark:bg-teal-600 border-teal-700 dark:border-teal-500 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>۱. تدریس صوتی-تصویری کل دوره (۱۲ اپیزود)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                setIsPlayingAudio(false);
                setCinemaSubMode('reels-175');
              }}
              className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-colors inline-flex items-center justify-center gap-2 border cursor-pointer ${
                cinemaSubMode === 'reels-175'
                  ? 'bg-teal-700 dark:bg-teal-600 border-teal-700 dark:border-teal-500 text-white'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>۲. فلش‌ریلز خودکار ۱۷۵ سوال (جواب آماده)</span>
            </button>
          </div>
        </div>
      </div>

      {cinemaSubMode === 'episodes' ? (
        <div className="space-y-6">
          {/* Main Cinema Stage (Immediately Above the Fold) */}
          <div className="bg-slate-900 dark:bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            {/* Compact 12-Episode Pill Strip inside the Cinema Header */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-800">
              {CINEMA_EPISODES.map((ep, idx) => {
                const isCurrent = idx === activeEpisodeIdx;
                const isDone = watchedEpisodes.includes(ep.id);
                return (
                  <button
                    key={ep.id}
                    type="button"
                    onClick={() => {
                      setActiveEpisodeIdx(idx);
                      setActiveSceneIdx(0);
                      setAudioProgressPercent(0);
                      if (isPlayingAudio) {
                        playEpisodeAtIndex(idx, voiceMode, voiceName);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors inline-flex items-center gap-1.5 cursor-pointer border ${
                      isCurrent
                        ? 'bg-teal-500 border-teal-400 text-slate-950'
                        : isDone
                        ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    <span>
                      اپیزود {ep.number}: {ep.title.split('(')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Top Cinema Control Deck */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 pb-6 border-b border-slate-800">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-teal-400 font-semibold">
                  <span>اپیزود {currentEpisode.number} از ۱۲</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentEpisode.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400">
                    پوشش مستقیم {toPersianDigits(currentEpisode.coveredQuestionsCount)} سوال امتحانی ({currentEpisode.durationEstimate})
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  {currentEpisode.number}. {currentEpisode.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">{currentEpisode.subtitle}</p>
              </div>

              {/* Big One-Click Play Controls */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  disabled={activeEpisodeIdx === 0 || isLoadingAudio}
                  onClick={() => playEpisodeAtIndex(Math.max(0, activeEpisodeIdx - 1))}
                  aria-label="اپیزود قبلی"
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={isLoadingAudio}
                  onClick={handleTogglePlayCurrentEpisode}
                  className="px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm inline-flex items-center gap-2.5 transition-colors cursor-pointer shrink-0"
                >
                  {isLoadingAudio ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>در حال آماده‌سازی صدای استاد...</span>
                    </>
                  ) : isPlayingAudio ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span>توقف موقت تدریس</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>شروع تدریس صوتی این اپیزود (دراز بکش و گوش بده)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={activeEpisodeIdx === CINEMA_EPISODES.length - 1 || isLoadingAudio}
                  onClick={() =>
                    playEpisodeAtIndex(
                      Math.min(CINEMA_EPISODES.length - 1, activeEpisodeIdx + 1)
                    )
                  }
                  aria-label="اپیزود بعدی"
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Audio Settings Strip: Mode (Single vs Podcast), Voice, Speed, Auto-Next */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex rounded-lg bg-slate-900 border border-slate-700 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceMode('narration');
                      if (isPlayingAudio) {
                        playEpisodeAtIndex(activeEpisodeIdx, 'narration', voiceName);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      voiceMode === 'narration'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mic2 className="w-3.5 h-3.5" />
                    <span>تدریس خودمانی تک‌نفره</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceMode('podcast');
                      if (isPlayingAudio) {
                        playEpisodeAtIndex(activeEpisodeIdx, 'podcast', voiceName);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      voiceMode === 'podcast'
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>مکالمه استاد و دانشجو</span>
                  </button>
                </div>

                {voiceMode === 'narration' && (
                  <select
                    aria-label="انتخاب صدای استاد"
                    value={voiceName}
                    onChange={(e) => {
                      const v = e.target.value;
                      setVoiceName(v);
                      if (isPlayingAudio) {
                        playEpisodeAtIndex(activeEpisodeIdx, voiceMode, v);
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="Kore">صدای Kore (گرم و صمیمی)</option>
                    <option value="Puck">صدای Puck (پرانرژی و سریع)</option>
                    <option value="Zephyr">صدای Zephyr (شفاف و آرام)</option>
                    <option value="Charon">صدای Charon (بم و جدی)</option>
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const speeds = [1, 1.25, 1.5];
                    const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
                    setPlaybackRate(next);
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-900 border border-slate-700 rounded-lg text-teal-400 hover:bg-slate-800 cursor-pointer"
                >
                  سرعت: {playbackRate}x
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAutoAdvanceEpisodes((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    autoAdvanceEpisodes
                      ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>
                    {autoAdvanceEpisodes
                      ? 'پخش خودکار اپیزود بعدی: روشن'
                      : 'پخش خودکار اپیزود بعدی: خاموش'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onMarkEpisodeWatched(currentEpisode.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    watchedEpisodes.includes(currentEpisode.id)
                      ? 'bg-teal-600 border-teal-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {watchedEpisodes.includes(currentEpisode.id)
                      ? 'یاد گرفتم'
                      : 'ثبت تماشای این اپیزود'}
                  </span>
                </button>
              </div>
            </div>

            {/* Audio Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>پیشرفت صوتی اپیزود {currentEpisode.number}</span>
                <span className="font-mono tabular-nums">{toPersianDigits(audioProgressPercent)}٪</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-400 transition-all duration-300"
                  style={{ width: `${audioProgressPercent}%` }}
                />
              </div>
            </div>

            {audioError && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-700 text-xs text-rose-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{audioError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePlayCurrentEpisode}
                  className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded-lg font-bold"
                >
                  تلاش مجدد
                </button>
              </div>
            )}

            {/* Giant Spotlight Visual Scene (Syncs with Audio or Clickable) */}
            <div className="bg-slate-950 border-2 border-teal-500/70 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold text-teal-400 inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>اسلاید در حال تدریس (صحنه {toPersianDigits(activeSceneIdx + 1)} از ۴)</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {currentEpisode.visualScenes.map((_, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setActiveSceneIdx(sIdx)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                        activeSceneIdx === sIdx
                          ? 'bg-teal-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      صحنه {toPersianDigits(sIdx + 1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5 space-y-2">
                  <div className="text-4xl">{activeScene.visualEmoji}</div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    {activeScene.sceneTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    <strong className="text-amber-400">سوال طراح در امتحان: </strong>
                    {activeScene.examTrigger}
                  </p>
                </div>

                <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-emerald-400">
                      ✅ جواب قطعی که باید در برگه بزنی:
                    </div>
                    <div className="text-base sm:text-xl font-extrabold text-white leading-relaxed">
                      {activeScene.exactAnswer}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-800 text-xs sm:text-sm text-teal-300 font-medium">
                    💡 <strong>رمز قفل در ذهن: </strong>
                    {activeScene.memoryHook}
                  </div>
                </div>
              </div>
            </div>

            {/* All 4 Visual Scenes Storyboard Grid at a Glance */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentEpisode.visualScenes.map((scene, sIdx) => {
                const isSelected = sIdx === activeSceneIdx;
                return (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => setActiveSceneIdx(sIdx)}
                    className={`text-right p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-teal-400 ring-1 ring-teal-400'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{scene.visualEmoji}</span>
                        <span className="text-[11px] font-mono text-teal-400 font-bold">
                          صحنه {toPersianDigits(sIdx + 1)}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white leading-snug">
                        {scene.sceneTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-relaxed">
                        {scene.examTrigger}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 text-xs font-bold text-emerald-400 leading-snug">
                      ← {scene.exactAnswer}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Conversational Audio Transcript Box (for easy skimming with eyes half-closed) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="text-xs font-bold text-teal-400">
                متن خودمانی تدریس صوتی این اپیزود (خلاصه محاوره‌ای کل نکات):
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-loose">
                {currentEpisode.colloquialAudioScript.replace(/<breath>/g, ' · ')}
              </p>
            </div>
          </div>

          {/* Rapid-Fire 1-Line Exam Q&A Cheat Sheet for this Episode */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                تقلب‌نامه ۱ خطی سوالات این اپیزود (سوال امتحان ← جواب فوری)
              </h3>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                فقط کلمات سبز را به خاطر بسپار!
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentEpisode.rapidFireQuestions.map((item, qIdx) => (
                <div
                  key={qIdx}
                  className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-2 flex flex-col justify-between"
                >
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-snug">
                    ❓ {item.q}
                  </div>
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                      ✅ {item.a}
                    </span>
                    <span className="text-[11px] font-medium text-teal-700 dark:text-teal-300 shrink-0">
                      ({item.code})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Mode 2: 175-Question Auto-Reels (Zero-Click Solved Question Stream) */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="text-xs font-bold text-teal-700 dark:text-teal-400">
                  حالت مرور بدون کلیک · نمایش خودکار سوال + گزینه صحیح سبز + رمز حافظه
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  فلش‌ریلز خودکار ۱۷۵ سوال امتحانی (مشاهده و شنیدن بدون تست زدن)
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReelsPlaying((prev) => !prev)}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                    isReelsPlaying
                      ? 'bg-amber-600 text-white'
                      : 'bg-teal-700 dark:bg-teal-600 text-white hover:bg-teal-800'
                  }`}
                >
                  {isReelsPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>توقف ورق زدن خودکار</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>شروع ورق زدن خودکار سوالات (هر {toPersianDigits(reelsIntervalSec)} ثانیه)</span>
                    </>
                  )}
                </button>

                <select
                  aria-label="سرعت ورق زدن خودکار سوالات"
                  value={reelsIntervalSec}
                  onChange={(e) => setReelsIntervalSec(Number(e.target.value))}
                  className="px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
                >
                  <option value={5}>هر ۵ ثانیه ۱ سوال (سریع)</option>
                  <option value={7}>هر ۷ ثانیه ۱ سوال (متعادل)</option>
                  <option value={10}>هر ۱۰ ثانیه ۱ سوال (آرام)</option>
                </select>
              </div>
            </div>

            {/* Booklet Filter */}
            <div className="flex flex-wrap items-center gap-2">
              {BOOKLET_METADATA.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setReelsBooklet(b.id);
                    setReelsIndex(0);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    reelsBooklet === b.id
                      ? 'bg-slate-900 dark:bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {b.title}
                </button>
              ))}
            </div>
          </div>

          {/* Giant Solved Question Reel Stage */}
          {currentReelQuestion && (
            <div className="max-w-4xl mx-auto bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 sm:p-10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs text-teal-400 font-bold">
                  <span>
                    سوال {toPersianDigits(safeReelsIdx + 1)} از {toPersianDigits(reelsQuestions.length)}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{currentReelQuestion.category}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isReelsTtsLoading}
                    onClick={handleSpeakSingleReelQuestion}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {isReelsTtsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                    <span>بخوان با صدای استاد (Gemini TTS)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setReelsIndex((prev) =>
                        prev > 0 ? prev - 1 : reelsQuestions.length - 1
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
                  >
                    قبلی
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReelsIndex((prev) =>
                        prev < reelsQuestions.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer"
                  >
                    بعدی
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-relaxed">
                {toPersianDigits(currentReelQuestion.questionNumber)}. {currentReelQuestion.question}
              </h3>

              {/* Instant Highlighted Correct Answer Box */}
              <div className="bg-emerald-950/90 border-2 border-emerald-500 rounded-2xl p-6 space-y-2">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>پاسخ صحیح در جلسه امتحان (همین گزینه را بزن!):</span>
                </div>
                <div className="text-lg sm:text-2xl font-extrabold text-white">
                  {currentReelQuestion.options[currentReelQuestion.correctIndex]}
                </div>
              </div>

              {/* Golden Memory Code */}
              <div className="bg-slate-950 border border-teal-800/80 rounded-2xl p-5 space-y-2">
                <div className="text-xs font-bold text-teal-400">
                  💡 رمز فوری قفل در حافظه (بدون نیاز به حفظ کردن):
                </div>
                <p className="text-sm sm:text-base font-bold text-teal-100 leading-relaxed">
                  {currentReelQuestion.mnemonic}
                </p>
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-800 leading-relaxed">
                  {currentReelQuestion.explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
