import { getHoi4Leaderboard } from '@/lib/data-fetching';
import Hoi4View from '@/components/hoi4/Hoi4View';
import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: 'HOI4 참전 기록',
  description: '지도동 Hearts of Iron 4 내전·참전 기록과 누적 통계를 확인하세요.',
  path: '/hoi4',
});

export default async function Hoi4Page() {
  const data = await getHoi4Leaderboard();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="sr-only">
        <h1>지도동 HOI4 참전 기록</h1>
        <p>내전 세션별 참전 멤버와 플레이 국가 누적 통계</p>
      </header>
      <Hoi4View data={data} />
    </div>
  );
}
