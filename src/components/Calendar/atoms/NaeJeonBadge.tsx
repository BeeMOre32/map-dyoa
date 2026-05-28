import { Sword } from 'lucide-react';

export default function NaeJeonBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-black text-amber-800 dark:text-amber-200 ${
        compact
          ? 'px-1.5 py-0.5 text-[10px]'
          : 'px-2 py-0.5 text-[11px]'
      }`}
      style={{
        backgroundColor: 'rgba(245,158,11,0.22)',
        border: '1px solid rgba(245,158,11,0.45)',
      }}
    >
      <Sword className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      내전
    </span>
  );
}
