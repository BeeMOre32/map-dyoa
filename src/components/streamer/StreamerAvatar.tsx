'use client';

import { useEffect, useMemo, useState } from 'react';
import { getStreamerColor } from '@/constants/streamercolor';
import { getStreamerImagePath } from '@/lib/utils';
import { useIsDarkAfterMount } from '@/hooks/useIsDarkAfterMount';

interface StreamerAvatarProps {
  name: string;
  imgSrc?: string | null;
  colorCode: string;
  streamerId?: string;
  size: 'xs' | 'small' | 'medium' | 'large';
}

export default function StreamerAvatar({
  name,
  imgSrc,
  colorCode,
  streamerId,
  size,
}: StreamerAvatarProps) {
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(() => new Set());
  const isDark = useIsDarkAfterMount();
  const resolvedColor =
    (streamerId ? getStreamerColor(streamerId, isDark) : null) ?? colorCode;

  const candidates = useMemo(() => {
    const list: string[] = [];
    const remote = imgSrc?.trim();
    const local = getStreamerImagePath(name);
    if (remote) list.push(remote);
    if (local && local !== remote) list.push(local);
    return list;
  }, [imgSrc, name]);

  useEffect(() => {
    setFailedSrcs(new Set());
  }, [candidates]);

  const activeSrc = candidates.find((src) => !failedSrcs.has(src));
  const shouldShowFallback = !activeSrc;

  const sizeClasses = {
    xs: 'w-7 h-7',
    small: 'w-10 h-10',
    medium: 'w-14 h-14',
    large: 'w-20 h-20',
  };
  const textSizeClasses = {
    xs: 'text-[9px] leading-none',
    small: 'text-xs',
    medium: 'text-base',
    large: 'text-xl',
  };

  if (shouldShowFallback) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center font-black shadow-sm transition-transform group-hover:scale-110 duration-300 shrink-0 ${textSizeClasses[size]}`}
        style={{
          backgroundColor: `${resolvedColor}20`,
          color: resolvedColor,
        }}
      >
        {name.substring(0, 2)}
      </div>
    );
  }

  return (
    <div
      className={`relative ${sizeClasses[size]} shrink-0 overflow-hidden rounded-2xl shadow-sm transition-transform group-hover:scale-110 duration-300`}
    >
      <img
        src={activeSrc}
        alt={name}
        className="h-full w-full object-cover"
        onError={() => {
          setFailedSrcs((prev) => {
            const next = new Set(prev);
            next.add(activeSrc);
            return next;
          });
        }}
      />
    </div>
  );
}
