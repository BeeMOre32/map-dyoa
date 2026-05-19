// src/app/streamers/layout.tsx
import StreamersLayoutShell from '@/components/streamer/StreamersLayoutShell';

export default function StreamersLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return <StreamersLayoutShell modal={modal}>{children}</StreamersLayoutShell>;
}
