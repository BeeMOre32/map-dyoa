'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Clapperboard, ExternalLink, LayoutGrid, Radio } from 'lucide-react';
import ClipCard from '@/components/clips/ClipCard';
import CreateClipModal from '@/components/clips/CreateClipModal';
import StreamerAvatar from '@/components/streamer/StreamerAvatar';
import BongnudoRpModal from '@/components/bongnudo/BongnudoRpModal';
import { useSession } from 'next-auth/react';
import { mergeBongnudoProfile, type BongnudoProfileView } from '@/lib/bongnudo-profiles';
import {
  BONGNUDO2_CLIP_QUERY,
  BONGNUDO2_END_DATE,
  BONGNUDO2_HOLIDAYS,
  BONGNUDO2_MULTIVIEW_PATH,
  BONGNUDO2_NAMU_URL,
  BONGNUDO2_PATH,
  BONGNUDO2_START_DATE,
  BONGNUDO2_TITLE,
  bongnudoFactionLabel,
} from '@/config/bongnudo2';
import { useLiveStatus } from '@/hooks/useLiveStatus';
import { getBongnudoStatus, listBongnudoDays, type BongnudoDay } from '@/lib/bongnudo';
import { kstDateKey } from '@/lib/hoi4-exam-time';
import { MAX_STREAMS } from '@/components/multiview/utils';
import type { FlattenedSchedule } from '@/lib/schedule-formatters';
import type { Streamer } from '@prisma/client';
import type { ClipWithParticipants } from '@/types/entities';

const PHASE_TONE: Record<ReturnType<typeof getBongnudoStatus>['phase'], string> = {
  live: 'bg-emerald-500 text-white',
  prep: 'bg-sky-500 text-white',
  holiday: 'bg-slate-500 text-white',
  offhours: 'bg-indigo-500 text-white',
  upcoming: 'bg-indigo-500 text-white',
  ended: 'bg-slate-400 text-white',
};

interface BongnudoViewProps {
  members: Streamer[];
  guests: Streamer[];
  unmatchedNames: string[];
  unmatchedGuests: string[];
  profiles: BongnudoProfileView[];
  schedules: FlattenedSchedule[];
  clipCatalogStreamers: Streamer[];
  clipCatalogSchedules: FlattenedSchedule[];
  clips: ClipWithParticipants[];
  initialLiveIds?: string[];
}

export default function BongnudoView({
  members,
  guests,
  unmatchedNames,
  unmatchedGuests,
  profiles,
  schedules,
  clipCatalogStreamers,
  clipCatalogSchedules,
  clips,
  initialLiveIds,
}: BongnudoViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showClipModal, setShowClipModal] = useState(false);
  const [hubTab, setHubTab] = useState<'members' | 'clips'>('members');
  const participants = useMemo(() => [...members, ...guests], [members, guests]);
  const { liveIds } = useLiveStatus(initialLiveIds);
  const [selected, setSelected] = useState<string[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, BongnudoProfileView>>(() => {
    const saved = Object.fromEntries(profiles.map((row) => [row.streamerId, row]));
    return Object.fromEntries(
      [...members, ...guests].map((person) => [
        person.id,
        mergeBongnudoProfile(person.name, saved[person.id], person.id),
      ]),
    );
  });
  const [rpTarget, setRpTarget] = useState<{ streamer: Streamer; guest: boolean } | null>(null);
  const status = useMemo(() => getBongnudoStatus(), []);
  const days = useMemo(() => listBongnudoDays(), []);
  const scheduleCountByDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const schedule of schedules) {
      const key = kstDateKey(schedule.startTime);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [schedules]);
  const liveOnAir = useMemo(
    () => [...members, ...guests].filter((person) => liveIds.has(person.id)),
    [members, guests, liveIds],
  );
  const holidayLabel = BONGNUDO2_HOLIDAYS.map((d) => d.slice(5).replace('-', '.')).join(', ');

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= MAX_STREAMS) return prev;
      return [...prev, id];
    });
  };

  const openSelectedMultiview = () => {
    if (selected.length === 0) return;
    router.push(`/live/multiview?ids=${selected.join(',')}`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white transition-colors dark:bg-slate-950">
      <header className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-5 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                봉누도 2
              </h1>
              <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500">
                GTA5 RP · 지도동 멤버 · 달력 · 클립 · 멀티뷰
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${PHASE_TONE[status.phase]}`}>
              {status.label}
            </span>
          </div>
          <p className="mt-2 text-[12px] font-bold text-slate-500 dark:text-slate-400">
            {status.detail} · {BONGNUDO2_START_DATE.replaceAll('-', '.')}–{BONGNUDO2_END_DATE.replaceAll('-', '.')}
            {' · '}18:00–03:00 · 금휴 {holidayLabel}
            {liveOnAir.length > 0 ? ` · LIVE ${liveOnAir.length}` : ''}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`${BONGNUDO2_MULTIVIEW_PATH}?live=1`}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-3.5 py-2 text-xs font-black text-white hover:bg-indigo-500"
            >
              <Radio className="h-3.5 w-3.5" />
              방송 중 멀티뷰
              {liveOnAir.length > 0 ? ` ${liveOnAir.length}` : ''}
            </Link>
            <Link
              href={BONGNUDO2_MULTIVIEW_PATH}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              지도동 전체
            </Link>
            <Link
              href={`/clips?q=${encodeURIComponent(BONGNUDO2_CLIP_QUERY)}`}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Clapperboard className="h-3.5 w-3.5" />
              클립
            </Link>
            <a
              href={BONGNUDO2_NAMU_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              나무위키
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-5">
        <section className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <SectionLabel>시즌 달력</SectionLabel>
            <span className="text-[10px] font-bold text-slate-400">18:00–익일 03:00</span>
          </div>
          <SeasonCalendar days={days} scheduleCountByDay={scheduleCountByDay} />
        </section>

        <section className="space-y-2">
          <SectionLabel>일정</SectionLabel>
          <SeriesScheduleCard
            livePeople={liveOnAir}
            rosterCount={participants.length}
            status={status}
          />
        </section>

        <div className="sticky top-0 z-10 -mx-4 border-b border-slate-100 bg-white/95 px-4 py-2 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95 sm:-mx-5 sm:px-5">
          <div className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
            <HubTab
              active={hubTab === 'members'}
              onClick={() => setHubTab('members')}
              label={`멤버 ${members.length}`}
            />
            <HubTab
              active={hubTab === 'clips'}
              onClick={() => setHubTab('clips')}
              label={`클립 ${clips.length}`}
            />
          </div>
        </div>

        {hubTab === 'members' ? (
          <section className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400">카드=RP · 체크=멀티뷰</p>
            {members.length > 0 ? (
              <PersonGrid
                people={members}
                profiles={profileMap}
                liveIds={liveIds}
                selected={selected}
                onToggle={toggleSelect}
                onOpen={(streamer) => setRpTarget({ streamer, guest: false })}
              />
            ) : (
              <EmptyNote>등록된 멤버와 아직 연결되지 않았습니다.</EmptyNote>
            )}
            {unmatchedNames.length > 0 ? (
              <p className="text-[11px] font-bold text-slate-400">미등록: {unmatchedNames.join(', ')}</p>
            ) : null}

            {selected.length > 0 ? (
              <button
                type="button"
                onClick={openSelectedMultiview}
                className="w-full rounded-2xl bg-slate-900 py-2.5 text-xs font-black text-white dark:bg-white dark:text-slate-900"
              >
                선택한 {selected.length}명 멀티뷰
              </button>
            ) : null}
          </section>
        ) : (
          <section className="space-y-2">
            <div className="flex items-center justify-end gap-2">
              {session ? (
                <button
                  type="button"
                  onClick={() => setShowClipModal(true)}
                  className="rounded-2xl bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-indigo-500"
                >
                  클립 올리기
                </button>
              ) : (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(BONGNUDO2_PATH)}`}
                  className="text-[11px] font-black text-slate-600 hover:underline dark:text-slate-300"
                >
                  로그인하고 올리기
                </Link>
              )}
              <Link
                href={`/clips?q=${encodeURIComponent(BONGNUDO2_CLIP_QUERY)}`}
                className="text-[11px] font-black text-indigo-600 hover:underline dark:text-indigo-400"
              >
                전체 보기
              </Link>
            </div>
            {clips.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {clips.slice(0, 8).map((clip, index) => (
                  <ClipCard key={clip.id} clip={clip} index={index} />
                ))}
              </div>
            ) : (
              <EmptyNote>클립이 아직 없습니다.</EmptyNote>
            )}
          </section>
        )}

        <p className="text-center text-[11px] font-bold text-slate-400">
          <a href={BONGNUDO2_NAMU_URL} target="_blank" rel="noopener noreferrer" className="underline">
            나무위키 봉누도 2
          </a>
          {' · '}
          <Link href={BONGNUDO2_PATH} className="underline">
            이 페이지
          </Link>
        </p>
      </div>

      {showClipModal ? (
        <CreateClipModal
          streamers={participants.length > 0 ? participants : clipCatalogStreamers}
          schedules={clipCatalogSchedules}
          onClose={() => setShowClipModal(false)}
          bongnudoPreset
          mother={BONGNUDO2_PATH}
        />
      ) : null}

      {rpTarget ? (
        <BongnudoRpModal
          streamer={rpTarget.streamer}
          profile={profileMap[rpTarget.streamer.id] ?? null}
          guest={rpTarget.guest}
          onClose={() => setRpTarget(null)}
          onSaved={(saved) => {
            const person = participants.find((row) => row.id === saved.streamerId);
            setProfileMap((prev) => ({
              ...prev,
              [saved.streamerId]: mergeBongnudoProfile(
                person?.name ?? '',
                saved,
                saved.streamerId,
              ),
            }));
          }}
        />
      ) : null}
    </div>
  );
}

function HubTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-black ${
        active
          ? 'bg-indigo-600 text-white'
          : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

function SeriesScheduleCard({
  livePeople,
  rosterCount,
  status,
}: {
  livePeople: Streamer[];
  rosterCount: number;
  status: ReturnType<typeof getBongnudoStatus>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3 px-3 py-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-800 dark:text-white">{BONGNUDO2_TITLE}</p>
          <p className="mt-0.5 text-[11px] font-bold text-slate-400">
            {BONGNUDO2_START_DATE.slice(5).replace('-', '.')}–{BONGNUDO2_END_DATE.slice(5).replace('-', '.')}
            {' · '}18:00–익일 03:00 · 금요 휴일
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-black text-white">
          시즌 일정
        </span>
      </div>
      <div className="border-t border-slate-100 px-3 py-2.5 dark:border-slate-800">
        {livePeople.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black text-red-500">LIVE {livePeople.length}</span>
            {livePeople.map((person) => (
              <span
                key={person.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white pr-2 dark:border-slate-700 dark:bg-slate-800"
              >
                <StreamerAvatar
                  name={person.name}
                  imgSrc={person.profileImg}
                  colorCode={person.colorCode}
                  streamerId={person.id}
                  size="xs"
                />
                <span className="text-[11px] font-black text-slate-800 dark:text-white">
                  {person.name}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] font-bold text-slate-400">
            {status.phase === 'live'
              ? '라이브 중인 멤버가 아직 없습니다'
              : `참가 인원은 라이브에 맞춰 표시 · 로스터 ${rosterCount}명`}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
      {children}
    </p>
  );
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;

function SeasonCalendar({
  days,
  scheduleCountByDay,
}: {
  days: BongnudoDay[];
  scheduleCountByDay: Map<string, number>;
}) {
  const weeks: BongnudoDay[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <Legend swatch="bg-indigo-600" label="오늘" />
        <Legend swatch="bg-indigo-100 dark:bg-indigo-950" label="운영" />
        <Legend swatch="bg-slate-100 dark:bg-slate-800" label="금요 휴일" />
        <span className="ml-auto text-[10px] font-bold text-slate-400">점 = 관련 일정</span>
      </div>

      <div className="grid grid-cols-7 gap-1 px-2 pt-2">
        {WEEKDAYS.map((weekday) => (
          <p
            key={weekday}
            className={`text-center text-[10px] font-black ${
              weekday === '금' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'
            }`}
          >
            {weekday}
          </p>
        ))}
      </div>

      <div className="space-y-1 p-2">
        {weeks.map((week, weekIndex) => (
          <div key={week[0]?.dateKey ?? weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const events = scheduleCountByDay.get(day.dateKey) ?? 0;
              const monthTick = day.day === 1 || (weekIndex === 0 && day === week[0]);
              return (
                <div
                  key={day.dateKey}
                  className={`relative flex min-h-14 flex-col items-center justify-center rounded-xl px-0.5 py-1.5 ${
                    day.isToday
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
                      : day.isHoliday
                        ? 'bg-slate-50 text-slate-400 dark:bg-slate-800/80 dark:text-slate-500'
                        : 'bg-indigo-50/80 text-slate-800 dark:bg-indigo-950/30 dark:text-white'
                  }`}
                >
                  {monthTick ? (
                    <span
                      className={`absolute left-1 top-1 text-[8px] font-black ${
                        day.isToday ? 'text-white/70' : 'text-indigo-400'
                      }`}
                    >
                      {day.month}월
                    </span>
                  ) : null}
                  <span className="text-sm font-black tabular-nums leading-none">{day.day}</span>
                  {day.isHoliday ? (
                    <span className="mt-1 text-[9px] font-black">휴일</span>
                  ) : events > 0 ? (
                    <span
                      className={`mt-1 h-1.5 w-1.5 rounded-full ${
                        day.isToday ? 'bg-white' : 'bg-indigo-500'
                      }`}
                      aria-label={`일정 ${events}개`}
                    />
                  ) : (
                    <span className={`mt-1 text-[8px] font-bold ${day.isToday ? 'text-white/70' : 'text-indigo-400'}`}>
                      18시
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
      <span className={`h-2.5 w-2.5 rounded ${swatch}`} />
      {label}
    </span>
  );
}

function EmptyNote({ children }: { children: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm font-bold text-slate-400 dark:border-slate-700">
      {children}
    </p>
  );
}

function PersonGrid({
  people,
  profiles,
  liveIds,
  selected,
  onToggle,
  onOpen,
  guest = false,
}: {
  people: Streamer[];
  profiles: Record<string, BongnudoProfileView>;
  liveIds: Set<string>;
  selected: string[];
  onToggle: (id: string) => void;
  onOpen: (streamer: Streamer) => void;
  guest?: boolean;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {people.map((person) => {
        const live = liveIds.has(person.id);
        const picked = selected.includes(person.id);
        const rp = profiles[person.id];
        return (
          <li
            key={person.id}
            className={`relative rounded-2xl border px-1.5 py-2.5 text-center ${
              picked
                ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950/40'
                : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
            }`}
          >
            <button
              type="button"
              onClick={() => onToggle(person.id)}
              className={`absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-md border ${
                picked
                  ? 'border-indigo-500 bg-indigo-500 text-white'
                  : 'border-slate-300 bg-white text-transparent dark:border-slate-600 dark:bg-slate-800'
              }`}
              aria-label={`${person.name} 멀티뷰 선택`}
            >
              <Check className="h-3 w-3" />
            </button>
            <button type="button" onClick={() => onOpen(person)} className="flex w-full flex-col items-center gap-1.5 pt-1">
              <div className="relative">
                <StreamerAvatar
                  name={person.name}
                  imgSrc={person.profileImg}
                  colorCode={person.colorCode}
                  streamerId={person.id}
                  size="small"
                />
                {live ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-[8px] font-black text-white">
                    LIVE
                  </span>
                ) : null}
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-white">{person.name}</span>
              <span className="line-clamp-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {rp?.rpName || (guest ? '게스트' : 'RP')}
              </span>
              <span className="line-clamp-1 text-[10px] font-black text-slate-400">
                {rp?.occupation ||
                  bongnudoFactionLabel(rp?.factionId) ||
                  (guest ? '🚶 시민' : 'RP')}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
