import { buildPageMetadata } from '@/lib/site';

export const metadata = buildPageMetadata({
  title: '로그인',
  description: 'Map-Dyoa 관리자 로그인',
  path: '/login',
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
