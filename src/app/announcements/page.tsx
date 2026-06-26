import AnnouncementsView from './AnnouncementsView';
import BackendUptimeBadge from '@/components/health/BackendUptimeBadge';
import { getBackendHealthUptimeSummary } from '@/lib/backend-health-store';

export default async function AnnouncementsPage() {
  let uptimeSummary = null;
  try {
    uptimeSummary = await getBackendHealthUptimeSummary();
  } catch {
    uptimeSummary = null;
  }

  return (
    <AnnouncementsView
      uptimeBadge={uptimeSummary ? <BackendUptimeBadge summary={uptimeSummary} /> : null}
    />
  );
}
