'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  Trash2,
  CalendarDays,
  Clock,
  Gamepad2,
  Users,
  RefreshCw,
  Database,
  FileText,
  Type,
} from 'lucide-react';
import { createScheduleAction } from '@/app/actions';
import { Streamer, Game } from '@prisma/client';
import {
  type ExtractedSchedule,
  buildExtractedScheduleActionPayload,
  normalizeExtractedSchedule,
  syncExtractedParticipants,
} from '@/lib/schedule-extract';
import StreamerSelector from './StreamerSelctor';
import Hoi4ParticipantFields, { isHoi4GameSelected } from './components/Hoi4ParticipantFields';

type Step = 'input' | 'loading' | 'review' | 'submitting';

type PhaseConfig = { phase: string; label: string; Icon: React.ElementType };

const IMAGE_PHASES: PhaseConfig[] = [
  { phase: 'db_fetch',  label: '데이터 불러오는 중', Icon: Database  },
  { phase: 'encoding',  label: '이미지 처리 중',      Icon: ImageIcon },
  { phase: 'analyzing', label: 'AI가 분석하는 중',    Icon: Sparkles  },
  { phase: 'parsing',   label: '결과 처리 중',        Icon: FileText  },
];

const TEXT_PHASES: PhaseConfig[] = [
  { phase: 'db_fetch',  label: '데이터 불러오는 중', Icon: Database  },
  { phase: 'analyzing', label: 'AI가 분석하는 중',    Icon: Sparkles  },
  { phase: 'parsing',   label: '결과 처리 중',        Icon: FileText  },
];

const IMAGE_PROGRESS = [5, 25, 50, 82, 96];
const TEXT_PROGRESS  = [5, 50, 82, 96];
const EXTRACT_DRAFT_TTL_MS = 1000 * 60 * 10; // 10분
const MAX_PERSIST_IMAGE_BYTES = 1_500_000; // 약 1.5MB 이하만 세션 저장

type PersistedExtractDraft = {
  updatedAt: number;
  step: 'input' | 'review';
  extracted: ExtractedSchedule[];
  textInput: string;
  previewDataUrl?: string;
};

function phaseClasses(isDone: boolean, isActive: boolean) {
  if (isDone) return {
    icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
  };
  if (isActive) return {
    icon: 'bg-violet-200 dark:bg-violet-700/60 text-violet-600 dark:text-violet-300',
    text: 'text-violet-700 dark:text-violet-300',
  };
  return {
    icon: 'bg-slate-100 dark:bg-slate-700/50 text-slate-300 dark:text-slate-600',
    text: 'text-slate-300 dark:text-slate-600',
  };
}

type Props = {
  mode: 'image' | 'text';
  streamers: Streamer[];
  games: Game[];
  onClose: () => void;
};

export default function ScheduleExtractTab({ mode, streamers, games, onClose }: Props) {
  const [step, setStep] = useState<Step>('input');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedSchedule[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<string | null>(null);
  const [displayProgress, setDisplayProgress] = useState(5);
  const [persistedPreviewDataUrl, setPersistedPreviewDataUrl] = useState<string | null>(null);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const phases = mode === 'image' ? IMAGE_PHASES : TEXT_PHASES;
  const progressArr = mode === 'image' ? IMAGE_PROGRESS : TEXT_PROGRESS;
  const storageKey = `schedule-extract-draft:v1:${mode}`;

  const sortedStreamers = useMemo(
    () => [...streamers].sort((a, b) => a.name.localeCompare(b.name, 'ko-KR')),
    [streamers],
  );
  const streamerMap = useMemo(
    () => new Map(streamers.map((st) => [st.id, st.name])),
    [streamers],
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedExtractDraft;
      if (!parsed.updatedAt || Date.now() - parsed.updatedAt > EXTRACT_DRAFT_TTL_MS) {
        sessionStorage.removeItem(storageKey);
        return;
      }
      queueMicrotask(() => {
        if (Array.isArray(parsed.extracted) && parsed.extracted.length > 0) {
          setExtracted(
            parsed.extracted.map((s) =>
              normalizeExtractedSchedule(s, s.key ?? crypto.randomUUID()),
            ),
          );
          setStep(parsed.step === 'review' ? 'review' : 'input');
        }
        if (typeof parsed.textInput === 'string') {
          setTextInput(parsed.textInput);
        }
        if (typeof parsed.previewDataUrl === 'string' && parsed.previewDataUrl.length > 0) {
          setPersistedPreviewDataUrl(parsed.previewDataUrl);
          setPreviewUrl(parsed.previewDataUrl);
        }
      });
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      const shouldPersist = extracted.length > 0 || (mode === 'text' && textInput.trim().length > 0);
      if (!shouldPersist) {
        sessionStorage.removeItem(storageKey);
        return;
      }
      const payload: PersistedExtractDraft = {
        updatedAt: Date.now(),
        step: step === 'review' || step === 'submitting' ? 'review' : 'input',
        extracted,
        textInput,
        previewDataUrl: persistedPreviewDataUrl ?? undefined,
      };
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [extracted, textInput, step, mode, storageKey, persistedPreviewDataUrl]);

  const consumeSSE = useCallback(async (res: Response) => {
    if (!res.body) {
      setErrorMsg('서버 응답을 읽을 수 없습니다.');
      setStep('input');
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        if (!part.startsWith('data: ')) continue;
        const event = JSON.parse(part.slice(6));
        if (event.type === 'status') {
          setLoadingPhase(event.phase);
        } else if (event.type === 'error') {
          setErrorMsg(event.message);
          setStep('input');
          return;
        } else if (event.type === 'result') {
          setExtracted(
            (event.schedules as Partial<
              Omit<ExtractedSchedule, 'key' | 'editingStreamers'>
            >[]).map((s) => normalizeExtractedSchedule(s, crypto.randomUUID())),
          );
          setStep('review');
        }
      }
    }
  }, []);

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    setErrorMsg(null);
    setLoadingPhase(null);
    setPreviewUrl(URL.createObjectURL(file));
    setPersistedPreviewDataUrl(null);
    setStep('loading');
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const formData = new FormData();
      formData.append('image', file);

      if (file.size <= MAX_PERSIST_IMAGE_BYTES) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => reject(new Error('이미지 캐시 변환 실패'));
          reader.readAsDataURL(file);
        });
        if (dataUrl) setPersistedPreviewDataUrl(dataUrl);
      }

      const res = await fetch('/api/schedule/extract-from-image', {
        method: 'POST',
        body: formData,
        signal: abortRef.current.signal,
      });
      await consumeSSE(res);
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      setErrorMsg('네트워크 오류가 발생했습니다.');
      setStep('input');
    }
  }, [consumeSSE]);

  const processText = useCallback(async () => {
    if (!textInput.trim()) {
      setErrorMsg('텍스트를 입력해주세요.');
      return;
    }
    setErrorMsg(null);
    setLoadingPhase(null);
    setStep('loading');
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch('/api/schedule/extract-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput }),
        signal: abortRef.current.signal,
      });
      await consumeSSE(res);
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      setErrorMsg('네트워크 오류가 발생했습니다.');
      setStep('input');
    }
  }, [textInput, consumeSSE]);

  const handleReset = () => {
    abortRef.current?.abort();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStep('input');
    setExtracted([]);
    setPreviewUrl(null);
    setErrorMsg(null);
    setSubmitError(null);
    setLoadingPhase(null);
    setPersistedPreviewDataUrl(null);
    sessionStorage.removeItem(storageKey);
  };

  const updateSchedule = (key: string, updates: Partial<ExtractedSchedule>) =>
    setExtracted((prev) => prev.map((s) => (s.key === key ? { ...s, ...updates } : s)));

  const removeSchedule = (key: string) =>
    setExtracted((prev) => prev.filter((s) => s.key !== key));

  const handleSubmit = async () => {
    if (extracted.length === 0) return;
    setStep('submitting');
    setSubmitError(null);

    const results = await Promise.allSettled(
      extracted.map((s) => {
        if (!s.title?.trim())
          return Promise.resolve({ success: false, error: '제목이 입력되지 않았습니다.' });
        if (!s.streamerIds?.length)
          return Promise.resolve({ success: false, error: `"${s.title}" - 멤버를 선택해주세요.` });

        return createScheduleAction(
          buildExtractedScheduleActionPayload(s, streamers, games),
        );
      }),
    );

    const failures: string[] = [];
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        const v = r.value as { success: boolean; error?: string };
        if (!v.success) failures.push(`${idx + 1}번: ${v.error ?? '알 수 없는 오류'}`);
      } else {
        failures.push(`${idx + 1}번: ${r.reason?.message ?? '네트워크 오류'}`);
      }
    });

    if (failures.length === 0) {
      sessionStorage.removeItem(storageKey);
      onClose();
    } else {
      setSubmitError(failures.join('\n'));
      setStep('review');
    }
  };

  const currentPhaseIdx = loadingPhase ? phases.findIndex((p) => p.phase === loadingPhase) : -1;
  const progressPct = progressArr[currentPhaseIdx + 1] ?? 5;
  const fakeProgressCap = currentPhaseIdx >= 1
    ? 100
    : Math.min(45, progressPct + 8);
  const shownProgress = Math.max(progressPct, Math.round(displayProgress));
  const loadingLabel =
    shownProgress >= 99 ? '마무리 중...' : (phases[currentPhaseIdx]?.label ?? '분석 준비 중');
  const isReview = step === 'review' || step === 'submitting';
  const showPreviewPanel =
    mode === 'image' && !!previewUrl && (step === 'loading' || isReview);
  const hasAnyMissingStreamers = extracted.some((s) => !s.streamerIds?.length);

  useEffect(() => {
    if (step !== 'loading') {
      queueMicrotask(() => setDisplayProgress(5));
      return;
    }

    queueMicrotask(() => setDisplayProgress((prev) => Math.max(prev, progressPct)));
    const timer = setInterval(() => {
      setDisplayProgress((prev) => {
        const target = Math.max(progressPct, fakeProgressCap);
        if (prev >= target) return prev;
        const gap = target - prev;
        const delta = gap > 10 ? 1.6 : gap > 4 ? 0.8 : 0.35;
        return Math.min(target, prev + delta);
      });
    }, 220);

    return () => clearInterval(timer);
  }, [step, progressPct, fakeProgressCap]);

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {showPreviewPanel && (
        <div className="shrink-0 px-4 pt-3 md:hidden">
          <button
            type="button"
            onClick={() => setIsMobilePreviewOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300"
          >
            <Eye className="w-4 h-4" />
            이미지 보기
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0">

        {/* ── IMAGE INPUT ── */}
        {step === 'input' && mode === 'image' && (
          <div className="p-6 md:p-8 space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) processImage(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-3xl p-10 flex flex-col items-center gap-4 transition-all ${
                dragOver
                  ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-slate-50 dark:hover:bg-slate-700/30'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                  이미지를 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
                  PNG, JPG, WEBP 지원
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processImage(file);
                e.target.value = '';
              }}
            />
            {errorMsg && (
              <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </p>
            )}
          </div>
        )}

        {/* ── TEXT INPUT ── */}
        {step === 'input' && mode === 'text' && (
          <div className="p-6 md:p-8 space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">
                <Type className="w-3.5 h-3.5" />
                일정 텍스트
              </label>
              <textarea
                value={textInput}
                onChange={(e) => { setTextInput(e.target.value); if (errorMsg) setErrorMsg(null); }}
                placeholder={`일정 내용을 붙여넣거나 입력하세요.\n\n예) 이번 주 일정\n- 월요일 21시: 멤버1, 멤버2 - 마인크래프트\n- 화요일 20시: 멤버3 - 배틀그라운드`}
                className="w-full h-52 px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all resize-none"
              />
            </div>
            {errorMsg && (
              <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </p>
            )}
            <button
              onClick={processText}
              disabled={!textInput.trim()}
              className="w-full py-3.5 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI로 일정 추출
            </button>
          </div>
        )}

        {/* ── LOADING ── */}
        {step === 'loading' && (
          <div className="p-6 flex flex-col gap-4">
            {mode === 'image' && previewUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="분석 중인 이미지" className="w-full max-h-48 object-contain" />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="relative h-1.5 bg-violet-100 dark:bg-violet-900/40 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-violet-500 rounded-full"
                  animate={{ width: `${shownProgress}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
              <p className="text-right text-[11px] font-bold text-violet-400 dark:text-violet-500 tabular-nums">
                {shownProgress}%
              </p>
            </div>

            <div className="rounded-2xl border border-violet-200/70 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-900/20 px-4 py-3">
              <p className="text-xs font-black text-violet-700 dark:text-violet-300">
                AI가 일정을 읽는 중입니다
              </p>
              <p className="mt-1 text-[11px] font-medium text-violet-600/90 dark:text-violet-300/90 leading-relaxed">
                현재 단계: {loadingLabel}.
                {" "}탭을 이동해도 추출 결과는 10분 동안 임시 저장됩니다.
              </p>
            </div>

            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-800 overflow-hidden">
              {phases.map(({ phase, label, Icon }, idx) => {
                const isDone = idx < currentPhaseIdx;
                const isActive = idx === currentPhaseIdx;
                const cls = phaseClasses(isDone, isActive);
                return (
                  <div
                    key={phase}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      idx > 0 ? 'border-t border-violet-100 dark:border-violet-800' : ''
                    } ${isActive ? 'bg-violet-100/60 dark:bg-violet-800/30' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${cls.icon}`}>
                      {isDone   ? <CheckCircle2 className="w-4 h-4" /> :
                       isActive ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                  <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-sm font-bold transition-colors ${cls.text}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── REVIEW ── */}
        {isReview && (
          <div className="p-4 md:p-5 space-y-3">
            {extracted.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">
                  {mode === 'image' ? '이미지에서 일정을 찾지 못했습니다.' : '텍스트에서 일정을 찾지 못했습니다.'}
                </p>
                <button
                  onClick={handleReset}
                  className="text-sm font-bold text-violet-500 hover:text-violet-600 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {extracted.length}개 일정 추출됨 · 내용을 확인하고 필요 시 수정하세요
                  </p>
                </div>

                {extracted.map((s, idx) => {
                  const hasEmptyTitle = !s.title?.trim();
                  const hasNoStreamers = !s.streamerIds?.length;
                  const hasErrors = hasEmptyTitle || hasNoStreamers;
                  const isHoi4 = isHoi4GameSelected(s.gameId ?? '', games);

                  return (
                    <div
                      key={s.key}
                      className={`rounded-2xl border overflow-hidden transition-colors ${
                        hasErrors
                          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {/* Card header */}
                      <div className={`flex items-center gap-2 px-4 py-3 border-b transition-colors ${
                        hasErrors
                          ? 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'
                      }`}>
                        <span className="text-xs font-black text-slate-400 dark:text-slate-500 w-4 shrink-0 text-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={s.title ?? ''}
                          onChange={(e) => updateSchedule(s.key, { title: e.target.value })}
                          placeholder="방송 제목"
                          className={`flex-1 min-w-0 bg-transparent text-sm font-bold placeholder-slate-400 outline-none ${
                            hasEmptyTitle
                              ? 'text-red-500 dark:text-red-400 placeholder-red-300'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}
                        />
                        <button
                          onClick={() => removeSchedule(s.key)}
                          className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Card body */}
                      <div className="px-4 py-3 space-y-2.5">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 flex-1 min-w-0">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <input
                              type="date"
                              value={s.date ?? ''}
                              onChange={(e) => updateSchedule(s.key, { date: e.target.value || null })}
                              className="flex-1 min-w-0 text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none scheme-light dark:scheme-dark"
                            />
                          </label>
                          <label className="flex items-center gap-2 flex-1 min-w-0">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <input
                              type="time"
                              value={s.time ?? ''}
                              onChange={(e) => updateSchedule(s.key, { time: e.target.value || null })}
                              className="flex-1 min-w-0 text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none scheme-light dark:scheme-dark"
                            />
                          </label>
                        </div>

                        <label className="flex items-center gap-2">
                          <Gamepad2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <select
                            value={s.gameId ?? ''}
                            onChange={(e) => {
                              const gameId = e.target.value || null;
                              updateSchedule(s.key, {
                                gameId,
                                ...(gameId && !isHoi4GameSelected(gameId, games)
                                  ? { isNaeJeon: false }
                                  : {}),
                              });
                            }}
                            className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none"
                          >
                            <option value="">게임 선택 안 함</option>
                            {games.map((g) => (
                              <option key={g.id} value={g.id}>{g.title}</option>
                            ))}
                          </select>
                          {s.gameName && !s.gameId && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 italic">
                              감지: {s.gameName}
                            </span>
                          )}
                        </label>

                        <div>
                          <button
                            type="button"
                            onClick={() => updateSchedule(s.key, { editingStreamers: !s.editingStreamers })}
                            className={`flex items-center gap-2 w-full text-left py-0.5 px-2 rounded transition-colors ${
                              hasNoStreamers
                                ? 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <Users className={`w-3.5 h-3.5 shrink-0 ${hasNoStreamers ? 'text-red-500' : 'text-slate-400'}`} />
                            <span className={`text-sm font-medium flex-1 min-w-0 truncate ${
                              hasNoStreamers ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'
                            }`}>
                              {s.streamerIds.length > 0 ? (
                                s.streamerIds.map((id) => streamerMap.get(id)).filter(Boolean).join(', ')
                              ) : (
                                <span className={hasNoStreamers ? 'font-bold' : 'italic'}>
                                  멤버 미선택 — 탭하여 선택
                                </span>
                              )}
                            </span>
                            {s.streamerNames.length > 0 && s.streamerIds.length === 0 && (
                              <span className="text-[11px] text-slate-400 shrink-0 italic">
                                감지: {s.streamerNames.join(', ')}
                              </span>
                            )}
                          </button>

                          <AnimatePresence>
                            {s.editingStreamers && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden mt-2"
                              >
                                <StreamerSelector
                                  compact
                                  streamers={sortedStreamers}
                                  selectedStreamers={s.streamerIds}
                                  toggleStreamer={(id) => {
                                    const has = s.streamerIds.includes(id);
                                    const nextIds = has
                                      ? s.streamerIds.filter((x) => x !== id)
                                      : [...s.streamerIds, id];
                                    updateSchedule(s.key, {
                                      ...syncExtractedParticipants(s, streamers, {
                                        streamerIds: nextIds,
                                      }),
                                    });
                                  }}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <Hoi4ParticipantFields
                          compact
                          isHoi4Game={isHoi4}
                          isNaeJeon={s.isNaeJeon}
                          onSetIsNaeJeon={(value) =>
                            updateSchedule(s.key, { isNaeJeon: value })
                          }
                          participants={s.participants}
                          streamers={sortedStreamers}
                          onUpdateParticipant={(id, field, value) => {
                            const nextParticipants = s.participants.map((p) =>
                              p.id === id ? { ...p, [field]: value } : p,
                            );
                            updateSchedule(s.key, {
                              participants: nextParticipants,
                              ...(field === 'nation' && value.trim() && isHoi4
                                ? { isNaeJeon: true }
                                : {}),
                            });
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
        </div>

        {showPreviewPanel && (
          <div className="hidden md:flex md:w-80 lg:w-96 shrink-0 border-l border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 p-3">
            <div className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="업로드된 일정표"
                className="w-full h-full max-h-[65dvh] object-contain"
              />
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/50 hover:bg-black/70 text-white rounded-xl text-xs font-bold transition-colors backdrop-blur-sm"
              >
                <RefreshCw className="w-3 h-3" />
                재업로드
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer (review/submitting only) */}
      {isReview && (
        <div className="p-5 md:p-6 bg-slate-50 dark:bg-slate-800 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
          {submitError && (
            <div className="flex items-start gap-2 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 whitespace-pre-wrap">{submitError}</div>
            </div>
          )}
          {hasAnyMissingStreamers && (
            <div className="flex items-start gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>모든 일정에서 멤버를 선택해야 등록할 수 있습니다.</div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={step === 'submitting'}
              className="flex-1 py-3.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              {mode === 'image' ? '재업로드' : '다시 입력'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={step === 'submitting' || extracted.length === 0 || hasAnyMissingStreamers}
              className="flex-1 py-3.5 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {step === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {extracted.length}개 일정 등록
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showPreviewPanel && isMobilePreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-90 bg-black/70 backdrop-blur-sm p-4 md:hidden"
            onClick={() => setIsMobilePreviewOpen(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="업로드된 일정표 전체보기"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(false)}
                className="absolute top-3 right-3 rounded-xl px-3 py-1.5 text-xs font-bold bg-black/60 text-white"
              >
                닫기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
