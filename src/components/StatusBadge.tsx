import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

// src/app/admin/feedbacks/StatusBadge.tsx
export default function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: {
      label: '대기중',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      icon: Clock,
    },
    RESOLVED: {
      label: '해결됨',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: CheckCircle2,
    },
    REJECTED: {
      label: '반려됨',
      color: 'bg-red-50 text-red-600 border-red-100',
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
