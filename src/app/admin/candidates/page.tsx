import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ScheduleCandidateQueue from '@/components/admin/ScheduleCandidateQueue';
import { listScheduleCandidates } from '@/lib/schedule-candidate-store';
import { getAllGames } from '@/lib/data-fetching';

export default async function AdminCandidatesPage() {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') redirect('/admin');

  const [candidates, games] = await Promise.all([
    listScheduleCandidates({ limit: 80 }),
    getAllGames(),
  ]);

  return (
    <ScheduleCandidateQueue
      candidates={candidates}
      games={games.map((g) => ({ id: g.id, title: g.title }))}
    />
  );
}
