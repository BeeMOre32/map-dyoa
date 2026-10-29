import { listClipWeekRecommends } from '@/lib/clip-week';
import ClipWeekView from '@/components/clips/ClipWeekView';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '이번 주 추천 클립',
  description: '이번 주 추천이 들어온 클립을 지금까지 쌓인 추천 수 순으로 보여 줍니다.',
  path: '/clips/week',
});

export default async function ClipWeekPage() {
  const rows = await listClipWeekRecommends(20);
  return <ClipWeekView rows={rows} />;
}
