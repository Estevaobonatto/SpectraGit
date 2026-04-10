import * as React from 'react';
import { motion, type HTMLMotionProps, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

type FadeDirection = 'up' | 'down' | 'left' | 'right';

interface FadeProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  direction?: FadeDirection;
  duration?: number;
  delay?: number;
  blur?: boolean;
  className?: string;
}

const directionOffset: Record<FadeDirection, { x?: number; y?: number }> = {
  up: { y: 16 },
  down: { y: -16 },
  left: { x: 16 },
  right: { x: -16 },
};

export function Fade({
  children,
  direction = 'up',
  duration = 0.4,
  delay = 0,
  blur = false,
  className,
  ...props
}: FadeProps) {
  const offset = directionOffset[direction];

  return (
    <motion.div
      initial={{
        opacity: 0,
        ...offset,
        ...(blur ? { filter: 'blur(4px)' } : {}),
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        ...(blur ? { filter: 'blur(0px)' } : {}),
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadePresence({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="content"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
