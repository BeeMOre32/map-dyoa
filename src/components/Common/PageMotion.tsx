'use client';

import { motion } from 'motion/react';
import {
  statsInteractiveHover,
  statsPageHeaderVariants,
  statsSectionVariants,
  statsTileGridVariants,
  statsTileVariants,
} from '@/lib/statsMotion';

const PRESETS = {
  header: statsPageHeaderVariants,
  section: statsSectionVariants,
  grid: statsTileGridVariants,
  tile: statsTileVariants,
} as const;

type Props = {
  as?: 'div' | 'ul' | 'li';
  preset: keyof typeof PRESETS;
  index?: number;
  hover?: boolean;
  className?: string;
  children: React.ReactNode;
};

export default function PageMotion({
  as = 'div',
  preset,
  index = 0,
  hover = false,
  className,
  children,
}: Props) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      custom={index}
      initial="hidden"
      animate="visible"
      variants={PRESETS[preset]}
      {...(hover ? statsInteractiveHover : {})}
    >
      {children}
    </Comp>
  );
}
