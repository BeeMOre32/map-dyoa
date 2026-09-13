'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Loader2, LogIn, X } from 'lucide-react';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import { upsertBongnudoProfileAction } from '@/app/bongnudo/actions';
import {
  BONGNUDO2_FACTIONS,
  BONGNUDO2_GANGS,
  BONGNUDO2_OCCUPATIONS,
  BONGNUDO2_ORGS,
  BONGNUDO2_PATH,
  bongnudoFactionLabel,
} from '@/config/bongnudo2';
import { mergeBongnudoProfile } from '@/lib/bongnudo-profiles';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useModalDismiss } from '@/hooks/useModalDismiss';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useToast } from '@/components/Common/Toaster';
import { markModalSoftNav } from '@/lib/modal-navigation';
import { emptyBongnudoProfile, type BongnudoProfileView } from '@/lib/bongnudo-profiles';
import type { Streamer } from '@prisma/client';

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-indigo-800';
const labelClass = 'text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500';

interface BongnudoRpModalProps {
  streamer: Streamer;
  profile: BongnudoProfileView | null;
  guest?: boolean;
  onClose: () => void;
  onSaved: (profile: BongnudoProfileView) => void;
}

export default function BongnudoRpModal({
  streamer,
  profile,
  guest = false,
  onClose,
  onSaved,
}: BongnudoRpModalProps) {
  const dismiss = useModalDismiss({ mother: BONGNUDO2_PATH, onClose });
  useEscapeKey(dismiss);
  useScrollLock();
  const { data: session } = useSession();
  const toast = useToast();
  const canEdit = Boolean(session);
  const initial = mergeBongnudoProfile(
    streamer.name,
    profile ?? emptyBongnudoProfile(streamer.id),
    streamer.id,
  );

  const [rpName, setRpName] = useState(initial.rpName);
  const [occupation, setOccupation] = useState(initial.occupation);
  const [factionId, setFactionId] = useState(initial.factionId);
  const [concept, setConcept] = useState(initial.concept);
  const [notes, setNotes] = useState(initial.notes);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit || pending) return;
    setPending(true);
    setError(null);
    const result = await upsertBongnudoProfileAction({
      streamerId: streamer.id,
      rpName,
      occupation,
      factionId,
      concept,
      notes,
    });
    setPending(false);
    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    onSaved(result.data);
    toast.success('RP 정보를 저장했습니다.');
    dismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={pending ? undefined : dismiss} />
      <div className="relative flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <StreamerAvatar
              name={streamer.name}
              imgSrc={streamer.profileImg}
              colorCode={streamer.colorCode}
              streamerId={streamer.id}
              size="medium"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                봉누도 2 RP
              </p>
              <h2 className="truncate text-lg font-black text-slate-800 dark:text-white">{streamer.name}</h2>
              {guest ? (
                <span className="mt-0.5 inline-block rounded-full bg-slate-200 px-1.5 py-px text-[9px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  게스트
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            disabled={pending}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
          <Field label="RP 이름">
            {canEdit ? (
              <input
                className={inputClass}
                value={rpName}
                onChange={(event) => setRpName(event.target.value)}
                maxLength={40}
                placeholder="인게임에서 쓰는 이름"
              />
            ) : (
              <ReadValue value={rpName} empty="아직 없어요" />
            )}
          </Field>
          <Field label="직업 · 직함">
            {canEdit ? (
              <select
                className={inputClass}
                value={occupation}
                onChange={(event) => {
                  const next = event.target.value;
                  setOccupation(next);
                  const preset = BONGNUDO2_OCCUPATIONS.find((row) => row.label === next);
                  if (preset) setFactionId(preset.factionId);
                }}
              >
                <option value="">나중에 정함</option>
                {BONGNUDO2_OCCUPATIONS.map((row) => (
                  <option key={row.id} value={row.label}>
                    {row.label}
                  </option>
                ))}
                {occupation &&
                !BONGNUDO2_OCCUPATIONS.some((row) => row.label === occupation) ? (
                  <option value={occupation}>{occupation}</option>
                ) : null}
              </select>
            ) : (
              <ReadValue value={occupation} empty="아직 없어요" />
            )}
          </Field>
          <Field label="소속 · 집단">
            {canEdit ? (
              <select
                className={inputClass}
                value={factionId}
                onChange={(event) => setFactionId(event.target.value)}
              >
                <option value="">나중에 정함</option>
                {BONGNUDO2_ORGS.length > 0 ? (
                  <optgroup label="공공 · 기타">
                    {BONGNUDO2_ORGS.map((faction) => (
                      <option key={faction.id} value={faction.id}>
                        {faction.label}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
                <optgroup label="갱단">
                  {BONGNUDO2_GANGS.length > 0 ? (
                    BONGNUDO2_GANGS.map((faction) => (
                      <option key={faction.id} value={faction.id}>
                        {faction.label}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      아직 없음 · 설정에서 추가 예정
                    </option>
                  )}
                </optgroup>
                {factionId && !BONGNUDO2_FACTIONS.some((faction) => faction.id === factionId) ? (
                  <option value={factionId}>{factionId}</option>
                ) : null}
              </select>
            ) : (
              <ReadValue value={bongnudoFactionLabel(factionId)} empty="아직 없어요" />
            )}
          </Field>
          <Field label="컨셉">
            {canEdit ? (
              <input
                className={inputClass}
                value={concept}
                onChange={(event) => setConcept(event.target.value)}
                maxLength={200}
                placeholder="한 줄로 캐릭터 컨셉"
              />
            ) : (
              <ReadValue value={concept} empty="아직 없어요" />
            )}
          </Field>
          <Field label="메모">
            {canEdit ? (
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={2000}
                placeholder="관계, 사건, 알아두면 좋은 점"
              />
            ) : (
              <ReadValue value={notes} empty="아직 없어요" />
            )}
          </Field>

          {error ? <p className="text-xs font-bold text-red-500">{error}</p> : null}

          {canEdit ? (
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-black text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              저장
            </button>
          ) : (
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(BONGNUDO2_PATH)}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-900"
            >
              <LogIn className="h-4 w-4" />
              로그인하고 수정
            </Link>
          )}

          <Link
            href={`/streamers/detail/${streamer.id}`}
            scroll={false}
            onClick={markModalSoftNav}
            className="block text-center text-[11px] font-black text-slate-400 hover:underline"
          >
            멤버 프로필 보기
          </Link>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function ReadValue({ value, empty }: { value: string; empty: string }) {
  return (
    <p
      className={`rounded-2xl bg-slate-50 px-3 py-2.5 text-sm font-medium dark:bg-slate-800 ${
        value ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'
      }`}
    >
      {value || empty}
    </p>
  );
}
