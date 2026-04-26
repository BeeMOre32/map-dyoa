import { getAllClips, getAllStreamers, getCalendarData } from '@/lib/data-fetching';
import ClipView from '@/components/clips/ClipView';

export default async function ClipsPage() {
  const [clips, streamers, { schedules }] = await Promise.all([
    getAllClips(),
    getAllStreamers(),
    getCalendarData(),
  ]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <ClipView clips={clips} streamers={streamers} schedules={schedules} />
    </div>
  );
}
