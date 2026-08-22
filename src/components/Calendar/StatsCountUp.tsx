'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from 'motion/react';

interface StatsCountUpProps {
  value: number;
  className?: string;
  delay?: number;
}

export default function StatsCountUp({ value, className, delay = 0 }: StatsCountUpProps) {
  const reducedMotion = useReducedMotion();
  const spring = useSpring(reducedMotion ? value : 0, { stiffness: 120, damping: 28, mass: 0.8 });
  const rounded = useTransform(spring, (v) => Math.round(v));
  const [display, setDisplay] = useState(reducedMotion ? value : 0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value);
      return;
    }
    const timer = window.setTimeout(() => spring.set(value), delay * 1000);
    return () => window.clearTimeout(timer);
  }, [delay, reducedMotion, spring, value]);

  useMotionValueEvent(rounded, 'change', (v) => {
    if (!reducedMotion) setDisplay(v);
  });

  return (
    <motion.span
      className={className}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26, delay }}
    >
      {display.toLocaleString()}
    </motion.span>
  );
}
