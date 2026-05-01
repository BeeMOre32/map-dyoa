// src/components/streamer/RequestEditModal.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Send, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { createFeedbackAction } from '@/app/actions';
import { feedbackSchema } from '@/lib/schemas';
import { backdropVariants, defaultModalVariants } from '@/lib/modalVariants';
import { getStreamerColor } from '@/constants/streamercolor';
import type { Streamer } from '@prisma/client';


interface RequestEditModalProps {
  streamer: Streamer;
  onClose: () => void;
}

export default function RequestEditModal({
  streamer,
  onClose,
}: RequestEditModalProps) {
  const { resolvedTheme } = useTheme();
  const streamerColor = getStreamerColor(streamer.id, resolvedTheme === 'dark') ?? streamer.colorCode;
  const [category, setCategory] = useState('잘못된 핸들/닉네임');
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = feedbackSchema.pick({ content: true }).safeParse({ content });
    if (!parsed.success) {
      setContentError(parsed.error.issues[0].message);
      return;
    }
    setContentError(null);
    setSubmitError(null);
    setIsPending(true);

    try {
      const result = await createFeedbackAction({
        streamerId: streamer.id,
        streamerName: streamer.name,
        category,
        content,
      });

      if (result.success) {
        setIsSuccess(true);
        setTimeout(onClose, 1800);
      } else {
        setSubmitError(result.error || '요청 중 오류가 발생했습니다.');
      }
    } catch {
      setSubmitError('서버와 통신 중 문제가 발생했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
      onClick={isPending ? undefined : onClose}
    >
      <motion.div
        variants={defaultModalVariants}
        className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 overflow-hidden border border-slate-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 bg-slate-50/50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                정보 수정 요청
              </h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 font-bold mt-1">
                <span style={{ color: streamerColor }}>
                  {streamer.name}
                </span>{' '}
                님의 정보를 바로잡아주세요.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-30"
            >
              <X className="w-5 h-5 text-slate-400 dark:text-slate-600" />
            </button>
          </div>

          {isSuccess ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <p className="font-black text-slate-800 dark:text-white">
                수정 요청이 접수되었습니다!
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                잠시 후 자동으로 닫힙니다.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
                  수정 사유
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all disabled:opacity-50"
                >
                  <option>잘못된 핸들/닉네임</option>
                  <option>기수(세대) 정보 오류</option>
                  <option>플랫폼 주소 변경</option>
                  <option>기타 오타 및 오류</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
                  상세 내용
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (contentError) setContentError(null);
                  }}
                  disabled={isPending}
                  placeholder="어떤 부분이 틀렸나요? 정확한 정보를 적어주시면 큰 도움이 됩니다!"
                  className={`w-full bg-slate-50 dark:bg-slate-700 border rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all resize-none disabled:opacity-50 ${
                    contentError ? 'border-red-400 dark:border-red-500' : 'border-slate-100 dark:border-slate-600'
                  }`}
                />
                {contentError && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {contentError}
                  </p>
                )}
              </div>

              {submitError && (
                <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {submitError}
                </p>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-sm disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-2 py-4 bg-indigo-600 dark:bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 dark:hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-950 flex items-center justify-center gap-2 text-sm disabled:bg-indigo-400 dark:disabled:bg-indigo-800"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      보내는 중...
                    </>
                  ) : (
                    <>
                      요청 보내기 <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
