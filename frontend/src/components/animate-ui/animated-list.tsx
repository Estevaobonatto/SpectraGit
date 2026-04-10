import * as React from 'react';
import { motion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  duration?: number;
  direction?: 'up' | 'down';
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export function AnimatedList({
  children,
  className,
  staggerDelay = 0.05,
  duration = 0.3,
  direction = 'up',
}: AnimatedListProps) {
  const custom = { staggerDelay, duration, direction };

  return (
    <motion.div
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      initial="hidden"
      animate="visible"
      className={cn(className)}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return (
          <AnimatedListItem duration={duration} direction={direction}>
            {child}
          </AnimatedListItem>
        );
      })}
    </motion.div>
  );
}

function AnimatedListItem({
  children,
  duration,
  direction,
}: {
  children: React.ReactNode;
  duration: number;
  direction: 'up' | 'down';
}) {
  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          y: direction === 'up' ? 12 : -12,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration,
            ease: [0.25, 0.1, 0.25, 1],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedGroup({
  children,
  className,
  preset = 'fade',
}: {
  children: React.ReactNode;
  className?: string;
  preset?: 'fade' | 'slide' | 'scale' | 'blur-slide';
}) {
  const presetVariants: Record<string, { hidden: object; visible: object }> = {
    fade: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    slide: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
    },
    'blur-slide': {
      hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
      visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
    },
  };

  return (
    <motion.div
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
      initial="hidden"
      animate="visible"
      className={cn(className)}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return (
          <motion.div
            variants={{
              ...presetVariants[preset],
              visible: {
                ...presetVariants[preset].visible,
                transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
              },
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
