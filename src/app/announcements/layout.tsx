import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '공지사항 | Map-Dyoa',
};

export default function AnnouncementsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
