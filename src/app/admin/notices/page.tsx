import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getAllSiteNotices } from '@/lib/data-fetching';
import SiteNoticeManagement from '@/components/admin/SiteNoticeManagement';

export default async function AdminNoticesPage() {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') redirect('/admin');

  const notices = await getAllSiteNotices();
  return (
    <Suspense fallback={<div className="p-8 text-sm font-bold text-slate-500">불러오는 중…</div>}>
      <SiteNoticeManagement notices={notices} />
    </Suspense>
  );
}
