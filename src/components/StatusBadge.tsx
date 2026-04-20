import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

// src/app/admin/feedbacks/StatusBadge.tsx
export default function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: {
      label: '대기중',
      color:
        'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
      icon: Clock,
    },
    RESOLVED: {
      label: '해결됨',
      color:
        'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
      icon: CheckCircle2,
    },
    REJECTED: {
      label: '반려됨',
      color:
        'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800',
      icon: AlertCircle,
    },
  };

  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl border ${config.color} w-fit`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs font-black">{config.label}</span>
    </div>
  );
}
