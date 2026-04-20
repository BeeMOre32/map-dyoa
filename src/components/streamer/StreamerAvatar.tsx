'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface StreamerAvatarProps {
  name: string;
  imgSrc?: string | null; // null도 허용하도록 타입 확장
  colorCode: string;
  size: 'small' | 'medium' | 'large';
}

export default function StreamerAvatar({
  name,
  imgSrc,
  colorCode,
  size,
}: StreamerAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imgSrc]);

  const shouldShowFallback = !imgSrc || imgSrc.trim() === '' || imgError;
  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-14 h-14',
    large: 'w-20 h-20',
  };

  if (shouldShowFallback) {
    return (
      <div
        className={`${sizeClasses[size]}  rounded-2xl flex items-center justify-center font-black text-xl shadow-sm transition-transform group-hover:scale-110 duration-300 shrink-0`}
        style={{
          backgroundColor: `${colorCode}20`,
          color: colorCode,
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
        fill // 부모 컨테이너 크기에 맞춤
        className="object-cover"
        onError={() => setImgError(true)} // 🌟 실제 파일이 404 나면 텍스트 아바타로 전환
      />
    </div>
  );
}
