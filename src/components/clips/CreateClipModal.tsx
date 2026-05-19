'use client';

import { X, Link as LinkIcon, Clapperboard, Tv, Search, Users, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { useScrollLock } from '@/hooks/useScrollLock';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { clipModalRevealContainer, clipModalRevealItem } from '@/lib/clipMotion';
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
  const dismiss = useModalDismiss({ mother: '/clips', onClose });
  const form = useClipForm(streamers, schedules, dismiss, initialData);
  useEscapeKey(dismiss);
  useScrollLock();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />
      <motion.div
        className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
        variants={smoothModalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* 헤더 */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800 sm:p-6">
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
            onClick={dismiss}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <motion.form
          id="clip-form"
          onSubmit={form.handleSubmit}
          variants={clipModalRevealContainer}
          initial="hidden"
          animate="visible"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
        >
          {/* 클립 URL */}
          <motion.section variants={clipModalRevealItem} className="space-y-1.5" data-zod-field="url">
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
          </motion.section>

          {/* 연관된 스트리머 */}
          <motion.section variants={clipModalRevealItem} className="space-y-2" data-zod-field="streamerIds">
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
                          className="flex items-center gap-1 rounded-xl py-1 pl-2.5 pr-1.5 text-[11px] font-black text-white transition-opacity hover:opacity-80"
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
          </motion.section>

          {/* 진행된 방송 */}
          <motion.section variants={clipModalRevealItem} className="space-y-1.5">
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
          </motion.section>

          {/* 클립 제목 */}
          <motion.section variants={clipModalRevealItem} className="space-y-1.5" data-zod-field="title">
            <label className={labelClass}>클립 제목 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
              placeholder="클립 제목을 입력하세요"
              className={inputClass}
            />
          </motion.section>

          {/* 썸네일 */}
          <motion.section variants={clipModalRevealItem} className="space-y-1.5">
            <label className={labelClass}>
              썸네일 URL{' '}
              <span className="text-slate-300 normal-case font-bold">(선택 · 치지직 자동 추출)</span>
            </label>
            <AnimatePresence mode="wait">
              {form.thumbnailUrl && (
                <motion.div
                  key={form.thumbnailUrl}
                  initial={{ opacity: 0, height: 0, scale: 0.98 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.98 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 340 }}
                  className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.thumbnailUrl}
                    alt="썸네일 미리보기"
                    className="h-full w-full object-cover"
                    onError={() => form.setThumbnailUrl('')}
                  />
                  <button
                    type="button"
                    onClick={() => form.setThumbnailUrl('')}
                    className="absolute right-2 top-2 rounded-lg bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
          </motion.section>

          {/* 날짜 & 설명 */}
          <motion.section variants={clipModalRevealItem} className="grid grid-cols-2 gap-3">
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
          </motion.section>

          <AnimatePresence>
            {form.error && (
              <motion.p
                key={form.error}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500 dark:bg-red-900/20"
              >
                {form.error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div variants={clipModalRevealItem} className="flex gap-3 pt-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={dismiss}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              취소
            </motion.button>
            <motion.button
              type="submit"
              disabled={form.submitting}
              whileTap={{ scale: form.submitting ? 1 : 0.98 }}
              className="flex-1 rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none"
            >
              {form.submitting
                ? form.isEdit ? '수정 중...' : '추가 중...'
                : form.isEdit ? '수정 완료' : '클립 추가'}
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}
