// src/components/calendar/CreateStreamerModal.tsx
'use client';

import { useState } from 'react';
import { X, UserPlus, Check, Palette, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { createStreamerAction } from '@/app/actions';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const streamerSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  handle: z
    .string()
    .min(1, '영문 ID를 입력해주세요.')
    .regex(/^[a-z0-9_]+$/, '영문 소문자, 숫자, 밑줄(_)만 사용 가능합니다.'),
});

type StreamerErrors = Partial<Record<keyof z.infer<typeof streamerSchema> | 'submit', string>>;

// 캘린더에 예쁘게 보일 추천 파스텔 색상 목록
const PASTEL_COLORS = [
  { name: '블루', hex: '#3b82f6' },
  { name: '로즈', hex: '#f43f5e' },
  { name: '민트', hex: '#10b981' },
  { name: '앰버', hex: '#f59e0b' },
  { name: '퍼플', hex: '#8b5cf6' },
  { name: '핑크', hex: '#ec4899' },
  { name: '스카이', hex: '#0ea5e9' },
  { name: '그레이', hex: '#64748b' },
];

export default function CreateStreamerModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [generation, setGeneration] = useState<number>(1);
  const [role, setRole] = useState('');
  const [colorCode, setColorCode] = useState(PASTEL_COLORS[0].hex);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chzzkUrl, setChzzkUrl] = useState('');
  const [errors, setErrors] = useState<StreamerErrors>({});

  useEscapeKey(onClose);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = streamerSchema.safeParse({ name, handle });
    if (!parsed.success) {
      const fieldErrors: StreamerErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof StreamerErrors;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    const payload = { name, handle, generation, role, platform: 'chzzk', colorCode, chzzkUrl };
    const result = await createStreamerAction(payload);

    setIsSubmitting(false);

    if (result.success) onClose();
    else setErrors({ submit: '스트리머 추가에 실패했습니다. 다시 시도해주세요.' });
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl dark:shadow-slate-900/50 overflow-hidden animate-in zoom-in-95 border border-slate-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-start bg-slate-50/50 dark:bg-slate-700/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                New Member
              </p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                인원 추가
              </h3>
              <h5 className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                프로필 사진 기능은 추후 업데이트 예정입니다!
              </h5>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-400 dark:text-slate-600" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 max-h-[60vh] overflow-y-auto"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
                }}
                placeholder="예) 위구리"
                className={`w-full p-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 outline-none transition-all ${
                  errors.name ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                }`}
              />
              {errors.name && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                영문 ID (고유값)
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => {
                  setHandle(e.target.value);
                  if (errors.handle) setErrors((er) => ({ ...er, handle: undefined }));
                }}
                placeholder="예) overracoon"
                className={`w-full p-3 bg-slate-50 dark:bg-slate-700 border rounded-xl font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 outline-none transition-all ${
                  errors.handle ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
                }`}
              />
              {errors.handle && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {errors.handle}
                </p>
              )}
            </div>
          </div>

          <div className="flex grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                기수
              </label>
              <input
                type="number"
                value={generation}
                onChange={(e) => setGeneration(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                역할 (선택)
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="예) 부장, 멤버 등"
                className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
              치지직 주소 (선택)
            </label>
            <input
              type="url"
              value={chzzkUrl}
              onChange={(e) => setChzzkUrl(e.target.value)}
              placeholder="https://chzzk.naver.com/..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 outline-none transition-all"
            />
          </div>

          {/* 🌟 고유 색상 설정 영역 🌟 */}
          <div className="p-5 border border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-700 shadow-sm">
            <label className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white mb-4">
              <Palette className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />{' '}
              고유 색상 설정
            </label>

            {/* 1. 추천 색상 */}
            <div className="mb-5">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-2 uppercase">
                추천 파스텔 톤
              </p>
              <div className="flex flex-wrap gap-2.5">
                {PASTEL_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setColorCode(color.hex)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-sm ${colorCode.toLowerCase() === color.hex.toLowerCase() ? 'ring-2 ring-offset-2 ring-indigo-400 dark:ring-offset-slate-700 scale-110' : 'opacity-80 hover:opacity-100'}`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {colorCode.toLowerCase() === color.hex.toLowerCase() && (
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 사용자 지정 색상 (Color Picker + Hex Input) */}
            <div className="mb-5">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-2 uppercase">
                직접 지정 (RGB / HEX)
              </p>
              <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                {/* HTML 기본 Color Picker (테두리를 숨겨 예쁘게 디자인) */}
                <div className="relative w-10 h-10 rounded-lg overflow-hidden shadow-sm border border-slate-200 dark:border-slate-500 shrink-0">
                  <input
                    type="color"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                  />
                </div>
                {/* 텍스트 입력창 (직접 타이핑 가능) */}
                <input
                  type="text"
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                  placeholder="#000000"
                  className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 dark:text-white uppercase tracking-wider"
                  maxLength={7}
                />
              </div>
            </div>

            {/* 3. 캘린더 렌더링 미리보기 */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-600 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                달력 표시 미리보기
              </span>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold shadow-sm bg-white dark:bg-slate-600"
                style={{
                  color: colorCode,
                  border: `1px solid ${colorCode}40`,
                  backgroundColor: `${colorCode}10`,
                }}
              >
                {name || '스트리머'}{' '}
                {role && (
                  <span className="opacity-60 text-[10px]">({role})</span>
                )}
              </span>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="p-6 bg-slate-50 dark:bg-slate-700 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-600">
            {errors.submit && (
              <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errors.submit}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-2xl font-bold border border-slate-200 dark:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-500 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 bg-indigo-600 dark:bg-indigo-600 text-white dark:text-white rounded-2xl font-bold hover:bg-indigo-700 dark:hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isSubmitting ? '저장 중...' : '인원 추가하기'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
