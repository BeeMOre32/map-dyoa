import { getCalendarData, getClipsPaginated, getLiveStreamerIds } from '@/lib/data-fetching';
import {
  mergeBongnudoClips,
  pickBongnudoSchedules,
  splitBongnudoStreamers,
} from '@/lib/bongnudo';
import { fetchBongnudoProfilesFromServer } from '@/lib/map-dyoa-server-bongnudo';
import {
  BONGNUDO2_CLIP_MONTHS,
  BONGNUDO2_CLIP_QUERY,
  BONGNUDO2_PATH,
} from '@/config/bongnudo2';
import BongnudoView from '@/components/bongnudo/BongnudoView';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '봉누도 2',
  description:
    '봉누도 2 GTA5 RP 서버의 지도동 참가 멤버, 운영 일정, 클립, 전용 멀티뷰를 한곳에서 확인하세요.',
  path: BONGNUDO2_PATH,
});

export default async function BongnudoPage() {
  const [calendarData, initialLiveIds, profiles] = await Promise.all([
    getCalendarData(),
    getLiveStreamerIds(),
    fetchBongnudoProfilesFromServer(),
  ]);
  const roster = splitBongnudoStreamers(calendarData.streamers);
  const rosterIds = new Set([...roster.members, ...roster.guests].map((s) => s.id));
  const clipPeople = [...roster.members, ...roster.guests].map((s) => s.id);

  const clipResults = await Promise.all([
    getClipsPaginated({
      q: BONGNUDO2_CLIP_QUERY,
      pageSize: 16,
      sort: 'newest',
      schedulesForClipLinks: calendarData.schedules,
    }),
    ...BONGNUDO2_CLIP_MONTHS.map((month) =>
      clipPeople.length > 0
        ? getClipsPaginated({
            streamerIds: clipPeople,
            month,
            pageSize: 16,
            sort: 'newest',
            schedulesForClipLinks: calendarData.schedules,
          })
        : Promise.resolve({ clips: [] }),
    ),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BongnudoView
        members={roster.members}
        guests={roster.guests}
        unmatchedNames={roster.unmatchedMembers}
        unmatchedGuests={roster.unmatchedGuests}
        profiles={profiles}
        schedules={pickBongnudoSchedules(calendarData.schedules, rosterIds)}
        clipCatalogStreamers={calendarData.streamers}
        clipCatalogSchedules={calendarData.schedules}
        clips={mergeBongnudoClips(clipResults.map((result) => result.clips))}
        initialLiveIds={initialLiveIds}
      />
    </div>
  );
}
