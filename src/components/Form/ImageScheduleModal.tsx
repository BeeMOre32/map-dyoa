'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ImageIcon, Loader2, CheckCircle2, AlertCircle,
  Sparkles, Trash2, CalendarDays, Clock, Gamepad2, Users, RefreshCw,
} from 'lucide-react';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { createScheduleAction } from '@/app/actions';
import { Streamer, Game } from '@prisma/client';
import { ModalProps } from '@/types/props';
import StreamerSelector from './StreamerSelctor';

// ── Types ──────────────────────────────────────────────────────────────────

type ExtractedSchedule = {
  key: string;
  title: string;
  date: string | null;
  time: string | null;
  gameId: string | null;
  gameName: string | null;
  streamerIds: string[];
  streamerNames: string[];
  editingStreamers: boolean;
};

type Step = 'upload' | 'loading' | 'review' | 'submitting';

type ImageScheduleModalProps = ModalProps & {
  streamers: Streamer[];
  games: Game[];
};

// ── Component ──────────────────────────────────────────────────────────────

export default function ImageScheduleModal({
  onClose,
  streamers,
  games,
}: ImageScheduleModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedSchedule[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEscapeKey(onClose);

  const sortedStreamers = [...streamers].sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));

  // ── 이미지 처리 ───────────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    setErrorMsg(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStep('loading');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/schedule/extract-from-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? '분석에 실패했습니다.');
        setStep('upload');
        return;
      }

      const schedules: ExtractedSchedule[] = (data.schedules ?? []).map(
        (s: Omit<ExtractedSchedule, 'key' | 'editingStreamers'>) => ({
          ...s,
          key: crypto.randomUUID(),
          streamerIds: s.streamerIds ?? [],
          streamerNames: s.streamerNames ?? [],
          editingStreamers: false,
        }),
      );

      setExtracted(schedules);
      setStep('review');
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
      setStep('upload');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setStep('upload');
    setExtracted([]);
    setPreviewUrl(null);
    setErrorMsg(null);
    setSubmitError(null);
  };

  // ── 추출 결과 편집 ────────────────────────────────────────────────────────

  const updateSchedule = (key: string, updates: Partial<ExtractedSchedule>) => {
    setExtracted((prev) => prev.map((s) => s.key === key ? { ...s, ...updates } : s));
  };

  const removeSchedule = (key: string) => {
    setExtracted((prev) => prev.filter((s) => s.key !== key));
  };

  // ── 등록 ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (extracted.length === 0) return;
    setStep('submitting');
    setSubmitError(null);

    const results = await Promise.allSettled(
      extracted.map((s) => {
        const hasTime = !!s.time;
        const dateStr = s.date ?? new Date().toISOString().split('T')[0];
        const startTime = hasTime
          ? new Date(`${dateStr}T${s.time}`)
          : new Date(`${dateStr}T00:00`);

        return createScheduleAction({
          title: s.title,
          startTime,
          participants: s.streamerIds.map((id) => ({ id })),
          gameId: s.gameId ?? undefined,
          isGuerrilla: !hasTime,
          isNaeJeon: false,
        });
      }),
    );

    const failCount = results.filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success),
    ).length;

    if (failCount === 0) {
      onClose();
    } else {
      setSubmitError(`${failCount}개 등록에 실패했습니다.`);
      setStep('review');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const isReview = step === 'review' || step === 'submitting';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={backdropVariants}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={smoothModalVariants}
        className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 flex flex-col max-h-[90dvh] border border-slate-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="p-6 md:p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/50 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">이미지로 일정 등록</h3>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400">BETA</span>
              </div>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {step === 'upload' && '일정표 이미지를 업로드하세요'}
                {step === 'loading' && 'AI가 이미지를 분석하는 중...'}
                {isReview && `${extracted.length}개 일정 추출됨 · 확인 후 등록`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* ── 이미지 미리보기 (리뷰 단계에서 고정 표시) ── */}
        <AnimatePresence>
          {previewUrl && isReview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="shrink-0 overflow-hidden border-b border-slate-100 dark:border-slate-700"
            >
              <div className="relative bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="업로드된 일정표"
                  className="w-full max-h-52 object-contain"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/50 hover:bg-black/70 text-white rounded-xl text-xs font-bold transition-colors backdrop-blur-sm"
                >
                  <RefreshCw className="w-3 h-3" />
                  재업로드
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* STEP: upload */}
          {step === 'upload' && (
            <div className="p-6 md:p-8 space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
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
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">이미지를 드래그하거나 클릭하여 업로드</p>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">PNG, JPG, WEBP 지원</p>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              {errorMsg && (
                <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}
                </p>
              )}
            </div>
          )}

          {/* STEP: loading */}
          {step === 'loading' && (
            <div className="p-6 flex flex-col gap-4">
              {previewUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="분석 중인 이미지" className="w-full max-h-56 object-contain" />
                </div>
              )}
              <div className="flex items-center gap-4 px-4 py-4 bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-800">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
                  <Loader2 className="w-5 h-5 text-violet-600 dark:text-violet-400 animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-black text-violet-700 dark:text-violet-300">AI가 이미지를 분석하는 중</p>
                  <p className="text-xs font-medium text-violet-500 dark:text-violet-400 mt-0.5">일정 정보를 추출하고 있어요...</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP: review / submitting */}
          {isReview && (
            <div className="p-4 md:p-5 space-y-3">
              {extracted.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500">이미지에서 일정을 찾지 못했습니다.</p>
                  <button onClick={handleReset} className="text-sm font-bold text-violet-500 hover:text-violet-600 transition-colors">
                    다시 시도
                  </button>
                </div>
              ) : (
                <>
                  {/* 추출 결과 요약 */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {extracted.length}개 일정 추출됨 · 내용을 확인하고 필요 시 수정하세요
                    </p>
                  </div>

                  {/* 일정 카드 목록 */}
                  {extracted.map((s, idx) => (
                    <div key={s.key} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      {/* 카드 헤더 */}
                      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-black text-slate-400 dark:text-slate-500 w-4 shrink-0 text-center">{idx + 1}</span>
                        <input
                          type="text"
                          value={s.title}
                          onChange={(e) => updateSchedule(s.key, { title: e.target.value })}
                          placeholder="방송 제목"
                          className="flex-1 min-w-0 bg-transparent text-sm font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                        />
                        <button
                          onClick={() => removeSchedule(s.key)}
                          className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* 카드 내용 */}
                      <div className="px-4 py-3 space-y-2.5">
                        {/* 날짜 · 시간 */}
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

                        {/* 게임 */}
                        <label className="flex items-center gap-2">
                          <Gamepad2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <select
                            value={s.gameId ?? ''}
                            onChange={(e) => updateSchedule(s.key, { gameId: e.target.value || null })}
                            className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent outline-none"
                          >
                            <option value="">게임 선택 안 함</option>
                            {games.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                          </select>
                          {s.gameName && !s.gameId && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 italic">감지: {s.gameName}</span>
                          )}
                        </label>

                        {/* 멤버 */}
                        <div>
                          <button
                            type="button"
                            onClick={() => updateSchedule(s.key, { editingStreamers: !s.editingStreamers })}
                            className="flex items-center gap-2 w-full text-left py-0.5"
                          >
                            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 flex-1 min-w-0 truncate">
                              {s.streamerIds.length > 0
                                ? streamers.filter((st) => s.streamerIds.includes(st.id)).map((st) => st.name).join(', ')
                                : <span className="text-slate-400 dark:text-slate-500 italic text-xs">멤버 미선택 — 탭하여 선택</span>
                              }
                            </span>
                            {s.streamerNames.length > 0 && s.streamerIds.length === 0 && (
                              <span className="text-[11px] text-slate-400 shrink-0 italic">감지: {s.streamerNames.join(', ')}</span>
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
                                    updateSchedule(s.key, {
                                      streamerIds: has
                                        ? s.streamerIds.filter((x) => x !== id)
                                        : [...s.streamerIds, id],
                                    });
                                  }}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {isReview && (
          <div className="p-5 md:p-6 bg-slate-50 dark:bg-slate-800 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
            {submitError && (
              <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />{submitError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={step === 'submitting'}
                className="flex-1 py-3.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={step === 'submitting' || extracted.length === 0}
                className="flex-1 py-3.5 bg-violet-600 text-white rounded-2xl font-bold hover:bg-violet-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {step === 'submitting'
                  ? <><Loader2 className="w-4 h-4 animate-spin" />등록 중...</>
                  : <><Sparkles className="w-4 h-4" />{extracted.length}개 일정 등록</>
                }
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
