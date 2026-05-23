import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '지도동 방송 일정 · Map-Dyoa';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-2px',
            }}
          >
            지도동
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: 'rgba(199, 210, 254, 0.95)',
              letterSpacing: '-1px',
            }}
          >
            방송 일정 · 클립 · 멀티뷰
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'rgba(165, 180, 252, 0.75)',
              letterSpacing: '2px',
            }}
          >
            map-dyoa.site
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            fontSize: 20,
            color: 'rgba(165, 180, 252, 0.7)',
            fontWeight: 500,
          }}
        >
          map-dyoa.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
