// src/components/streamer/RequestEditModal.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Send, AlertCircle, Loader2 } from 'lucide-react';
import { createFeedbackAction } from '@/app/actions';
import { backdropVariants, defaultModalVariants } from '@/lib/modalVariants';
import type { Streamer } from '@prisma/client';
import type { RequestEditModalProps } from '@/types/components';

export default function RequestEditModal({
  streamer,
  onClose,
}: RequestEditModalProps) {
  const [category, setCategory] = useState('잘못된 핸들/닉네임');
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return alert('상세 내용을 입력해주세요!');

    setIsPending(true);

    try {
      // 🌟 서버 액션 호출
      const result = await createFeedbackAction({
        streamerId: streamer.id,
        streamerName: streamer.name,
        category,
        content,
      });

      if (result.success) {
        alert(
          `${streamer.name}님에 대한 수정 요청이 성공적으로 접수되었습니다!`,
        );
        onClose();
      } else {
        alert(result.error || '요청 중 오류가 발생했습니다.');
      }
    } catch (error) {
      alert('서버와 통신 중 문제가 발생했습니다.');
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
      className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={isPending ? undefined : onClose}
    >
      <motion.div
        variants={defaultModalVariants}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-500" />
                정보 수정 요청
              </h3>
              <p className="text-sm text-slate-400 font-bold mt-1">
                <span style={{ color: streamer.colorCode }}>
                  {streamer.name}
                </span>{' '}
                님의 정보를 바로잡아주세요.
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 px-1">
                수정 사유
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isPending}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
              >
                <option>잘못된 핸들/닉네임</option>
                <option>기수(세대) 정보 오류</option>
                <option>플랫폼 주소 변경</option>
                <option>기타 오타 및 오류</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 px-1">
                상세 내용
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPending}
                placeholder="어떤 부분이 틀렸나요? 정확한 정보를 적어주시면 큰 도움이 됩니다!"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none disabled:opacity-50"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all text-sm disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 text-sm disabled:bg-indigo-400"
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
        </div>
      </motion.div>
    </motion.div>
  );
}
