import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllGames, getAllStreamers, getAuditLogs } from '@/lib/data-fetching';
import AdminAuditLogList from '@/components/admin/AdminAuditLogList';

const ACTIONS = ['update', 'create', 'delete', 'all'] as const;
type AuditActionFilter = (typeof ACTIONS)[number];

function parseAction(raw?: string): AuditActionFilter {
  if (raw && ACTIONS.includes(raw as AuditActionFilter)) {
    return raw as AuditActionFilter;
  }
  return 'update';
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== 'ADMIN') redirect('/admin');

  const { action: actionParam } = await searchParams;
  const actionFilter = parseAction(actionParam);

  const [logs, streamers, games] = await Promise.all([
    getAuditLogs({
      action: actionFilter === 'all' ? undefined : actionFilter,
      limit: 100,
    }),
    getAllStreamers(),
    getAllGames(),
  ]);

  const formatCtx = {
    streamerNames: Object.fromEntries(streamers.map((s) => [s.id, s.name])),
    gameTitles: Object.fromEntries(games.map((g) => [g.id, g.title])),
  };

  return (
    <AdminAuditLogList logs={logs} actionFilter={actionFilter} formatCtx={formatCtx} />
  );
}
