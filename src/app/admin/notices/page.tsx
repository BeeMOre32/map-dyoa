import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllSiteNotices } from '@/lib/data-fetching';
import SiteNoticeManagement from '@/components/admin/SiteNoticeManagement';

export default async function AdminNoticesPage() {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') redirect('/admin');

  const notices = await getAllSiteNotices();
  return <SiteNoticeManagement notices={notices} />;
}
