import { ImageResponse } from 'next/og';
import { getScheduleDetail } from '@/lib/data-fetching';

export const runtime = 'edge';
export const alt = '지도동 방송 일정';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ScheduleOgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const schedule = await getScheduleDetail(id);

  if (!schedule) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1e1b4b',
            color: '#fff',
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          일정을 찾을 수 없습니다
        </div>
      ),
      { ...size },
    );
  }

  const members = schedule.participants
    .slice(0, 6)
    .map((p) => p.name)
    .join(' · ');
  const extra =
    schedule.participants.length > 6
      ? ` 외 ${schedule.participants.length - 6}명`
      : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background:
            'linear-gradient(145deg, #1e1b4b 0%, #4338ca 55%, #6366f1 100%)',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'rgba(199, 210, 254, 0.95)',
              letterSpacing: 2,
            }}
          >
            MAP-DYOA · 방송 일정
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              lineHeight: 1.15,
              maxHeight: 200,
              overflow: 'hidden',
            }}
          >
            {schedule.title.length > 48
              ? `${schedule.title.slice(0, 48)}…`
              : schedule.title}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <div
              style={{
                padding: '12px 24px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.15)',
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {schedule.formattedDate}
            </div>
            <div
              style={{
                padding: '12px 24px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.12)',
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {schedule.formattedTime}
            </div>
            {schedule.game?.title ? (
              <div
                style={{
                  padding: '12px 24px',
                  borderRadius: 999,
                  background: 'rgba(251, 191, 36, 0.25)',
                  fontSize: 26,
                  fontWeight: 700,
                }}
              >
                {schedule.game.title}
              </div>
            ) : null}
          </div>
          {members || extra ? (
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: 'rgba(226, 232, 240, 0.95)',
              }}
            >
              {members}
              {extra}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size },
  );
}
