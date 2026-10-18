import { listClipWeekRecommends } from '@/lib/clip-week';
import ClipWeekView from '@/components/clips/ClipWeekView';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '이번 주 추천 클립',
  description: '이번 주 지도동 사이트에서 추천이 많은 클립입니다. 추천 수는 계속 남습니다.',
  path: '/clips/week',
});

export default async function ClipWeekPage() {
  const rows = await listClipWeekRecommends(20);
  return <ClipWeekView rows={rows} />;
}
