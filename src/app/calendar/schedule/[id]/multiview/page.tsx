import { notFound } from 'next/navigation';
import { getScheduleDetail } from '@/lib/data-fetching';
import { flattenScheduleParticipants } from '@/lib/schedule-formatters';
import MultiView from '@/components/multiview/MultiView';

export default async function MultiViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const schedule = await getScheduleDetail(id);
  if (!schedule) return notFound();

  return <MultiView schedule={flattenScheduleParticipants(schedule)} />;
}
