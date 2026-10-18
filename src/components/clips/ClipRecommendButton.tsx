'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@heroui/react';
import { useToast } from '@/components/Common/Toaster';
import {
  readClipRecommended,
  subscribeClipRecommend,
  toggleClipRecommend,
} from '@/lib/clip-recommend-client';

export function ClipRecommendButton({
  clipId,
  recommends = 0,
  tone = 'dark',
}: {
  clipId: string;
  recommends?: number;
  tone?: 'dark' | 'light';
}) {
  const toast = useToast();
  const [count, setCount] = useState(recommends);
  const [recommended, setRecommended] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setCount(recommends);
  }, [recommends]);

  useEffect(() => {
    setRecommended(readClipRecommended(clipId));
    return subscribeClipRecommend(clipId, (detail) => {
      setCount(detail.recommends);
      setRecommended(detail.recommended);
    });
  }, [clipId]);

  const dark = tone === 'dark';

  return (
    <Button
      size="sm"
      variant={recommended ? 'primary' : dark ? 'secondary' : 'outline'}
      isPending={pending}
      aria-pressed={recommended}
      className={
        dark
          ? '!h-8 !gap-1.5 !px-3 !text-sm !font-bold'
          : '!h-6 !gap-1 !rounded-full !px-2 !text-[11px] !font-bold [&_svg]:!size-3'
      }
      onPress={() => {
        if (pending) return;
        setPending(true);
        void toggleClipRecommend(clipId)
          .then((result) => {
            if (!result) {
              toast.error('추천을 저장하지 못했습니다.');
              return;
            }
            toast.success(result.recommended ? '추천했습니다.' : '추천을 취소했습니다.');
          })
          .finally(() => setPending(false));
      }}
    >
      <Heart className={`size-4 ${recommended ? 'fill-current' : ''}`} />
      {recommended ? '추천함' : '추천'}
      <span className="tabular-nums">{count}</span>
    </Button>
  );
}
