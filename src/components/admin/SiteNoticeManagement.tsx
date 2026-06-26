'use client';

import { useState, useTransition, useEffect } from 'react';
import {
  Plus, SquarePen, Trash2, Megaphone, X, Check,
  AlertTriangle, Info, Eye, EyeOff,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  createSiteNoticeAction,
  updateSiteNoticeAction,
  toggleSiteNoticeAction,
  deleteSiteNoticeAction,
  type SiteNoticeInput,
} from '@/app/actions';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import type { AdminSiteNoticeRow, SiteNoticeRow } from '@/lib/data-fetching';

type Level = 'INFO' | 'WARNING' | 'URGENT';

type NoticeDraft = {
  level: Level;
  title: string;
  body: string;
};

const BACKEND_INCIDENT_DRAFT: NoticeDraft = {
  level: 'WARNING',
  title: '백엔드 서버 응답 지연·장애 안내',
  body: '일정 API(map-dyoa-server) 자동 헬스 체크에서 이상이 감지되었습니다. 일시적으로 일정·캘린더 로딩이 느리거나 실패할 수 있습니다. 복구 후 이 공지를 내리겠습니다.',
};

const LEVELS: { value: Level; label: string; cls: string }[] = [
  { value: 'INFO', label: '정보', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { value: 'WARNING', label: '주의', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 'URGENT', label: '긴급', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
];

/** Date → datetime-local 입력값 (로컬 타임존) */
function toLocalInput(d: Date | null): string {
  if (!d) return '';
  const dt = new Date(d);
  const off = dt.getTimezoneOffset();
  return new Date(dt.getTime() - off * 60000).toISOString().slice(0, 16);
}

function fromLocalInput(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

function NoticeFormModal({
  initial,
  draft,
  onClose,
}: {
  initial?: SiteNoticeRow;
  draft?: NoticeDraft;
  onClose: () => void;
}) {
  const router = useRouter();
  const dismiss = useModalDismiss({ mother: '/admin/notices', onClose });
  useEscapeKey(dismiss);
  const [isPending, startTransition] = useTransition();
  const [level, setLevel] = useState<Level>(
    (initial?.level as Level) ?? draft?.level ?? 'URGENT',
  );
  const [title, setTitle] = useState(initial?.title ?? draft?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? draft?.body ?? '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.endsAt ?? null));
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload: SiteNoticeInput = {
      level,
      title,
      body: body.trim() || null,
      active,
      startsAt: fromLocalInput(startsAt),
      endsAt: fromLocalInput(endsAt),
    };
    startTransition(async () => {
      const result = initial
        ? await updateSiteNoticeAction(initial.id, payload)
        : await createSiteNoticeAction(payload);
      if (result.success) {
        router.refresh();
        dismiss();
      } else {
        setError(result.error ?? '오류가 발생했습니다.');
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={dismiss}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">
            {initial ? '공지 수정' : '긴급 공지 추가'}
          </h2>
          <button onClick={dismiss} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">중요도</label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(l.value)}
                  className={`py-2.5 rounded-2xl text-sm font-black transition-all border ${
                    level === l.value
                      ? `${l.cls} border-transparent ring-2 ring-offset-1 ring-current`
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 서버 점검 중입니다"
              maxLength={120}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">본문 (선택)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="상세 안내 내용을 입력하세요."
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">게시 시작 (선택)</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">자동 만료 (선택)</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActive(!active)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">지금 게시(활성)</span>
            <div className={`w-10 h-6 rounded-full relative transition-colors ${active ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </button>

          {level === 'URGENT' && (
            <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-2xl">
              긴급 공지는 사용자가 닫을 수 없습니다. 상황이 끝나면 비활성화하거나 만료 시각을 지정하세요.
            </p>
          )}

          {error && (
            <p className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-2xl">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={dismiss} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              취소
            </button>
            <button type="submit" disabled={isPending} className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
              {isPending ? '처리 중...' : initial ? '수정 완료' : '추가'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteNoticeButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => startTransition(async () => {
            await deleteSiteNoticeAction(id);
            router.refresh();
          })}
          disabled={isPending}
          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
        </button>
        <button onClick={() => setConfirm(false)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-xl transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title="삭제"
      className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-slate-100 dark:bg-slate-700 rounded-xl"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

function ToggleNoticeButton({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(async () => {
        await toggleSiteNoticeAction(id, !active);
        router.refresh();
      })}
      disabled={isPending}
      title={active ? '내리기' : '게시하기'}
      className={`p-2 rounded-xl transition-colors disabled:opacity-50 ${
        active
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600'
      }`}
    >
      {active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
    </button>
  );
}

export default function SiteNoticeManagement({
  notices,
}: {
  notices: AdminSiteNoticeRow[];
}) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<NoticeDraft | undefined>();
  const [editing, setEditing] = useState<SiteNoticeRow | null>(null);

  useEffect(() => {
    if (searchParams.get('compose') === 'backend-incident') {
      setCreateDraft(BACKEND_INCIDENT_DRAFT);
      setCreateOpen(true);
    }
  }, [searchParams]);

  return (
    <div className="p-8 space-y-6 bg-white dark:bg-slate-950 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">긴급 공지</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">
            서버 장애·점검 등 사이트 상단 배너로 노출할 공지를 관리합니다.
          </p>
        </div>
        <button
          onClick={() => {
            setCreateDraft(undefined);
            setCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          공지 추가
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
            <Megaphone className="w-10 h-10 opacity-40" />
            <p className="font-bold text-sm">등록된 공지가 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {notices.map((n) => {
              const lv = LEVELS.find((l) => l.value === n.level)!;
              const live = n.status === 'live';
              return (
                <div key={n.id} className="flex items-center gap-4 px-6 py-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${lv.cls}`}>
                    {n.level === 'INFO'
                      ? <Info className="w-5 h-5" />
                      : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-[10px] font-black rounded ${lv.cls}`}>{lv.label}</span>
                      {live ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-black rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          노출 중
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-black rounded bg-slate-100 text-slate-400 dark:bg-slate-700">
                          {n.status === 'inactive' ? '비활성' : n.status === 'expired' ? '만료됨' : '예약'}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate mt-1">{n.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                      {n.startsAt && `시작 ${format(new Date(n.startsAt), 'M/d HH:mm', { locale: ko })} · `}
                      {n.endsAt ? `만료 ${format(new Date(n.endsAt), 'M/d HH:mm', { locale: ko })}` : '만료 없음'}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <ToggleNoticeButton id={n.id} active={n.active} />
                    <button
                      onClick={() => setEditing(n)}
                      className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors bg-slate-100 dark:bg-slate-700 rounded-xl"
                    >
                      <SquarePen className="w-4 h-4" />
                    </button>
                    <DeleteNoticeButton id={n.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {(createOpen || editing) && (
          <NoticeFormModal
            initial={editing ?? undefined}
            draft={editing ? undefined : createDraft}
            onClose={() => {
              setCreateOpen(false);
              setCreateDraft(undefined);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
