import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAdminClips } from '@/lib/data-fetching';
import AdminClipList from '@/components/admin/AdminClipList';

export default async function AdminClipsPage() {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') redirect('/admin');

  const clips = await getAdminClips();
  return <AdminClipList clips={clips} />;
}
