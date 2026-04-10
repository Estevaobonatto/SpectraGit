import * as React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ClickEffectProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export function ClickEffect({ children, className, scale = 0.97 }: ClickEffectProps) {
  return (
    <motion.div
      whileTap={{ scale }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

interface HoverScaleProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export function HoverScale({ children, className, scale = 1.02 }: HoverScaleProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

interface ShineProps {
  children: React.ReactNode;
  className?: string;
}

export function Shine({ children, className }: ShineProps) {
  return (
    <motion.div
      className={cn('relative overflow-hidden', className)}
      whileHover="hover"
    >
      {children}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
        variants={{
          hover: {
            x: ['calc(-100% - 100px)', 'calc(100% + 100px)'],
            transition: { duration: 0.6, ease: 'easeInOut' },
          },
        }}
        style={{ x: 'calc(-100% - 100px)' }}
      />
    </motion.div>
  );
}
