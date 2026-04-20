'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface StreamerAvatarProps {
  name: string;
  imgSrc?: string | null; // null도 허용하도록 타입 확장
  colorCode: string;
}

export default function StreamerAvatar({
  name,
  imgSrc,
  colorCode,
}: StreamerAvatarProps) {
  // 🌟 이미지 로드 에러 상태 관리 (경로는 있는데 실제 파일이 없는 경우 대비)
  const [imgError, setImgError] = useState(false);

  // imgSrc가 바뀌면 에러 상태 초기화
  useEffect(() => {
    setImgError(false);
  }, [imgSrc]);

  // 1. imgSrc가 없거나(undefined, null) 2. 빈 문자열이거나 3. 이미지 로드에 실패했을 때 div 반환
  const shouldShowFallback = !imgSrc || imgSrc.trim() === '' || imgError;

  if (shouldShowFallback) {
    return (
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm transition-transform group-hover:scale-110 duration-300 shrink-0"
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
    <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-2xl shadow-sm transition-transform group-hover:scale-110 duration-300">
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
