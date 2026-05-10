import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAdminSchedules } from '@/lib/data-fetching';
import AdminScheduleList from '@/components/admin/AdminScheduleList';

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function AdminSchedulesPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') redirect('/admin');

  const { from, to } = await searchParams;
  const schedules = await getAdminSchedules(from, to);

  return <AdminScheduleList schedules={schedules} defaultFrom={from} defaultTo={to} />;
}
