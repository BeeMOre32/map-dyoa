'use client';

import { useState, useMemo } from 'react';
import { X, Link as LinkIcon, Clapperboard, Tv, Search, Users, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { backdropVariants, smoothModalVariants } from '@/lib/modalVariants';
import { createClipAction } from '@/app/actions';
import { getStreamerColor } from '@/constants/streamercolor';
import { useTheme } from 'next-themes';
import type { Streamer } from '@prisma/client';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import ScheduleSearchSelect from './ScheduleSearchSelect';

interface CreateClipModalProps {
  streamers: Streamer[];
  schedules: FlattenedSchedule[];
  onClose: () => void;
}

export default function CreateClipModal({
  streamers,
  schedules,
  onClose,
}: CreateClipModalProps) {
  const { resolvedTheme } = useTheme();

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [description, setDescription] = useState('');
  const [clipDate, setClipDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [streamerSearch, setStreamerSearch] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEscapeKey(onClose);

  const filteredStreamers = useMemo(() => {
    const q = streamerSearch.trim().toLowerCase();
    if (!q) return streamers;
    return streamers.filter((s) => s.name.toLowerCase().includes(q));
  }, [streamers, streamerSearch]);

  const filteredSchedules = useMemo(() => {
    if (selectedIds.length === 0) return schedules;
    return schedules.filter((s) =>
      s.participants.some((p) => selectedIds.includes(p.id)),
    );
  }, [selectedIds, schedules]);

  function toggleStreamer(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setScheduleId('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title.trim()) return setError('제목을 입력해주세요.');
    if (!url.trim()) return setError('클립 URL을 입력해주세요.');
    if (selectedIds.length === 0)
      return setError('연관된 스트리머를 최소 1명 선택해주세요.');

    setSubmitting(true);
    const result = await createClipAction({
      title: title.trim(),
      url: url.trim(),
      streamerIds: selectedIds,
      scheduleId: scheduleId || undefined,
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      description: description.trim() || undefined,
      clipDate: clipDate ? new Date(clipDate) : undefined,
    });
    setSubmitting(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error ?? '오류가 발생했습니다.');
    }
  }

  const inputClass =
    'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all';
  const labelClass =
    'text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider';

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
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
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
            <h2 className="text-lg font-black text-slate-800 dark:text-white">클립 추가</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

          {/* ── 클립 URL ── */}
          <div className="space-y-1.5">
            <label className={labelClass}>클립 URL *</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://chzzk.naver.com/clips/..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
              />
            </div>
          </div>

          {/* ── 연관된 스트리머 ── */}
          <div className="space-y-2">
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                연관된 스트리머 *
              </span>
            </label>

            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedIds.map((id) => {
                  const s = streamers.find((x) => x.id === id);
                  if (!s) return null;
                  const color = getStreamerColor(s.id, resolvedTheme === 'dark') ?? s.colorCode;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleStreamer(id)}
                      className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-xl text-[11px] font-black text-white transition-opacity hover:opacity-80"
                      style={{ backgroundColor: color }}
                    >
                      {s.name}
                      <X className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="relative border-b border-slate-100 dark:border-slate-800">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={streamerSearch}
                  onChange={(e) => setStreamerSearch(e.target.value)}
                  placeholder="이름으로 검색..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
                />
              </div>
              <ul className="max-h-36 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {filteredStreamers.length === 0 ? (
                  <li className="px-4 py-4 text-sm text-center text-slate-400 font-bold">
                    검색 결과가 없습니다
                  </li>
                ) : (
                  filteredStreamers.map((s) => {
                    const isSelected = selectedIds.includes(s.id);
                    const color = getStreamerColor(s.id, resolvedTheme === 'dark') ?? s.colorCode;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => toggleStreamer(s.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-900/20'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span
                            className={`text-sm font-bold flex-1 ${
                              isSelected
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {s.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">
                              선택됨
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>

          {/* ── 진행된 방송 ── */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              <span className="flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5" />
                진행된 방송{' '}
                <span className="text-slate-300 normal-case font-bold">(선택)</span>
              </span>
            </label>
            <ScheduleSearchSelect
              schedules={filteredSchedules}
              value={scheduleId}
              onChange={setScheduleId}
              disabled={selectedIds.length === 0}
            />
          </div>

          {/* ── 클립 제목 ── */}
          <div className="space-y-1.5">
            <label className={labelClass}>클립 제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="클립 제목을 입력하세요"
              className={inputClass}
            />
          </div>

          {/* ── 썸네일 URL ── */}
          <div className="space-y-1.5">
            <label className={labelClass}>
              썸네일 URL{' '}
              <span className="text-slate-300 normal-case font-bold">(선택)</span>
            </label>
            {/* 치지직 안내 */}
            <div className="flex items-start gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                치지직은 공개 API가 없어 자동 추출이 불가합니다.
                클립 페이지에서 썸네일을 직접 복사해 붙여넣어 주세요.
              </p>
            </div>
            {thumbnailUrl && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailUrl}
                  alt="썸네일 미리보기"
                  className="w-full h-full object-cover"
                  onError={() => setThumbnailUrl('')}
                />
                <button
                  type="button"
                  onClick={() => setThumbnailUrl('')}
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
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-all"
              />
            </div>
          </div>

          {/* ── 날짜 & 설명 ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelClass}>
                클립 날짜{' '}
                <span className="text-slate-300 normal-case font-bold">(선택)</span>
              </label>
              <input
                type="date"
                value={clipDate}
                onChange={(e) => setClipDate(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="한줄 설명..."
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl">
              {error}
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
              disabled={submitting}
              className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              {submitting ? '추가 중...' : '클립 추가'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
