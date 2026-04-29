import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
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

  const streamers = await prisma.streamer.findMany({
    where: { id: { in: idList } },
  });

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
