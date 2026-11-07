import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Loader2,
  Mic2,
  Users,
  Download,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { toPersianDigits } from '../utils/examLogic';

export interface TtsAudioPlayerProps {
  lessonId: string;
  lessonTitle: string;
  narrationText: string;
  podcastDialogue?: {
    speaker: 'Ostad' | 'Daneshjoo';
    text: string;
  }[];
  compact?: boolean;
}

const VOICE_OPTIONS = [
  { id: 'Kore', label: 'Kore (گرم و آموزشی)' },
  { id: 'Zephyr', label: 'Zephyr (شفاف و روان)' },
  { id: 'Puck', label: 'Puck (پرانرژی)' },
  { id: 'Charon', label: 'Charon (بم و جدی)' },
  { id: 'Fenrir', label: 'Fenrir (کلاسیک)' },
];

export const TtsAudioPlayer: React.FC<TtsAudioPlayerProps> = ({
  lessonId,
  lessonTitle,
  narrationText,
  podcastDialogue,
  compact = false,
}) => {
  const [mode, setMode] = useState<'narration' | 'podcast'>('narration');
  const [voiceName, setVoiceName] = useState<string>('Kore');
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.8-flash-tts');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastFetchedSignatureRef = useRef<string>('');

  // Reset player if lessonId changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setAudioDataUrl(null);
    setCurrentTime(0);
    setDuration(0);
    setErrorMessage(null);
    lastFetchedSignatureRef.current = '';
  }, [lessonId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const formatSeconds = (sec: number) => {
    if (!Number.isFinite(sec) || sec < 0) return '۰۰:۰۰';
    const mins = Math.floor(sec / 60);
    const rem = Math.floor(sec % 60);
    return toPersianDigits(
      `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
    );
  };

  const handleGenerateAndPlay = async (requestedMode = mode, requestedVoice = voiceName) => {
    const signature = `${lessonId}::${requestedMode}::${requestedVoice}`;

    // If already loaded with the same settings, toggle play/pause
    if (audioDataUrl && lastFetchedSignatureRef.current === signature && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.playbackRate = playbackRate;
        await audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: narrationText,
          mode: requestedMode,
          voiceName: requestedVoice,
          dialogueTurns: requestedMode === 'podcast' ? podcastDialogue : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.audioBase64) {
        throw new Error(data?.error || 'خطا در تولید صدای Gemini 3.8 Flash TTS');
      }

      const mimeType = data.mimeType || 'audio/wav';
      const url = `data:${mimeType};base64,${data.audioBase64}`;
      setAudioDataUrl(url);
      setActiveModel(data.model || 'gemini-3.8-flash-tts');
      lastFetchedSignatureRef.current = signature;

      // Play once audio element updates
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.playbackRate = playbackRate;
          audioRef.current
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }, 60);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'خطا در ارتباط با سرور صوتی Gemini 3.8 Flash TTS'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCycleSpeed = () => {
    const speeds = [1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div
      className={`rounded-xl border transition-colors ${
        compact
          ? 'bg-slate-50/90 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 p-4'
          : 'bg-teal-50/60 dark:bg-slate-800/80 border-teal-200/90 dark:border-teal-800/60 p-4 sm:p-5'
      }`}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
            audioRef.current.playbackRate = playbackRate;
          }
        }}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="hidden"
      />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left/Right Info & Play Trigger */}
        <div className="flex items-start sm:items-center gap-3.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleGenerateAndPlay(mode, voiceName)}
            aria-label={isPlaying ? `توقف روخوانی صوتی ${lessonTitle}` : `پخش صوتی ${lessonTitle} با Gemini 3.8 Flash TTS`}
            className="w-11 h-11 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 fill-current" />
            )}
          </button>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-teal-900 dark:text-teal-300">
                <Volume2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                <span>روخوانی صوتی هوشمند ({activeModel})</span>
              </span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span className="text-slate-600 dark:text-slate-400">
                {isLoading
                  ? 'در حال سنتز صدای استودیویی با هوش مصنوعی...'
                  : audioDataUrl
                  ? isPlaying
                    ? 'در حال پخش درس‌نامه صوتی'
                    : 'آماده پخش مجدد'
                  : 'تبدیل متن درس‌نامه به پادکست صوتی با کیفیت استودیویی'}
              </span>
            </div>

            {/* Interactive Timeline Bar when audio is ready */}
            {audioDataUrl ? (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                  {formatSeconds(currentTime)}
                </span>
                <input
                  type="range"
                  aria-label="نوار زمان پخش صوتی"
                  min={0}
                  max={duration > 0 ? duration : 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const nextTime = Number(e.target.value);
                    setCurrentTime(nextTime);
                    if (audioRef.current) {
                      audioRef.current.currentTime = nextTime;
                    }
                  }}
                  className="w-36 sm:w-56 accent-teal-700 dark:accent-teal-400 cursor-pointer h-1.5"
                />
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                  {formatSeconds(duration)}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                روی دکمه پخش کلیک کنید تا کل نکات این فصل با صدای طبیعی فارسی برایتان خوانده شود.
              </p>
            )}
          </div>
        </div>

        {/* Controls: Mode Toggle (Narration vs Podcast), Voice Selector, Speed, Download */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {podcastDialogue && podcastDialogue.length > 0 && (
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5">
              <button
                type="button"
                onClick={() => {
                  setMode('narration');
                  if (audioDataUrl) {
                    handleGenerateAndPlay('narration', voiceName);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  mode === 'narration'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mic2 className="w-3.5 h-3.5" />
                <span>تک‌گوینده</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('podcast');
                  if (audioDataUrl) {
                    handleGenerateAndPlay('podcast', voiceName);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  mode === 'podcast'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>مکالمه استاد و دانشجو</span>
              </button>
            </div>
          )}

          {mode === 'narration' && (
            <select
              aria-label="انتخاب صدای گوینده Gemini TTS"
              value={voiceName}
              onChange={(e) => {
                const nextVoice = e.target.value;
                setVoiceName(nextVoice);
                if (audioDataUrl) {
                  handleGenerateAndPlay(mode, nextVoice);
                }
              }}
              className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600"
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  صدای {v.label}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleCycleSpeed}
            className="px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors tabular-nums"
            title="تغییر سرعت پخش"
          >
            {playbackRate}x
          </button>

          {audioDataUrl && (
            <>
              <button
                type="button"
                onClick={handleRestart}
                aria-label="پخش از ابتدا"
                className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="پخش از ابتدا"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <a
                href={audioDataUrl}
                download={`vtenz-${lessonId}-${mode}.wav`}
                className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود فایل صوتی</span>
              </a>
            </>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mt-3 pt-3 border-t border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3 text-xs text-rose-700 dark:text-rose-400">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => handleGenerateAndPlay(mode, voiceName)}
            className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-md font-semibold hover:bg-rose-200 transition-colors whitespace-nowrap"
          >
            تلاش مجدد
          </button>
        </div>
      )}
    </div>
  );
};
