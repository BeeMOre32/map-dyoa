'use client';

import { X, Link as LinkIcon, Clapperboard, Tv, Search, Users, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useScrollLock } from '@/hooks/useScrollLock';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { useClipForm } from '@/hooks/useClipForm';
import { getStreamerImagePath } from '@/lib/utils';
import type { Streamer } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import type { ClipWithParticipants } from '@/types/entities';
import ScheduleSearchSelect from './ScheduleSearchSelect';
import StreamerAvatar from '../streamer/StreamerAvatar';

interface CreateClipModalProps {
  streamers: Streamer[];
  schedules: FlattenedSchedule[];
  onClose: () => void;
  initialData?: ClipWithParticipants;
}

const inputClass =
  'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all';
const labelClass =
  'text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider';

function MetaStatusIcon({ fetchingMeta, metaStatus }: { fetchingMeta: boolean; metaStatus: 'idle' | 'ok' | 'fail' }) {
  if (fetchingMeta) return <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-spin" />;
  if (metaStatus === 'ok') return <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500">✓</span>;
  if (metaStatus === 'fail') return <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">수동입력</span>;
  return null;
}

export default function CreateClipModal({
  streamers,
  schedules,
  onClose,
  initialData,
}: CreateClipModalProps) {
  const form = useClipForm(streamers, schedules, onClose, initialData);
  useEscapeKey(onClose);
  useScrollLock();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"
        variants={smoothModalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {form.isEdit ? 'Edit Clip' : 'New Clip'}
              </p>
              <h2 className="text-lg font-black text-slate-800 dark:text-white">
                {form.isEdit ? '클립 수정' : '클립 추가'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          id="clip-form"
          onSubmit={form.handleSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0"
        >
          {/* 클립 URL */}
          <div className="space-y-1.5" data-zod-field="url">
            <label className={labelClass}>클립 URL *</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={form.url}
                onChange={(e) => form.handleUrlChange(e.target.value)}
                placeholder="https://chzzk.naver.com/clips/..."
                className={twMerge(inputClass, 'pl-10 pr-10')}
              />
              <MetaStatusIcon fetchingMeta={form.fetchingMeta} metaStatus={form.metaStatus} />
            </div>
          </div>

          {/* 연관된 스트리머 */}
          <div className="space-y-2" data-zod-field="streamerIds">
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                연관된 스트리머 *
              </span>
            </label>

            <AnimatePresence mode="popLayout">
              {form.selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-1.5 overflow-hidden"
                >
                  <AnimatePresence mode="popLayout">
                    {form.selectedIds.map((id) => {
                      const s = streamers.find((x) => x.id === id);
                      if (!s) return null;
                      const color = form.getStreamerChipColor(s.id, s.colorCode);
                      return (
                        <motion.button
                          key={id}
                          layout
                          initial={{ scale: 0.75, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.75, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          type="button"
                          onClick={() => form.toggleStreamer(id)}
                          className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-xl text-[11px] font-black text-white hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: color }}
                        >
                          <StreamerAvatar
                            colorCode={color}
                            name={s.name}
                            size="xs"
                            imgSrc={s.profileImg ?? getStreamerImagePath(s.name)}
                          />
                          {s.name}
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={form.streamerSearch}
                onChange={(e) => form.setStreamerSearch(e.target.value)}
                placeholder="이름 또는 초성으로 검색..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
              />
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <div className="max-h-48 overflow-y-auto p-3">
                {form.filteredStreamers.length === 0 ? (
                  <p className="py-6 text-sm text-center text-slate-400 font-bold">검색 결과가 없습니다</p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {form.filteredStreamers.map((s) => {
                      const isSelected = form.selectedIds.includes(s.id);
                      const color = form.getStreamerChipColor(s.id, s.colorCode);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => form.toggleStreamer(s.id)}
                          className="group flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div
                            className="relative shrink-0"
                            style={isSelected ? { outline: `3px solid ${color}`, outlineOffset: 2, borderRadius: 14 } : undefined}
                          >
                            <StreamerAvatar
                              name={s.name}
                              imgSrc={s.profileImg ?? getStreamerImagePath(s.name)}
                              colorCode={s.colorCode}
                              streamerId={s.id}
                              size="medium"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                                <Check className="w-5 h-5 text-white" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <span
                            className={`text-[11px] font-bold leading-tight text-center line-clamp-1 w-full transition-colors ${
                              isSelected
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {s.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 진행된 방송 */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5" />
                진행된 방송{' '}
                <span className="text-slate-300 normal-case font-bold">(선택)</span>
              </span>
            </label>
            <ScheduleSearchSelect
              schedules={form.filteredSchedules}
              value={form.scheduleId}
              onChange={form.setScheduleId}
              disabled={form.selectedIds.length === 0}
            />
          </div>

          {/* 클립 제목 */}
          <div className="space-y-1.5" data-zod-field="title">
            <label className={labelClass}>클립 제목 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
              placeholder="클립 제목을 입력하세요"
              className={inputClass}
            />
          </div>

          {/* 썸네일 */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              썸네일 URL{' '}
              <span className="text-slate-300 normal-case font-bold">(선택 · 치지직 자동 추출)</span>
            </label>
            {form.thumbnailUrl && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.thumbnailUrl}
                  alt="썸네일 미리보기"
                  className="w-full h-full object-cover"
                  onError={() => form.setThumbnailUrl('')}
                />
                <button
                  type="button"
                  onClick={() => form.setThumbnailUrl('')}
                  className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={form.thumbnailUrl}
                onChange={(e) => form.setThumbnailUrl(e.target.value)}
                placeholder="https://..."
                className={twMerge(inputClass, 'pl-10')}
              />
            </div>
          </div>

          {/* 날짜 & 설명 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>
                클립 날짜{' '}
                <span className="text-slate-300 normal-case font-bold">(선택)</span>
              </label>
              <input
                type="date"
                value={form.clipDate}
                onChange={(e) => form.setClipDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>
                설명{' '}
                <span className="text-slate-300 normal-case font-bold">(선택)</span>
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => form.setDescription(e.target.value)}
                placeholder="한줄 설명..."
                className={inputClass}
              />
            </div>
          </div>

          {form.error && (
            <p className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl">
              {form.error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={form.submitting}
              className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              {form.submitting
                ? form.isEdit ? '수정 중...' : '추가 중...'
                : form.isEdit ? '수정 완료' : '클립 추가'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
