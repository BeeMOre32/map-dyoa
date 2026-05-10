import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllGames } from '@/lib/data-fetching';
import GameManagement from '@/components/admin/GameManagement';

export default async function AdminGamesPage() {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') redirect('/admin');

  const games = await getAllGames();
  return <GameManagement games={games} />;
}
