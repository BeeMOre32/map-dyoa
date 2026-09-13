import { notFound } from 'next/navigation';
import { getAllStreamers, getLiveStreamerIds } from '@/lib/data-fetching';
import { pickBongnudoMultiview, splitBongnudoStreamers } from '@/lib/bongnudo';
import { BONGNUDO2_PATH } from '@/config/bongnudo2';
import MultiView from '@/components/multiview/MultiView';

export default async function BongnudoMultiViewPage({
  searchParams,
}: {
  searchParams: Promise<{ live?: string }>;
}) {
  const { live } = await searchParams;
  const [streamers, liveIds] = await Promise.all([
    getAllStreamers(),
    getLiveStreamerIds(),
  ]);
  const roster = splitBongnudoStreamers(streamers);
  const liveOnly = live === '1';
  const pool = liveOnly ? [...roster.members, ...roster.guests] : roster.members;
  const picked = pickBongnudoMultiview(pool, liveIds, liveOnly);

  if (picked.length === 0) return notFound();

  return (
    <MultiView
      participants={picked}
      title={liveOnly ? '봉누도 2 라이브' : '봉누도 2 지도동'}
      backHref={BONGNUDO2_PATH}
      autoStart
    />
  );
}
