'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
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
  const [imgError, setImgError] = useState(false);
  const isDark = useIsDarkAfterMount();
  const resolvedColor =
    (streamerId ? getStreamerColor(streamerId, isDark) : null) ?? colorCode;

  useEffect(() => {
    setImgError(false);
  }, [imgSrc]);

  const shouldShowFallback = !imgSrc || imgSrc.trim() === '' || imgError;
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
      <Image
        src={imgSrc}
        alt={name}
        fill
        className="object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}
