'use client';

import { useEffect } from 'react';
import ErrorReportPanel from '@/components/Common/ErrorReportPanel';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorReportPanel error={error} reset={reset} variant="embedded" />;
}
