import type { Config } from 'tailwindcss';

const config: Config = {
  // 🌟 1. 다크모드를 'class' 기반으로 설정 (next-themes 연동 필수)
  darkMode: 'class',

  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      // 🌟 2. 둥글둥글한 디자인을 위한 곡률 확장
      borderRadius: {
        '4xl': '2rem', // 32px
        '5xl': '3rem', // 48px
        '6xl': '4rem', // 64px
      },

      // 🌟 3. 지도동 테마에 어울리는 애니메이션 추가 (선택사항)
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        float: 'float 3s ease-in-out infinite',
      },

      colors: {
        indigo: {
          50: '#f5f7ff',
          100: '#ebf0fe',
        },
      },
      backgroundColor: {
        dark: {
          base: '#0f0f0f',
          surface: '#1a1a1a',
          elevated: '#252525',
          hover: '#2d2d2d',
        },
      },
      textColor: {
        dark: {
          primary: '#f5f5f5',
          secondary: '#a0a0a0',
          tertiary: '#707070',
        },
      },
    },
  },

  plugins: [],
};

export default config;
