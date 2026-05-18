import Link from 'next/link';
import type { Streamer } from '@prisma/client';
import JsonLd from '@/components/Seo/JsonLd';
import {
  getStreamerBreadcrumbJsonLd,
  getStreamerPersonJsonLd,
} from '@/lib/seo-jsonld';

type Props = {
  streamer: Pick<Streamer, 'id' | 'name' | 'bio' | 'chzzkUrl' | 'youtubeUrl' | 'profileImg'>;
  scheduleCount: number;
  clipCount: number;
};

export default function StreamerSeoContent({
  streamer,
  scheduleCount,
  clipCount,
}: Props) {
  const bio =
    streamer.bio?.trim() ||
    `${streamer.name}의 지도동 방송 일정·클립·프로필입니다.`;

  return (
    <article className="sr-only" aria-label={`${streamer.name} 프로필`}>
      <JsonLd
        data={[
          getStreamerPersonJsonLd(streamer),
          getStreamerBreadcrumbJsonLd(streamer),
        ]}
      />
      <h1>{streamer.name}</h1>
      <p>{bio}</p>
      <p>
        등록 일정 {scheduleCount}건 · 클립 {clipCount}건
      </p>
      <nav aria-label="관련 링크">
        <Link href="/streamers">지도동 멤버 목록</Link>
        <Link href="/calendar">방송 일정 캘린더</Link>
        {streamer.chzzkUrl ? (
          <a href={streamer.chzzkUrl}>치지직 채널</a>
        ) : null}
        {streamer.youtubeUrl ? (
          <a href={streamer.youtubeUrl}>유튜브 채널</a>
        ) : null}
      </nav>
    </article>
  );
}
