'use client';

import { MotionConfig } from 'motion/react';

type Props = {
  children: React.ReactNode;
};

export default function MotionProvider({ children }: Props) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
