import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 120,
          background:
            'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
        }}
      >
        <div
          style={{
            width: 260,
            height: 260,
            borderRadius: 999,
            background: '#EEF2FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 108,
              height: 132,
              borderRadius: 54,
              background: '#4338CA',
              clipPath:
                'path("M54 0C24 0 0 24 0 54C0 96 45 125 52 129C53 130 55 130 56 129C63 125 108 96 108 54C108 24 84 0 54 0Z")',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                background: '#E0E7FF',
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
