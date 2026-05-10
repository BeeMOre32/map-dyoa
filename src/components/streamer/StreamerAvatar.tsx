'use client';

import { useState } from 'react';
import { getStreamerColor } from '@/constants/streamercolor';
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
  const [failedImgSrc, setFailedImgSrc] = useState<string | null>(null);
  const isDark = useIsDarkAfterMount();
  const resolvedColor =
    (streamerId ? getStreamerColor(streamerId, isDark) : null) ?? colorCode;

  const normalizedImgSrc = imgSrc?.trim() ?? '';
  const shouldShowFallback = !normalizedImgSrc || failedImgSrc === normalizedImgSrc;
  const sizeClasses = {
    xs: 'w-7 h-7',
    small: 'w-10 h-10',
    medium: 'w-14 h-14',
    large: 'w-20 h-20',
  };

  if (shouldShowFallback) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center font-black text-xl shadow-sm transition-transform group-hover:scale-110 duration-300 shrink-0`}
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
        src={normalizedImgSrc}
        alt={name}
        className="h-full w-full object-cover"
        onError={() => setFailedImgSrc(normalizedImgSrc)}
      />
    </div>
  );
}
