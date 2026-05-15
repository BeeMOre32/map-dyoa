import { notFound } from 'next/navigation';
import { getAllStreamers } from '@/lib/data-fetching';
import MultiView from '@/components/multiview/MultiView';

export default async function LiveMultiViewPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  if (!ids) return notFound();

  const idList = ids.split(',').filter(Boolean);
  if (idList.length === 0) return notFound();

  const all = await getAllStreamers();
  const streamers = all.filter((s) => idList.includes(s.id));

  if (streamers.length === 0) return notFound();

  const ordered = idList
    .map((id) => streamers.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <MultiView
      participants={ordered}
      title="라이브 멀티뷰"
      backHref="/live"
    />
  );
}
